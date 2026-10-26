const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || `http://localhost:${PORT}`;

const fs = require('fs');

// Resolva IMAGES_BASE_DIR a partir do .env ou mantenha o padrão
const IMAGES_BASE_DIR = process.env.IMAGES_BASE_DIR || path.join(__dirname, '..', 'imagens');

// Função auxiliar para detectar qual pasta existe física no disco (novo formato vs formato original)
function resolveFolder(base, primaryName, fallbackName) {
  const primaryPath = path.join(base, primaryName);
  if (fs.existsSync(primaryPath)) {
    return primaryPath;
  }
  return path.join(base, fallbackName);
}

// Mapeamento das subpastas locais de imagens de forma dinâmica e tolerante
const IMAGE_FOLDERS = {
  monstros: resolveFolder(IMAGES_BASE_DIR, 'monstros', 'Cartas Monstro'),
  magias: resolveFolder(IMAGES_BASE_DIR, 'magias', 'Cartas Magia'),
  armadilhas: resolveFolder(IMAGES_BASE_DIR, 'armadilhas', 'Cartas Armadilha'),
  tokens: resolveFolder(IMAGES_BASE_DIR, 'tokens', 'Fichas-Tokens')
};

// Arquivo do banco de dados local filtrado
const CARDS_DB_FILE = path.join(__dirname, '..', 'data', 'cards_pt.json');

// Cache das imagens baixadas do YGOPRODeck e da Yugipedia
const CACHE_DIR = process.env.CACHE_DIR || path.join(__dirname, '..', 'data', 'cache');

// A Yugipedia pede um User-Agent que identifique o projeto
const USER_AGENT = process.env.USER_AGENT || 'yugioh-proxy-maker/1.0 (projeto pessoal de proxies)';

// Site (frontend) gerado com `npm run build` na pasta web/
const WEB_DIST_DIR = path.join(__dirname, '..', '..', 'web', 'dist');

module.exports = {
  PORT,
  HOST,
  IMAGES_BASE_DIR,
  IMAGE_FOLDERS,
  CARDS_DB_FILE,
  CACHE_DIR,
  USER_AGENT,
  WEB_DIST_DIR
};
