// Leitura de decks nos formatos padrão da comunidade:
// - YDKe: "ydke://<main>!<extra>!<side>!", cada parte em base64 com IDs de 32 bits (little-endian).
//   Exportado por YGOPRODeck, Master Duel Meta, EDOPro, YGO Omega etc.
// - YDK: arquivo de texto com as seções #main, #extra e !side, um ID por linha.
//   Exportado por EDOPro, YGO Omega, YGOPRODeck, Dueling Book etc.

/** Decodifica uma parte do YDKe (base64 → lista de IDs). */
function decodificarYdkeParte(base64) {
  if (!base64) return [];
  const binario = atob(base64);
  const ids = [];
  for (let i = 0; i + 3 < binario.length; i += 4) {
    ids.push(
      (binario.charCodeAt(i) |
        (binario.charCodeAt(i + 1) << 8) |
        (binario.charCodeAt(i + 2) << 16) |
        (binario.charCodeAt(i + 3) << 24)) >>> 0
    );
  }
  return ids;
}

function lerYdke(texto) {
  const m = /ydke:\/\/([A-Za-z0-9+/=]*)!([A-Za-z0-9+/=]*)!([A-Za-z0-9+/=]*)!?/.exec(texto);
  if (!m) return null;
  return {
    main: decodificarYdkeParte(m[1]),
    extra: decodificarYdkeParte(m[2]),
    side: decodificarYdkeParte(m[3])
  };
}

function lerYdk(texto) {
  const deck = { main: [], extra: [], side: [] };
  let secao = 'main';
  let encontrouId = false;
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha) continue;
    const marcador = linha.toLowerCase();
    if (marcador === '#main') { secao = 'main'; continue; }
    if (marcador === '#extra') { secao = 'extra'; continue; }
    if (marcador === '!side') { secao = 'side'; continue; }
    if (linha.startsWith('#') || linha.startsWith('!')) continue; // comentários (#created by ...)
    const id = /^\d+$/.exec(linha);
    if (!id) continue;
    deck[secao].push(Number(id[0]));
    encontrouId = true;
  }
  return encontrouId ? deck : null;
}

/**
 * Lê um deck colado (YDKe ou conteúdo de .ydk). Devolve { main, extra, side } com os IDs
 * na ordem do deck (repetidos para cada cópia), ou null se o texto não for um deck.
 */
export function parseDeck(texto) {
  if (!texto || !texto.trim()) return null;
  try {
    return lerYdke(texto) || lerYdk(texto);
  } catch {
    return null;
  }
}

/** Agrupa os IDs em [{ id, quantidade }], mantendo a ordem da primeira aparição. */
export function agruparIds(ids) {
  const contagem = new Map();
  for (const id of ids) contagem.set(id, (contagem.get(id) || 0) + 1);
  return [...contagem].map(([id, quantidade]) => ({ id, quantidade }));
}
