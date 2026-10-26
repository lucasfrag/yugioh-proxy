// Temas visuais do site. As cores de cada tema ficam no index.css (:root[data-theme="..."]);
// aqui ficam só as amostras de cor do seletor (nomes e descrições estão em utils/i18n.js).

export const THEMES = [
  { id: 'duel-disk', cores: ['#060a14', '#22d3ee', '#6366f1'] },
  { id: 'milenio', cores: ['#0a1411', '#d4945f', '#34d399'] },
  { id: 'grafite', cores: ['#111214', '#ef4444', '#a1a1aa'] },
  { id: 'fichario', cores: ['#f4efe6', '#0f766e', '#b45309'] },
  { id: 'original', cores: ['#090613', '#d4af37', '#8a2be2'] }
];

const STORAGE_KEY = 'ygo_proxies_tema';
const DEFAULT_THEME = 'duel-disk';

export function loadTheme() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some((t) => t.id === salvo)) return salvo;
  } catch {
    // Armazenamento indisponível: usa o tema padrão
  }
  return DEFAULT_THEME;
}

/** Aplica o tema no <html> (o CSS lê o atributo data-theme) e lembra a escolha. */
export function applyTheme(id) {
  if (id === DEFAULT_THEME) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Armazenamento indisponível: o tema vale só até fechar a página
  }
}
