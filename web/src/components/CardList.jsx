import React from 'react';
import { Plus, Minus, Trash2, Image } from 'lucide-react';
import { IDIOMAS, getItemImage, getItemKey } from '../utils/cardImages';

export default function CardList({ addedCards, onUpdateQuantity, onDeleteCard, onEditCard }) {
  if (addedCards.length === 0) {
    return (
      <div className="empty-card-list">
        <p>Sua lista de proxies está vazia.</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Busque cartas acima para adicioná-las.</p>
      </div>
    );
  }

  const totalCards = addedCards.reduce((acc, card) => acc + card.quantity, 0);

  return (
    <div className="card-list-container">
      <div className="card-list-header">
        <span className="section-title">Cartas Selecionadas</span>
        <span className="total-badge">{totalCards} {totalCards === 1 ? 'carta' : 'cartas'}</span>
      </div>

      <div className="list-items-wrapper">
        {addedCards.map((card) => {
          const imagem = getItemImage(card);
          const itemKey = getItemKey(card);
          const idioma = IDIOMAS.find((i) => i.id === imagem.idioma);

          return (
            <div key={itemKey} className="list-item-card">
              <div className="item-thumbnail" onClick={() => onEditCard(card)} title="Trocar idioma/arte">
                <img src={imagem.miniatura || imagem.url} alt={card.nome} />
              </div>

              <div className="item-details">
                <span className="item-name">{card.nome}</span>
                <span className="item-id">ID: {card.id}</span>

                {/* Idioma e arte escolhidos, com atalho para trocar */}
                <div className="artwork-selector-group">
                  {idioma && <span className={`language-badge language-${idioma.id}`}>{idioma.sigla}</span>}
                  <button type="button" className="change-art-btn" onClick={() => onEditCard(card)}>
                    <Image size={12} className="artwork-icon" />
                    {imagem.rotulo || 'Arte'}
                  </button>
                </div>
              </div>

              <div className="item-actions">
                <div className="quantity-controls">
                  <button
                    onClick={() => onUpdateQuantity(itemKey, card.quantity - 1)}
                    className="qty-btn"
                    title="Diminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{card.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(itemKey, card.quantity + 1)}
                    className="qty-btn"
                    title="Aumentar"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => onDeleteCard(itemKey)}
                  className="delete-btn"
                  title="Remover"
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
