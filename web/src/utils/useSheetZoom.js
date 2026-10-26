import { useLayoutEffect, useState } from 'react';
import { PAGE_SIZES } from './printMath';

const MM_TO_PX = 96 / 25.4;
// Espaço que não é da folha: padding da área de prévia, título e indicador de página
const PREVIEW_PADDING = 64;
const RESERVED_HEIGHT = 90;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.2;

/**
 * Zoom de tela das folhas: a folha ocupa a altura disponível, sem passar da largura.
 * Quando sobra largura, as páginas ficam lado a lado (o container quebra linha sozinho).
 * Só vale para a tela; na impressão a folha volta ao tamanho real.
 *
 * @param {React.RefObject<HTMLElement>} areaRef Elemento dentro da área de prévia (<main>)
 * @param {string} sheetSize Chave de PAGE_SIZES (ex.: "A4")
 * @param {boolean} active Se há páginas renderizadas
 */
export function useSheetZoom(areaRef, sheetSize, active) {
  const [zoom, setZoom] = useState(0.6);

  useLayoutEffect(() => {
    const container = areaRef.current?.parentElement;
    if (!active || !container) return undefined;

    const sheet = PAGE_SIZES[sheetSize] || PAGE_SIZES.A4;
    const sheetW = sheet.width * MM_TO_PX;
    const sheetH = sheet.height * MM_TO_PX;

    const update = () => {
      // Em telas estreitas a prévia cresce com o conteúdo; a janela limita a altura
      const height = Math.min(container.clientHeight, window.innerHeight) - PREVIEW_PADDING - RESERVED_HEIGHT;
      const width = container.clientWidth - PREVIEW_PADDING;
      const next = Math.min(height / sheetH, width / sheetW, MAX_ZOOM);
      setZoom(Math.max(MIN_ZOOM, Math.round(next * 100) / 100));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [areaRef, sheetSize, active]);

  return zoom;
}
