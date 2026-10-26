import { CARD_SIZES, PAPERS } from '../layout.js';

export default function PrintSettings({ settings, onChange, layout, totalCards, pageCount, onPrint }) {
  return (
    <div className="settings no-print">
      <div className="fields">
        <label>
          Papel
          <select value={settings.paper} onChange={(e) => onChange({ paper: e.target.value })}>
            {Object.entries(PAPERS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
        </label>
        <label>
          Tamanho da carta
          <select value={settings.cardSize} onChange={(e) => onChange({ cardSize: e.target.value })}>
            {Object.entries(CARD_SIZES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
        </label>
        <label>
          Espaço entre cartas (mm)
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={settings.gap}
            onChange={(e) => onChange({ gap: Math.min(10, Math.max(0, Number(e.target.value) || 0)) })}
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={settings.cutMarks} onChange={(e) => onChange({ cutMarks: e.target.checked })} />
          Marcas de corte
        </label>
      </div>
      <div className="summary">
        <span>
          {totalCards} {totalCards === 1 ? 'carta' : 'cartas'} · {layout.cols}×{layout.rows} por folha ·{' '}
          {pageCount} {pageCount === 1 ? 'folha' : 'folhas'}
        </span>
        <button type="button" className="primary" onClick={onPrint} disabled={!totalCards}>
          Imprimir / salvar PDF
        </button>
      </div>
      <p className="hint">Na janela de impressão, use escala 100% (ou "Tamanho real") e margens "Nenhuma".</p>
    </div>
  );
}
