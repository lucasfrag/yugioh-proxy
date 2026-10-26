import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { IDIOMAS } from '../utils/cardImages';

export default function ArtworkSelectionModal({
  card,
  onClose,
  onConfirm,
  initialImage = null,
  initialQuantity = 1,
  confirmLabel = 'Selecionar Carta'
}) {
  const [imagens, setImagens] = useState(null);
  const [erro, setErro] = useState('');
  const [idioma, setIdioma] = useState(initialImage?.idioma || null);
  const [selected, setSelected] = useState(initialImage);
  const [quantity, setQuantity] = useState(initialQuantity);
  const hasInitialImage = Boolean(initialImage);

  // Busca todas as imagens da carta ao abrir o modal
  useEffect(() => {
    let cancelado = false;
    async function fetchImagens() {
      try {
        const response = await fetch(`/api/cartas/${card.id}/imagens`);
        const data = await response.json();
        if (cancelado) return;
        setImagens(data.idiomas);
        if (data.erro) setErro(data.erro);

        // Idioma inicial: o da imagem já escolhida, senão Português (se houver), senão Inglês
        if (!hasInitialImage) {
          const inicial = data.idiomas.pt.length > 0 ? 'pt' : 'en';
          setIdioma(inicial);
          setSelected(withIdioma(data.idiomas[inicial][0], inicial));
        }
      } catch {
        if (!cancelado) setErro('Não foi possível carregar as imagens desta carta.');
      }
    }
    fetchImagens();
    return () => { cancelado = true; };
  }, [card.id, hasInitialImage]);

  if (!card) return null;

  const lista = (imagens && idioma && imagens[idioma]) || [];
  // As abas só aparecem quando há imagens em mais de um idioma (ex.: acervo PT local + artes EN)
  const idiomasDisponiveis = imagens ? IDIOMAS.filter(({ id }) => imagens[id].length > 0) : [];
  const mostrarAbas = idiomasDisponiveis.length > 1;

  const handleChangeIdioma = (novoIdioma) => {
    setIdioma(novoIdioma);
    // Ao trocar de idioma, já seleciona a primeira arte dele
    const primeira = imagens?.[novoIdioma]?.[0];
    if (primeira) setSelected(withIdioma(primeira, novoIdioma));
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(card, selected, quantity);
    onClose();
  };

  const incrementQty = () => setQuantity(prev => prev + 1);
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-wide">
        <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2 className="modal-title">{card.nome}</h2>
          <div className="modal-sub-details">
            <span className="modal-card-id">ID: {card.id}</span>
            {card.nome_en && card.nome_en !== card.nome && <span className="modal-card-type">{card.nome_en}</span>}
            {card.tipo && <span className="modal-card-type">{card.tipo}</span>}
          </div>
        </div>

        <div className="modal-body">
          {mostrarAbas && (
            <div className="language-tabs">
              {idiomasDisponiveis.map(({ id, nome }) => (
                <button
                  key={id}
                  type="button"
                  className={`language-tab ${idioma === id ? 'active' : ''}`}
                  onClick={() => handleChangeIdioma(id)}
                >
                  {nome}
                  <span className="language-tab-count">{imagens[id].length}</span>
                </button>
              ))}
            </div>
          )}

          {imagens && (
            <p className="modal-instructions">
              {lista.length > 1
                ? 'Esta carta possui múltiplas ilustrações disponíveis. Selecione a versão desejada para impressão:'
                : 'Confirme a ilustração e a quantidade de cópias para impressão:'}
            </p>
          )}

          {erro && <p className="modal-warning">{erro}</p>}

          {!imagens && !erro && (
            <div className="modal-loading">
              <Loader2 className="loading-spinner" size={22} /> Carregando imagens...
            </div>
          )}

          {imagens && lista.length === 0 && (
            <p className="modal-instructions">Nenhuma imagem disponível para esta carta.</p>
          )}

          <div className="artwork-grid-container">
            <div className="artwork-grid multi-art">
              {lista.map((img) => (
                <div
                  key={img.url}
                  className={`artwork-option-card ${selected?.url === img.url ? 'selected' : ''}`}
                  onClick={() => setSelected(withIdioma(img, idioma))}
                >
                  <div className="artwork-card-wrapper">
                    <img src={img.miniatura} alt={`${card.nome} - ${img.rotulo}`} className="artwork-preview-image" loading="lazy" />
                    <div className="artwork-badge">{img.rotulo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-quantity-group">
            <span className="qty-label">Quantidade:</span>
            <div className="modal-quantity-controls">
              <button onClick={decrementQty} className="modal-qty-btn" type="button">
                <Minus size={16} />
              </button>
              <span className="modal-qty-value">{quantity}</span>
              <button onClick={incrementQty} className="modal-qty-btn" type="button">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="modal-action-buttons">
            <button className="modal-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button className="modal-btn-confirm" onClick={handleConfirm} disabled={!selected}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Guarda só o necessário da imagem escolhida (vai para o localStorage junto com a lista)
function withIdioma(img, idioma) {
  if (!img) return null;
  return { url: img.url, miniatura: img.miniatura, rotulo: img.rotulo, idioma };
}
