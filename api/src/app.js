import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './config.js';
import { publicCard } from './db.js';
import { ensureCached, limiter } from './util.js';
import { findScan, getScans } from './yugipedia.js';

const YGOPRODECK_IMG = {
  full: (id) => `https://images.ygoprodeck.com/images/cards/${id}.jpg`,
  small: (id) => `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`,
};

// Downloads de imagem em paralelo, mas com limite (o YGOPRODeck aceita até 20 req/s).
const ygoprodeckQueue = limiter(6);
const yugipediaQueue = limiter(3);

const IMMUTABLE = { maxAge: '365d', immutable: true };

export function createApp(db) {
  const app = express();
  app.use(express.json());

  const requireDb = (req, res, next) => {
    if (db) return next();
    res.status(503).json({ error: 'Base de cartas não encontrada. Rode `npm run setup` na raiz do projeto.' });
  };

  // GET /api/cards?q=mago&limit=20   ou   GET /api/cards?ids=46986414,89631139
  app.get('/api/cards', requireDb, (req, res) => {
    if (req.query.ids) {
      const ids = String(req.query.ids).split(',').slice(0, 300);
      const cards = ids.map((id) => db.get(id)).filter(Boolean).map(publicCard);
      return res.json({ cards });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json({ cards: db.search(String(req.query.q || ''), limit).map(publicCard) });
  });

  app.get('/api/cards/:id', requireDb, (req, res) => {
    const card = db.get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Carta não encontrada.' });
    res.json(publicCard(card));
  });

  // Todas as imagens disponíveis para uma carta: artes do YGOPRODeck + scans da Yugipedia.
  app.get('/api/cards/:id/artworks', requireDb, async (req, res) => {
    const card = db.get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Carta não encontrada.' });

    const arts = card.arts.map((artId, i) => ({
      key: `ygoprodeck:${artId}`,
      source: 'ygoprodeck',
      lang: 'en',
      label: card.arts.length > 1 ? `Arte ${i + 1}` : 'Arte',
      width: 421,
      height: 614,
      url: `/img/ygoprodeck/full/${artId}.jpg`,
      thumb: `/img/ygoprodeck/small/${artId}.jpg`,
    }));

    let scans = [];
    let scansError = null;
    try {
      const gallery = await getScans(card, { refresh: req.query.refresh === '1' });
      scans = gallery.scans.map((s) => {
        const file = encodeURIComponent(s.file);
        return {
          key: `yugipedia:${s.file}`,
          source: 'yugipedia',
          lang: s.lang,
          label: [s.set, s.rarity, s.extra].filter(Boolean).join(' · '),
          width: s.width,
          height: s.height,
          url: `/img/yugipedia/${card.id}/full/${file}`,
          thumb: `/img/yugipedia/${card.id}/thumb/${file}`,
        };
      });
    } catch (err) {
      console.error(`[yugipedia] ${card.en}:`, err.message);
      scansError = 'Não foi possível consultar a Yugipedia agora.';
    }

    res.json({ card: publicCard(card), arts, scans, scansError });
  });

  app.get('/img/ygoprodeck/:size/:file', async (req, res, next) => {
    const { size, file } = req.params;
    const m = /^(\d+)\.jpg$/.exec(file);
    if (!YGOPRODECK_IMG[size] || !m) return res.sendStatus(404);
    try {
      const local = path.join(config.cacheDir, 'img', 'ygoprodeck', size, file);
      await ensureCached(local, YGOPRODECK_IMG[size](m[1]), { userAgent: config.userAgent, queue: ygoprodeckQueue });
      res.sendFile(local, IMMUTABLE);
    } catch (err) {
      next(err);
    }
  });

  app.get('/img/yugipedia/:cardId/:size/:file', async (req, res, next) => {
    const { cardId, size, file } = req.params;
    if (size !== 'full' && size !== 'thumb') return res.sendStatus(404);
    try {
      const scan = await findScan(Number(cardId), file);
      if (!scan) return res.sendStatus(404);
      const opts = { userAgent: config.userAgent, queue: yugipediaQueue };
      const full = path.join(config.cacheDir, 'img', 'yugipedia', 'full', path.basename(file));
      if (size === 'thumb') {
        const thumb = path.join(config.cacheDir, 'img', 'yugipedia', 'thumb', path.basename(file));
        try {
          await ensureCached(thumb, scan.thumbUrl, opts);
          return res.sendFile(thumb, IMMUTABLE);
        } catch {
          // Nem toda imagem tem miniatura gerada na Yugipedia; usa a imagem completa.
        }
      }
      await ensureCached(full, scan.url, opts);
      res.sendFile(full, IMMUTABLE);
    } catch (err) {
      next(err);
    }
  });

  // Em produção a própria API serve o site (web/dist).
  if (fs.existsSync(config.webDist)) {
    app.use(express.static(config.webDist));
    app.get(/^(?!\/(api|img)\/).*/, (req, res) => res.sendFile(path.join(config.webDist, 'index.html')));
  }

  app.use((err, req, res, next) => {
    console.error('[erro]', err.message);
    res.status(502).json({ error: 'Falha ao obter o recurso.' });
  });

  return app;
}
