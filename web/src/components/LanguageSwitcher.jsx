import React from 'react';
import { IDIOMAS_INTERFACE, useI18n } from '../utils/i18n';

// Botões PT | EN para o idioma da interface
export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="language-switcher" role="group" aria-label={t('nav.language')}>
      {IDIOMAS_INTERFACE.map(({ id, sigla, nome }) => (
        <button
          key={id}
          type="button"
          className={`language-switcher-btn ${lang === id ? 'active' : ''}`}
          onClick={() => setLang(id)}
          aria-pressed={lang === id}
          title={nome}
          lang={id === 'pt' ? 'pt-BR' : 'en'}
        >
          {sigla}
        </button>
      ))}
    </div>
  );
}
