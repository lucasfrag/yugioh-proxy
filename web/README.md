# Yu-Gi-Oh! Proxy Maker Português - Frontend

Este é o cliente web (frontend) construído em React com Vite para a geração de proxies de Yu-Gi-Oh! em alta definição prontas para impressão.

## 🚀 Tecnologias Utilizadas

*   **React 18** (Biblioteca de interface)
*   **Vite** (Ferramenta de build rápida)
*   **Lucide React** (Pacote de ícones)
*   **CSS Vanilla** (Estilização customizada com temática inspirada no anime)

## 📋 Pré-requisitos

Certifique-se de ter instalado em sua máquina:
*   [Node.js](https://nodejs.org/) (versão 18 ou superior)
*   O servidor backend rodando localmente ([yugioh-api](https://github.com/seu-usuario/yugioh-api) configurado na porta 3000)

## 🔧 Instalação e Execução

1. Clone o repositório em sua máquina:
   ```bash
   git clone https://github.com/seu-usuario/yugioh-proxies.git
   ```
2. Acesse o diretório do projeto:
   ```bash
   cd yugioh-proxies
   ```
3. Instale as dependências necessárias:
   ```bash
   npm install
   ```
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Abra o seu navegador no endereço: **`http://localhost:5173`**

## 🏗️ Geração do Build para Produção

Para otimizar e empacotar a aplicação para distribuição em produção, execute:
```bash
npm run build
```
Os arquivos otimizados serão gerados na pasta `/dist`.

## ⚙️ Integração com a API

Por padrão, a aplicação frontend se comunica com a API local em `http://localhost:3000`. Certifique-se de iniciar o servidor backend antes de utilizar o buscador de cartas.
