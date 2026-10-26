// Folhas de impressão em milímetros reais. Na tela aparecem reduzidas como prévia.
const MARK = 4; // comprimento das marcas de corte (mm)

export default function PrintSheets({ pages, layout, cardSize, settings }) {
  const { pw, ph, cols, left, top, gridW, gridH, cutXs, cutYs } = layout;
  const { width: cw, height: ch } = cardSize;
  const gap = settings.gap;

  return (
    <div className="print-root">
      <style>{`@page { size: ${pw}mm ${ph}mm; margin: 0; }`}</style>
      {pages.map((cards, p) => (
        <div key={p} className="sheet" style={{ width: `${pw}mm`, height: `${ph}mm` }}>
          {cards.map((c, i) => (
            <img
              key={`${c.key}-${c.copy}`}
              className="sheet-card"
              src={c.art.url}
              alt={c.en}
              style={{
                left: `${left + (i % cols) * (cw + gap)}mm`,
                top: `${top + Math.floor(i / cols) * (ch + gap)}mm`,
                width: `${cw}mm`,
                height: `${ch}mm`,
              }}
            />
          ))}
          {settings.cutMarks && (
            <>
              {cutXs.map((x) => (
                <span key={`x${x}`}>
                  <i className="mark v" style={{ left: `${x}mm`, top: `${top - MARK - 1}mm`, height: `${MARK}mm` }} />
                  <i className="mark v" style={{ left: `${x}mm`, top: `${top + gridH + 1}mm`, height: `${MARK}mm` }} />
                </span>
              ))}
              {cutYs.map((y) => (
                <span key={`y${y}`}>
                  <i className="mark h" style={{ top: `${y}mm`, left: `${left - MARK - 1}mm`, width: `${MARK}mm` }} />
                  <i className="mark h" style={{ top: `${y}mm`, left: `${left + gridW + 1}mm`, width: `${MARK}mm` }} />
                </span>
              ))}
            </>
          )}
          <span className="page-number no-print">{p + 1}</span>
        </div>
      ))}
    </div>
  );
}
