import Fuse from 'fuse.js';
import { config } from './config.js';
import { normalize, readJson } from './util.js';

export class CardDb {
  constructor(cards, syncedAt = null) {
    this.syncedAt = syncedAt;
    this.cards = cards.map((c) => ({ ...c, _en: normalize(c.en), _pt: normalize(c.pt) }));
    this.byId = new Map();
    for (const card of this.cards) {
      this.byId.set(card.id, card);
      // Ids de artes alternativas também levam à carta (útil para importar .ydk).
      for (const artId of card.arts) if (!this.byId.has(artId)) this.byId.set(artId, card);
    }
    this.fuse = new Fuse(this.cards, { keys: ['_pt', '_en'], threshold: 0.35, ignoreLocation: true });
  }

  static async load(file = config.cardsFile) {
    const data = await readJson(file);
    if (!data) return null;
    return new CardDb(data.cards, data.syncedAt);
  }

  get(id) {
    return this.byId.get(Number(id)) ?? null;
  }

  /**
   * Busca por nome em PT ou EN. Ordem: nome exato, começa com, palavra que começa com,
   * contém; se faltar resultado, completa com busca aproximada (erros de digitação).
   */
  search(query, limit = 20) {
    const q = normalize(query);
    if (!q) return [];
    if (/^\d+$/.test(q)) {
      const card = this.get(q);
      return card ? [card] : [];
    }

    const rank = (name) => {
      if (!name) return Infinity;
      if (name === q) return 0;
      if (name.startsWith(q)) return 1;
      if (name.includes(` ${q}`)) return 2;
      if (name.includes(q)) return 3;
      return Infinity;
    };

    const hits = [];
    for (const card of this.cards) {
      const score = Math.min(rank(card._pt), rank(card._en));
      if (score !== Infinity) hits.push({ card, score });
    }
    hits.sort((a, b) => a.score - b.score || a.card.en.length - b.card.en.length);
    const result = hits.slice(0, limit).map((h) => h.card);

    if (result.length < limit && q.length >= 3) {
      const seen = new Set(result.map((c) => c.id));
      for (const { item } of this.fuse.search(q, { limit: limit * 2 })) {
        if (result.length >= limit) break;
        if (!seen.has(item.id)) result.push(item);
      }
    }
    return result;
  }
}

/** Formato público de uma carta (sem os campos internos de busca). */
export function publicCard(card) {
  const { _en, _pt, ...rest } = card;
  return rest;
}
