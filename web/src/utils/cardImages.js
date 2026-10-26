// Funções auxiliares para as imagens das cartas (idioma e arte).

export const IDIOMAS = [
  { id: 'pt', nome: 'Português', sigla: 'PT' },
  { id: 'en', nome: 'Inglês', sigla: 'EN' },
  { id: 'ocg', nome: 'OCG (Japonês)', sigla: 'OCG' }
];

/**
 * Imagem selecionada de um item da lista. Itens antigos caem para `imagens[índice]`:
 * os salvos antes da escolha de idioma (só têm `selectedImageIndex`) e os que apontavam
 * para scans da Yugipedia, que deixaram de ser oferecidos.
 */
export function getItemImage(item) {
  const salva = item.imagemSelecionada;
  if (salva && !salva.url.includes('/imagens/yugipedia/')) return salva;
  const url = (item.imagens && item.imagens[item.selectedImageIndex || 0]) || '';
  return { url, miniatura: toThumbnail(url), idioma: 'en', rotulo: 'Arte 1' };
}

/** Chave que identifica a combinação carta + imagem na lista. */
export function getItemKey(item) {
  return `${item.id}|${getItemImage(item).url}`;
}

/** Versão pequena de uma imagem do YGOPRODeck (para miniaturas). */
export function toThumbnail(url) {
  return url ? url.replace('/imagens/ygoprodeck/full/', '/imagens/ygoprodeck/small/') : url;
}
