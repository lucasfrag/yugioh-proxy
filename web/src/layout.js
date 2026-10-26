// Cálculo de quantas cartas cabem por folha e onde ficam as marcas de corte (tudo em mm).

export const PAPERS = {
  a4: { label: 'A4 (210 × 297 mm)', width: 210, height: 297 },
  letter: { label: 'Carta (216 × 279 mm)', width: 215.9, height: 279.4 },
};

export const CARD_SIZES = {
  official: { label: 'Oficial Yu-Gi-Oh! (59 × 86 mm)', width: 59, height: 86 },
  magic: { label: 'Padrão / Magic (63 × 88 mm)', width: 63, height: 88 },
};

const MIN_MARGIN = 5;

export function computeLayout({ paper, cardWidth, cardHeight, gap }) {
  const { width: pw, height: ph } = PAPERS[paper];
  const usableW = pw - 2 * MIN_MARGIN;
  const usableH = ph - 2 * MIN_MARGIN;
  const cols = Math.max(1, Math.floor((usableW + gap) / (cardWidth + gap)));
  const rows = Math.max(1, Math.floor((usableH + gap) / (cardHeight + gap)));
  const gridW = cols * cardWidth + (cols - 1) * gap;
  const gridH = rows * cardHeight + (rows - 1) * gap;
  const left = (pw - gridW) / 2;
  const top = (ph - gridH) / 2;

  // Posições das bordas de cada carta (marcas de corte saem dessas linhas).
  const xs = new Set();
  for (let c = 0; c < cols; c++) {
    xs.add(round(left + c * (cardWidth + gap)));
    xs.add(round(left + c * (cardWidth + gap) + cardWidth));
  }
  const ys = new Set();
  for (let r = 0; r < rows; r++) {
    ys.add(round(top + r * (cardHeight + gap)));
    ys.add(round(top + r * (cardHeight + gap) + cardHeight));
  }

  return { pw, ph, cols, rows, perPage: cols * rows, left, top, gridW, gridH, cutXs: [...xs], cutYs: [...ys] };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

/** Expande a lista (com quantidades) em uma carta por posição e divide em folhas. */
export function paginate(entries, perPage) {
  const flat = entries.flatMap((e) => Array.from({ length: e.qty }, (_, i) => ({ ...e, copy: i })));
  const pages = [];
  for (let i = 0; i < flat.length; i += perPage) pages.push(flat.slice(i, i + perPage));
  return pages;
}
