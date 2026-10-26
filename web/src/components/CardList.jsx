import React from 'react';
import { Plus, Minus, Trash2, Image } from 'lucide-react';
import { IDIOMAS, getItemImage, getItemKey } from '../utils/cardImages';
import { artLabel, cardNames, useI18n } from '../utils/i18n';

export default function CardList({ addedCards, onUpdateQuantity, onDeleteCard, onEditCard }) {
  const { lang, t, tn } = useI18n();

  if (addedCards.length === 0) {
    return (
      <div className="empty-card-list">
        <p>{t('list.empty')}</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('list.emptyHint')}</p>
      </div>
    );
  }

  const totalCards = addedCards.reduce((acc, card) => acc + card.quantity, 0);

  return (
    <div className="card-list-container">
      <div className="card-list-header">
        <span className="section-title">{t('list.title')}</span>
        <span className="total-badge">{tn('list.count', totalCards)}</span>
      </div>

      <div className="list-items-wrapper">
        {addedCards.map((card) => {
          const imagem = getItemImage(card);
          const itemKey = getItemKey(card);
          const idioma = IDIOMAS.find((i) => i.id === imagem.idioma);
          const nome = cardNames(card, lang).principal;

          return (
            <div key={itemKey} className="list-item-card">
              <div className="item-thumbnail" onClick={() => onEditCard(card)} title={t('list.changeArt')}>
                <img src={imagem.miniatura || imagem.url} alt={nome} />
              </div>

              <div className="item-details">
                <span className="item-name">{nome}</span>
                <span className="item-id">ID: {card.id}</span>

                {/* Idioma e arte escolhidos, com atalho para trocar */}
                <div className="artwork-selector-group">
                  {idioma && <span className={`language-badge language-${idioma.id}`}>{idioma.sigla}</span>}
                  <button type="button" className="change-art-btn" onClick={() => onEditCard(card)}>
                    <Image size={12} className="artwork-icon" />
                    {artLabel(imagem.rotulo, t)}
                  </button>
                </div>
              </div>

              <div className="item-actions">
                <div className="quantity-controls">
                  <button
                    onClick={() => onUpdateQuantity(itemKey, card.quantity - 1)}
                    className="qty-btn"
                    title={t('list.decrease')}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{card.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(itemKey, card.quantity + 1)}
                    className="qty-btn"
                    title={t('list.increase')}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => onDeleteCard(itemKey)}
                  className="delete-btn"
                  title={t('list.remove')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
