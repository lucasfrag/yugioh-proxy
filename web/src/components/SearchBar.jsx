import { useEffect, useRef, useState } from 'react';
import { displayName, searchCards } from '../api.js';

export default function SearchBar({ lang, onPick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchCards(q)
        .then((cards) => { if (!cancelled) { setResults(cards); setActive(0); setError(''); } })
        .catch((err) => { if (!cancelled) setError(err.message); });
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const pick = (card) => {
    onPick(card);
    setQuery('');
    setResults([]);
    input.current.focus();
  };

  const onKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); pick(results[active]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="search">
      <input
        ref={input}
        type="search"
        placeholder="Buscar carta em português ou inglês (ex.: Mago Negro, Ash Blossom)"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoFocus
      />
      {error && <p className="notice error">{error}</p>}
      {open && results.length > 0 && (
        <ul className="results">
          {results.map((card, i) => {
            const name = displayName(card, lang);
            return (
              <li
                key={card.id}
                className={i === active ? 'active' : ''}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(card); }}
              >
                <img src={`/img/ygoprodeck/small/${card.arts[0]}.jpg`} alt="" loading="lazy" />
                <div>
                  <strong>{name}</strong>
                  <small>
                    {name !== card.en ? card.en : card.pt || ''}
                    {card.arts.length > 1 && ` · ${card.arts.length} artes`}
                  </small>
                </div>
                <span className={`frame frame-${card.frame}`}>{card.type}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
