/**
 * Normaliza uma string de texto para comparação fácil.
 * Remove acentos, caracteres especiais, pontuação, espaços e converte para minúsculas.
 * Exemplo: "Donzela Apaixonada" -> "donzelaapaixonada"
 * 
 * @param {string} name 
 * @returns {string}
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD') // Divide os caracteres acentuados em caractere + acento
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .replace(/[^a-z0-9]/g, '') // Mantém apenas letras e números (remove espaços e pontuação)
    .trim();
}

module.exports = { normalizeName };
