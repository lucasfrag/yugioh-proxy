const test = require('node:test');
const assert = require('node:assert');
const { parseScanTitle, thumbUrl } = require('../src/utils/yugipedia');

test('parseScanTitle - reconhece scans em PT, EN e OCG', () => {
  assert.deepStrictEqual(parseScanTitle('File:DarkMagician-25TH-PT-UR-1E.png'), {
    lang: 'pt', region: 'PT', set: '25TH', rarity: 'UR', extra: '1E', file: 'DarkMagician-25TH-PT-UR-1E.png'
  });
  assert.strictEqual(parseScanTitle('File:DarkMagician-2015-JP-MLR.png').lang, 'ocg');
  assert.strictEqual(parseScanTitle('File:DarkMagician-LOB-NA-UR-1E.jpg').lang, 'en');
  // "RDS" (Rise of Destiny) é um set normal, não Rush Duel
  assert.strictEqual(parseScanTitle('File:BlueEyesWhiteDragon-RDS-JP-C.png').set, 'RDS');
});

test('parseScanTitle - ignora videogame, mangá, propaganda, Rush Duel, Dungeon Dice Monsters e outros idiomas', () => {
  assert.strictEqual(parseScanTitle('File:DMagician-DM2-JP-VG.png'), null);
  assert.strictEqual(parseScanTitle('File:AshBlossomJoyousSpring-JP-Manga-OS.png'), null);
  assert.strictEqual(parseScanTitle('File:BlueEyesWhiteDragon-SD25-JP-Commercial.png'), null);
  assert.strictEqual(parseScanTitle('File:BlueEyesWhiteDragon-RDKP02-JP-OP.png'), null);
  assert.strictEqual(parseScanTitle('File:DarkMagicianGirl-DDM-JP-UtR-Pink.png'), null);
  assert.strictEqual(parseScanTitle('File:DarkMagicianGirl-DDM-JP-Back.png'), null);
  assert.strictEqual(parseScanTitle('File:DarkMagician-LOB-DE-UR-1E.png'), null);
  assert.strictEqual(parseScanTitle('File:AshBlossomJoyousSpring-OW.png'), null);
});

test('thumbUrl - monta a miniatura no padrão do MediaWiki', () => {
  assert.strictEqual(
    thumbUrl({ url: 'https://ms.yugipedia.com/c/c3/DarkMagician-2026-JP-UR.png', width: 701 }),
    'https://ms.yugipedia.com/thumb/c/c3/DarkMagician-2026-JP-UR.png/240px-DarkMagician-2026-JP-UR.png'
  );
  assert.strictEqual(thumbUrl({ url: 'https://ms.yugipedia.com/c/c3/X.png', width: 150 }), 'https://ms.yugipedia.com/c/c3/X.png');
});
