import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { IDIOMAS, BAIXA_RESOLUCAO, isLowRes, pickBestImage } from '../utils/cardImages';

const OCULTAR_BAIXA_KEY = 'ygo_proxies_ocultar_baixa';

function loadOcultarBaixa() {
  try {
    return localStorage.getItem(OCULTAR_BAIXA_KEY) !== 'false';
  } catch {
    return true;
  }
}

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

  // Opção "Ocultar baixa resolução" (marcada por padrão e lembrada entre as visitas)
  const [ocultarBaixa, setOcultarBaixa] = useState(loadOcultarBaixa);
  const ocultarBaixaRef = useRef(ocultarBaixa);
  ocultarBaixaRef.current = ocultarBaixa;

  // Busca todas as imagens da carta (PT, EN e OCG) ao abrir o modal
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
          const visiveisPt = filtrar(data.idiomas.pt, ocultarBaixaRef.current);
          const inicial = visiveisPt.length > 0 ? 'pt' : 'en';
          setIdioma(inicial);
          setSelected(withIdioma(pickBestImage(filtrar(data.idiomas[inicial], ocultarBaixaRef.current)), inicial));
        }
      } catch {
        if (!cancelado) setErro('Não foi possível carregar as imagens desta carta.');
      }
    }
    fetchImagens();
    return () => { cancelado = true; };
  }, [card.id, hasInitialImage]);

  if (!card) return null;

  const todas = (imagens && idioma && imagens[idioma]) || [];
  const lista = filtrar(todas, ocultarBaixa);
  const ocultas = todas.length - lista.length;

  const handleChangeIdioma = (novoIdioma) => {
    setIdioma(novoIdioma);
    // Ao trocar de idioma, já seleciona a melhor imagem disponível nele
    const melhor = pickBestImage(filtrar(imagens?.[novoIdioma], ocultarBaixa));
    if (melhor) setSelected(withIdioma(melhor, novoIdioma));
  };

  const handleToggleOcultarBaixa = (valor) => {
    setOcultarBaixa(valor);
    try {
      localStorage.setItem(OCULTAR_BAIXA_KEY, String(valor));
    } catch {
      // Armazenamento indisponível: a opção vale só até fechar a página
    }
    // Se a imagem selecionada acabou de ser ocultada, escolhe a melhor que sobrou
    if (valor && selected && todas.some(img => img.url === selected.url && isLowRes(img))) {
      const melhor = pickBestImage(filtrar(todas, true));
      setSelected(melhor ? withIdioma(melhor, idioma) : null);
    }
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
          <div className="language-tabs">
            {IDIOMAS.map(({ id, nome }) => {
              const total = imagens ? filtrar(imagens[id], ocultarBaixa).length : null;
              return (
                <button
                  key={id}
                  type="button"
                  className={`language-tab ${idioma === id ? 'active' : ''}`}
                  onClick={() => handleChangeIdioma(id)}
                  disabled={imagens !== null && imagens[id].length === 0}
                >
                  {nome}
                  {total !== null && <span className="language-tab-count">{total}</span>}
                </button>
              );
            })}
          </div>

          <p className="modal-instructions">
            Escolha o idioma e a ilustração desejada para impressão. A resolução aparece abaixo de cada imagem.
          </p>

          <label className="checkbox-container modal-checkbox">
            <input
              type="checkbox"
              checked={ocultarBaixa}
              onChange={(e) => handleToggleOcultarBaixa(e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="checkbox-text">
              Ocultar scans em baixa resolução (menos de {BAIXA_RESOLUCAO}px)
            </span>
          </label>

          {erro && <p className="modal-warning">{erro}</p>}

          {!imagens && !erro && (
            <div className="modal-loading">
              <Loader2 className="loading-spinner" size={22} /> Carregando imagens...
            </div>
          )}

          {imagens && lista.length === 0 && (
            <p className="modal-instructions">
              {ocultas > 0
                ? `Este idioma só tem ${ocultas} ${ocultas === 1 ? 'scan' : 'scans'} em baixa resolução. Desmarque a opção acima para ${ocultas === 1 ? 'vê-lo' : 'vê-los'}.`
                : 'Nenhuma imagem disponível neste idioma.'}
            </p>
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
                  {img.largura && (
                    <div className={`artwork-resolution ${isLowRes(img) ? 'low' : ''}`}>
                      {img.largura} × {img.altura}px{isLowRes(img) ? ' · baixa' : ''}
                    </div>
                  )}
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

// Remove os scans em baixa resolução quando a opção está marcada
function filtrar(lista, ocultarBaixa) {
  if (!lista) return [];
  return ocultarBaixa ? lista.filter(img => !isLowRes(img)) : lista;
}

// Guarda só o necessário da imagem escolhida (vai para o localStorage junto com a lista)
function withIdioma(img, idioma) {
  if (!img) return null;
  return { url: img.url, miniatura: img.miniatura, rotulo: img.rotulo, largura: img.largura, idioma };
}
