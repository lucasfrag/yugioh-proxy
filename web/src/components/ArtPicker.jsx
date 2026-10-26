import { useEffect, useState } from 'react';
import { getArtworks } from '../api.js';

const TABS = [
  { id: 'pt', label: 'Português' },
  { id: 'en', label: 'Inglês (TCG)' },
  { id: 'jp', label: 'Japonês (OCG)' },
  { id: 'arts', label: 'Artes limpas' },
];

export default function ArtPicker({ entry, lang, title, onSelect, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(lang === 'en' ? 'arts' : lang);

  useEffect(() => {
    getArtworks(entry.cardId).then(setData, (err) => setError(err.message));
  }, [entry.cardId]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const items = !data ? [] : tab === 'arts' ? data.arts : data.scans.filter((s) => s.lang === tab);
  const count = (id) => (!data ? '' : id === 'arts' ? data.arts.length : data.scans.filter((s) => s.lang === id).length);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label={`Escolher arte de ${title}`}>
        <header>
          <h2>{title}</h2>
          <button type="button" className="close" onClick={onClose} aria-label="Fechar">×</button>
        </header>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label} <small>{count(t.id)}</small>
            </button>
          ))}
        </nav>
        {tab === 'arts' && (
          <p className="hint">Imagens digitais do YGOPRODeck, uma por arte (inclui artes alternativas). Sem reflexo de foil, mas resolução menor (421 px).</p>
        )}
        {tab !== 'arts' && (
          <p className="hint">Scans de cartas impressas, da Yugipedia. Prefira os de 650 px ou mais de largura.</p>
        )}
        {error && <p className="notice error">{error}</p>}
        {data?.scansError && tab !== 'arts' && <p className="notice error">{data.scansError}</p>}
        {!data && !error && <p className="hint">Carregando imagens…</p>}
        {data && items.length === 0 && <p className="hint">Nenhuma imagem neste idioma.</p>}
        <div className="art-grid">
          {items.map((art) => (
            <button
              key={art.key}
              type="button"
              className={`art ${art.key === entry.art.key ? 'selected' : ''}`}
              onClick={() => onSelect(art)}
            >
              <img src={art.thumb} alt={art.label} loading="lazy" />
              <span>{art.label}</span>
              <small className={art.width < 500 ? 'warn' : ''}>{art.width} × {art.height}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
