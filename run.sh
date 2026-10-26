#!/usr/bin/env bash
# Sobe o Proxy Maker com um comando só.
#
#   ./run.sh            instala o que faltar, gera o site e abre em http://localhost:3000
#   ./run.sh dev        modo desenvolvimento (recarrega ao editar o código), normalmente em http://localhost:5173
#   ./run.sh atualizar  baixa a base de cartas de novo (para pegar cartas novas) e sobe o site
#   ./run.sh cartas-pt  baixa as cartas em português (coleção do Emula Animes) e sobe o site
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-}"
PORT="${PORT:-3000}"
export DOTENV_CONFIG_QUIET=true

# Usa o Node do nvm (versão do .nvmrc), se o nvm estiver instalado
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  set +u  # o nvm usa variáveis não definidas
  . "$NVM_DIR/nvm.sh"
  nvm use --silent >/dev/null 2>&1 || nvm use --silent default >/dev/null 2>&1 || true
  set -u
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale a versão 20.9 ou mais nova: https://nodejs.org" >&2
  exit 1
fi

# A sharp (usada nas cartas PT) exige Node 20.9 ou mais novo
if ! node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>20||(a===20&&b>=9)?0:1)"; then
  echo "Este projeto precisa do Node 20.9 ou mais novo (você tem $(node -v))." >&2
  echo "Jeito mais fácil, sem sudo: instale o nvm (https://github.com/nvm-sh/nvm) e rode: nvm install --lts" >&2
  exit 1
fi

# Instala na primeira vez ou quando surgir dependência nova (ex.: sharp, usada nas cartas PT)
if [ ! -d node_modules ] || ! (cd api && node -e "require('sharp')" >/dev/null 2>&1); then
  echo "==> Instalando dependências..."
  npm install
fi

PRECISA_SETUP=0
# A base precisa ter o campo "artes" (bases antigas, só com o acervo local, não têm)
if ! grep -q '"artes"' api/data/cards_pt.json 2>/dev/null || [ "$MODE" = "atualizar" ]; then
  PRECISA_SETUP=1
fi

# Cartas em português: coleção HD feita por fãs pelo Emula Animes (https://cartascaseiras.blogspot.com/).
# O download vem direto da pasta pública do autor; nada é hospedado por este projeto.
IMAGENS_DIR="$(cd api && node -e "process.stdout.write(require('./src/config').IMAGES_BASE_DIR)")"
SEM_PT_MARCA="$IMAGENS_DIR/.sem-cartas-pt"
tem_cartas_pt() { [ -d "$IMAGENS_DIR/Cartas Monstro" ] || [ -d "$IMAGENS_DIR/monstros" ]; }

baixar_cartas_pt() {
  rm -f "$SEM_PT_MARCA"
  npm run cartas-pt --silent
  PRECISA_SETUP=1
}

if [ "$MODE" = "cartas-pt" ]; then
  baixar_cartas_pt
elif [ "$MODE" = "atualizar" ] && tem_cartas_pt; then
  # Pega as cartas que o autor tenha adicionado desde o último download
  baixar_cartas_pt
elif ! tem_cartas_pt && [ ! -f "$SEM_PT_MARCA" ] && [ -t 0 ]; then
  echo
  echo "==> Cartas em português (opcional)"
  echo "    Coleção em HD feita por fãs pelo Emula Animes — https://cartascaseiras.blogspot.com/"
  echo "    São ~2.300 cartas (~450 MB), baixadas direto da pasta pública do autor."
  echo "    Sem elas, o site usa as artes em inglês."
  read -r -p "    Baixar agora? [s/N] " RESPOSTA
  if [[ "$RESPOSTA" =~ ^[sSyY] ]]; then
    baixar_cartas_pt
  else
    mkdir -p "$IMAGENS_DIR"
    touch "$SEM_PT_MARCA"
    echo "    Tudo bem! Para baixar depois: ./run.sh cartas-pt"
  fi
  echo
fi

if [ "$PRECISA_SETUP" = 1 ]; then
  echo "==> Montando a base de cartas..."
  npm run setup
fi

case "$MODE" in
  dev)
    echo "==> Modo desenvolvimento: abra o endereço \"Local:\" que o Vite mostrar abaixo (normalmente http://localhost:5173)"
    PORT="$PORT" API_URL="http://localhost:$PORT" exec npm run dev
    ;;
  ""|atualizar|cartas-pt)
    echo "==> Gerando o site..."
    npm run build --silent
    echo "==> Pronto: abra http://localhost:$PORT  (Ctrl+C para parar)"
    PORT="$PORT" exec npm start --silent
    ;;
  *)
    echo "Uso: ./run.sh [dev|atualizar|cartas-pt]" >&2
    exit 1
    ;;
esac
