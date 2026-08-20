import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { PRODUCTS_BY_ID } from "../data/catalog";
import { inventory } from "../lib/inventory";
import { loadRaw, save } from "../lib/persist";

export interface CartLine {
  key: string;
  productId: string;
  size: string;
  qty: number;
  addedAt: number;
  /** Looks added as a set carry the look's title so the bag can group them. */
  lookTitle?: string;
}

/** How long a boutique will hold a piece off the floor for an unfinished bag. */
export const HOLD_MS = 20 * 60 * 1000;

const KEY = "tonite.cart.v1";

interface Ctx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  storeIds: string[];
  add: (productId: string, size: string, opts?: { lookTitle?: string }) => boolean;
  addMany: (
    items: { productId: string; size: string }[],
    opts?: { lookTitle?: string },
  ) => { added: number; missed: number };
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  /** Puts the 20-minute hold back to full for one line. */
  extend: (key: string) => void;
  has: (productId: string, size: string) => boolean;
  expiredNotice: string | null;
  dismissNotice: () => void;
}

const CartCtx = createContext<Ctx | null>(null);

const lineKey = (productId: string, size: string) => `${productId}::${size}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    const saved = loadRaw<CartLine[]>(KEY, []);
    const now = Date.now();
    return saved.filter((l) => now - l.addedAt < HOLD_MS && PRODUCTS_BY_ID[l.productId]);
  });
  const [expiredNotice, setExpiredNotice] = useState<string | null>(null);

  /**
   * Holds are a side effect on shared inventory, so every mutation runs
   * imperatively against this ref and then commits — never inside a state
   * updater, which React may re-run during a render pass.
   */
  const linesRef = useRef(lines);
  const restored = useRef(false);

  const commit = useCallback((next: CartLine[]) => {
    linesRef.current = next;
    setLines(next);
    save(KEY, next);
  }, []);

  // Re-place holds for a bag restored from a previous visit.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const kept = linesRef.current.filter((l) => {
      let got = 0;
      while (got < l.qty && inventory.hold(l.productId, l.size)) got += 1;
      if (got === l.qty) return true;
      if (got) inventory.release(l.productId, l.size, got);
      return false;
    });
    if (kept.length !== linesRef.current.length) commit(kept);
    else linesRef.current = kept;
  }, [commit]);

  // Holds lapse. The piece goes back on the floor and the line leaves the bag.
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      const stale = linesRef.current.filter((l) => now - l.addedAt >= HOLD_MS);
      if (!stale.length) return;
      stale.forEach((l) => inventory.release(l.productId, l.size, l.qty));
      const first = PRODUCTS_BY_ID[stale[0].productId];
      setExpiredNotice(
        stale.length === 1 && first
          ? `The hold on ${first.name} lapsed — it is back on the floor.`
          : `${stale.length} holds lapsed. Those pieces are back on the floor.`,
      );
      commit(linesRef.current.filter((l) => now - l.addedAt < HOLD_MS));
    }, 5_000);
    return () => clearInterval(t);
  }, [commit]);

  const add = useCallback<Ctx["add"]>(
    (productId, size, opts) => {
      if (!inventory.hold(productId, size)) return false;
      const key = lineKey(productId, size);
      const current = linesRef.current;
      const existing = current.find((l) => l.key === key);
      commit(
        existing
          ? current.map((l) => (l.key === key ? { ...l, qty: l.qty + 1, addedAt: Date.now() } : l))
          : [
              ...current,
              { key, productId, size, qty: 1, addedAt: Date.now(), lookTitle: opts?.lookTitle },
            ],
      );
      return true;
    },
    [commit],
  );

  const addMany = useCallback<Ctx["addMany"]>(
    (items, opts) => {
      let added = 0;
      let missed = 0;
      items.forEach((i) => {
        if (add(i.productId, i.size, opts)) added += 1;
        else missed += 1;
      });
      return { added, missed };
    },
    [add],
  );

  const remove = useCallback<Ctx["remove"]>(
    (key) => {
      const line = linesRef.current.find((l) => l.key === key);
      if (!line) return;
      inventory.release(line.productId, line.size, line.qty);
      commit(linesRef.current.filter((l) => l.key !== key));
    },
    [commit],
  );

  const setQty = useCallback<Ctx["setQty"]>(
    (key, qty) => {
      const line = linesRef.current.find((l) => l.key === key);
      if (!line) return;
      if (qty <= 0) {
        remove(key);
        return;
      }
      const delta = qty - line.qty;
      if (delta > 0) {
        let got = 0;
        while (got < delta && inventory.hold(line.productId, line.size)) got += 1;
        if (got < delta) {
          // The floor ran out mid-increment; keep whatever we could actually hold.
          if (!got) return;
          commit(linesRef.current.map((l) => (l.key === key ? { ...l, qty: l.qty + got } : l)));
          return;
        }
      } else if (delta < 0) {
        inventory.release(line.productId, line.size, -delta);
      }
      commit(linesRef.current.map((l) => (l.key === key ? { ...l, qty } : l)));
    },
    [commit, remove],
  );

  const clear = useCallback(() => {
    linesRef.current.forEach((l) => inventory.release(l.productId, l.size, l.qty));
    commit([]);
  }, [commit]);

  const extend = useCallback<Ctx["extend"]>(
    (key) => {
      commit(linesRef.current.map((l) => (l.key === key ? { ...l, addedAt: Date.now() } : l)));
    },
    [commit],
  );

  const value = useMemo<Ctx>(() => {
    const subtotal = lines.reduce(
      (sum, l) => sum + (PRODUCTS_BY_ID[l.productId]?.price ?? 0) * l.qty,
      0,
    );
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal,
      storeIds: [
        ...new Set(
          lines.map((l) => PRODUCTS_BY_ID[l.productId]?.storeId).filter(Boolean) as string[],
        ),
      ],
      add,
      addMany,
      remove,
      setQty,
      clear,
      extend,
      has: (productId, size) => lines.some((l) => l.key === lineKey(productId, size)),
      expiredNotice,
      dismissNotice: () => setExpiredNotice(null),
    };
  }, [lines, add, addMany, remove, setQty, clear, extend, expiredNotice]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
