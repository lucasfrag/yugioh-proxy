// Scans de cartas impressas (PT, EN e OCG japonês) a partir das galerias da Yugipedia.
// Cada carta tem uma página "Card Gallery:<nome em inglês>" listando os scans de todas as
// edições. Os nomes de arquivo seguem o padrão <Nome>-<SET>-<IDIOMA>-<RARIDADE>[-<extra>].png
import path from 'node:path';
import { config } from './config.js';
import { limiter, readJson, writeJson } from './util.js';

const API = 'https://yugipedia.com/api.php';

// Uma requisição por vez à API da Yugipedia, para não sobrecarregar o site.
const apiQueue = limiter(1);

// Códigos de região da Yugipedia agrupados nos idiomas que o app oferece.
const LANGS = { PT: 'pt', EN: 'en', NA: 'en', EU: 'en', AU: 'en', JP: 'jp', JA: 'jp' };
const LANG_ORDER = { pt: 0, en: 1, jp: 2 };

const FILE_RE = /^File:[^-]+-([A-Z0-9]+)-([A-Z]{2})-([A-Za-z0-9]+)(?:-(.+?))?\.(png|jpe?g)$/i;

/** Interpreta o nome de um arquivo de scan. Retorna null se não for um scan de carta real. */
export function parseScanTitle(title) {
  const m = FILE_RE.exec(title);
  if (!m) return null;
  const [, set, region, rarity, extra = ''] = m;
  const lang = LANGS[region];
  if (!lang) return null;
  // Exclui videogame, mangá, anime, fotos de propaganda e Rush Duel (sets "RD/XXXX", outro jogo).
  if (rarity === 'VG' || /Manga|Anime/i.test(extra)) return null;
  if (/Commercial/i.test(rarity + extra) || /^RD[A-Z0-9]{3,}$/.test(set)) return null;
  return { lang, region, set, rarity, extra, file: title.slice('File:'.length) };
}

const THUMB_WIDTH = 240;

/** URL da miniatura no padrão do MediaWiki: /thumb/a/ab/Arquivo.png/240px-Arquivo.png */
export function thumbUrl({ url, width }) {
  if (width <= THUMB_WIDTH) return url;
  const m = /^(https:\/\/[^/]+)\/(\w\/\w\w\/)([^/]+)$/.exec(url);
  return m ? `${m[1]}/thumb/${m[2]}${m[3]}/${THUMB_WIDTH}px-${m[3]}` : url;
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`;
  const res = await apiQueue(() => fetch(url, { headers: { 'User-Agent': config.userAgent } }));
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
      // Não usar iiurlwidth: a Yugipedia bloqueia (403) consultas que pedem miniaturas.
      iiprop: 'url|size',
      ...cont,
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
  return files;
}

/** Títulos alternativos da página da carta, buscados pela senha (id) dela. */
async function titlesByPassword(id) {
  const password = String(id).padStart(8, '0');
  const data = await api({ action: 'ask', query: `[[Password::${password}]]` });
  return Object.keys(data.query?.results ?? {}).filter((t) => !t.includes('('));
}

function sortScans(scans) {
  return scans.sort((a, b) => LANG_ORDER[a.lang] - LANG_ORDER[b.lang] || b.width - a.width);
}

const memory = new Map();

function cacheFile(cardId) {
  return path.join(config.cacheDir, 'yugipedia', `${cardId}.json`);
}

/** Scans de uma carta, usando o cache em disco quando ele ainda é recente. */
export async function getScans(card, { refresh = false } = {}) {
  if (!refresh && memory.has(card.id)) return memory.get(card.id);
  const cached = !refresh && await readJson(cacheFile(card.id));
  if (cached && Date.now() - cached.fetchedAt < config.galleryTtlMs) {
    memory.set(card.id, cached);
    return cached;
  }

  let scans = await fetchGallery(card.en);
  let title = card.en;
  if (scans.length === 0) {
    for (const alt of await titlesByPassword(card.id)) {
      if (alt === card.en) continue;
      scans = await fetchGallery(alt);
      if (scans.length) {
        title = alt;
        break;
      }
    }
  }

  const entry = { fetchedAt: Date.now(), title, scans: sortScans(scans) };
  await writeJson(cacheFile(card.id), entry);
  memory.set(card.id, entry);
  return entry;
}

/** Procura um scan já conhecido (só servimos arquivos que vieram da galeria da carta). */
export async function findScan(cardId, file) {
  const entry = memory.get(cardId) ?? await readJson(cacheFile(cardId));
  if (!entry) return null;
  memory.set(cardId, entry);
  return entry.scans.find((s) => s.file === file) ?? null;
}
