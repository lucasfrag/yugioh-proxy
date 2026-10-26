// Acesso aos dados das cartas em dois modos:
// - API (padrão, ./run.sh): o servidor Express faz a busca e serve as imagens.
// - Estático (versão online, build com VITE_STATIC=1): o site carrega um índice de cartas
//   (data/cartas.json) e faz a busca no próprio navegador; as imagens são arquivos do site.
import Fuse from 'fuse.js';

export const IS_STATIC = import.meta.env.VITE_STATIC === '1';
const BASE = import.meta.env.BASE_URL;

/** Verso usado quando nenhum foi escolhido. */
export const DEFAULT_BACK_URL = IS_STATIC ? `${BASE}img/verso/Back-EN.webp` : '/imagens/verso-remoto/Back-EN.png';

// ---------- Modo estático ----------

const imgEn = (artId) => `${BASE}img/en/${artId}.webp`;
const imgPt = (arquivo) => `${BASE}img/pt/${arquivo}`;

/** Mesma normalização da API (utils/normalizer.js): sem acentos, pontuação e espaços. */
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

let indicePromise = null;

/** Carrega o índice uma vez só e prepara a busca. */
function carregarIndice() {
  if (!indicePromise) {
    indicePromise = fetch(`${BASE}data/cartas.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Índice de cartas indisponível (${r.status})`);
        return r.json();
      })
      .then((dados) => {
        // Cada carta vem como [id, nome, nome_en, tipo, tipo_en, tipo_carta, artes[], pt[]]
        const cartas = dados.cartas.map(([id, nome, nomeEn, tipo, tipoEn, tipoCarta, artes, pt]) => ({
          id,
          nome,
          nome_en: nomeEn,
          tipo,
          tipo_en: tipoEn,
          tipo_carta: tipoCarta,
          artes,
          pt,
          imagens: [imgEn(artes[0] ?? id)],
          _nome: normalizeName(nome),
          _nomeEn: normalizeName(nomeEn),
          _id: String(id)
        }));
        const fuse = new Fuse(cartas, {
          keys: [{ name: 'nome', weight: 0.7 }, { name: 'nome_en', weight: 0.3 }],
          threshold: 0.4,
          ignoreLocation: true
        });
        return { cartas, fuse, versos: dados.versos.map((v) => `${BASE}img/verso/${v}`) };
      });
    indicePromise.catch(() => { indicePromise = null; });
  }
  return indicePromise;
}

/** Busca com a mesma prioridade da API: ID exato, nome exato, início do nome, ID parcial, aproximada. */
async function buscarEstatico(query, limit) {
  const { cartas, fuse } = await carregarIndice();
  const termo = query.trim();
  const normalizado = normalizeName(termo);
  const soDigitos = /^\d+$/.test(termo);
  const idParcial = soDigitos && termo.length >= 3;

  const idExato = [];
  const nomeExato = [];
  const inicio = [];
  const parcial = [];
  for (const c of cartas) {
    if (soDigitos && c._id === termo) idExato.push(c);
    else if (c._nome === normalizado || c._nomeEn === normalizado) nomeExato.push(c);
    else if (c._nome.startsWith(normalizado) || c._nomeEn.startsWith(normalizado)) inicio.push(c);
    else if (idParcial && c._id.includes(termo)) parcial.push(c);
  }

  const vistos = new Set();
  const resultado = [];
  for (const c of [...idExato, ...nomeExato, ...inicio, ...parcial]) {
    if (resultado.length >= limit) return resultado;
    if (!vistos.has(c.id)) { vistos.add(c.id); resultado.push(c); }
  }
  // A busca aproximada é a mais cara: só roda se ainda faltam resultados
  for (const { item } of fuse.search(termo, { limit: limit * 2 })) {
    if (resultado.length >= limit) break;
    if (!vistos.has(item.id)) { vistos.add(item.id); resultado.push(item); }
  }
  return resultado;
}

function imagensEstatico(card) {
  return {
    idiomas: {
      pt: (card.pt || []).map((arquivo, idx) => ({
        url: imgPt(arquivo), miniatura: imgPt(arquivo), rotulo: `Arte ${idx + 1}`, fonte: 'local'
      })),
      en: (card.artes || []).map((artId, idx) => ({
        url: imgEn(artId), miniatura: imgEn(artId), rotulo: `Arte ${idx + 1}`, largura: 813, altura: 1185, fonte: 'ygoprodeck'
      })),
      ocg: []
    },
    erro: null
  };
}

// ---------- Funções usadas pelos componentes ----------

export async function searchCards(query, limit = 10) {
  if (IS_STATIC) return buscarEstatico(query, limit);
  const response = await fetch(`/api/cartas?nome=${encodeURIComponent(query)}&limit=${limit}`);
  const data = await response.json();
  return data.resultados || [];
}

export async function getCardImages(card) {
  if (IS_STATIC) {
    // A carta pode ter vindo de uma lista salva: busca os dados completos no índice
    const { cartas } = await carregarIndice();
    return imagensEstatico(cartas.find((c) => c.id === card.id) || card);
  }
  const response = await fetch(`/api/cartas/${card.id}/imagens`);
  return response.json();
}

export async function getBacks() {
  if (IS_STATIC) return (await carregarIndice()).versos;
  const response = await fetch('/api/cartas/backs');
  return response.json();
}
