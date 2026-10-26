// Leitura de decks no formato .ydk (YGOPro / YGOPRODeck / Dueling Book).

/**
 * Retorna [{ id, qty }] na ordem em que as cartas aparecem.
 * O Side Deck só entra se `includeSide` for true.
 */
export function parseYdk(text, { includeSide = false } = {}) {
  const counts = new Map();
  let section = 'main';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      if (line === '#main' || line === '#extra') section = line.slice(1);
      continue;
    }
    if (line.startsWith('!')) {
      section = line === '!side' ? 'side' : section;
      continue;
    }
    if (!/^\d+$/.test(line)) continue;
    if (section === 'side' && !includeSide) continue;
    const id = Number(line);
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return [...counts].map(([id, qty]) => ({ id, qty }));
}
