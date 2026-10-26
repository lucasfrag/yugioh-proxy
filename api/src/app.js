const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { IMAGE_FOLDERS, IMAGES_BASE_DIR, CACHE_DIR, USER_AGENT, WEB_DIST_DIR } = require('./config');
const { ensureCached, limiter } = require('./utils/cache');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Site do Proxy Maker (pasta web/dist, gerada com `npm run build`), se existir.
// Vem antes da documentação para ocupar a raiz "/"; a documentação continua em /api
if (fs.existsSync(WEB_DIST_DIR)) {
  app.use(express.static(WEB_DIST_DIR));
}

// Servir o painel/documentação frontend (pasta pública)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', express.static(path.join(__dirname, 'public')));

// Servir imagens das cartas estaticamente do diretório D:
app.use('/imagens/monstros', express.static(IMAGE_FOLDERS.monstros));
app.use('/imagens/magias', express.static(IMAGE_FOLDERS.magias));
app.use('/imagens/armadilhas', express.static(IMAGE_FOLDERS.armadilhas));
app.use('/imagens/tokens', express.static(IMAGE_FOLDERS.tokens));

// Servir o verso da carta (Parte de Trás)
const cardBackDir = path.join(IMAGES_BASE_DIR, 'verso');
app.use('/imagens/back', express.static(cardBackDir));

// Imagens remotas (artes do YGOPRODeck e versos oficiais da Yugipedia): baixadas uma vez e servidas do cache local
const YGOPRODECK_URLS = {
  full: (id) => `https://images.ygoprodeck.com/images/cards/${id}.jpg`,
  small: (id) => `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`
};
const REMOTE_BACKS = {
  'Back-EN.png': 'https://ms.yugipedia.com/e/e5/Back-EN.png',
  'Back-JP.png': 'https://ms.yugipedia.com/d/da/Back-JP.png',
  'Back-KR.png': 'https://ms.yugipedia.com/7/70/Back-KR.png'
};
const ygoprodeckQueue = limiter(6);
const backsQueue = limiter(3);
const CACHE_OPTIONS = { maxAge: '365d', immutable: true };

app.get('/imagens/ygoprodeck/:size/:file', async (req, res, next) => {
  const { size, file } = req.params;
  const match = /^(\d+)\.jpg$/.exec(file);
  if (!YGOPRODECK_URLS[size] || !match) return res.sendStatus(404);
  try {
    const local = path.join(CACHE_DIR, 'img', 'ygoprodeck', size, file);
    await ensureCached(local, YGOPRODECK_URLS[size](match[1]), { userAgent: USER_AGENT, queue: ygoprodeckQueue });
    res.sendFile(local, CACHE_OPTIONS);
  } catch (err) {
    next(err);
  }
});

app.get('/imagens/verso-remoto/:file', async (req, res, next) => {
  const remote = REMOTE_BACKS[req.params.file];
  if (!remote) return res.sendStatus(404);
  try {
    const local = path.join(CACHE_DIR, 'img', 'verso', req.params.file);
    await ensureCached(local, remote, { userAgent: USER_AGENT, queue: backsQueue });
    res.sendFile(local, CACHE_OPTIONS);
  } catch (err) {
    next(err);
  }
});

// Rotas da API
app.use('/api/cartas', require('./routes/cartas'));

// Rota raiz (redireciona para o painel de documentação caso não caia na pasta pública)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Expor rota de documentação no prefixo /api para acesso via CloudFront
app.get('/api', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento de erros genéricos
app.use((err, req, res, next) => {
  console.error('[ERRO INTERNO]', err.stack);
  res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
});

module.exports = app;
