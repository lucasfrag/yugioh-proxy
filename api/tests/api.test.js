const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

test('Yu-Gi-Oh! API integration tests', async (t) => {
  let server;
  let baseUrl;

  // Inicializa o servidor Express em uma porta aleatória disponível antes dos testes
  t.before(() => {
    return new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const address = server.address();
        baseUrl = `http://localhost:${address.port}`;
        console.log(`[Teste] Servidor de testes iniciado em: ${baseUrl}`);
        resolve();
      });
    });
  });

  // Finaliza o servidor após a execução dos testes
  t.after(() => {
    return new Promise((resolve) => {
      server.close(() => {
        console.log('[Teste] Servidor de testes finalizado.');
        resolve();
      });
    });
  });

  // Teste 1: Listagem padrão com paginação e formato JSON
  await t.test('GET /api/cartas - deve listar cartas paginadas com metadados corretos', async () => {
    const res = await fetch(`${baseUrl}/api/cartas`);
    assert.strictEqual(res.status, 200);
    
    const data = await res.json();
    assert.strictEqual(typeof data.total, 'number');
    assert.strictEqual(data.page, 1);
    assert.strictEqual(data.limit, 20);
    assert.ok(Array.isArray(data.resultados), 'Resultados deve ser uma lista (array)');
    assert.ok(data.resultados.length <= 20, 'O limite de resultados retornados deve ser menor ou igual a 20');
  });

  // Teste 2: Priorização de correspondência exata
  await t.test('GET /api/cartas?nome=Mago Negro - deve retornar Mago Negro em primeiro lugar e conter imagens', async () => {
    const res = await fetch(`${baseUrl}/api/cartas?nome=Mago%20Negro`);
    assert.strictEqual(res.status, 200);
    
    const data = await res.json();
    assert.ok(data.resultados.length > 0, 'Deve retornar ao menos um resultado');
    
    const firstResult = data.resultados[0];
    assert.strictEqual(firstResult.nome, 'Mago Negro', 'A primeira carta da busca deve ser o "Mago Negro" (correspondência exata)');
    assert.strictEqual(firstResult.imagem, undefined, 'O campo antigo "imagem" (string) deve ter sido removido');
    assert.ok(Array.isArray(firstResult.imagens), 'O campo "imagens" deve ser um array');
    assert.ok(firstResult.imagens.length > 1, 'Mago Negro deve conter mais de uma imagem cadastrada');
    // Imagens do acervo local (se houver) ou, sem ele, as artes do YGOPRODeck servidas pela API
    assert.ok(/\/imagens\/(monstros|ygoprodeck)\//.test(firstResult.imagens[0]), 'As imagens devem vir do acervo local ou do YGOPRODeck');
  });

  // Teste 2.5: Busca com erro de digitação (Fuzzy Search)
  await t.test('GET /api/cartas?nome=Mago Nego - deve tolerar erros e retornar Mago Negro', async () => {
    const res = await fetch(`${baseUrl}/api/cartas?nome=Mago%20Nego`);
    assert.strictEqual(res.status, 200);
    
    const data = await res.json();
    assert.ok(data.resultados.length > 0, 'Deve retornar resultados mesmo com erro de digitação');
    
    const hasMagoNegro = data.resultados.some(c => c.nome === 'Mago Negro');
    assert.ok(hasMagoNegro, 'Deve conter "Mago Negro" na lista filtrada para "Mago Nego"');
  });

  // Teste 2.7: Busca unificada por ID no campo de nome
  await t.test('GET /api/cartas?nome=55144522 - deve buscar por ID no parâmetro de nome', async () => {
    const res = await fetch(`${baseUrl}/api/cartas?nome=55144522`);
    assert.strictEqual(res.status, 200);
    
    const data = await res.json();
    assert.strictEqual(data.resultados.length, 1);
    assert.strictEqual(data.resultados[0].nome, 'Pote da Ganância');
  });

  // Teste 2.8: Busca por ID parcial
  await t.test('GET /api/cartas?nome=55144 - deve retornar cartas com ID parcial correspondente (Pote da Ganância)', async () => {
    const res = await fetch(`${baseUrl}/api/cartas?nome=55144`);
    assert.strictEqual(res.status, 200);
    
    const data = await res.json();
    assert.ok(data.resultados.length > 0, 'Deve retornar resultados para ID parcial');
    const hasPote = data.resultados.some(c => c.nome === 'Pote da Ganância');
    assert.ok(hasPote, 'Deve incluir Pote da Ganância');
  });

  // Teste 2.9: Busca por número curto (não deve fazer busca parcial de ID pois length < 3)
  await t.test('GET /api/cartas?nome=7 - deve priorizar o nome exato "7" e depois "7 Completados", sem poluição de ID parcial', async () => {
    const res = await fetch(`${baseUrl}/api/cartas?nome=7`);
    assert.strictEqual(res.status, 200);
    
    const data = await res.json();
    assert.ok(data.resultados.length > 0, 'Deve retornar resultados');
    // Com a base completa existe a carta "7" (nome exato), que vem antes de "7 Completados"
    assert.strictEqual(data.resultados[0].nome, '7', 'Deve priorizar a carta de nome exato "7"');
    // Em seguida vêm as que começam com 7 em PT ou EN (ex.: "Peixe de 7 Cores" = "7 Colored Fish")
    const nomes = data.resultados.slice(1, 3).map(c => c.nome);
    assert.ok(nomes.includes('7 Completados'), 'Logo depois deve vir "7 Completados" pois começa com 7');
  });

  // Teste 3: Busca de carta por ID
  await t.test('GET /api/cartas/:id - deve buscar carta específica por ID (Pote da Ganância)', async () => {
    const res = await fetch(`${baseUrl}/api/cartas/55144522`);
    assert.strictEqual(res.status, 200);
    
    const card = await res.json();
    assert.strictEqual(card.id, 55144522);
    assert.strictEqual(card.nome, 'Pote da Ganância');
    assert.strictEqual(card.tipo_carta, 'Carta Mágica');
    assert.strictEqual(card.tipo, 'Magia Normal');
    assert.ok(card.imagens.length >= 1, 'Deve conter pelo menos uma imagem');
  });

  // Teste 4: Busca por nome no parâmetro da URL
  await t.test('GET /api/cartas/nome/:nome - deve buscar carta por nome na rota do parâmetro', async () => {
    const res = await fetch(`${baseUrl}/api/cartas/nome/Pote%20da%20Gan%C3%A2ncia`);
    assert.strictEqual(res.status, 200);
    
    const card = await res.json();
    assert.strictEqual(card.id, 55144522);
    assert.strictEqual(card.nome, 'Pote da Ganância');
  });

  // Teste 5: Erro 404 para ID inexistente
  await t.test('GET /api/cartas/:id - deve retornar 404 para ID inválido ou inexistente', async () => {
    const res = await fetch(`${baseUrl}/api/cartas/999999999`);
    assert.strictEqual(res.status, 404);
    
    const errorData = await res.json();
    assert.ok(errorData.erro, 'Deve conter uma mensagem de erro na resposta');
  });

  // Teste 5.5: Várias cartas por ID (importação de decks), inclusive por ID de arte alternativa
  await t.test('GET /api/cartas/lote - deve encontrar cartas por ID e por ID de arte alternativa', async () => {
    const res = await fetch(`${baseUrl}/api/cartas/lote?ids=46986414,46986415,999999999`);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data['46986414'].nome, 'Mago Negro', 'Deve encontrar a carta pelo ID');
    assert.strictEqual(data['46986415'].id, 46986414, 'O ID de arte alternativa deve levar à carta original');
    assert.strictEqual(data['999999999'], undefined, 'IDs inexistentes não entram na resposta');
  });

  // Teste 6: Obter versos disponíveis
  await t.test('GET /api/cartas/backs - deve listar os versos de carta disponíveis (pasta local ou versos oficiais)', async () => {
    const res = await fetch(`${baseUrl}/api/cartas/backs`);
    assert.strictEqual(res.status, 200);
    
    const backs = await res.json();
    assert.ok(Array.isArray(backs), 'O retorno deve ser um array');
    assert.ok(backs.length > 0, 'Deve conter pelo menos um verso de carta');
    // Pasta local de versos, ou os versos oficiais TCG/OCG quando ela não existe
    assert.ok(/\/imagens\/(back|verso-remoto)\//.test(backs[0]), 'A URL do verso deve estar no caminho correto');
  });
});
