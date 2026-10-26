const ATTRIBUTE_MAP = {
  'DARK': 'Trevas',
  'LIGHT': 'Luz',
  'FIRE': 'Fogo',
  'WATER': 'Água',
  'WIND': 'Vento',
  'EARTH': 'Terra',
  'DIVINE': 'Divino'
};

const SPELL_RACE_MAP = {
  'Normal': 'Magia Normal',
  'Continuous': 'Magia Contínua',
  'Quick-Play': 'Magia Rápida',
  'Field': 'Magia de Campo',
  'Equip': 'Magia de Equipamento',
  'Ritual': 'Magia de Ritual'
};

const TRAP_RACE_MAP = {
  'Normal': 'Armadilha Normal',
  'Continuous': 'Armadilha Contínua',
  'Counter': 'Armadilha de Resposta'
};

const MONSTER_TYPE_MAP = {
  'Normal Monster': 'Monstro Normal',
  'Normal Tuner Monster': 'Monstro Regulador Normal',
  'Effect Monster': 'Monstro de Efeito',
  'Tuner Monster': 'Monstro Regulador',
  'Flip Effect Monster': 'Monstro de Efeito Virar',
  'Flip Tuner Effect Monster': 'Monstro Regulador de Efeito Virar',
  'Spirit Monster': 'Monstro Espírito',
  'Toon Monster': 'Monstro Toon',
  'Gemini Monster': 'Monstro Gêmeo',
  'Union Effect Monster': 'Monstro de União',
  'Ritual Monster': 'Monstro de Ritual',
  'Ritual Effect Monster': 'Monstro de Ritual de Efeito',
  'Fusion Monster': 'Monstro de Fusão',
  'Synchro Monster': 'Monstro Sincro',
  'Synchro Tuner Monster': 'Monstro Regulador Sincro',
  'XYZ Monster': 'Monstro Xyz',
  'Link Monster': 'Monstro Link',
  'Pendulum Normal Monster': 'Monstro Normal Pêndulo',
  'Pendulum Effect Monster': 'Monstro de Efeito Pêndulo',
  'Pendulum Flip Effect Monster': 'Monstro de Efeito Virar Pêndulo',
  'Pendulum Tuner Effect Monster': 'Monstro Regulador de Efeito Pêndulo',
  'Pendulum Effect Fusion Monster': 'Monstro de Fusão de Efeito Pêndulo',
  'Synchro Pendulum Effect Monster': 'Monstro Sincro de Efeito Pêndulo',
  'XYZ Pendulum Effect Monster': 'Monstro Xyz de Efeito Pêndulo',
  'Token': 'Ficha'
};

/**
 * Traduz o atributo em inglês para português.
 * @param {string} attr 
 * @returns {string|null}
 */
function translateAttribute(attr) {
  if (!attr) return null;
  return ATTRIBUTE_MAP[attr.toUpperCase()] || attr;
}

/**
 * Define a categoria geral da carta em português (tipo_carta).
 * @param {string} type 
 * @returns {string}
 */
function translateCardType(type) {
  if (!type) return 'Carta de Monstro';
  const t = type.toLowerCase();
  if (t.includes('spell')) return 'Carta Mágica';
  if (t.includes('trap')) return 'Carta de Armadilha';
  if (t.includes('token')) return 'Ficha';
  return 'Carta de Monstro';
}

/**
 * Traduz a subcategoria de tipo da carta para português.
 * @param {string} rawType Tipo original (ex: "Normal Monster" ou "Spell Card")
 * @param {string} rawRace Raça/Subtipo original (ex: "Quick-Play" ou "Warrior")
 * @param {string} cardTypeTranslated Categoria geral traduzida ("Carta Mágica", etc)
 * @returns {string}
 */
function translateType(rawType, rawRace, cardTypeTranslated) {
  if (cardTypeTranslated === 'Carta Mágica') {
    return SPELL_RACE_MAP[rawRace] || `Magia (${rawRace})`;
  }
  if (cardTypeTranslated === 'Carta de Armadilha') {
    return TRAP_RACE_MAP[rawRace] || `Armadilha (${rawRace})`;
  }
  
  // Para monstros e fichas
  if (MONSTER_TYPE_MAP[rawType]) {
    return MONSTER_TYPE_MAP[rawType];
  }
  
  // Tradução fallback dinâmica para monstros caso haja um tipo novo/não listado
  let translated = rawType || '';
  translated = translated.replace(/Normal Monster/gi, 'Monstro Normal');
  translated = translated.replace(/Effect Monster/gi, 'Monstro de Efeito');
  translated = translated.replace(/Tuner Monster/gi, 'Monstro Regulador');
  translated = translated.replace(/Fusion Monster/gi, 'Monstro de Fusão');
  translated = translated.replace(/Synchro Monster/gi, 'Monstro Sincro');
  translated = translated.replace(/XYZ Monster/gi, 'Monstro Xyz');
  translated = translated.replace(/Link Monster/gi, 'Monstro Link');
  translated = translated.replace(/Ritual Monster/gi, 'Monstro de Ritual');
  translated = translated.replace(/Pendulum/gi, 'Pêndulo');
  translated = translated.replace(/Union/gi, 'União');
  translated = translated.replace(/Flip/gi, 'Virar');
  translated = translated.replace(/Toon/gi, 'Toon');
  translated = translated.replace(/Spirit/gi, 'Espírito');
  translated = translated.replace(/Gemini/gi, 'Gêmeo');
  translated = translated.replace(/Token/gi, 'Ficha');
  translated = translated.replace(/Monster/gi, 'Monstro');

  return translated;
}

/**
 * Mapeia os dados crus da YGOPRODeck para o esquema brasileiro e associa os caminhos das imagens.
 * @param {object} rawCard Objeto da API original
 * @param {string[]} imageRelativePaths Lista de caminhos relativos locais para as imagens
 * @param {string} hostUrl URL base do servidor (ex: "http://localhost:3000")
 * @returns {object}
 */
function mapCard(rawCard, imageRelativePaths = [], hostUrl) {
  const tipoCarta = translateCardType(rawCard.type);
  const tipo = translateType(rawCard.type, rawCard.race, tipoCarta);
  const atributo = translateAttribute(rawCard.attribute);

  const imageUrls = imageRelativePaths.map(relPath => {
    const encodedSegments = relPath.replace(/\\/g, '/').split('/').map(segment => encodeURIComponent(segment));
    return `${hostUrl}/imagens/${encodedSegments.join('/')}`;
  });

  return {
    id: rawCard.id,
    nome: rawCard.name,
    nome_en: rawCard.name_en || rawCard.name,
    tipo_carta: tipoCarta,
    tipo: tipo,
    // Tipo em inglês, para a interface em inglês (ex.: "Normal Monster", "Quick-Play Spell")
    tipo_en: rawCard.humanReadableCardType || rawCard.type || null,
    desc: rawCard.desc || '',
    atk: rawCard.atk !== undefined ? rawCard.atk : null,
    def: rawCard.def !== undefined ? rawCard.def : null,
    nivel: rawCard.level !== undefined ? rawCard.level : null,
    atributo: atributo,
    imagens: imageUrls,
    // IDs das artes no YGOPRODeck (artes alternativas têm ID próprio)
    artes: (rawCard.card_images || []).map(img => img.id)
  };
}

module.exports = {
  mapCard,
  translateAttribute,
  translateCardType,
  translateType
};
