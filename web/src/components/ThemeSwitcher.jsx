import React, { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEMES, applyTheme, loadTheme } from '../utils/themes';
import { useI18n } from '../utils/i18n';

export default function ThemeSwitcher() {
  const { t } = useI18n();
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
        title={t('nav.theme')}
      >
        <Palette size={16} />
        <span>{t(`theme.${atual.id}.name`)}</span>
      </button>

      {aberto && (
        <div className="theme-menu" role="menu">
          {THEMES.map((tema_) => (
            <button
              key={tema_.id}
              type="button"
              role="menuitemradio"
              aria-checked={tema_.id === tema}
              className={`theme-option ${tema_.id === tema ? 'active' : ''}`}
              onClick={() => escolher(tema_.id)}
            >
              <span className="theme-swatches" aria-hidden="true">
                {tema_.cores.map((cor) => <span key={cor} style={{ background: cor }} />)}
              </span>
              <span className="theme-option-text">
                <strong>{t(`theme.${tema_.id}.name`)}</strong>
                <small>{t(`theme.${tema_.id}.desc`)}</small>
              </span>
              {tema_.id === tema && <Check size={16} className="theme-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
