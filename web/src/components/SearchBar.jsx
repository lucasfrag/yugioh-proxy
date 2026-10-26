import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { toThumbnail } from '../utils/cardImages';

export default function SearchBar({ onSelectCard }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Debounce para evitar sobrecarga de requisições na API local
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/cartas?nome=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        setSuggestions(data.resultados || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Fecha o dropdown se clicar fora do componente
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (card) => {
    onSelectCard(card);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className="search-bar-container" ref={dropdownRef}>
      <label className="input-label">Buscar Carta (Nome ou ID)</label>
      <div className="search-input-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Ex: Mago Negro, 55144522..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowDropdown(true)}
          className="search-input"
        />
        {loading && <Loader2 className="loading-spinner" size={18} />}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul className="suggestions-dropdown">
          {suggestions.map((card) => {
            const hasImage = card.imagens && card.imagens.length > 0;
            const typeColor = card.tipo_carta === 'Carta Mágica' ? '#1d9e74' : 
                              card.tipo_carta === 'Carta de Armadilha' ? '#bc2c72' : '#d37118';

            return (
              <li key={card.id} onClick={() => handleSelect(card)} className="suggestion-item">
                <div className="suggestion-thumbnail">
                  {hasImage ? (
                    <img src={toThumbnail(card.imagens[0])} alt={card.nome} />
                  ) : (
                    <div className="no-image-thumb">?</div>
                  )}
                </div>
                <div className="suggestion-info">
                  <span className="suggestion-name">
                    {card.nome} <span className="suggestion-id-tag">(ID: {card.id})</span>
                  </span>
                  <div className="suggestion-meta">
                    <span className="suggestion-en-name">{card.nome_en}</span>
                    <span className="suggestion-type" style={{ color: typeColor }}>
                      {card.tipo}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showDropdown && query.trim() && !loading && suggestions.length === 0 && (
        <div className="suggestions-dropdown no-results">
          Nenhuma carta correspondente encontrada.
        </div>
      )}
    </div>
  );
}
