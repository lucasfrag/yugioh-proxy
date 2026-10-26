import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');

export const config = {
  port: Number(process.env.PORT) || 3000,
  dataDir: DATA_DIR,
  cardsFile: path.join(DATA_DIR, 'cards.json'),
  cacheDir: path.join(DATA_DIR, 'cache'),
  webDist: path.resolve(ROOT, '..', 'web', 'dist'),
  // A Yugipedia pede um User-Agent que identifique o projeto.
  userAgent: process.env.USER_AGENT || 'yugioh-proxy-maker/0.1 (projeto pessoal de proxies)',
  galleryTtlMs: 14 * 24 * 60 * 60 * 1000,
};
