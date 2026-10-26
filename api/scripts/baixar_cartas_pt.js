// Baixa as cartas em português (HD) direto da fonte original e converte para WebP.
//
// Cartas criadas por fãs pelo Emula Animes e distribuídas gratuitamente no blog
// Cartas Caseiras. Todo o crédito é dele: https://cartascaseiras.blogspot.com/
//
// Uso: npm run cartas-pt   (pode ser interrompido e retomado; arquivos já baixados são pulados)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { IMAGES_BASE_DIR, USER_AGENT } = require('../src/config');

const CREDITO = {
  autor: 'Emula Animes',
  blog: 'https://cartascaseiras.blogspot.com/',
  postagem: 'https://cartascaseiras.blogspot.com/2021/04/cartas-de-yu-gi-oh-pt-br-para-imprimir.html',
  youtube: 'https://www.youtube.com/watch?v=JqDxDtMwyME',
  drive: 'https://drive.google.com/drive/folders/1ZVQyZlSaNVBvNpMxiEwfEDdwZbgqTIQ-'
};

// Pasta pública "Yu-Gi-Oh-HD" no Google Drive do autor
const DRIVE_ROOT_ID = '1ZVQyZlSaNVBvNpMxiEwfEDdwZbgqTIQ-';

// Pastas do Drive -> pastas locais (as mesmas que o setup_database.js lê)
const PASTAS = {
  'Cartas Monstro': 'Cartas Monstro',
  'Cartas Magia': 'Cartas Magia',
  'Cartas Armadilha': 'Cartas Armadilha',
  'Fichas-Tokens': 'Fichas-Tokens',
  'Parte de Trás': 'verso'
};

const QUALIDADE_WEBP = 92; // ~170 KB por carta, sem perda visível na impressão
const DOWNLOADS_SIMULTANEOS = 4;
const TENTATIVAS = 4;
// Para testes: baixa só as N primeiras cartas
const LIMITE = Number(process.env.CARTAS_PT_LIMITE) || Infinity;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchComRetentativa(url) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.ok) return res;
      ultimoErro = new Error(`HTTP ${res.status}`);
    } catch (error) {
      ultimoErro = error;
    }
    await sleep(1000 * 2 ** tentativa);
  }
  throw ultimoErro;
}

/** Lista o conteúdo de uma pasta pública do Drive (visualização embutida, sem login). */
async function listarPasta(folderId) {
  const res = await fetchComRetentativa(`https://drive.google.com/embeddedfolderview?id=${folderId}`);
  const html = await res.text();
  const itens = [];
  const re = /<div class="flip-entry" id="entry-([^"]+)".*?<a href="([^"]+)".*?<div class="flip-entry-title">([^<]*)<\/div>/gs;
  for (const [, id, href, titulo] of html.matchAll(re)) {
    itens.push({ id, nome: decodeHtml(titulo), pasta: href.includes('/folders/') });
  }
  return itens;
}

/** Percorre uma pasta (com subpastas) e devolve os arquivos com o caminho relativo. */
async function listarArquivos(folderId, caminho) {
  const arquivos = [];
  for (const item of await listarPasta(folderId)) {
    const relativo = path.join(caminho, item.nome);
    if (item.pasta) arquivos.push(...await listarArquivos(item.id, relativo));
    else arquivos.push({ id: item.id, relativo });
  }
  return arquivos;
}

function ehPngOuJpeg(buffer) {
  const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  return png || jpeg;
}

/** Baixa uma imagem e salva como WebP (escrita atômica: arquivo temporário + rename). */
async function baixarComoWebp(arquivo, destino) {
  const res = await fetchComRetentativa(`https://drive.usercontent.google.com/download?id=${arquivo.id}&export=download`);
  const tipo = res.headers.get('content-type') || '';
  const buffer = Buffer.from(await res.arrayBuffer());
  if (tipo.startsWith('text/html')) throw new Error('o Drive devolveu uma página em vez da imagem (limite de downloads?)');
  // Só PNG/JPEG chegam à sharp (a pasta do autor só tem esses formatos)
  if (!ehPngOuJpeg(buffer)) throw new Error('arquivo não é PNG/JPEG; ignorado');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.${process.pid}.tmp`;
  await sharp(buffer, { failOn: 'error' }).webp({ quality: QUALIDADE_WEBP }).toFile(tmp);
  fs.renameSync(tmp, destino);
}

function escreverCreditos() {
  const texto = [
    'CARTAS EM PORTUGUÊS — CRÉDITOS',
    '',
    `Todas as cartas desta pasta foram criadas por fãs pelo ${CREDITO.autor} e distribuídas`,
    'gratuitamente no blog Cartas Caseiras. Os direitos do card game pertencem à Konami.',
    '',
    `Blog:      ${CREDITO.blog}`,
    `Postagem:  ${CREDITO.postagem}`,
    `YouTube:   ${CREDITO.youtube}`,
    `Drive:     ${CREDITO.drive}`,
    '',
    'Encontrou um erro numa carta? Avise o autor nos comentários do blog.',
    'As imagens foram convertidas de PNG para WebP pelo script api/scripts/baixar_cartas_pt.js.',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(IMAGES_BASE_DIR, 'CREDITOS.txt'), texto, 'utf-8');
}

async function main() {
  console.log('=== Cartas em português (HD) ===');
  console.log(`Criadas por ${CREDITO.autor} — ${CREDITO.blog}`);
  console.log(`Destino: ${IMAGES_BASE_DIR}\n`);

  // 1. Listar as pastas de cartas no Drive do autor
  console.log('[1/3] Listando as cartas na pasta pública do autor...');
  const raiz = await listarPasta(DRIVE_ROOT_ID);
  const tarefas = [];
  for (const item of raiz) {
    if (item.pasta && PASTAS[item.nome]) {
      const arquivos = await listarArquivos(item.id, '');
      console.log(`- ${item.nome}: ${arquivos.length} arquivos`);
      for (const arquivo of arquivos) {
        if (!/\.(png|jpe?g|webp)$/i.test(arquivo.relativo)) continue;
        let relativoWebp = arquivo.relativo.replace(/\.(png|jpe?g|webp)$/i, '.webp');
        // Versos levam o nome do autor (aparece no seletor de verso do site)
        if (PASTAS[item.nome] === 'verso') relativoWebp = `${CREDITO.autor} - ${relativoWebp}`;
        tarefas.push({ ...arquivo, destino: path.join(IMAGES_BASE_DIR, PASTAS[item.nome], relativoWebp) });
      }
    }
  }
  if (tarefas.length === 0) {
    console.error('[ERRO] Nenhuma carta encontrada. A pasta do autor pode ter mudado; confira o blog.');
    process.exit(1);
  }

  // 2. Baixar o que ainda não existe localmente
  const pendentes = tarefas.filter(t => !fs.existsSync(t.destino)).slice(0, LIMITE);
  console.log(`\n[2/3] Baixando ${pendentes.length} de ${tarefas.length} cartas (as demais já estão na pasta)...`);
  let feitas = 0;
  const falhas = [];
  let proxima = 0;
  async function trabalhador() {
    while (proxima < pendentes.length) {
      const tarefa = pendentes[proxima++];
      try {
        await baixarComoWebp(tarefa, tarefa.destino);
      } catch (error) {
        falhas.push(`${tarefa.relativo}: ${error.message}`);
      }
      feitas++;
      if (feitas % 50 === 0 || feitas === pendentes.length) {
        console.log(`- ${feitas}/${pendentes.length} (${falhas.length} falhas)`);
      }
    }
  }
  await Promise.all(Array.from({ length: DOWNLOADS_SIMULTANEOS }, trabalhador));

  // 3. Créditos ao autor junto das imagens
  console.log('\n[3/3] Gravando CREDITOS.txt...');
  escreverCreditos();

  if (falhas.length > 0) {
    console.log(`\n[AVISO] ${falhas.length} cartas não foram baixadas:`);
    falhas.slice(0, 10).forEach(f => console.log(`  - ${f}`));
    console.log('Rode o comando de novo para tentar só as que faltaram.');
  }
  console.log(`\n=== Concluído! Obrigado, ${CREDITO.autor}: ${CREDITO.blog} ===`);
  console.log('Pelo ./run.sh o setup roda em seguida; usando só o npm, rode "npm run setup" para as cartas aparecerem no site.');
  if (falhas.length > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error('[ERRO]', error.message);
  process.exit(1);
});
