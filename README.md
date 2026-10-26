# Yu-Gi-Oh! Proxies

Versão do [Proxy Maker Brasil](https://www.proxymakerbrasil.com/) (de [Ruan Cardoso](https://github.com/Ruancard)) com cartas em **português, inglês (TCG) e japonês (OCG)** e todas as variantes de arte.

O código parte dos repositórios originais:

| Pasta | Origem | O que faz |
|---|---|---|
| `api/` | [ruancard/yugioh-api](https://github.com/ruancard/yugioh-api) | Express: base de cartas, busca e imagens |
| `web/` | [ruancard/yugioh-proxies](https://github.com/ruancard/yugioh-proxies) | React + Vite: busca, lista, folhas de impressão |

## Como rodar

Requer Node.js 18.18 ou mais novo.

```bash
./run.sh            # instala, baixa a base (só na 1ª vez), gera o site e abre em http://localhost:3000
./run.sh dev        # modo desenvolvimento, recarrega ao editar o código
./run.sh atualizar  # baixa a base de cartas de novo (cartas novas) e sobe o site
```

A porta pode ser trocada com `PORT=8080 ./run.sh`.

## O que mudou em relação ao original

**Idioma e arte no mesmo lugar.** Ao clicar numa carta da busca, abre o modal com abas **Português / Inglês / OCG (Japonês)**. Em cada aba aparecem todas as imagens disponíveis com a resolução; depois é só escolher a quantidade e clicar em "Selecionar Carta". Na lista, o botão com o nome da arte (ou a miniatura) reabre o mesmo modal para trocar idioma, arte e quantidade.

**Todas as cartas, sem precisar do acervo local.** No original, a base só tinha as cartas que estavam na pasta de imagens HD do autor (que não está no repositório). Agora o `setup` inclui todas as cartas do YGOPRODeck (~14.600), com o nome em português quando existe tradução.

**De onde vêm as imagens:**

| Aba | Fonte |
|---|---|
| Português | Acervo HD local (se `IMAGES_BASE_DIR` estiver configurado) + scans PT da [Yugipedia](https://yugipedia.com) |
| Inglês | Artes digitais do [YGOPRODeck](https://ygoprodeck.com) (todas as artes alternativas) + scans EN da Yugipedia |
| OCG (Japonês) | Scans japoneses da Yugipedia |

A opção **"Ocultar scans em baixa resolução"** (marcada por padrão e lembrada pelo navegador) esconde scans com menos de 500 px de largura, que ficam borrados impressos. As artes digitais do YGOPRODeck (421 px) continuam visíveis, porque são imagens limpas e às vezes a única fonte de arte alternativa.

A maioria dos scans tem de 700 a 1500 px de largura (300 a 600 dpi no tamanho real da carta). As imagens são baixadas uma vez e servidas do cache em `api/data/cache/`. Ficam de fora versões de videogame, mangá, anime, Rush Duel, Dungeon Dice Monsters e fotos de propaganda.

**Versos.** São 9 modelos: os 6 do site original (em `api/imagens/verso/`, baixados do proxymakerbrasil.com, já que não estão no repositório do autor) e os oficiais TCG, OCG e coreano (Yugipedia). Para adicionar versos próprios, coloque as imagens (`.webp`, `.png` ou `.jpg`) em `<IMAGES_BASE_DIR>/verso/` (por padrão `api/imagens/verso/`).

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

As cores ficam em variáveis no topo de `web/src/index.css`, para facilitar ajustes. A página de documentação da API (`/api`) usa a mesma paleta. O `robots.txt` não aponta mais para o sitemap do domínio original, e o `sitemap.xml` foi removido.

### Mudanças técnicas

- `api/src/routes/cartas.js`: nova rota `GET /api/cartas/:id/imagens` (imagens por idioma); cartas sem imagem local usam as artes do YGOPRODeck; versos remotos.
- `api/src/app.js`: rotas `/imagens/ygoprodeck`, `/imagens/yugipedia` e `/imagens/verso-remoto` (cache local); serve o site de `web/dist` em `/` (a documentação da API continua em `/api`).
- `api/src/utils/yugipedia.js` e `cache.js`: consulta às galerias da Yugipedia e cache de imagens.
- `api/scripts/setup_database.js` e `mapper.js`: base completa e campo `artes`.
- `web/src/components/ArtworkSelectionModal.jsx`: abas de idioma; `CardList.jsx`: botão para trocar idioma/arte; os itens guardam a imagem escolhida (`imagemSelecionada`).
- `web/src/components/ControlPanel.jsx`: miniaturas de verso quebram linha (cabem os 9 modelos).
- `web/src/App.jsx` e `index.css`: removido o bloco "Apoie o Projeto" do rodapé.
- `web/package.json`: Vite 6 e ESLint 9 (o Vite 8 e o ESLint 10 exigem Node 20+).
- Três testes da API foram atualizados porque supunham o acervo local; testes novos em `api/tests/yugipedia.test.js`.

## Créditos

Projeto original: Ruan Cardoso. Dados de cartas: YGOPRODeck. Scans: Yugipedia (conteúdo da comunidade). Yu-Gi-Oh! é marca registrada da Konami. Proxies são para uso pessoal e casual, não para torneios oficiais nem venda.
