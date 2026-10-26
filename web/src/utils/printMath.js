// Definições de tamanho das folhas de mercado (medidas em milímetros)
export const PAGE_SIZES = {
  A4: { name: 'A4', width: 210, height: 297 },
  A3: { name: 'A3', width: 297, height: 420 },
  A2: { name: 'A2', width: 420, height: 594 },
  A5: { name: 'A5', width: 148, height: 210 },
  Letter: { name: 'Carta (Letter)', width: 215.9, height: 279.4 },
  Legal: { name: 'Ofício (Legal)', width: 215.9, height: 355.6 },
  Tabloid: { name: 'Tabloide (Tabloid)', width: 279.4, height: 431.8 }
};

// Tamanho oficial de uma carta Yu-Gi-Oh! (em milímetros)
export const CARD_OFFICIAL_WIDTH = 59;
export const CARD_OFFICIAL_HEIGHT = 86;

// Margem de segurança física para as impressoras (em milímetros)
export const SAFETY_MARGIN = 10;

/**
 * Calcula a grade de cartões e distribui as cartas em páginas frentes e versos.
 * 
 * @param {Array} addedCards Lista de cartas adicionadas pelo usuário (incluindo quantidade)
 * @param {object} config Objeto de configurações { sheetSize, scale, margin, borderSize, enableBacks }
 * @returns {Array} Lista de páginas estruturadas para renderização
 */
export function calculatePrintLayout(addedCards, config) {
  const { sheetSize, scale, margin, enableBacks } = config;
  const sheet = PAGE_SIZES[sheetSize] || PAGE_SIZES.A4;
  
  // Medidas das cartas em mm com base na escala
  const cardW = CARD_OFFICIAL_WIDTH * (scale / 100);
  const cardH = CARD_OFFICIAL_HEIGHT * (scale / 100);
  
  // Área útil de impressão descontando a margem de segurança configurável
  const safetyMarginVal = config.useSafetyMargin !== false ? SAFETY_MARGIN : 0;
  const printableW = sheet.width - 2 * safetyMarginVal;
  const printableH = sheet.height - 2 * safetyMarginVal;
  
  // Cálculo matemático exato da grade: N * W + (N-1) * M <= PrintableW
  const cols = Math.floor((printableW + margin) / (cardW + margin)) || 1;
  const rows = Math.floor((printableH + margin) / (cardH + margin)) || 1;
  
  const cardsPerPage = cols * rows;
  
  // Dimensões totais do bloco de cartas para centralização na folha
  const totalGridW = cols * cardW + (cols - 1) * margin;
  const totalGridH = rows * cardH + (rows - 1) * margin;
  
  // Margens de centralização
  const leftMargin = (sheet.width - totalGridW) / 2;
  const rightMargin = sheet.width - totalGridW - leftMargin;
  const topMargin = (sheet.height - totalGridH) / 2;
  const bottomMargin = sheet.height - totalGridH - topMargin;

  // Planificar a lista de cartas conforme suas quantidades
  const flatCards = [];
  addedCards.forEach(card => {
    for (let i = 0; i < card.quantity; i++) {
      flatCards.push(card);
    }
  });

  const pages = [];
  let cardIndex = 0;
  let pageNumber = 1;

  while (cardIndex < flatCards.length) {
    const pageCards = flatCards.slice(cardIndex, cardIndex + cardsPerPage);
    
    // Criar array de cartas da página preenchida até o limite (cardsPerPage) com null
    const paddedFrontCards = [];
    for (let i = 0; i < cardsPerPage; i++) {
      if (i < pageCards.length) {
        paddedFrontCards.push(pageCards[i]);
      } else {
        paddedFrontCards.push(null);
      }
    }
    
    // 1. Página de Frente
    pages.push({
      pageNumber: pageNumber++,
      isBack: false,
      cards: paddedFrontCards,
      gridConfig: {
        cols,
        rows,
        cardWidth: cardW,
        cardHeight: cardH,
        margin,
        leftMargin,
        rightMargin,
        topMargin,
        bottomMargin
      }
    });

    // 2. Página de Verso (se habilitada)
    if (enableBacks) {
      // Espelhar a ordem das cartas horizontalmente em cada linha da grade para coincidir frente/verso
      const mirroredBackCards = [];
      for (let r = 0; r < rows; r++) {
        // Obter as colunas da linha r a partir de paddedFrontCards
        const rowCards = paddedFrontCards.slice(r * cols, (r + 1) * cols);
        // Inverte horizontalmente a linha inteira (incluindo slots vazios/null)
        mirroredBackCards.push(...[...rowCards].reverse());
      }

      pages.push({
        pageNumber: pageNumber++,
        isBack: true,
        cards: mirroredBackCards,
        gridConfig: {
          cols,
          rows,
          cardWidth: cardW,
          cardHeight: cardH,
          margin,
          // Espelha as margens laterais (esquerda vira direita, e vice-versa)
          leftMargin: rightMargin,
          rightMargin: leftMargin,
          topMargin,
          bottomMargin
        }
      });
    }

    cardIndex += cardsPerPage;
  }

  return {
    pages,
    cols,
    rows,
    cardsPerPage
  };
}
