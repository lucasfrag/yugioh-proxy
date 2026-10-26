// Gera a versão estática do site (sem servidor) para publicar de graça, ex.: Cloudflare Pages.
//
// A pasta gerada (site-estatico/ na raiz) contém:
//   data/cartas.json   índice das cartas para a busca no navegador
//   img/en/<id>.webp   artes em inglês, baixadas UMA vez do YGOPRODeck (que pede para não fazer hotlink)
//   img/pt/...         cartas em português do Emula Animes — só com --com-pt (com um CREDITOS.txt)
//   img/verso/...      versos
//   index.html, assets/ o site, gerado com VITE_STATIC=1
//
// Uso: npm run site-estatico            (sem as cartas em português)
//      npm run site-estatico -- --com-pt (inclui as cartas em português)
// Pode ser interrompido e retomado: imagens já geradas são puladas.
//
// Atualização automática (GitHub Actions): com ORIGEM_IMAGENS=https://<site publicado>, as artes que
// já estão no site no ar são copiadas de lá (já em WebP) e só as cartas novas são baixadas do YGOPRODeck.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');
const { CARDS_DB_FILE, CACHE_DIR, IMAGE_FOLDERS, IMAGES_BASE_DIR, USER_AGENT } = require('../src/config');

const RAIZ = path.join(__dirname, '..', '..');
const SAIDA = process.env.SITE_DIR || path.join(RAIZ, 'site-estatico');
const COM_PT = process.argv.includes('--com-pt');
// Para testes: processa só as N primeiras artes em inglês
const LIMITE_ARTES = Number(process.env.SITE_LIMITE_ARTES) || Infinity;
// Site já publicado de onde copiar as artes existentes (ex.: https://yugioh-proxy.pages.dev)
const ORIGEM_IMAGENS = (process.env.ORIGEM_IMAGENS || '').replace(/\/+$/, '');

const QUALIDADE_WEBP = 85;
const LIMITE_ARQUIVOS = 20000; // plano grátis do Cloudflare Pages
// Educado com o YGOPRODeck: no máximo ~10 pedidos por segundo (o limite deles é 20)
// Os pedidos ao YGOPRODeck são espaçados globalmente (aguardarVez), então mais trabalhadores
// só aceleram as cópias do site publicado
const DOWNLOADS_SIMULTANEOS = 12;
const INTERVALO_MINIMO_MS = 100;

const VERSOS_OFICIAIS = {
  'Back-EN': 'https://ms.yugipedia.com/e/e5/Back-EN.png',
  'Back-JP': 'https://ms.yugipedia.com/d/da/Back-JP.png',
  'Back-KR': 'https://ms.yugipedia.com/7/70/Back-KR.png'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let proximoPedido = 0;
/** Espaça os pedidos ao YGOPRODeck para nunca passar de ~10 por segundo. */
async function aguardarVez() {
  const agora = Date.now();
  const espera = Math.max(0, proximoPedido - agora);
  proximoPedido = Math.max(agora, proximoPedido) + INTERVALO_MINIMO_MS;
  if (espera > 0) await sleep(espera);
}

async function baixar(url) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    await aguardarVez();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      ultimoErro = new Error(`HTTP ${res.status}`);
      if (res.status === 404) break;
    } catch (error) {
      ultimoErro = error;
    }
    await sleep(1000 * 2 ** tentativa);
  }
  throw ultimoErro;
}

/** Copia a arte do site já publicado (sem reconverter). Devolve false se ela ainda não existe lá. */
async function copiarDoSitePublicado(id, destino) {
  if (!ORIGEM_IMAGENS) return false;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const res = await fetch(`${ORIGEM_IMAGENS}/img/en/${id}.webp`, { headers: { 'User-Agent': USER_AGENT } });
      if (res.status === 404) return false;
      if (res.ok && (res.headers.get('content-type') || '').includes('image/webp')) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.writeFileSync(`${destino}.${process.pid}.tmp`, buffer);
        fs.renameSync(`${destino}.${process.pid}.tmp`, destino);
        return true;
      }
      // Sem a imagem (ex.: página de fallback do Pages): trata como inexistente
      if (res.ok) return false;
    } catch {
      // Falha de rede: tenta de novo
    }
    await sleep(1000 * tentativa);
  }
  return false;
}

async function salvarWebp(origem, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.${process.pid}.tmp`;
  await sharp(origem, { failOn: 'error' }).webp({ quality: QUALIDADE_WEBP }).toFile(tmp);
  fs.renameSync(tmp, destino);
}

const CREDITOS_PT = [
  'CARTAS EM PORTUGUÊS — CRÉDITOS',
  '',
  'As cartas em português desta pasta foram criadas por fãs pelo Emula Animes e',
  'distribuídas gratuitamente no blog Cartas Caseiras.',
  'Os direitos do card game pertencem à Konami.',
  '',
  'Blog:     https://cartascaseiras.blogspot.com/',
  'Postagem: https://cartascaseiras.blogspot.com/2021/04/cartas-de-yu-gi-oh-pt-br-para-imprimir.html',
  'YouTube:  https://www.youtube.com/watch?v=JqDxDtMwyME',
  '',
  'Encontrou um erro numa carta? Avise o autor nos comentários do blog.',
  ''
].join('\n');

/**
 * Copia do site publicado as cartas PT que já estão no ar (para cartas sem imagem PT local).
 * Usa o índice publicado (data/cartas.json) para saber quais arquivos existem.
 */
async function cartasPtDoSitePublicado(idsAtuais, ptPorCarta) {
  let indice;
  try {
    const res = await fetch(`${ORIGEM_IMAGENS}/data/cartas.json`, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return { cartas: 0, copiadas: 0 };
    indice = await res.json();
  } catch {
    return { cartas: 0, copiadas: 0 };
  }
  let cartas = 0;
  let copiadas = 0;
  for (const [id, , , , , , , pt] of indice.cartas || []) {
    if (!pt || pt.length === 0 || ptPorCarta.has(id) || !idsAtuais.has(id)) continue;
    const arquivos = [];
    for (const nome of pt) {
      const destino = path.join(SAIDA, 'img', 'pt', nome);
      if (!fs.existsSync(destino)) {
        const res = await fetch(`${ORIGEM_IMAGENS}/img/pt/${nome}`, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok || !(res.headers.get('content-type') || '').includes('image/webp')) continue;
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.writeFileSync(destino, Buffer.from(await res.arrayBuffer()));
        copiadas++;
      }
      arquivos.push(nome);
    }
    if (arquivos.length) {
      ptPorCarta.set(id, arquivos);
      cartas++;
    }
  }
  return { cartas, copiadas };
}

/** Converte a URL de imagem local da base (…/imagens/monstros/Nome.webp) no caminho do arquivo. */
function caminhoImagemLocal(url) {
  const m = /\/imagens\/(monstros|magias|armadilhas|tokens)\/(.+)$/.exec(url);
  if (!m) return null;
  return path.join(IMAGE_FOLDERS[m[1]], ...m[2].split('/').map(decodeURIComponent));
}

function contarArquivos(dir) {
  let arquivos = 0;
  let bytes = 0;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) {
      const sub = contarArquivos(p);
      arquivos += sub.arquivos;
      bytes += sub.bytes;
    } else {
      arquivos++;
      bytes += fs.statSync(p).size;
    }
  }
  return { arquivos, bytes };
}

async function main() {
  console.log('=== Gerando o site estático ===');
  console.log(`Destino: ${SAIDA}`);
  console.log(`Cartas em português: ${COM_PT ? 'incluídas (--com-pt)' : 'não incluídas (use --com-pt para incluir)'}\n`);

  if (!fs.existsSync(CARDS_DB_FILE)) {
    console.error('[ERRO] Base de cartas não encontrada. Rode "npm run setup" antes.');
    process.exit(1);
  }
  const cards = JSON.parse(fs.readFileSync(CARDS_DB_FILE, 'utf8'));
  fs.mkdirSync(SAIDA, { recursive: true });

  // 1. Cartas em português (cópia dos arquivos locais, já em WebP)
  console.log('[1/5] Cartas em português...');
  const ptPorCarta = new Map();
  if (COM_PT) {
    let copiadas = 0;
    for (const card of cards) {
      const arquivos = [];
      (card.imagens || []).forEach((url, idx) => {
        const origem = caminhoImagemLocal(url);
        if (!origem || !fs.existsSync(origem)) return;
        const nome = `${card.id}-${idx + 1}.webp`;
        const destino = path.join(SAIDA, 'img', 'pt', nome);
        if (!fs.existsSync(destino)) {
          fs.mkdirSync(path.dirname(destino), { recursive: true });
          fs.copyFileSync(origem, destino);
          copiadas++;
        }
        arquivos.push(nome);
      });
      if (arquivos.length) ptPorCarta.set(card.id, arquivos);
    }
    console.log(`- ${ptPorCarta.size} cartas com arte em português na pasta local (${copiadas} arquivos novos)`);

    // Sem a pasta local (ex.: GitHub Actions): mantém as cartas PT que já estão no site publicado
    if (ORIGEM_IMAGENS) {
      const deSite = await cartasPtDoSitePublicado(new Set(cards.map(c => c.id)), ptPorCarta);
      if (deSite.cartas) console.log(`- ${deSite.cartas} cartas mantidas do site publicado (${deSite.copiadas} arquivos copiados)`);
    }
    if (ptPorCarta.size === 0) {
      console.error('[ERRO] --com-pt foi pedido, mas nenhuma carta em português foi encontrada (nem local, nem no site publicado).');
      console.error('       Publicar assim tiraria as cartas PT do site. Rode "npm run cartas-pt" ou confira ORIGEM_IMAGENS.');
      process.exit(1);
    }
    fs.writeFileSync(path.join(SAIDA, 'img', 'pt', 'CREDITOS.txt'), CREDITOS_PT, 'utf-8');
  } else {
    // Garante que uma geração anterior com --com-pt não deixe as imagens no site
    fs.rmSync(path.join(SAIDA, 'img', 'pt'), { recursive: true, force: true });
    console.log('- pulado');
  }

  // 2. Artes em inglês
  console.log('\n[2/5] Artes em inglês (YGOPRODeck)...');
  const artes = [...new Set(cards.flatMap(c => c.artes || []))];
  const pendentes = artes
    .filter(id => !fs.existsSync(path.join(SAIDA, 'img', 'en', `${id}.webp`)))
    .slice(0, LIMITE_ARTES);
  console.log(`- ${artes.length} artes no total; faltam ${pendentes.length}`);
  if (ORIGEM_IMAGENS) console.log(`- copiando as que já existem em ${ORIGEM_IMAGENS}`);
  let feitas = 0;
  let baixadas = 0;
  let copiadas = 0;
  const falhas = [];
  let proxima = 0;
  async function trabalhador() {
    while (proxima < pendentes.length) {
      const id = pendentes[proxima++];
      try {
        const destino = path.join(SAIDA, 'img', 'en', `${id}.webp`);
        if (await copiarDoSitePublicado(id, destino)) {
          copiadas++;
          feitas++;
          if (feitas % 250 === 0 || feitas === pendentes.length) {
            console.log(`- ${feitas}/${pendentes.length} (${copiadas} copiadas do site, ${baixadas} baixadas, ${falhas.length} falhas)`);
          }
          continue;
        }
        // Usa o cache do modo local (./run.sh) quando a imagem já foi baixada antes
        const cache = path.join(CACHE_DIR, 'img', 'ygoprodeck', 'full', `${id}.jpg`);
        let origem;
        if (fs.existsSync(cache)) origem = fs.readFileSync(cache);
        else {
          origem = await baixar(`https://images.ygoprodeck.com/images/cards/${id}.jpg`);
          baixadas++;
        }
        await salvarWebp(origem, path.join(SAIDA, 'img', 'en', `${id}.webp`));
      } catch (error) {
        falhas.push(`${id}: ${error.message}`);
      }
      feitas++;
      if (feitas % 250 === 0 || feitas === pendentes.length) {
        console.log(`- ${feitas}/${pendentes.length} (${copiadas} copiadas do site, ${baixadas} baixadas, ${falhas.length} falhas)`);
      }
    }
  }
  await Promise.all(Array.from({ length: DOWNLOADS_SIMULTANEOS }, trabalhador));

  // 3. Versos: os da pasta local (os do Emula Animes só com --com-pt) + oficiais
  console.log('\n[3/5] Versos...');
  const versos = [];
  const pastaVerso = path.join(IMAGES_BASE_DIR, 'verso');
  const locais = fs.existsSync(pastaVerso)
    ? fs.readdirSync(pastaVerso).filter(f => /\.(webp|png|jpe?g)$/i.test(f)).sort()
    : [];
  let original = 0;
  let emula = 0;
  for (const arquivo of locais) {
    const doEmula = arquivo.startsWith('Emula Animes');
    if (doEmula && !COM_PT) continue;
    // Nomes sem espaços nem acentos (URLs mais seguras), mantendo o crédito do autor
    const nome = doEmula ? `Emula-Animes-${++emula}.webp` : `Original-${++original}.webp`;
    await salvarWebp(fs.readFileSync(path.join(pastaVerso, arquivo)), path.join(SAIDA, 'img', 'verso', nome));
    versos.push(nome);
  }
  for (const [nome, url] of Object.entries(VERSOS_OFICIAIS)) {
    const destino = path.join(SAIDA, 'img', 'verso', `${nome}.webp`);
    if (!fs.existsSync(destino)) await salvarWebp(await baixar(url), destino);
    versos.push(`${nome}.webp`);
  }
  // Remove versos de gerações anteriores que não fazem mais parte do site
  for (const f of fs.readdirSync(path.join(SAIDA, 'img', 'verso'))) {
    if (!versos.includes(f)) fs.rmSync(path.join(SAIDA, 'img', 'verso', f));
  }
  console.log(`- ${versos.length} versos`);

  // 4. Índice das cartas: [id, nome, nome_en, tipo, tipo_en, tipo_carta, artes[], pt[]]
  console.log('\n[4/5] Índice das cartas...');
  const temArte = (id) => fs.existsSync(path.join(SAIDA, 'img', 'en', `${id}.webp`));
  const indice = {
    gerado: new Date().toISOString(),
    versos,
    cartas: cards.map(c => [
      c.id, c.nome, c.nome_en, c.tipo, c.tipo_en || null, c.tipo_carta,
      (c.artes || []).filter(temArte), ptPorCarta.get(c.id) || []
    ])
  };
  fs.mkdirSync(path.join(SAIDA, 'data'), { recursive: true });
  fs.writeFileSync(path.join(SAIDA, 'data', 'cartas.json'), JSON.stringify(indice));
  console.log(`- ${indice.cartas.length} cartas (${(fs.statSync(path.join(SAIDA, 'data', 'cartas.json')).size / 1e6).toFixed(1)} MB)`);

  // 5. Site em modo estático + regras de cache do Cloudflare Pages
  console.log('\n[5/5] Gerando o site...');
  fs.rmSync(path.join(SAIDA, 'assets'), { recursive: true, force: true });
  execSync(`npx vite build --outDir "${SAIDA}"`, {
    cwd: path.join(RAIZ, 'web'),
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, VITE_STATIC: '1' }
  });
  fs.writeFileSync(path.join(SAIDA, '_headers'), [
    '/img/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/data/*',
    '  Cache-Control: public, max-age=3600',
    ''
  ].join('\n'));

  const { arquivos, bytes } = contarArquivos(SAIDA);
  console.log(`\n=== Pronto: ${arquivos} arquivos, ${(bytes / 1e9).toFixed(2)} GB em ${SAIDA} ===`);
  if (arquivos > LIMITE_ARQUIVOS) {
    console.log(`[AVISO] Passou do limite de ${LIMITE_ARQUIVOS} arquivos do plano grátis do Cloudflare Pages.`);
  }
  if (falhas.length > 0) {
    console.log(`[AVISO] ${falhas.length} artes não foram baixadas (rode de novo para tentar só essas):`);
    falhas.slice(0, 10).forEach(f => console.log(`  - ${f}`));
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error('[ERRO]', error.message);
  process.exit(1);
});
