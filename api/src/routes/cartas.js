const express = require('express');
const router = express.Router();
const fs = require('fs');
const Fuse = require('fuse.js');
const { CARDS_DB_FILE } = require('../config');
const { normalizeName } = require('../utils/normalizer');

// Carregar as cartas em memória na inicialização
let cards = [];
let fuse = null;

try {
  if (fs.existsSync(CARDS_DB_FILE)) {
    cards = JSON.parse(fs.readFileSync(CARDS_DB_FILE, 'utf8'));
    console.log(`[Banco de Dados] ${cards.length} cartas carregadas na inicialização.`);
    
    // Inicializar Fuse.js para busca fuzzy tolerante a erros ortográficos
    if (cards.length > 0) {
      fuse = new Fuse(cards, {
        keys: [
          { name: 'nome', weight: 0.7 },
          { name: 'nome_en', weight: 0.3 }
        ],
        threshold: 0.4, // Tolerância a erros (0.0 = exato, 1.0 = casa com tudo)
        ignoreLocation: true
      });
    }
  } else {
    console.warn(`[AVISO] Arquivo de dados não encontrado em: ${CARDS_DB_FILE}. Execute o setup antes.`);
  }
} catch (error) {
  console.error('[ERRO] Falha ao carregar as cartas:', error.message);
}

/**
 * Substitui o host nas URLs das imagens dinamicamente com base nos cabeçalhos da requisição.
 * Isso garante que links permaneçam válidos se o IP/Porta mudar ou a API for hospedada externamente.
 * 
 * @param {object} card 
 * @param {object} req 
 * @returns {object}
 */
function getDynamicCard(card, req) {
  const targetHost = process.env.HOST || `${req.protocol}://${req.get('host')}`;
  const dynamicCard = { ...card };

  if (card.imagens && Array.isArray(card.imagens)) {
    dynamicCard.imagens = card.imagens.map(img => 
      img.replace(/^http(s)?:\/\/[^\/]+/, targetHost)
    );
  }

  // Sem imagem local: usa as artes do YGOPRODeck (servidas pelo cache da própria API)
  if (dynamicCard.imagens.length === 0 && card.artes) {
    dynamicCard.imagens = card.artes.map(id => `${targetHost}/imagens/ygoprodeck/full/${id}.jpg`);
  }

  return dynamicCard;
}

/**
 * Lista todas as imagens disponíveis de uma carta, separadas por idioma.
 * Só imagens digitais (renderizações limpas da carta, sem reflexo nem desgaste):
 * - pt: acervo local em HD, se `IMAGES_BASE_DIR` tiver as pastas de cartas
 * - en: artes do YGOPRODeck (813 x 1185 px, uma por arte alternativa)
 * - ocg: ainda sem fonte digital
 */
function getCardImages(card, req) {
  const targetHost = process.env.HOST || `${req.protocol}://${req.get('host')}`;
  const idiomas = { pt: [], en: [], ocg: [] };

  const localImages = (card.imagens || []).map(img => img.replace(/^http(s)?:\/\/[^\/]+/, targetHost));
  localImages.forEach((url, idx) => {
    idiomas.pt.push({ url, miniatura: url, rotulo: `Arte ${idx + 1}`, fonte: 'local' });
  });

  (card.artes || []).forEach((id, idx) => {
    idiomas.en.push({
      url: `${targetHost}/imagens/ygoprodeck/full/${id}.jpg`,
      miniatura: `${targetHost}/imagens/ygoprodeck/small/${id}.jpg`,
      rotulo: `Arte ${idx + 1}`,
      largura: 813,
      altura: 1185,
      fonte: 'ygoprodeck'
    });
  });

  return { idiomas, erro: null };
}

// GET /api/cartas - Listar cartas com filtros e paginação
router.get('/', (req, res) => {
  const { nome, tipo_carta, tipo, atributo, nivel, page = 1, limit = 20 } = req.query;
  
  let results = [...cards];

  // 1. Filtro por Nome/ID (busca híbrida por Nome e/ou ID)
  if (nome) {
    const searchTrimmed = nome.trim();
    const searchNormalized = normalizeName(searchTrimmed);
    const isPureDigits = /^\d+$/.test(searchTrimmed);
    const matchPartialId = isPureDigits && searchTrimmed.length >= 3;

    let exactIdMatches = [];
    let exactNameMatches = [];
    let startNameMatches = [];
    let partialIdMatches = [];
    let fuzzyNameMatches = [];

    for (const card of cards) {
      const cardIdStr = String(card.id);

      // A. Correspondência de ID Exato (se for numérico)
      if (isPureDigits && cardIdStr === searchTrimmed) {
        exactIdMatches.push(card);
        continue;
      }

      // B. Correspondência de Nome Exato
      const cardNameNorm = normalizeName(card.nome);
      const cardNameEnNorm = normalizeName(card.nome_en);
      if (cardNameNorm === searchNormalized || cardNameEnNorm === searchNormalized) {
        exactNameMatches.push(card);
        continue;
      }

      // C. Início do Nome (Prefix)
      if (cardNameNorm.startsWith(searchNormalized) || cardNameEnNorm.startsWith(searchNormalized)) {
        startNameMatches.push(card);
        continue;
      }

      // D. Correspondência de ID Parcial (somente se for numérico com >= 3 dígitos)
      if (matchPartialId && cardIdStr.includes(searchTrimmed)) {
        partialIdMatches.push(card);
        continue;
      }
    }

    // E. Busca Fuzzy por nome usando Fuse.js
    if (fuse) {
      const searchResults = fuse.search(searchTrimmed);
      fuzzyNameMatches = searchResults.map(res => res.item);
    }

    // Combinar resultados mantendo a prioridade e removendo duplicatas
    const combined = [
      ...exactIdMatches,
      ...exactNameMatches,
      ...startNameMatches,
      ...partialIdMatches,
      ...fuzzyNameMatches
    ];

    const seen = new Set();
    results = [];
    for (const card of combined) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        results.push(card);
      }
    }
  }

  // 2. Filtro por Categoria Geral (tipo_carta)
  if (tipo_carta) {
    results = results.filter(c => c.tipo_carta.toLowerCase() === tipo_carta.toLowerCase());
  }

  // 3. Filtro por Tipo Específico (tipo)
  if (tipo) {
    results = results.filter(c => c.tipo.toLowerCase().includes(tipo.toLowerCase()));
  }

  // 4. Filtro por Atributo
  if (atributo) {
    results = results.filter(c => c.atributo && c.atributo.toLowerCase() === atributo.toLowerCase());
  }

  // 5. Filtro por Nível
  if (nivel) {
    const levelNum = parseInt(nivel, 10);
    results = results.filter(c => c.nivel === levelNum);
  }

  // Paginação
  const limitNum = parseInt(limit, 10);
  const pageNum = parseInt(page, 10);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = pageNum * limitNum;

  const totalResults = results.length;
  const paginatedResults = results.slice(startIndex, endIndex).map(c => getDynamicCard(c, req));

  res.json({
    total: totalResults,
    page: pageNum,
    limit: limitNum,
    total_paginas: Math.ceil(totalResults / limitNum),
    resultados: paginatedResults
  });
});

// GET /api/cartas/backs - Obter todos os versos (backs) disponíveis
router.get('/backs', (req, res) => {
  try {
    const { IMAGES_BASE_DIR } = require('../config');
    const path = require('path');
    const fs = require('fs');
    
    const requestHost = `${req.protocol}://${req.get('host')}`;
    const targetHost = process.env.HOST || requestHost;
    
    let files = [];
    const cardBackDir = path.join(IMAGES_BASE_DIR, 'verso');
    
    // Se a pasta física local existir (Ambiente de Desenvolvimento), lê dinamicamente
    if (fs.existsSync(cardBackDir)) {
      const localFiles = fs.readdirSync(cardBackDir);
      files = localFiles.filter(file => /\.(webp|png|jpg|jpeg)$/i.test(file));
    }
    
    // Versos oficiais TCG, OCG e coreano (Yugipedia), sempre disponíveis e servidos pelo cache da API.
    // Os da pasta local (se houver) entram primeiro.
    const officialBacks = ['Back-EN.png', 'Back-JP.png', 'Back-KR.png']
      .map(file => `${targetHost}/imagens/verso-remoto/${file}`);
    
    const backs = files.map(file => `${targetHost}/imagens/back/${encodeURIComponent(file)}`);
    res.json([...backs, ...officialBacks]);
  } catch (error) {
    console.error('Erro ao listar versos:', error.message);
    res.status(500).json({ erro: 'Falha ao buscar os versos das cartas.' });
  }
});

// GET /api/cartas/:id/imagens - Todas as imagens da carta por idioma (PT, EN e OCG)
router.get('/:id/imagens', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const card = cards.find(c => c.id === id || (c.artes && c.artes.includes(id)));

  if (!card) {
    return res.status(404).json({ erro: 'Carta não encontrada com o ID fornecido.' });
  }

  res.json(getCardImages(card, req));
});

// GET /api/cartas/:id - Buscar carta por ID exato
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const card = cards.find(c => c.id === id);

  if (!card) {
    return res.status(404).json({ erro: 'Carta não encontrada com o ID fornecido.' });
  }

  res.json(getDynamicCard(card, req));
});

// GET /api/cartas/nome/:nome - Buscar por nome (busca exata primeiro, depois parcial)
router.get('/nome/:nome', (req, res) => {
  const searchName = req.params.nome;
  const searchNormalized = normalizeName(searchName);

  // Busca exata
  let matchedCards = cards.filter(c => 
    normalizeName(c.nome) === searchNormalized || 
    normalizeName(c.nome_en) === searchNormalized
  );

  // Fallback para busca parcial
  if (matchedCards.length === 0) {
    matchedCards = cards.filter(c => 
      normalizeName(c.nome).includes(searchNormalized) || 
      normalizeName(c.nome_en).includes(searchNormalized)
    );
  }

  if (matchedCards.length === 0) {
    return res.status(404).json({ erro: 'Nenhuma carta encontrada com o nome fornecido.' });
  }

  // Se houver apenas 1 resultado relevante, retorna o objeto diretamente
  if (matchedCards.length === 1) {
    return res.json(getDynamicCard(matchedCards[0], req));
  }

  // Caso contrário, retorna a lista de correspondências
  res.json(matchedCards.map(c => getDynamicCard(c, req)));
});

module.exports = router;
