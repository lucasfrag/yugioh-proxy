# Yu-Gi-Oh! Proxy Maker Português - Backend API

Esta é a API de serviços construída em Node.js com Express que gerencia a base de dados de cartas em português e serve as imagens locais de alta definição para o gerador de proxies.

## 🚀 Tecnologias Utilizadas

*   **Node.js** (Ambiente de execução)
*   **Express** (Framework web)
*   **Fuse.js** (Mecanismo de busca fuzzy tolerante a erros ortográficos)
*   **Axios** (Cliente HTTP para sincronização externa)

## 📋 Pré-requisitos

Certifique-se de ter instalado em sua máquina:
*   [Node.js](https://nodejs.org/) (versão 18 ou superior)
*   A pasta contendo o acervo físico de imagens baixadas (com pastas como `Cartas Monstro`, `Cartas Magia`, `Cartas Armadilha`, `Fichas-Tokens` e `verso`).

## 🔧 Instalação e Configuração

1. Clone o repositório em sua máquina:
   ```bash
   git clone https://github.com/seu-usuario/yugioh-api.git
   ```
2. Acesse o diretório do projeto:
   ```bash
   cd yugioh-api
   ```
3. Instale as dependências necessárias:
   ```bash
   npm install
   ```
4. Configure as variáveis de ambiente:
   * Copie o arquivo `.env.example` criando um novo arquivo `.env`:
     ```bash
     cp .env.example .env
     ```
   * Abra o arquivo `.env` e edite a variável `IMAGES_BASE_DIR` informando o caminho exato onde as pastas físicas de imagens estão salvas em seu disco.

## 🗄️ Inicialização do Banco de Dados

Antes de rodar a API, você deve mapear as imagens locais e sincronizar com a base de dados em português do YGOPRODeck. Execute o script de sincronização automática:
```bash
npm run setup
```
Este comando criará o banco filtrado em `data/cards_pt.json` associando os IDs corretos e as artes das cartas às suas imagens locais.

## 🏁 Execução do Servidor

Para iniciar o servidor da API, execute:
```bash
npm start
```
O servidor será iniciado em: **`http://localhost:3000`**

## 🛣️ Rotas Disponíveis na API

*   `GET /api/cartas` - Busca cartas com filtros de paginação e busca tolerante a erros por nome ou ID (ex: `?nome=mago`).
*   `GET /api/cartas/:id` - Retorna os dados completos de uma carta específica por ID exato.
*   `GET /api/cartas/nome/:nome` - Retorna a carta correspondente ao nome exato fornecido.
*   `GET /api/cartas/backs` - Lista todas as imagens disponíveis para a parte de trás (verso) das cartas.
