import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CardDb } from '../src/db.js';
import { normalize } from '../src/util.js';
import { parseScanTitle, thumbUrl } from '../src/yugipedia.js';

const db = new CardDb([
  { id: 46986414, en: 'Dark Magician', pt: 'Mago Negro', frame: 'normal', type: 'Normal Monster', arts: [46986414, 46986415] },
  { id: 89631139, en: 'Blue-Eyes White Dragon', pt: 'Dragão Branco de Olhos Azuis', frame: 'normal', type: 'Normal Monster', arts: [89631139] },
  { id: 38033121, en: 'Dark Magician Girl', pt: 'Garota Maga Negra', frame: 'effect', type: 'Effect Monster', arts: [38033121] },
]);

test('normalize remove acentos e pontuação', () => {
  assert.equal(normalize('Dragão Branco-de Olhos!'), 'dragao branco de olhos');
});

test('busca em português e inglês', () => {
  assert.equal(db.search('mago negro')[0].id, 46986414);
  assert.equal(db.search('dragao branco')[0].id, 89631139);
  assert.equal(db.search('dark magician')[0].id, 46986414);
  assert.deepEqual(db.search('dark magician').map((c) => c.id), [46986414, 38033121]);
});

test('busca tolera erro de digitação', () => {
  assert.equal(db.search('magiciam')[0]?.en.startsWith('Dark Magician'), true);
});

test('id de arte alternativa leva à carta', () => {
  assert.equal(db.search('46986415')[0].id, 46986414);
});

test('parseScanTitle reconhece scans de PT, EN e OCG', () => {
  assert.deepEqual(parseScanTitle('File:DarkMagician-25TH-PT-UR-1E.png'), {
    lang: 'pt', region: 'PT', set: '25TH', rarity: 'UR', extra: '1E', file: 'DarkMagician-25TH-PT-UR-1E.png',
  });
  assert.equal(parseScanTitle('File:DarkMagician-2015-JP-MLR.png').lang, 'jp');
  assert.equal(parseScanTitle('File:DarkMagician-LOB-NA-UR-1E.jpg').lang, 'en');
});

test('parseScanTitle ignora videogame, mangá e outros idiomas', () => {
  assert.equal(parseScanTitle('File:DMagician-DM2-JP-VG.png'), null);
  assert.equal(parseScanTitle('File:AshBlossomJoyousSpring-JP-Manga-OS.png'), null);
  assert.equal(parseScanTitle('File:DarkMagician-LOB-DE-UR-1E.png'), null);
  assert.equal(parseScanTitle('File:AshBlossomJoyousSpring-OW.png'), null);
  assert.equal(parseScanTitle('File:BlueEyesWhiteDragon-RDKP02-JP-OP.png'), null);
  assert.equal(parseScanTitle('File:BlueEyesWhiteDragon-SD25-JP-Commercial.png'), null);
  assert.equal(parseScanTitle('File:BlueEyesWhiteDragon-RDS-JP-C.png').set, 'RDS');
});

test('thumbUrl monta a miniatura no padrão do MediaWiki', () => {
  assert.equal(
    thumbUrl({ url: 'https://ms.yugipedia.com/c/c3/DarkMagician-2026-JP-UR.png', width: 701 }),
    'https://ms.yugipedia.com/thumb/c/c3/DarkMagician-2026-JP-UR.png/240px-DarkMagician-2026-JP-UR.png',
  );
  assert.equal(thumbUrl({ url: 'https://ms.yugipedia.com/c/c3/X.png', width: 150 }), 'https://ms.yugipedia.com/c/c3/X.png');
});
