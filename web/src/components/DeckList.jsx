import { displayName, LANGS } from '../api.js';

const LANG_BADGE = { pt: 'PT', en: 'EN', jp: 'OCG' };

export default function DeckList({ entries, lang, onQty, onRemove, onPickArt, onSplit }) {
  if (!entries.length) return null;
  return (
    <ul className="deck">
      {entries.map((e) => (
        <li key={e.key} className={`frame-border-${e.frame}`}>
          <button type="button" className="thumb" onClick={() => onPickArt(e.key)} title="Trocar arte">
            <img src={e.art.thumb} alt="" loading="lazy" />
            {e.loading && <span className="spinner" />}
          </button>
          <div className="info">
            <strong>{displayName(e, lang)}</strong>
            <small>
              <span className={`lang-badge lang-${e.art.lang}`}>{LANG_BADGE[e.art.lang]}</span>
              {e.art.label}
              {e.art.width < 500 && <span className="warn" title="Pode ficar borrada na impressão"> · baixa resolução</span>}
            </small>
            {e.missingLang && <small className="warn">Sem scan em {LANGS[lang].toLowerCase()} — usando outra imagem.</small>}
          </div>
          <div className="actions">
            <div className="qty">
              <button type="button" onClick={() => onQty(e.key, e.qty - 1)} aria-label="Menos">−</button>
              <span>{e.qty}</span>
              <button type="button" onClick={() => onQty(e.key, e.qty + 1)} aria-label="Mais">+</button>
            </div>
            <button type="button" className="link" onClick={() => onPickArt(e.key)}>Trocar arte</button>
            <button type="button" className="link" onClick={() => onSplit(e.key)} title="Adiciona uma cópia com arte diferente">
              + cópia com outra arte
            </button>
            <button type="button" className="link danger" onClick={() => onRemove(e.key)}>Remover</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
