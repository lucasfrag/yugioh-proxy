# Yu-Gi-Oh! Proxy Maker

Gerador de proxies de Yu-Gi-Oh! para impressão, com busca em **português e inglês** e imagens em três idiomas:

| Idioma | Fonte das imagens | Observação |
|---|---|---|
| Português | Scans da [Yugipedia](https://yugipedia.com) | Só existe para cartas lançadas em PT |
| Inglês (TCG) | Scans da Yugipedia + artes do [YGOPRODeck](https://ygoprodeck.com) | Artes do YGOPRODeck incluem todas as artes alternativas (421 px) |
| Japonês (OCG) | Scans da Yugipedia | Edições japonesas |

A maioria dos scans tem 700 a 1500 px de largura, o que dá de 300 a 600 dpi no tamanho real da carta (59 × 86 mm).

## Estrutura

```
api/   Node + Express: base de cartas, busca, galeria de imagens e cache local de imagens
web/   React + Vite: busca, escolha de arte, deck e folhas de impressão
```

## Como rodar

Requer Node.js 18.18 ou mais novo. O jeito mais fácil:

```bash
./run.sh            # instala, baixa a base (só na 1ª vez), gera o site e abre em http://localhost:3000
./run.sh dev        # modo desenvolvimento, recarrega ao editar o código
./run.sh atualizar  # baixa a base de cartas de novo (cartas novas) e sobe o site
```

A porta pode ser trocada com `PORT=8080 ./run.sh`.

Ou, passo a passo:

```bash
npm install
npm run setup   # baixa a base de cartas do YGOPRODeck (refaça para pegar cartas novas)
npm run dev     # API em :3000 e site em http://localhost:5173
```

Para usar sem modo de desenvolvimento:

```bash
npm run build
npm start       # site + API em http://localhost:3000
```

## Como funciona

- `npm run setup` grava `api/data/cards.json` com nome em inglês, nome em português (quando há tradução) e os ids de cada arte.
- Ao abrir uma carta, a API consulta a página `Card Gallery:<nome>` da Yugipedia, separa os scans por idioma e guarda o resultado em `api/data/cache/` por 14 dias.
- As imagens são baixadas uma vez e servidas a partir do cache local, sem hotlink no YGOPRODeck nem na Yugipedia.
- A arte padrão segue o idioma escolhido no topo da página. Em PT e OCG, o app pega o menor scan com pelo menos 650 px; em inglês, a arte digital do YGOPRODeck.

## API

| Rota | Descrição |
|---|---|
| `GET /api/cards?q=mago negro&limit=20` | Busca por nome em PT ou EN (tolera erro de digitação) |
| `GET /api/cards?ids=46986414,14558127` | Várias cartas por id (aceita ids de artes alternativas) |
| `GET /api/cards/:id` | Uma carta |
| `GET /api/cards/:id/artworks` | Artes do YGOPRODeck e scans PT/EN/OCG (`?refresh=1` ignora o cache) |
| `GET /img/...` | Imagens servidas pelo cache local |

## Impressão

Use **Imprimir / salvar PDF**. Na janela do navegador, escolha escala 100% ("Tamanho real") e margens "Nenhuma". Decks `.ydk` podem ser importados; o Side Deck é ignorado.

## Créditos

Inspirado no [Proxy Maker Brasil](https://www.proxymakerbrasil.com/). Dados de cartas: YGOPRODeck. Scans: Yugipedia (conteúdo da comunidade). Yu-Gi-Oh! é marca registrada da Konami. Proxies são para uso pessoal e casual, não para torneios oficiais nem venda.
