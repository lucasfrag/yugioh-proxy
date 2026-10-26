import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { IDIOMAS } from '../utils/cardImages';
import { artLabel, cardNames, cardType, useI18n } from '../utils/i18n';
import { getCardImages } from '../utils/api';

export default function ArtworkSelectionModal({
  card,
  onClose,
  onConfirm,
  initialImage = null,
  initialQuantity = 1,
  confirmLabel
}) {
  const { lang, t } = useI18n();
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
        const data = await getCardImages(card);
        if (cancelado) return;
        setImagens(data.idiomas);
        if (data.erro) setErro(data.erro);

        // Idioma inicial: o da imagem já escolhida; senão, na interface em inglês, as artes em
        // inglês; na interface em português, as cartas PT (se houver)
        if (!hasInitialImage) {
          const inicial = lang !== 'en' && data.idiomas.pt.length > 0 ? 'pt' : 'en';
          setIdioma(inicial);
          setSelected(withIdioma(data.idiomas[inicial][0], inicial));
        }
      } catch {
        if (!cancelado) setErro('modal.error');
      }
    }
    fetchImagens();
    return () => { cancelado = true; };
    // O idioma da interface só influencia a aba inicial, ao abrir o modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, hasInitialImage]);

  if (!card) return null;

  const nomes = cardNames(card, lang);

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
        <button className="modal-close-btn" onClick={onClose} aria-label={t('modal.close')}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2 className="modal-title">{nomes.principal}</h2>
          <div className="modal-sub-details">
            <span className="modal-card-id">ID: {card.id}</span>
            {nomes.secundario && <span className="modal-card-type">{nomes.secundario}</span>}
            {card.tipo && <span className="modal-card-type">{cardType(card, lang)}</span>}
          </div>
        </div>

        <div className="modal-body">
          {mostrarAbas && (
            <div className="language-tabs">
              {idiomasDisponiveis.map(({ id }) => (
                <button
                  key={id}
                  type="button"
                  className={`language-tab ${idioma === id ? 'active' : ''}`}
                  onClick={() => handleChangeIdioma(id)}
                >
                  {t(`modal.lang.${id}`)}
                  <span className="language-tab-count">{imagens[id].length}</span>
                </button>
              ))}
            </div>
          )}

          {imagens && (
            <p className="modal-instructions">
              {lista.length > 1 ? t('modal.multiple') : t('modal.single')}
            </p>
          )}

          {erro && <p className="modal-warning">{t(erro)}</p>}

          {!imagens && !erro && (
            <div className="modal-loading">
              <Loader2 className="loading-spinner" size={22} /> {t('modal.loading')}
            </div>
          )}

          {imagens && lista.length === 0 && (
            <p className="modal-instructions">{t('modal.none')}</p>
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
                    <img src={img.miniatura} alt={`${nomes.principal} - ${artLabel(img.rotulo, t)}`} className="artwork-preview-image" loading="lazy" />
                    <div className="artwork-badge">{artLabel(img.rotulo, t)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-quantity-group">
            <span className="qty-label">{t('modal.quantity')}</span>
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
              {t('modal.cancel')}
            </button>
            <button className="modal-btn-confirm" onClick={handleConfirm} disabled={!selected}>
              {confirmLabel || t('modal.select')}
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
