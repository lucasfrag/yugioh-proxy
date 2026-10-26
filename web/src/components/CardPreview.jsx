import React, { useRef } from 'react';
import { getItemImage } from '../utils/cardImages';
import { useSheetZoom } from '../utils/useSheetZoom';
import { cardNames, useI18n } from '../utils/i18n';

// URL padrão para o verso das cartas de Yu-Gi-Oh!
const CARD_BACK_IMAGE_URL = '/imagens/verso-remoto/Back-EN.png';

export default function CardPreview({ layoutResult, borderSize, sheetSize, useSafetyMargin, selectedBackUrl }) {
  const { pages } = layoutResult;
  const { lang, t, tn } = useI18n();
  const areaRef = useRef(null);
  const hasPages = Boolean(pages && pages.length > 0);
  const zoom = useSheetZoom(areaRef, sheetSize, hasPages);

  if (!hasPages) {
    return (
      <div className="preview-placeholder">
        <div className="placeholder-content">
          <h3>{t('preview.title')}</h3>
          <p>{t('preview.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="print-preview-area" ref={areaRef}>
      <div className="preview-section-title no-print">
        {t('preview.title')} ({tn('preview.pages', pages.length)})
      </div>

      <div className="sheets-container" style={{ '--sheet-zoom': zoom }}>
        {pages.map((page) => {
          const { gridConfig, cards, isBack, pageNumber } = page;
          
          // Estilo dinâmico para a folha simulando as margens exatas em milímetros
          const sheetStyle = {
            paddingTop: `${gridConfig.topMargin}mm`,
            paddingBottom: `${gridConfig.bottomMargin}mm`,
            paddingLeft: `${gridConfig.leftMargin}mm`,
            paddingRight: `${gridConfig.rightMargin}mm`
          };

          // Estilo dinâmico do CSS Grid
          const gridStyle = {
            display: 'grid',
            gridTemplateColumns: `repeat(${gridConfig.cols}, ${gridConfig.cardWidth}mm)`,
            gridTemplateRows: `repeat(${gridConfig.rows}, ${gridConfig.cardHeight}mm)`,
            gap: `${gridConfig.margin}mm`,
            width: 'max-content',
            height: 'max-content'
          };

          // Estilo da borda de corte ao redor da carta
          const cardStyle = {
            width: `${gridConfig.cardWidth}mm`,
            height: `${gridConfig.cardHeight}mm`,
            boxSizing: 'border-box'
          };

          if (borderSize > 0) {
            cardStyle.border = `${borderSize}px solid #1a1a1a`;
          }

          return (
            <div 
              key={pageNumber} 
              className={`sheet-page sheet-${sheetSize.toLowerCase()} ${isBack ? 'back-page' : 'front-page'}`}
              style={sheetStyle}
            >
              {/* Moldura de Segurança física (apenas na tela, oculta na impressão) */}
              {useSafetyMargin && (
                <div 
                  className="sheet-safety-outline no-print" 
                  style={{
                    position: 'absolute',
                    top: '10mm',
                    left: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    border: '1px dashed color-mix(in srgb, var(--accent) 35%, transparent)',
                    pointerEvents: 'none',
                    borderRadius: '2px',
                    boxSizing: 'border-box'
                  }} 
                />
              )}

              {/* Indicador de página visível na tela, mas invisível na impressão */}
              <div className="sheet-page-indicator no-print">
                {t(isBack ? 'preview.back' : 'preview.front', { n: pageNumber })}
              </div>

              <div style={gridStyle} className="sheet-grid">
                {cards.map((card, idx) => {
                  if (!card) {
                    return (
                      <div 
                        key={`empty-${idx}`} 
                        className="preview-card empty-slot" 
                        style={{ ...cardStyle, border: 'none', background: 'transparent' }}
                      />
                    );
                  }

                  const imageUrl = isBack ? (selectedBackUrl || CARD_BACK_IMAGE_URL) : getItemImage(card).url;

                  return (
                    <div 
                      key={`${card.id}-${idx}`} 
                      className={`preview-card ${isBack ? 'card-back' : 'card-front'}`}
                      style={cardStyle}
                    >
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={isBack ? t('preview.backAlt') : cardNames(card, lang).principal} 
                          className="card-image-render"
                        />
                      ) : (
                        <div className="card-error-render">?</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
