# Yu-Gi-Oh! Proxies

Versão do [Proxy Maker Brasil](https://www.proxymakerbrasil.com/) (de [Ruan Cardoso](https://github.com/Ruancard)) com **todas as cartas** (~14.600) e todas as variantes de arte, em imagens digitais limpas.

O código parte dos repositórios originais:

| Pasta | Origem | O que faz |
|---|---|---|
| `api/` | [ruancard/yugioh-api](https://github.com/ruancard/yugioh-api) | Express: base de cartas, busca e imagens |
| `web/` | [ruancard/yugioh-proxies](https://github.com/ruancard/yugioh-proxies) | React + Vite: busca, lista, folhas de impressão |

## Como rodar

Requer Node.js 20.9 ou mais novo (o projeto indica a versão 24 no `.nvmrc`). Se você usa o [nvm](https://github.com/nvm-sh/nvm), o `./run.sh` já ativa a versão certa sozinho.

```bash
./run.sh            # instala, baixa a base (só na 1ª vez), gera o site e abre em http://localhost:3000
./run.sh dev        # modo desenvolvimento, recarrega ao editar o código
./run.sh atualizar  # baixa a base de cartas de novo (cartas novas) e sobe o site
./run.sh cartas-pt  # baixa as cartas em português (coleção do Emula Animes) e sobe o site
```

Na primeira vez, o `./run.sh` pergunta se você quer baixar as **cartas em português**. Elas vêm direto da pasta pública do autor (veja abaixo); este projeto não hospeda nenhuma imagem. Se responder "não", ele não pergunta de novo, e dá para baixar depois com `./run.sh cartas-pt`. O download pode ser interrompido e retomado.

A porta pode ser trocada com `PORT=8080 ./run.sh`.

## O que mudou em relação ao original

**Arte e quantidade no mesmo lugar, também para editar.** Ao clicar numa carta da busca, abre o modal com todas as artes da carta; é só escolher a arte e a quantidade e clicar em "Selecionar Carta". Na lista, o botão com o nome da arte (ou a miniatura) reabre o mesmo modal para trocar arte e quantidade. Se houver imagens em mais de um idioma (ex.: acervo PT local + artes EN), o modal mostra abas **Português / Inglês / OCG** para escolher o idioma.

**Todas as cartas, sem precisar do acervo local.** No original, a base só tinha as cartas que estavam na pasta de imagens HD do autor (que não está no repositório). Agora o `setup` inclui todas as cartas do YGOPRODeck (~14.600), com o nome em português quando existe tradução.

**De onde vêm as imagens: só renderizações digitais.**

| Idioma | Fonte |
|---|---|
| Inglês | Artes digitais do [YGOPRODeck](https://ygoprodeck.com): 813 × 1185 px (~350 dpi no tamanho real), uma por arte alternativa |
| Português | Coleção HD do Emula Animes (2.300+ cartas), baixada com `./run.sh cartas-pt` (como no original, a partir da pasta `IMAGES_BASE_DIR`) |
| OCG (Japonês) | Ainda sem fonte digital |

As imagens são baixadas uma vez e servidas do cache em `api/data/cache/`.

> **Cartas em português — criadas pelo Emula Animes.** São as mesmas do site original: uma coleção feita por fãs pelo **[Emula Animes](https://www.youtube.com/watch?v=JqDxDtMwyME)**, com 2.300+ cartas recriadas em HD (813 × 1185 px), distribuída de graça no blog **[Cartas Caseiras](https://cartascaseiras.blogspot.com/2021/04/cartas-de-yu-gi-oh-pt-br-para-imprimir.html)**. O `./run.sh cartas-pt` (script `api/scripts/baixar_cartas_pt.js`) baixa cada carta da [pasta pública do autor no Google Drive](https://drive.google.com/drive/folders/1ZVQyZlSaNVBvNpMxiEwfEDdwZbgqTIQ-), converte de PNG para WebP (~200 KB por carta, ~450 MB no total) e grava um `CREDITOS.txt` junto. As imagens ficam em `api/imagens/` e estão no `.gitignore`: não são deste projeto. Encontrou um erro numa carta? Avise o autor nos comentários do blog. Cartas que não estão na coleção usam as artes em inglês. Não existe fonte digital equivalente para OCG.

**Versos.** São 9 modelos (13 com as cartas PT, que trazem os 4 versos do Emula Animes): os 6 do site original (em `api/imagens/verso/`, baixados do proxymakerbrasil.com, já que não estão no repositório do autor) e os oficiais TCG, OCG e coreano (Yugipedia). Para adicionar versos próprios, coloque as imagens (`.webp`, `.png` ou `.jpg`) em `<IMAGES_BASE_DIR>/verso/` (por padrão `api/imagens/verso/`).

**Rodapé.** A seção "Apoie o Projeto" (links e chaves de doação do autor original) foi removida; fica só a linha de créditos.

**Identidade visual própria ("Duel Disk").** Todo o visual foi refeito para não se confundir com o original; as funcionalidades são as mesmas.

| Elemento | Antes (original) | Agora |
|---|---|---|
| Nome | Proxy Maker Brasil | Yu-Gi-Oh! Proxies |
| Cores | Roxo + dourado | Marinho `#060a14` + ciano `#22d3ee` (apoio índigo `#6366f1`) |
| Fontes | Outfit / Plus Jakarta Sans (não carregadas) | Rajdhani (títulos) + Inter (texto), via Google Fonts |
| Formas | Cantos arredondados, brilho dourado | Cantos retos, botões chanfrados, linhas de HUD, grade de fundo na prévia |
| Logo | Ícone de brilho (lucide) | Hexágono de duel disk com carta (`web/src/components/Logo.jsx`, `public/favicon.svg`) |

**Layout que aproveita a tela.** Em telas largas (acima de 1280 px) são 3 colunas: cartas à esquerda (a lista ocupa a altura toda), prévia no centro e ajustes à direita, com o botão de imprimir sempre visível. A prévia calcula o zoom da folha para ocupar a altura livre (`web/src/utils/useSheetZoom.js`) e, quando sobra largura, mostra as páginas lado a lado (por exemplo, frente e verso). Entre 1024 e 1280 px, cartas e ajustes ficam empilhados à esquerda e a prévia fica fixa à direita; abaixo de 1024 px tudo empilha. O zoom vale só na tela: a impressão continua no tamanho real.

**Temas.** O botão com o ícone de paleta, no canto direito da navbar, troca entre 4 temas, e o navegador lembra a escolha:

| Tema | Visual |
|---|---|
| Duel Disk (padrão) | Marinho e ciano, cantos retos, linhas de HUD, Rajdhani |
| Milênio | Verde-escuro e bronze, cantos arredondados, títulos em Cinzel |
| Mesa de Duelo | Grafite e vermelho, sóbrio, Oswald |
| Fichário | Claro: creme, cartões brancos e verde-petróleo, Nunito |

Cada tema só redefine variáveis (`:root[data-theme="..."]` em `web/src/index.css`); o nome e as amostras do seletor ficam em `web/src/utils/themes.js`. Para criar um tema novo, copie um desses blocos, ajuste as cores e acrescente uma linha em `themes.js`. A impressão não muda com o tema.

As cores ficam em variáveis no topo de `web/src/index.css`, para facilitar ajustes. A página de documentação da API (`/api`) usa a mesma paleta. O `robots.txt` não aponta mais para o sitemap do domínio original, e o `sitemap.xml` foi removido.

### Mudanças técnicas

- `api/src/routes/cartas.js`: nova rota `GET /api/cartas/:id/imagens` (imagens por idioma); cartas sem imagem local usam as artes do YGOPRODeck; versos remotos.
- `api/src/app.js`: rotas `/imagens/ygoprodeck` e `/imagens/verso-remoto` (cache local); serve o site de `web/dist` em `/` (a documentação da API continua em `/api`).
- `api/src/utils/cache.js`: download e cache local de imagens.
- `api/scripts/setup_database.js` e `mapper.js`: base completa e campo `artes`.
- `web/src/components/ArtworkSelectionModal.jsx`: abas de idioma; `CardList.jsx`: botão para trocar idioma/arte; os itens guardam a imagem escolhida (`imagemSelecionada`).
- `web/src/components/ControlPanel.jsx`: miniaturas de verso quebram linha (cabem os 9 modelos).
- `web/src/App.jsx` e `index.css`: removido o bloco "Apoie o Projeto" do rodapé.
- `api/scripts/baixar_cartas_pt.js` (`npm run cartas-pt`): download das cartas PT da pasta do autor, com conversão para WebP pela [sharp](https://sharp.pixelplumbing.com/).
- `web/package.json`: Vite 6 e ESLint 9 (versões anteriores às do original, escolhidas quando o projeto ainda rodava no Node 18; com o Node atual dá para voltar ao Vite 8).
- Três testes da API foram atualizados porque supunham o acervo local.

## Créditos

Projeto original: Ruan Cardoso. Cartas em português (acervo HD): criadas pelo **Emula Animes** e distribuídas gratuitamente no blog [Cartas Caseiras](https://cartascaseiras.blogspot.com/2021/04/cartas-de-yu-gi-oh-pt-br-para-imprimir.html) ([YouTube](https://www.youtube.com/watch?v=JqDxDtMwyME)). Dados e artes em inglês: YGOPRODeck. Versos oficiais: Yugipedia. Yu-Gi-Oh! é marca registrada da Konami. Proxies são para uso pessoal e casual, não para torneios oficiais nem venda.
