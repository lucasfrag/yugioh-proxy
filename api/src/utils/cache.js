const fs = require('fs/promises');
const path = require('path');

/**
 * Cria uma fila que executa no máximo `n` tarefas assíncronas ao mesmo tempo.
 * @param {number} n
 * @returns {(fn: () => Promise<any>) => Promise<any>}
 */
function limiter(n) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= n || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(resolve, reject).finally(() => {
      active--;
      next();
    });
  };
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data));
  await fs.rename(tmp, file);
}

const inflight = new Map();

/**
 * Garante que `remoteUrl` esteja salvo em `localPath` (baixa apenas na primeira vez).
 * Downloads simultâneos do mesmo arquivo são agrupados em um só.
 *
 * @param {string} localPath Caminho do arquivo no cache local
 * @param {string} remoteUrl URL de origem da imagem
 * @param {{ userAgent: string, queue: Function }} options
 * @returns {Promise<string>}
 */
function ensureCached(localPath, remoteUrl, { userAgent, queue }) {
  if (inflight.has(localPath)) return inflight.get(localPath);
  const job = (async () => {
    try {
      await fs.access(localPath);
      return localPath;
    } catch {
      // Ainda não está em cache
    }
    const res = await queue(() => fetch(remoteUrl, { headers: { 'User-Agent': userAgent } }));
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.startsWith('image/')) {
      throw new Error(`Falha ao baixar ${remoteUrl} (${res.status} ${type})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    const tmp = `${localPath}.${process.pid}.tmp`;
    await fs.writeFile(tmp, buffer);
    await fs.rename(tmp, localPath);
    return localPath;
  })().finally(() => inflight.delete(localPath));
  inflight.set(localPath, job);
  return job;
}

module.exports = { limiter, readJson, writeJson, ensureCached };
