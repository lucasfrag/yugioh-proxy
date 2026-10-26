// Baixa a base de cartas do YGOPRODeck (inglês + português) e grava api/data/cards.json.
// Rode de vez em quando para pegar cartas novas: `npm run setup` na raiz.
import { config } from '../src/config.js';
import { writeJson } from '../src/util.js';

const API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

async function download(params) {
  const url = `${API}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { 'User-Agent': config.userAgent } });
  if (!res.ok) throw new Error(`${url} respondeu ${res.status}`);
  return (await res.json()).data;
}

console.log('Baixando cartas em inglês...');
const en = await download({});
console.log(`  ${en.length} cartas`);

console.log('Baixando nomes em português...');
const pt = await download({ language: 'pt' });
console.log(`  ${pt.length} cartas com tradução PT`);

const ptById = new Map(pt.map((c) => [c.id, c]));

const cards = en.map((c) => {
  const p = ptById.get(c.id);
  return {
    id: c.id,
    en: c.name,
    pt: p?.name ?? null,
    frame: c.frameType,
    type: c.type,
    // Cada item de card_images é uma arte diferente (artes alternativas têm id próprio).
    arts: (c.card_images || []).map((img) => img.id),
  };
});

await writeJson(config.cardsFile, { syncedAt: new Date().toISOString(), cards });
console.log(`Pronto: ${cards.length} cartas salvas em ${config.cardsFile}`);
