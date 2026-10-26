import React, { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEMES, applyTheme, loadTheme } from '../utils/themes';

export default function ThemeSwitcher() {
  const [tema, setTema] = useState(loadTheme);
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  // Fecha o menu ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return undefined;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    const onKey = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [aberto]);

  const escolher = (id) => {
    applyTheme(id);
    setTema(id);
    setAberto(false);
  };

  const atual = THEMES.find((t) => t.id === tema) || THEMES[0];

  return (
    <div className="theme-switcher" ref={ref}>
      <button
        type="button"
        className="theme-switcher-btn"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        title="Trocar tema"
      >
        <Palette size={16} />
        <span>{atual.nome}</span>
      </button>

      {aberto && (
        <div className="theme-menu" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === tema}
              className={`theme-option ${t.id === tema ? 'active' : ''}`}
              onClick={() => escolher(t.id)}
            >
              <span className="theme-swatches" aria-hidden="true">
                {t.cores.map((cor) => <span key={cor} style={{ background: cor }} />)}
              </span>
              <span className="theme-option-text">
                <strong>{t.nome}</strong>
                <small>{t.descricao}</small>
              </span>
              {t.id === tema && <Check size={16} className="theme-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
