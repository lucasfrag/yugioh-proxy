import fs from 'node:fs/promises';
import path from 'node:path';

/** Remove acentos/pontuação para comparar nomes ("Dragão" == "dragao"). */
export function normalize(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Executa no máximo `n` tarefas assíncronas ao mesmo tempo. */
export function limiter(n) {
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

export async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

export async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data));
  await fs.rename(tmp, file);
}

const inflight = new Map();

/**
 * Garante que `remoteUrl` esteja salvo em `localPath` (baixa só na primeira vez).
 * Downloads simultâneos do mesmo arquivo são deduplicados.
 */
export function ensureCached(localPath, remoteUrl, { userAgent, queue }) {
  if (inflight.has(localPath)) return inflight.get(localPath);
  const job = (async () => {
    try {
      await fs.access(localPath);
      return localPath;
    } catch { /* ainda não está em cache */ }
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
