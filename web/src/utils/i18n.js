// Traduções da interface (PT-BR e inglês) e o hook useI18n() usado pelos componentes.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const MENSAGENS = {
  pt: {
    'doc.title': 'Yu-Gi-Oh! Proxies — Monte e imprima suas proxies',
    'nav.language': 'Idioma',
    'nav.theme': 'Trocar tema',

    'search.label': 'Buscar Carta (Nome ou ID)',
    'search.placeholder': 'Ex: Mago Negro, 55144522...',
    'search.none': 'Nenhuma carta correspondente encontrada.',

    'list.empty': 'Sua lista de proxies está vazia.',
    'list.emptyHint': 'Busque cartas acima para adicioná-las.',
    'list.title': 'Cartas Selecionadas',
    'list.count.one': '{n} carta',
    'list.count.other': '{n} cartas',
    'list.changeArt': 'Trocar idioma/arte',
    'list.decrease': 'Diminuir',
    'list.increase': 'Aumentar',
    'list.remove': 'Remover',

    'art.n': 'Arte {n}',
    'art.generic': 'Arte',

    'settings.title': 'Ajustes de Impressão',
    'settings.sheetSize': 'Tamanho da Folha',
    'settings.scale': 'Escala da Carta',
    'settings.scaleOriginal': 'Original (100%)',
    'settings.spacing': 'Espaçamento entre Cartas',
    'settings.cutBorder': 'Borda de Corte (Espessura)',
    'settings.noBorder': 'Sem borda',
    'settings.backs': 'Intercalar páginas de Verso (frente/verso)',
    'settings.backModel': 'Modelo do Verso',
    'settings.backAlt': 'Verso {n}',
    'settings.safetyMargin': 'Aplicar Margem de Segurança da Folha (10mm)',
    'settings.print': 'Imprimir Proxies',
    'settings.reset': 'Resetar Ajustes',
    'settings.resetTitle': 'Restaurar Configurações Padrão',
    'settings.clear': 'Limpar Lista',
    'settings.clearTitle': 'Limpar Lista de Cartas',
    'settings.confirmClear': 'Tem certeza que deseja limpar toda a sua lista de cartas selecionadas?',
    'settings.confirmReset': 'Tem certeza que deseja restaurar as configurações da folha para os valores padrão?',
    'paper.Letter': 'Carta (Letter)',
    'paper.Legal': 'Ofício (Legal)',
    'paper.Tabloid': 'Tabloide (Tabloid)',

    'preview.title': 'Visualização de Impressão',
    'preview.empty': 'Adicione cartas à lista para visualizar como elas ficarão distribuídas nas folhas.',
    'preview.pages.one': '{n} página',
    'preview.pages.other': '{n} páginas',
    'preview.front': 'Página {n} - Frente (Cartas)',
    'preview.back': 'Página {n} - Verso (Fundo das Cartas - Espelhado)',
    'preview.backAlt': 'Verso Yu-Gi-Oh',

    'modal.lang.pt': 'Português',
    'modal.lang.en': 'Inglês',
    'modal.lang.ocg': 'OCG (Japonês)',
    'modal.multiple': 'Esta carta possui múltiplas ilustrações disponíveis. Selecione a versão desejada para impressão:',
    'modal.single': 'Confirme a ilustração e a quantidade de cópias para impressão:',
    'modal.loading': 'Carregando imagens...',
    'modal.none': 'Nenhuma imagem disponível para esta carta.',
    'modal.error': 'Não foi possível carregar as imagens desta carta.',
    'modal.quantity': 'Quantidade:',
    'modal.cancel': 'Cancelar',
    'modal.select': 'Selecionar Carta',
    'modal.save': 'Salvar Alterações',
    'modal.close': 'Fechar',
    'modal.ptCredit': 'Cartas em português criadas por',

    'footer.ptCards': 'Cartas em português criadas por',
    'footer.enArt': 'Artes em inglês:',
    'footer.github': 'Código-fonte no GitHub',

    'deck.button': 'Importar deck',
    'deck.title': 'Importar deck',
    'deck.subtitle': 'YDKe ou arquivo .ydk',
    'deck.help': 'Cole o código YDKe (ydke://…) ou o conteúdo de um arquivo .ydk — ou envie o arquivo. Funciona com decks do YGOPRODeck, Master Duel Meta, EDOPro, YGO Omega e Dueling Book.',
    'deck.placeholder': 'ydke://… ou o conteúdo do arquivo .ydk',
    'deck.file': 'Enviar arquivo .ydk',
    'deck.language': 'Idioma das cartas',
    'deck.lang.pt': 'Português (quando houver)',
    'deck.lang.en': 'Inglês',
    'deck.side': 'Incluir o side deck',
    'deck.replace': 'Substituir a lista atual',
    'deck.import': 'Importar',
    'deck.importing': 'Importando…',
    'deck.invalid': 'Não reconheci esse deck. Cole um código YDKe (ydke://…) ou o conteúdo de um arquivo .ydk.',
    'deck.done': 'Deck importado: {n} cartas.',
    'deck.sections': 'Main {main} · Extra {extra} · Side {side}',
    'deck.notFound.one': '{n} carta não foi encontrada (ID):',
    'deck.notFound.other': '{n} cartas não foram encontradas (IDs):',
    'deck.altArts': 'Estas cartas têm outras artes disponíveis. Clique para escolher:',
    'deck.noAltArts': 'Nenhuma carta deste deck tem outras artes disponíveis.',
    'deck.reviewedCount': '({n} de {total} revisadas)',
    'deck.reviewed': 'Revisada',
    'deck.hintAfter': 'Dá para trocar a arte de qualquer carta depois, na lista.',
    'deck.close': 'Concluir',

    'theme.duel-disk.name': 'Duel Disk',
    'theme.duel-disk.desc': 'Marinho e ciano, estilo HUD',
    'theme.milenio.name': 'Milênio',
    'theme.milenio.desc': 'Verde-escuro e bronze',
    'theme.grafite.name': 'Mesa de Duelo',
    'theme.grafite.desc': 'Grafite e vermelho, sóbrio',
    'theme.fichario.name': 'Fichário',
    'theme.fichario.desc': 'Claro: creme e verde-petróleo',
    'theme.original.name': 'Original',
    'theme.original.desc': 'Roxo e dourado do Proxy Maker Brasil'
  },
  en: {
    'doc.title': 'Yu-Gi-Oh! Proxies — Build and print your proxies',
    'nav.language': 'Language',
    'nav.theme': 'Change theme',

    'search.label': 'Search Card (Name or ID)',
    'search.placeholder': 'e.g. Dark Magician, 55144522...',
    'search.none': 'No matching cards found.',

    'list.empty': 'Your proxy list is empty.',
    'list.emptyHint': 'Search for cards above to add them.',
    'list.title': 'Selected Cards',
    'list.count.one': '{n} card',
    'list.count.other': '{n} cards',
    'list.changeArt': 'Change language/artwork',
    'list.decrease': 'Decrease',
    'list.increase': 'Increase',
    'list.remove': 'Remove',

    'art.n': 'Art {n}',
    'art.generic': 'Art',

    'settings.title': 'Print Settings',
    'settings.sheetSize': 'Paper Size',
    'settings.scale': 'Card Scale',
    'settings.scaleOriginal': 'Original (100%)',
    'settings.spacing': 'Card Spacing',
    'settings.cutBorder': 'Cut Border (Thickness)',
    'settings.noBorder': 'No border',
    'settings.backs': 'Interleave card back pages (double-sided)',
    'settings.backModel': 'Card Back',
    'settings.backAlt': 'Back {n}',
    'settings.safetyMargin': 'Apply printer safety margin (10mm)',
    'settings.print': 'Print Proxies',
    'settings.reset': 'Reset Settings',
    'settings.resetTitle': 'Restore default settings',
    'settings.clear': 'Clear List',
    'settings.clearTitle': 'Clear card list',
    'settings.confirmClear': 'Are you sure you want to clear your whole card list?',
    'settings.confirmReset': 'Are you sure you want to restore the default sheet settings?',
    'paper.Letter': 'Letter',
    'paper.Legal': 'Legal',
    'paper.Tabloid': 'Tabloid',

    'preview.title': 'Print Preview',
    'preview.empty': 'Add cards to your list to see how they will be laid out on the sheets.',
    'preview.pages.one': '{n} page',
    'preview.pages.other': '{n} pages',
    'preview.front': 'Page {n} - Front (cards)',
    'preview.back': 'Page {n} - Back (card backs, mirrored)',
    'preview.backAlt': 'Yu-Gi-Oh card back',

    'modal.lang.pt': 'Portuguese',
    'modal.lang.en': 'English',
    'modal.lang.ocg': 'OCG (Japanese)',
    'modal.multiple': 'This card has multiple artworks. Pick the one you want to print:',
    'modal.single': 'Confirm the artwork and the number of copies to print:',
    'modal.loading': 'Loading images...',
    'modal.none': 'No images available for this card.',
    'modal.error': 'Could not load the images for this card.',
    'modal.quantity': 'Quantity:',
    'modal.cancel': 'Cancel',
    'modal.select': 'Select Card',
    'modal.save': 'Save Changes',
    'modal.close': 'Close',
    'modal.ptCredit': 'Portuguese cards created by',

    'footer.ptCards': 'Portuguese cards created by',
    'footer.enArt': 'English artwork:',
    'footer.github': 'Source code on GitHub',

    'deck.button': 'Import deck',
    'deck.title': 'Import a deck',
    'deck.subtitle': 'YDKe or .ydk file',
    'deck.help': 'Paste a YDKe code (ydke://…) or the contents of a .ydk file — or upload the file. Works with decks from YGOPRODeck, Master Duel Meta, EDOPro, YGO Omega and Dueling Book.',
    'deck.placeholder': 'ydke://… or the contents of the .ydk file',
    'deck.file': 'Upload .ydk file',
    'deck.language': 'Card language',
    'deck.lang.pt': 'Portuguese (when available)',
    'deck.lang.en': 'English',
    'deck.side': 'Include the side deck',
    'deck.replace': 'Replace the current list',
    'deck.import': 'Import',
    'deck.importing': 'Importing…',
    'deck.invalid': "This doesn't look like a deck. Paste a YDKe code (ydke://…) or the contents of a .ydk file.",
    'deck.done': 'Deck imported: {n} cards.',
    'deck.sections': 'Main {main} · Extra {extra} · Side {side}',
    'deck.notFound.one': '{n} card was not found (ID):',
    'deck.notFound.other': '{n} cards were not found (IDs):',
    'deck.altArts': 'These cards have other artworks available. Click to choose:',
    'deck.noAltArts': 'No card in this deck has other artworks available.',
    'deck.reviewedCount': '({n} of {total} reviewed)',
    'deck.reviewed': 'Reviewed',
    'deck.hintAfter': 'You can change the art of any card later, in the list.',
    'deck.close': 'Done',

    'theme.duel-disk.name': 'Duel Disk',
    'theme.duel-disk.desc': 'Navy and cyan, HUD style',
    'theme.milenio.name': 'Millennium',
    'theme.milenio.desc': 'Deep green and bronze',
    'theme.grafite.name': 'Duel Table',
    'theme.grafite.desc': 'Graphite and red, understated',
    'theme.fichario.name': 'Binder',
    'theme.fichario.desc': 'Light: cream and teal',
    'theme.original.name': 'Original',
    'theme.original.desc': 'Purple and gold from Proxy Maker Brasil'
  }
};

export const IDIOMAS_INTERFACE = [
  { id: 'pt', sigla: 'PT', nome: 'Português' },
  { id: 'en', sigla: 'EN', nome: 'English' }
];

const STORAGE_KEY = 'ygo_proxies_idioma';

/** Idioma salvo; na primeira visita, o do navegador (português → PT, qualquer outro → EN). */
function idiomaInicial() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (MENSAGENS[salvo]) return salvo;
  } catch {
    // Armazenamento indisponível
  }
  const navegador = (typeof navigator !== 'undefined' && navigator.language) || 'pt';
  return navegador.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(idiomaInicial);

  const setLang = useCallback((novo) => {
    setLangState(novo);
    try {
      localStorage.setItem(STORAGE_KEY, novo);
    } catch {
      // Armazenamento indisponível: o idioma vale só até fechar a página
    }
  }, []);

  /** Texto traduzido; {n} e outras chaves entre chaves são substituídas por `vars`. */
  const t = useCallback((chave, vars = {}) => {
    const texto = MENSAGENS[lang][chave] ?? MENSAGENS.pt[chave] ?? chave;
    return texto.replace(/\{(\w+)\}/g, (_, nome) => (vars[nome] ?? `{${nome}}`));
  }, [lang]);

  /** Versão com singular/plural: usa "<chave>.one" quando n === 1, senão "<chave>.other". */
  const tn = useCallback((chave, n) => t(`${chave}.${n === 1 ? 'one' : 'other'}`, { n }), [t]);

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.title = t('doc.title');
  }, [lang, t]);

  const valor = useMemo(() => ({ lang, setLang, t, tn }), [lang, setLang, t, tn]);
  return createElement(I18nContext.Provider, { value: valor }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Nome da carta no idioma da interface (com o outro nome como secundário). */
export function cardNames(card, lang) {
  const pt = card.nome;
  const en = card.nome_en || card.nome;
  return lang === 'en'
    ? { principal: en, secundario: pt !== en ? pt : null }
    : { principal: pt, secundario: en !== pt ? en : null };
}

/** Tipo da carta no idioma da interface ("Monstro Normal" / "Normal Monster"). */
export function cardType(card, lang) {
  return (lang === 'en' && card.tipo_en) || card.tipo;
}

/** Rótulo de arte vindo da API ("Arte 2") traduzido para o idioma da interface. */
export function artLabel(rotulo, t) {
  const m = /^Arte (\d+)$/.exec(rotulo || '');
  if (m) return t('art.n', { n: m[1] });
  return rotulo || t('art.generic');
}
