// Temas visuais do site. As cores de cada tema ficam no index.css (:root[data-theme="..."]);
// aqui ficam só o nome e as amostras de cor mostradas no seletor.

export const THEMES = [
  { id: 'duel-disk', nome: 'Duel Disk', descricao: 'Marinho e ciano, estilo HUD', cores: ['#060a14', '#22d3ee', '#6366f1'] },
  { id: 'milenio', nome: 'Milênio', descricao: 'Verde-escuro e bronze', cores: ['#0a1411', '#d4945f', '#34d399'] },
  { id: 'grafite', nome: 'Mesa de Duelo', descricao: 'Grafite e vermelho, sóbrio', cores: ['#111214', '#ef4444', '#a1a1aa'] },
  { id: 'fichario', nome: 'Fichário', descricao: 'Claro: creme e verde-petróleo', cores: ['#f4efe6', '#0f766e', '#b45309'] },
  { id: 'original', nome: 'Original', descricao: 'Roxo e dourado do Proxy Maker Brasil', cores: ['#090613', '#d4af37', '#8a2be2'] }
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
