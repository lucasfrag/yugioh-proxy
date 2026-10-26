import React, { useRef, useState } from 'react';
import { X, Upload, Loader2, Images, Check } from 'lucide-react';
import { agruparIds, parseDeck } from '../utils/deckImport';
import { getCardImages, getCardsByIds } from '../utils/api';
import { cardNames, useI18n } from '../utils/i18n';

/** Busca as imagens de várias cartas com no máximo 4 pedidos ao mesmo tempo. */
async function imagensDasCartas(cartas) {
  const resultado = new Map();
  let proxima = 0;
  async function trabalhador() {
    while (proxima < cartas.length) {
      const card = cartas[proxima++];
      try {
        resultado.set(card.id, (await getCardImages(card)).idiomas);
      } catch {
        resultado.set(card.id, { pt: [], en: [], ocg: [] });
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, trabalhador));
  return resultado;
}

/**
 * Arte padrão de uma carta importada: no idioma preferido quando existir; em inglês, a arte
 * indicada pelo próprio deck (arquivos .ydk costumam trazer o ID da arte alternativa escolhida).
 */
function escolherImagem(idiomas, idiomaPreferido, idDoDeck, card) {
  const indiceArte = (card.artes || []).indexOf(idDoDeck);
  const ingles = idiomas.en[indiceArte >= 0 ? indiceArte : 0];
  let imagem = null;
  let idioma = 'en';
  if (idiomaPreferido === 'pt' && idiomas.pt.length > 0) {
    imagem = idiomas.pt[0];
    idioma = 'pt';
  } else if (ingles) {
    imagem = ingles;
  } else if (idiomas.pt.length > 0) {
    imagem = idiomas.pt[0];
    idioma = 'pt';
  }
  if (!imagem) return null;
  return { url: imagem.url, miniatura: imagem.miniatura, rotulo: imagem.rotulo, idioma };
}

export default function DeckImportModal({ onClose, onImport, onEditCard, oculto = false }) {
  const { lang, t, tn } = useI18n();
  const [texto, setTexto] = useState('');
  const [idiomaPreferido, setIdiomaPreferido] = useState(lang === 'en' ? 'en' : 'pt');
  const [incluirSide, setIncluirSide] = useState(false);
  const [substituir, setSubstituir] = useState(true);
  const [etapa, setEtapa] = useState('formulario'); // formulario | importando | resumo
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState(null);
  const [revisadas, setRevisadas] = useState(() => new Set()); // cartas já abertas no seletor de artes
  const arquivoRef = useRef(null);

  const lerArquivo = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setTexto(await arquivo.text());
    setErro('');
    e.target.value = '';
  };

  const importar = async () => {
    const deck = parseDeck(texto);
    if (!deck) {
      setErro(t('deck.invalid'));
      return;
    }
    setErro('');
    setEtapa('importando');

    const ids = [...deck.main, ...deck.extra, ...(incluirSide ? deck.side : [])];
    const grupos = agruparIds(ids);
    const cartasPorId = await getCardsByIds(grupos.map(g => g.id));
    const naoEncontrados = grupos.filter(g => !cartasPorId.has(g.id)).map(g => g.id);

    // Cada carta uma vez só (o deck pode ter a mesma carta com artes diferentes)
    const cartasUnicas = [...new Map(grupos.filter(g => cartasPorId.has(g.id)).map(g => {
      const card = cartasPorId.get(g.id);
      return [card.id, card];
    })).values()];
    const imagens = await imagensDasCartas(cartasUnicas);

    const itens = [];
    for (const { id, quantidade } of grupos) {
      const card = cartasPorId.get(id);
      if (!card) continue;
      const imagem = escolherImagem(imagens.get(card.id), idiomaPreferido, id, card);
      if (imagem) itens.push({ card, imagem, quantidade });
      else naoEncontrados.push(id);
    }
    onImport(itens, substituir);

    // Só cartas com artes alternativas de verdade (mais de uma arte no mesmo idioma);
    // a mesma arte em PT e em EN não conta
    const comOutrasArtes = cartasUnicas
      .map(card => ({ card, idiomas: imagens.get(card.id) }))
      .filter(({ idiomas }) => idiomas.pt.length > 1 || idiomas.en.length > 1);

    setResumo({
      secoes: { main: deck.main.length, extra: deck.extra.length, side: incluirSide ? deck.side.length : 0 },
      total: itens.reduce((n, i) => n + i.quantidade, 0),
      naoEncontrados,
      comOutrasArtes
    });
    setEtapa('resumo');
  };

  return (
    <div className="modal-overlay" hidden={oculto}>
      <div className="modal-content modal-content-wide deck-import">
        <button className="modal-close-btn" onClick={onClose} aria-label={t('modal.close')}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2 className="modal-title">{t('deck.title')}</h2>
          <div className="modal-sub-details">
            <span className="modal-card-type">{t('deck.subtitle')}</span>
          </div>
        </div>

        {etapa !== 'resumo' && (
          <div className="modal-body">
            <p className="modal-instructions">{t('deck.help')}</p>

            <textarea
              className="deck-textarea"
              value={texto}
              onChange={(e) => { setTexto(e.target.value); setErro(''); }}
              placeholder={t('deck.placeholder')}
              spellCheck={false}
              disabled={etapa === 'importando'}
            />
            <div className="deck-file-row">
              <button type="button" className="btn-secondary" onClick={() => arquivoRef.current?.click()} disabled={etapa === 'importando'}>
                <Upload size={15} />
                {t('deck.file')}
              </button>
              <input ref={arquivoRef} type="file" accept=".ydk,.txt" hidden onChange={lerArquivo} />
            </div>

            {erro && <p className="modal-warning">{erro}</p>}

            <div className="deck-options">
              <div className="deck-option-group" role="radiogroup" aria-label={t('deck.language')}>
                <span className="input-label">{t('deck.language')}</span>
                <div className="deck-lang">
                  {['pt', 'en'].map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={idiomaPreferido === id}
                      className={`deck-lang-option ${idiomaPreferido === id ? 'active' : ''}`}
                      onClick={() => setIdiomaPreferido(id)}
                      disabled={etapa === 'importando'}
                    >
                      {t(`deck.lang.${id}`)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="checkbox-container">
                <input type="checkbox" checked={incluirSide} onChange={(e) => setIncluirSide(e.target.checked)} />
                <span className="checkmark"></span>
                <span className="checkbox-text">{t('deck.side')}</span>
              </label>
              <label className="checkbox-container">
                <input type="checkbox" checked={substituir} onChange={(e) => setSubstituir(e.target.checked)} />
                <span className="checkmark"></span>
                <span className="checkbox-text">{t('deck.replace')}</span>
              </label>
            </div>
          </div>
        )}

        {etapa === 'resumo' && resumo && (
          <div className="modal-body">
            <p className="deck-summary-title">{t('deck.done', { n: resumo.total })}</p>
            <p className="modal-instructions">{t('deck.sections', resumo.secoes)}</p>

            {resumo.naoEncontrados.length > 0 && (
              <p className="modal-warning">
                {tn('deck.notFound', resumo.naoEncontrados.length)} {resumo.naoEncontrados.join(', ')}
              </p>
            )}

            {resumo.comOutrasArtes.length > 0 ? (
              <>
                <p className="modal-instructions">
                  {t('deck.altArts')} {t('deck.reviewedCount', { n: revisadas.size, total: resumo.comOutrasArtes.length })}
                </p>
                <div className="deck-alt-list">
                  {resumo.comOutrasArtes.map(({ card, idiomas }) => (
                    <button
                      key={card.id}
                      type="button"
                      className={`deck-alt-item ${revisadas.has(card.id) ? 'revisada' : ''}`}
                      onClick={() => {
                        setRevisadas(prev => new Set(prev).add(card.id));
                        onEditCard(card.id);
                      }}
                      title={cardNames(card, lang).principal}
                    >
                      <img src={(idiomas.pt[0] || idiomas.en[0]).miniatura} alt="" loading="lazy" />
                      <span className="deck-alt-name">{cardNames(card, lang).principal}</span>
                      <span className="deck-alt-count">
                        {idiomas.pt.length > 0 && <span className="language-badge language-pt">PT {idiomas.pt.length}</span>}
                        {idiomas.en.length > 0 && <span className="language-badge language-en">EN {idiomas.en.length}</span>}
                      </span>
                      {revisadas.has(card.id)
                        ? <Check size={15} className="deck-alt-icon" aria-label={t('deck.reviewed')} />
                        : <Images size={15} className="deck-alt-icon" />}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="modal-instructions">{t('deck.noAltArts')}</p>
            )}
          </div>
        )}

        <div className="modal-footer">
          <span className="deck-footer-hint">{etapa === 'resumo' ? t('deck.hintAfter') : ''}</span>
          <div className="modal-action-buttons">
            {etapa === 'resumo' ? (
              <button className="modal-btn-confirm" onClick={onClose}>{t('deck.close')}</button>
            ) : (
              <>
                <button className="modal-btn-cancel" onClick={onClose}>{t('modal.cancel')}</button>
                <button className="modal-btn-confirm" onClick={importar} disabled={!texto.trim() || etapa === 'importando'}>
                  {etapa === 'importando' ? <><Loader2 size={16} className="spin-inline" /> {t('deck.importing')}</> : t('deck.import')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
