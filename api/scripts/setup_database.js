const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { normalizeName } = require('../src/utils/normalizer');
const { mapCard } = require('../src/utils/mapper');
const { IMAGE_FOLDERS, CARDS_DB_FILE, HOST } = require('../src/config');

// Mapeamentos manuais para nomes alterados pela dublagem brasileira ou divergências da API
const NAME_OVERRIDES = {
  // key: nome normalizado vindo da API -> value: nome normalizado vindo do arquivo local
  'sparkmanoheroidoelemento': 'homemfaiscasparkmanoheroidoelemento',
  'claymanoheroidoelemento': 'homemargilaoheroidoelementoclayman',
  'dragaobebe': 'dragaobebefilhote',
  'caveirainvocada': 'reicaveiracaveirainvocada',
  'avianoheroidoelemento': 'aviariooheroidoelemento',
  'wildheartoheroidoelemento': 'coracaoselvagemoheroidoelemento',
  'bubblemanoheroidoelemento': 'homembolhaoheroidoelemento',
  'caveirainvocadatoon': 'reicaveiratoon',
  'ka2desscissors': 'ka2destesouras',
  'flyingkamakiri1': 'kamakirivoador1',
  'flyingkamakiri2': 'kamakirivoador2'
};

// Função para escanear diretórios recursivamente
const getFilesRecursively = (dir, baseDir = dir) => {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, baseDir));
    } else {
      const relativeToFolder = path.relative(baseDir, fullPath);
      results.push(relativeToFolder);
    }
  });
  return results;
};

async function setup() {
  console.log('=== Iniciando Configuração do Banco de Dados Yu-Gi-Oh! ===');
  
  // 1. Escanear pastas de imagens locais (recursivamente)
  console.log('\n[1/4] Escaneando imagens locais de cartas...');
  const imageMap = {};
  let totalLocalFiles = 0;

  for (const [folderKey, folderPath] of Object.entries(IMAGE_FOLDERS)) {
    if (!fs.existsSync(folderPath)) {
      console.warn(`[AVISO] Pasta não encontrada: ${folderPath}`);
      continue;
    }

    const files = getFilesRecursively(folderPath);
    console.log(`- Escaneando pasta '${folderKey}' (com subpastas): ${files.length} arquivos encontrados.`);
    
    for (const file of files) {
      const normalizedPath = file.replace(/\\/g, '/');
      if (!normalizedPath.toLowerCase().endsWith('.webp')) continue;
      totalLocalFiles++;

      const filename = path.basename(normalizedPath);
      const cleanedFilename = filename.replace(/\.webp$/i, '');
      
      // Remove números no final para agrupar variações de arte (ex: "Mago Negro2" -> "Mago Negro")
      // Só remove se o número for precedido diretamente por uma letra (ex: "Lady Harpia 2" ou "Kamakiri Voador #2" não remove)
      const baseCardName = cleanedFilename.replace(/([a-zA-Z\u00C0-\u00FF])\d+$/, '$1');
      const normalized = normalizeName(baseCardName);
      const relativePath = `${folderKey}/${normalizedPath}`;

      if (!imageMap[normalized]) {
        imageMap[normalized] = {
          folder: folderKey,
          relativePaths: []
        };
      }
      
      imageMap[normalized].relativePaths.push(relativePath);
    }
  }

  // Ordenar os caminhos das imagens para que a versão principal (sem número ou menor número) venha primeiro
  for (const normalized of Object.keys(imageMap)) {
    imageMap[normalized].relativePaths.sort((a, b) => {
      const fileA = path.basename(a, '.webp');
      const fileB = path.basename(b, '.webp');
      
      // Extrai número do final, se houver
      const numA = parseInt(fileA.match(/\d+$/)?.[0] || '0', 10);
      const numB = parseInt(fileB.match(/\d+$/)?.[0] || '0', 10);
      
      return numA - numB;
    });
  }

  const uniqueLocalCardsCount = Object.keys(imageMap).length;
  console.log(`Concluído! Encontradas ${totalLocalFiles} imagens locais mapeadas para ${uniqueLocalCardsCount} chaves de busca.`);

  // 2. Baixar bases de dados do YGOPRODeck (PT e EN para mesclagem)
  console.log('\n[2/4] Baixando base de dados do YGOPRODeck...');
  let apiCards = [];
  try {
    console.log('- Baixando dados em português...');
    const ptResponse = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt', {
      timeout: 45000 // 45 segundos
    });
    const ptCards = ptResponse.data.data;
    console.log(`- Sucesso! ${ptCards.length} cartas baixadas em português.`);

    console.log('- Baixando dados em inglês (completo)...');
    const engResponse = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php', {
      timeout: 45000 // 45 segundos
    });
    const engCards = engResponse.data.data;
    console.log(`- Sucesso! ${engCards.length} cartas baixadas em inglês.`);

    // Criar mapa das cartas em português para mesclagem por ID
    const ptMap = new Map(ptCards.map(c => [c.id, c]));

    // Mesclar: Usar dados em PT se disponível, senão cair no EN como fallback
    console.log('- Mesclando bases de dados...');
    apiCards = engCards.map(engCard => {
      const ptCard = ptMap.get(engCard.id);
      if (ptCard) {
        return {
          ...engCard,
          name: ptCard.name,
          desc: ptCard.desc,
          name_en: engCard.name
        };
      } else {
        return {
          ...engCard,
          name_en: engCard.name
        };
      }
    });
    console.log(`- Bases mescladas com sucesso. Total de ${apiCards.length} cartas disponíveis para mapeamento.`);
  } catch (error) {
    console.error('[ERRO] Falha ao baixar os dados da API:', error.message);
    process.exit(1);
  }

  // 3. Filtrar e Mapear cartas
  console.log('\n[3/4] Filtrando e mapeando cartas...');
  const filteredCards = [];
  let matchCount = 0;

  for (const rawCard of apiCards) {
    const apiNormalized = normalizeName(rawCard.name);
    
    // Verifica correspondência direta ou por override (dublagem brasileira / divergências)
    let finalKey = null;
    if (imageMap[apiNormalized]) {
      finalKey = apiNormalized;
    } else if (NAME_OVERRIDES[apiNormalized] && imageMap[NAME_OVERRIDES[apiNormalized]]) {
      finalKey = NAME_OVERRIDES[apiNormalized];
    }

    if (finalKey) {
      matchCount++;
      const firstImagePath = imageMap[finalKey].relativePaths[0];
      const localFilename = path.basename(firstImagePath, '.webp');
      
      // Remove número de variação final se houver (ex: "Dragão Branco de Olhos Azuis1" -> "Dragão Branco de Olhos Azuis")
      // Só se for colado em letra
      const cleanedLocalName = localFilename.replace(/([a-zA-Z\u00C0-\u00FF])\d+$/, '$1');

      const mapped = mapCard(rawCard, imageMap[finalKey].relativePaths, HOST);
      
      if (cleanedLocalName && normalizeName(mapped.nome) !== normalizeName(cleanedLocalName)) {
        console.log(`- [Ajuste de Nome] "${mapped.nome}" -> "${cleanedLocalName}" (ID: ${mapped.id})`);
        mapped.nome = cleanedLocalName;
      }
      
      filteredCards.push(mapped);
    } else {
      // Sem imagem local: a carta entra mesmo assim, com imagens do YGOPRODeck/Yugipedia
      filteredCards.push(mapCard(rawCard, [], HOST));
    }
  }

  console.log(`- Sucesso! ${matchCount} cartas com imagens locais (total no banco: ${filteredCards.length}).`);

  // 4. Salvar banco de dados filtrado
  console.log('\n[4/4] Salvando banco de dados local filtrado...');
  try {
    const dataDir = path.dirname(CARDS_DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(CARDS_DB_FILE, JSON.stringify(filteredCards, null, 2), 'utf-8');
    console.log(`- Banco de dados salvo com sucesso em: ${CARDS_DB_FILE}`);
    console.log(`- Tamanho final da base de dados: ${filteredCards.length} cartas.`);
  } catch (error) {
    console.error('[ERRO] Falha ao salvar o banco de dados:', error.message);
    process.exit(1);
  }

  console.log('\n=== Configuração concluída com sucesso! ===');
}

setup();
