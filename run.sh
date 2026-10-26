#!/usr/bin/env bash
# Sobe o Proxy Maker com um comando só.
#
#   ./run.sh            instala o que faltar, gera o site e abre em http://localhost:3000
#   ./run.sh dev        modo desenvolvimento (recarrega ao editar o código), normalmente em http://localhost:5173
#   ./run.sh atualizar  baixa a base de cartas de novo (para pegar cartas novas) e sobe o site
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-}"
PORT="${PORT:-3000}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale a versão 18.18 ou mais nova: https://nodejs.org" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "==> Instalando dependências (só na primeira vez)..."
  npm install
fi

if [ ! -f api/data/cards.json ] || [ "$MODE" = "atualizar" ]; then
  echo "==> Baixando a base de cartas..."
  npm run setup
fi

case "$MODE" in
  dev)
    echo "==> Modo desenvolvimento: abra o endereço \"Local:\" que o Vite mostrar abaixo (normalmente http://localhost:5173)"
    PORT="$PORT" API_URL="http://localhost:$PORT" exec npm run dev
    ;;
  ""|atualizar)
    echo "==> Gerando o site..."
    npm run build --silent
    echo "==> Pronto: abra http://localhost:$PORT  (Ctrl+C para parar)"
    PORT="$PORT" exec npm start --silent
    ;;
  *)
    echo "Uso: ./run.sh [dev|atualizar]" >&2
    exit 1
    ;;
esac
