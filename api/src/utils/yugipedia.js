// Scans de cartas impressas (PT, EN e OCG japonês) a partir das galerias da Yugipedia.
// Cada carta tem uma página "Card Gallery:<nome em inglês>" listando os scans de todas as
// edições. Os nomes de arquivo seguem o padrão <Nome>-<SET>-<IDIOMA>-<RARIDADE>[-<extra>].png
const path = require('path');
const { CACHE_DIR, USER_AGENT } = require('../config');
const { limiter, readJson, writeJson } = require('./cache');

const API = 'https://yugipedia.com/api.php';
const GALLERY_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const THUMB_WIDTH = 240;

// Uma requisição por vez à API da Yugipedia, para não sobrecarregar o site.
const apiQueue = limiter(1);

// Códigos de região da Yugipedia agrupados nos idiomas que o app oferece.
const LANGS = { PT: 'pt', EN: 'en', NA: 'en', EU: 'en', AU: 'en', JP: 'ocg', JA: 'ocg' };

const FILE_RE = /^File:[^-]+-([A-Z0-9]+)-([A-Z]{2})-([A-Za-z0-9]+)(?:-(.+?))?\.(png|jpe?g)$/i;

/**
 * Interpreta o nome de um arquivo de scan. Retorna null se não for um scan de carta real.
 * @param {string} title Ex.: "File:DarkMagician-25TH-PT-UR-1E.png"
 */
function parseScanTitle(title) {
  const m = FILE_RE.exec(title);
  if (!m) return null;
  const [, set, region, rarity, extra = ''] = m;
  const lang = LANGS[region];
  if (!lang) return null;
  // Exclui videogame, mangá, anime, fotos de propaganda, versos de carta, Rush Duel (sets
  // "RD/XXXX") e Dungeon Dice Monsters (set "DDM"), que são outros jogos.
  if (rarity === 'VG' || rarity === 'Back' || /Manga|Anime/i.test(extra)) return null;
  if (/Commercial/i.test(rarity + extra) || /^RD[A-Z0-9]{3,}$/.test(set) || set === 'DDM') return null;
  return { lang, region, set, rarity, extra, file: title.slice('File:'.length) };
}

/**
 * URL da miniatura no padrão do MediaWiki: /thumb/a/ab/Arquivo.png/240px-Arquivo.png
 * (pedir a miniatura pela API com iiurlwidth faz a Yugipedia responder 403).
 */
function thumbUrl({ url, width }) {
  if (width <= THUMB_WIDTH) return url;
  const m = /^(https:\/\/[^/]+)\/(\w\/\w\w\/)([^/]+)$/.exec(url);
  return m ? `${m[1]}/thumb/${m[2]}${m[3]}/${THUMB_WIDTH}px-${m[3]}` : url;
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`;
  const res = await apiQueue(() => fetch(url, { headers: { 'User-Agent': USER_AGENT } }));
  if (!res.ok) throw new Error(`Yugipedia respondeu ${res.status}`);
  return res.json();
}

async function fetchGallery(title) {
  const files = [];
  let cont = {};
  for (let page = 0; page < 8; page++) {
    const data = await api({
      action: 'query',
      redirects: '1',
      generator: 'images',
      titles: `Card Gallery:${title}`,
      gimlimit: '500',
      prop: 'imageinfo',
      iiprop: 'url|size',
      ...cont
    });
    for (const p of Object.values(data.query?.pages ?? {})) {
      const info = p.imageinfo?.[0];
      const scan = info && parseScanTitle(p.title);
      // Só imagens em pé com proporção de carta (descarta banners e fotos).
      if (scan && info.width / info.height > 0.6 && info.width / info.height < 0.78) {
        files.push({ ...scan, width: info.width, height: info.height, url: info.url, thumbUrl: thumbUrl(info) });
      }
    }
    if (!data.continue) break;
    cont = data.continue;
  }
  return files.sort((a, b) => b.width - a.width);
}

/** Títulos alternativos da página da carta, buscados pela senha (ID) dela. */
async function titlesByPassword(id) {
  const password = String(id).padStart(8, '0');
  const data = await api({ action: 'ask', query: `[[Password::${password}]]` });
  return Object.keys(data.query?.results ?? {}).filter((t) => !t.includes('('));
}

const memory = new Map();

function cacheFile(cardId) {
  return path.join(CACHE_DIR, 'yugipedia', `${cardId}.json`);
}

/**
 * Scans de uma carta, usando o cache em disco enquanto ele for recente.
 * @param {{ id: number, nome_en: string }} card
 */
async function getScans(card, { refresh = false } = {}) {
  if (!refresh && memory.has(card.id)) return memory.get(card.id);
  const cached = !refresh && await readJson(cacheFile(card.id));
  if (cached && Date.now() - cached.fetchedAt < GALLERY_TTL_MS) {
    memory.set(card.id, cached);
    return cached;
  }

  let scans = await fetchGallery(card.nome_en);
  let title = card.nome_en;
  if (scans.length === 0) {
    for (const alt of await titlesByPassword(card.id)) {
      if (alt === card.nome_en) continue;
      scans = await fetchGallery(alt);
      if (scans.length) {
        title = alt;
        break;
      }
    }
  }

  const entry = { fetchedAt: Date.now(), title, scans };
  await writeJson(cacheFile(card.id), entry);
  memory.set(card.id, entry);
  return entry;
}

/** Procura um scan já conhecido (só servimos arquivos que vieram da galeria da carta). */
async function findScan(cardId, file) {
  const entry = memory.get(cardId) ?? await readJson(cacheFile(cardId));
  if (!entry) return null;
  memory.set(cardId, entry);
  return entry.scans.find((s) => s.file === file) ?? null;
}

module.exports = { parseScanTitle, thumbUrl, getScans, findScan };
