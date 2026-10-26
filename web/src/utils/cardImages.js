// Funções auxiliares para as imagens das cartas (idioma, arte e resolução).

export const IDIOMAS = [
  { id: 'pt', nome: 'Português', sigla: 'PT' },
  { id: 'en', nome: 'Inglês', sigla: 'EN' },
  { id: 'ocg', nome: 'OCG (Japonês)', sigla: 'OCG' }
];

// Proporção oficial da carta (59 x 86 mm) e largura mínima para uma boa impressão (~280 dpi)
const CARD_RATIO = 59 / 86;
const BOA_LARGURA = 650;

// Scans abaixo dessa largura ficam borrados impressos (menos de ~215 dpi em 59 mm)
export const BAIXA_RESOLUCAO = 500;

/**
 * Scan em baixa resolução. As artes digitais do YGOPRODeck (421 px) e o acervo local
 * não entram aqui: são imagens limpas e às vezes a única opção de arte alternativa.
 */
export function isLowRes(img) {
  return img.fonte === 'yugipedia' && img.largura < BAIXA_RESOLUCAO;
}

/**
 * Imagem selecionada de um item da lista. Itens antigos (salvos antes da escolha de
 * idioma) só têm `selectedImageIndex`, então caímos para `imagens[índice]`.
 */
export function getItemImage(item) {
  if (item.imagemSelecionada) return item.imagemSelecionada;
  const url = (item.imagens && item.imagens[item.selectedImageIndex || 0]) || '';
  return { url, miniatura: url, idioma: 'pt', rotulo: '' };
}

/** Chave que identifica a combinação carta + imagem na lista. */
export function getItemKey(item) {
  return `${item.id}|${getItemImage(item).url}`;
}

/** Versão pequena de uma imagem do YGOPRODeck (para miniaturas). */
export function toThumbnail(url) {
  return url ? url.replace('/imagens/ygoprodeck/full/', '/imagens/ygoprodeck/small/') : url;
}

/**
 * Melhor imagem de uma lista para impressão: entre as que têm proporção de carta,
 * a menor que ainda tenha boa resolução (evita baixar scans de 6 MB sem necessidade).
 * Imagens sem tamanho conhecido (acervo local) têm prioridade.
 */
export function pickBestImage(lista) {
  if (!lista || lista.length === 0) return null;
  const local = lista.find(img => img.fonte === 'local');
  if (local) return local;
  const scans = lista.filter(img => img.fonte === 'yugipedia');
  const bemCortadas = scans.filter(img => Math.abs(img.largura / img.altura - CARD_RATIO) < 0.03);
  const candidatas = bemCortadas.length ? bemCortadas : scans;
  const boas = candidatas.filter(img => img.largura >= BOA_LARGURA).sort((a, b) => a.largura - b.largura);
  return boas[0] || lista[0];
}
