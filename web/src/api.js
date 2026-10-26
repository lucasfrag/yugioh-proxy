// Acesso à API e regras de escolha de arte.

export const LANGS = {
  pt: 'Português',
  en: 'Inglês (TCG)',
  jp: 'Japonês (OCG)',
};

const CARD_RATIO = 59 / 86;
const GOOD_WIDTH = 650; // ~280 dpi impressa em 59 mm

async function getJson(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export async function searchCards(query, limit = 12) {
  const { cards } = await getJson(`/api/cards?q=${encodeURIComponent(query)}&limit=${limit}`);
  return cards;
}

export async function getCards(ids) {
  const { cards } = await getJson(`/api/cards?ids=${ids.join(',')}`);
  return cards;
}

// Buscas de artes rodam no máximo 4 por vez (a Yugipedia é consultada uma carta por vez na API).
const artworkCache = new Map();
let running = 0;
const waiting = [];

function withSlot(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      running++;
      fn().then(resolve, reject).finally(() => {
        running--;
        waiting.shift()?.();
      });
    };
    if (running < 4) run();
    else waiting.push(run);
  });
}

export function getArtworks(cardId) {
  if (!artworkCache.has(cardId)) {
    const job = withSlot(() => getJson(`/api/cards/${cardId}/artworks`));
    job.catch(() => artworkCache.delete(cardId));
    artworkCache.set(cardId, job);
  }
  return artworkCache.get(cardId);
}

/** Arte padrão (imagem limpa do YGOPRODeck) — disponível na hora, sem consultar a galeria. */
export function ygoprodeckArt(artId) {
  return {
    key: `ygoprodeck:${artId}`,
    source: 'ygoprodeck',
    lang: 'en',
    label: 'Arte',
    width: 421,
    height: 614,
    url: `/img/ygoprodeck/full/${artId}.jpg`,
    thumb: `/img/ygoprodeck/small/${artId}.jpg`,
  };
}

/**
 * Melhor imagem no idioma pedido: scans com proporção de carta, preferindo a menor
 * que ainda tenha boa resolução (evita baixar arquivos de 6 MB sem necessidade).
 * Em inglês, a arte limpa do YGOPRODeck costuma imprimir melhor que um scan.
 */
export function pickArt(artworks, lang) {
  if (lang === 'en' || !artworks) return null;
  const scans = artworks.scans.filter((s) => s.lang === lang);
  const wellCropped = scans.filter((s) => Math.abs(s.width / s.height - CARD_RATIO) < 0.03);
  const pool = wellCropped.length ? wellCropped : scans;
  if (!pool.length) return null;
  const good = pool.filter((s) => s.width >= GOOD_WIDTH).sort((a, b) => a.width - b.width);
  return good[0] ?? [...pool].sort((a, b) => b.width - a.width)[0];
}

export function displayName(card, lang) {
  return (lang === 'pt' && card.pt) || card.en;
}
