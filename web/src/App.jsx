import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { displayName, getArtworks, getCards, LANGS, pickArt, ygoprodeckArt } from './api.js';
import { CARD_SIZES, computeLayout, paginate } from './layout.js';
import { parseYdk } from './ydk.js';
import SearchBar from './components/SearchBar.jsx';
import DeckList from './components/DeckList.jsx';
import ArtPicker from './components/ArtPicker.jsx';
import PrintSettings from './components/PrintSettings.jsx';
import PrintSheets from './components/PrintSheets.jsx';

const STORAGE_KEY = 'ygo-proxy:v1';

const DEFAULT_SETTINGS = {
  lang: 'pt',
  paper: 'a4',
  cardSize: 'official',
  gap: 0,
  cutMarks: true,
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      return {
        settings: { ...DEFAULT_SETTINGS, ...saved.settings },
        entries: (saved.entries || []).map((e) => ({ ...e, loading: false })),
      };
    }
  } catch { /* armazenamento indisponível */ }
  return { settings: DEFAULT_SETTINGS, entries: [] };
}

let nextKey = Date.now();
const newKey = () => String(nextKey++);

export default function App() {
  const initial = useMemo(loadState, []);
  const [settings, setSettings] = useState(initial.settings);
  const [entries, setEntries] = useState(initial.entries);
  const [pickerKey, setPickerKey] = useState(null);
  const [notice, setNotice] = useState('');
  const fileInput = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, entries }));
    } catch { /* armazenamento indisponível */ }
  }, [settings, entries]);

  const updateEntry = useCallback((key, patch) => {
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...(typeof patch === 'function' ? patch(e) : patch) } : e)));
  }, []);

  // Troca a arte provisória pela melhor imagem no idioma escolhido (se o usuário não escolheu outra).
  const resolveArt = useCallback((key, cardId, lang) => {
    if (lang === 'en') {
      updateEntry(key, { loading: false });
      return;
    }
    updateEntry(key, { loading: true });
    getArtworks(cardId)
      .then((artworks) => {
        const art = pickArt(artworks, lang);
        updateEntry(key, (e) => ({
          loading: false,
          art: e.artAuto && art ? art : e.art,
          missingLang: !art,
        }));
      })
      .catch(() => updateEntry(key, { loading: false }));
  }, [updateEntry]);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const addCard = useCallback((card, { qty = 1, artId } = {}) => {
    const existing = entriesRef.current.find((e) => e.cardId === card.id && e.artAuto && !artId);
    if (existing) {
      updateEntry(existing.key, (e) => ({ qty: e.qty + qty }));
      return;
    }
    const key = newKey();
    setEntries((list) => [...list, {
      key,
      cardId: card.id,
      en: card.en,
      pt: card.pt,
      frame: card.frame,
      qty,
      art: ygoprodeckArt(artId ?? card.arts[0]),
      artAuto: true,
      loading: settings.lang !== 'en',
    }]);
    resolveArt(key, card.id, settings.lang);
  }, [resolveArt, updateEntry, settings.lang]);

  const applyLangToAll = () => {
    setEntries((list) => list.map((e) => ({ ...e, artAuto: true, art: ygoprodeckArt(e.cardId), missingLang: false })));
    entries.forEach((e) => resolveArt(e.key, e.cardId, settings.lang));
  };

  const splitEntry = (key) => {
    const source = entries.find((e) => e.key === key);
    if (!source) return;
    const copyKey = newKey();
    setEntries((list) => {
      const i = list.findIndex((e) => e.key === key);
      const copy = { ...source, key: copyKey, qty: 1, artAuto: false };
      const updated = source.qty > 1 ? list.map((e) => (e.key === key ? { ...e, qty: e.qty - 1 } : e)) : list;
      return [...updated.slice(0, i + 1), copy, ...updated.slice(i + 1)];
    });
    setPickerKey(copyKey);
  };

  const importYdk = async (file) => {
    try {
      const wanted = parseYdk(await file.text());
      if (!wanted.length) {
        setNotice('Nenhuma carta encontrada no arquivo.');
        return;
      }
      const cards = await getCards(wanted.map((w) => w.id));
      const byId = new Map();
      for (const card of cards) for (const artId of card.arts) byId.set(artId, card);
      let missing = 0;
      for (const { id, qty } of wanted) {
        const card = byId.get(id);
        if (card) addCard(card, { qty, artId: id });
        else missing++;
      }
      setNotice(`Deck importado: ${wanted.reduce((n, w) => n + w.qty, 0)} cartas${missing ? ` (${missing} não encontradas)` : ''}.`);
    } catch (err) {
      setNotice(`Falha ao importar: ${err.message}`);
    }
  };

  const cardSize = CARD_SIZES[settings.cardSize];
  const layout = useMemo(
    () => computeLayout({ paper: settings.paper, cardWidth: cardSize.width, cardHeight: cardSize.height, gap: settings.gap }),
    [settings.paper, cardSize, settings.gap],
  );
  const pages = useMemo(() => paginate(entries, layout.perPage), [entries, layout.perPage]);
  const totalCards = entries.reduce((n, e) => n + e.qty, 0);
  const pickerEntry = entries.find((e) => e.key === pickerKey);

  const print = async () => {
    const images = [...document.querySelectorAll('.print-root img')];
    setNotice('Carregando imagens em alta resolução...');
    await Promise.all(images.map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
    setNotice('');
    window.print();
  };

  return (
    <>
      <div className="app-ui">
        <header className="topbar no-print">
          <h1>Yu-Gi-Oh! <span>Proxy Maker</span></h1>
          <label className="lang-select">
            Idioma preferido
            <select value={settings.lang} onChange={(e) => setSettings({ ...settings, lang: e.target.value })}>
              {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </header>

        <main className="layout">
          <section className="panel no-print">
            <SearchBar lang={settings.lang} onPick={(card) => addCard(card)} />

            <div className="toolbar">
              <button type="button" onClick={() => fileInput.current.click()}>Importar .ydk</button>
              <input
                ref={fileInput}
                type="file"
                accept=".ydk,.txt"
                hidden
                onChange={(e) => { if (e.target.files[0]) importYdk(e.target.files[0]); e.target.value = ''; }}
              />
              <button type="button" onClick={applyLangToAll} disabled={!entries.length}>
                Aplicar {LANGS[settings.lang].split(' ')[0].toLowerCase()} a todas
              </button>
              <button type="button" className="danger" onClick={() => setEntries([])} disabled={!entries.length}>
                Limpar
              </button>
            </div>
            {notice && <p className="notice" onClick={() => setNotice('')}>{notice}</p>}

            <DeckList
              entries={entries}
              lang={settings.lang}
              onQty={(key, qty) => (qty <= 0 ? setEntries((l) => l.filter((e) => e.key !== key)) : updateEntry(key, { qty }))}
              onRemove={(key) => setEntries((l) => l.filter((e) => e.key !== key))}
              onPickArt={setPickerKey}
              onSplit={splitEntry}
            />
          </section>

          <section className="panel">
            <PrintSettings
              settings={settings}
              onChange={(patch) => setSettings({ ...settings, ...patch })}
              layout={layout}
              totalCards={totalCards}
              pageCount={pages.length}
              onPrint={print}
            />
            <div className="preview">
              {pages.length === 0 && <p className="empty no-print">Busque uma carta ou importe um deck para ver a prévia das folhas.</p>}
              <PrintSheets pages={pages} layout={layout} cardSize={cardSize} settings={settings} />
            </div>
          </section>
        </main>

        <footer className="footer no-print">
          Dados: <a href="https://ygoprodeck.com/api-guide/" target="_blank" rel="noreferrer">YGOPRODeck</a> ·
          Scans: <a href="https://yugipedia.com" target="_blank" rel="noreferrer">Yugipedia</a> ·
          Proxies para uso pessoal e casual; Yu-Gi-Oh! é marca da Konami.
        </footer>
      </div>

      {pickerEntry && (
        <ArtPicker
          entry={pickerEntry}
          lang={settings.lang}
          onSelect={(art) => { updateEntry(pickerEntry.key, { art, artAuto: false, missingLang: false }); setPickerKey(null); }}
          onClose={() => setPickerKey(null)}
          title={displayName(pickerEntry, settings.lang)}
        />
      )}
    </>
  );
}
