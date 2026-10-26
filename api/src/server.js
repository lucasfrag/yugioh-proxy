import { createApp } from './app.js';
import { config } from './config.js';
import { CardDb } from './db.js';

const db = await CardDb.load();
if (db) {
  console.log(`${db.cards.length} cartas carregadas (sincronizado em ${db.syncedAt}).`);
} else {
  console.warn('Base de cartas não encontrada: rode `npm run setup` na raiz do projeto.');
}

createApp(db).listen(config.port, () => {
  console.log(`API rodando em http://localhost:${config.port}`);
});
