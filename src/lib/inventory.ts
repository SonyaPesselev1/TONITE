/**
 * Live inventory.
 *
 * The shop floor is shared: units disappear while you are looking at them.
 * This module owns the only mutable copy of stock in the app and notifies
 * React through `useSyncExternalStore`. Cart holds are subtracted from the
 * public number so two tabs can't promise the same last size 38.
 */
import { PRODUCTS, PRODUCTS_BY_ID } from "../data/catalog";
import { STORES_BY_ID } from "../data/stores";

const KEY = "tonite.inventory.v1";
const RESEED_AFTER_MS = 6 * 60 * 60 * 1000;
const TICK_MS = 7_000;

export interface SoldEvent {
  productId: string;
  size: string;
  at: number;
  neighborhood: string;
  /** true when that was the final unit in that size */
  lastOne: boolean;
}

const skuKey = (productId: string, size: string) => `${productId}:${size}`;

class Inventory {
  private stock = new Map<string, number>();
  private holds = new Map<string, number>();
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  version = 0;
  feed: SoldEvent[] = [];

  constructor() {
    this.seed();
    this.restore();
  }

  private seed() {
    for (const p of PRODUCTS) {
      for (const v of p.variants) this.stock.set(skuKey(p.id, v.size), v.stock);
    }
  }

  private restore() {
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { at: number; stock: Record<string, number> };
      if (!saved?.at || Date.now() - saved.at > RESEED_AFTER_MS) return;
      for (const [k, v] of Object.entries(saved.stock)) {
        if (this.stock.has(k)) this.stock.set(k, v);
      }
    } catch {
      /* a corrupt cache just means we open with a full rail */
    }
  }

  private persist() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ at: Date.now(), stock: Object.fromEntries(this.stock) }),
      );
    } catch {
      /* private mode */
    }
  }

  private emit() {
    this.version += 1;
    this.persist();
    for (const l of this.listeners) l();
  }

  /* ── Reads ───────────────────────────────────────────────────────── */

  /** Units a shopper can actually buy right now (shelf minus their own holds). */
  available(productId: string, size: string) {
    const k = skuKey(productId, size);
    return Math.max(0, (this.stock.get(k) ?? 0) - (this.holds.get(k) ?? 0));
  }

  onShelf(productId: string, size: string) {
    return this.stock.get(skuKey(productId, size)) ?? 0;
  }

  sizes(productId: string) {
    const p = PRODUCTS_BY_ID[productId];
    if (!p) return [];
    return p.variants.map((v) => ({ size: v.size, left: this.available(productId, v.size) }));
  }

  total(productId: string) {
    return this.sizes(productId).reduce((n, s) => n + s.left, 0);
  }

  inStock(productId: string) {
    return this.total(productId) > 0;
  }

  /** Only sizes with at least one unit left. */
  availableSizes(productId: string) {
    return this.sizes(productId).filter((s) => s.left > 0);
  }

  /* ── Writes ──────────────────────────────────────────────────────── */

  hold(productId: string, size: string, qty = 1) {
    const k = skuKey(productId, size);
    if (this.available(productId, size) < qty) return false;
    this.holds.set(k, (this.holds.get(k) ?? 0) + qty);
    this.emit();
    return true;
  }

  release(productId: string, size: string, qty = 1) {
    const k = skuKey(productId, size);
    const next = Math.max(0, (this.holds.get(k) ?? 0) - qty);
    if (next === 0) this.holds.delete(k);
    else this.holds.set(k, next);
    this.emit();
  }

  /** Checkout: holds become sales and leave the shop floor for good. */
  commit(lines: { productId: string; size: string; qty: number }[]) {
    for (const line of lines) {
      const k = skuKey(line.productId, line.size);
      this.stock.set(k, Math.max(0, (this.stock.get(k) ?? 0) - line.qty));
      const heldNow = Math.max(0, (this.holds.get(k) ?? 0) - line.qty);
      if (heldNow === 0) this.holds.delete(k);
      else this.holds.set(k, heldNow);
    }
    this.emit();
  }

  /* ── The rest of the city, shopping ──────────────────────────────── */

  private sellOne() {
    const candidates = PRODUCTS.flatMap((p) =>
      p.variants
        .filter((v) => (this.stock.get(skuKey(p.id, v.size)) ?? 0) > 0)
        .map((v) => ({ p, size: v.size, weight: p.heat * p.heat + 0.05 })),
    );
    if (!candidates.length) return;
    const total = candidates.reduce((n, c) => n + c.weight, 0);
    let roll = Math.random() * total;
    const pick = candidates.find((c) => (roll -= c.weight) <= 0) ?? candidates[0];

    const k = skuKey(pick.p.id, pick.size);
    const left = (this.stock.get(k) ?? 0) - 1;
    this.stock.set(k, Math.max(0, left));
    this.feed = [
      {
        productId: pick.p.id,
        size: pick.size,
        at: Date.now(),
        neighborhood: STORES_BY_ID[pick.p.storeId]?.neighborhood ?? "Downtown",
        lastOne: left <= 0,
      },
      ...this.feed,
    ].slice(0, 8);
    this.emit();
  }

  /** A return comes back on the rail now and then. */
  private restockOne() {
    const thin = PRODUCTS.filter((p) => this.total(p.id) <= 2);
    if (!thin.length) return;
    const p = thin[Math.floor(Math.random() * thin.length)];
    const v = p.variants[Math.floor(Math.random() * p.variants.length)];
    const k = skuKey(p.id, v.size);
    this.stock.set(k, Math.min(v.stock, (this.stock.get(k) ?? 0) + 1));
    this.emit();
  }

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    this.timer = setInterval(() => {
      if (document.hidden) return;
      if (Math.random() < 0.22) this.restockOne();
      else this.sellOne();
    }, TICK_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.started = false;
  }

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  getVersion = () => this.version;
}

export const inventory = new Inventory();

/** Deterministic-ish "people looking at this" number, refreshed by the tick. */
export function viewersFor(productId: string, version: number) {
  const p = PRODUCTS_BY_ID[productId];
  if (!p) return 0;
  const seed = productId.split("").reduce((n, c) => n + c.charCodeAt(0), 0) + Math.floor(version / 3);
  return 2 + Math.round(p.heat * 22) + (seed % 5);
}
