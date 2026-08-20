import { STORES_BY_ID } from "../data/stores";
import type { Store } from "../data/types";

/** Minutes a courier needs door-to-door, before the boutique has even packed. */
export function courierMinutes(store: Store, at: Date = new Date()) {
  const hour = at.getHours();
  // Evening surge: 6–10pm the city slows down.
  const surge = hour >= 18 && hour < 22 ? 1.25 : hour >= 22 || hour < 7 ? 0.9 : 1;
  return Math.round((9 + store.distanceKm * 5.4) * surge);
}

export interface Eta {
  /** Fastest realistic door time, minutes from now. */
  low: number;
  /** Padded door time, minutes from now. */
  high: number;
  from: Date;
  to: Date;
}

function window(minutes: number, at: Date): Eta {
  const low = Math.max(35, Math.round(minutes));
  const high = low + Math.max(12, Math.round(low * 0.22));
  return {
    low,
    high,
    from: new Date(at.getTime() + low * 60_000),
    to: new Date(at.getTime() + high * 60_000),
  };
}

/** ETA for a single boutique's order. */
export function storeEta(store: Store, at: Date = new Date()): Eta {
  return window(store.prepMinutes + courierMinutes(store, at), at);
}

/**
 * ETA for a basket. Orders from several boutiques are consolidated at the
 * nearest hub, which costs eight minutes per additional stop.
 */
export function basketEta(storeIds: string[], at: Date = new Date()): Eta {
  const ids = [...new Set(storeIds)];
  if (ids.length === 0) return window(45, at);
  const legs = ids.map((id) => {
    const store = STORES_BY_ID[id];
    return store ? store.prepMinutes + courierMinutes(store, at) : 45;
  });
  const slowest = Math.max(...legs);
  return window(slowest + (ids.length - 1) * 8, at);
}

/** Parses "9:30 PM" against today's date. */
export function closingTime(store: Store, at: Date = new Date()) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(store.closesAt);
  const d = new Date(at);
  if (!m) {
    d.setHours(21, 0, 0, 0);
    return d;
  }
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  d.setHours(h, Number(m[2]), 0, 0);
  return d;
}

/** Minutes left to order from a boutique tonight; negative once it has closed. */
export function minutesToCutoff(store: Store, at: Date = new Date()) {
  const cutoff = closingTime(store, at).getTime() - store.prepMinutes * 60_000;
  return Math.round((cutoff - at.getTime()) / 60_000);
}

export function isOpenNow(store: Store, at: Date = new Date()) {
  return minutesToCutoff(store, at) > 0;
}

export const DELIVERY_FEE = 12;
export const STYLING_FEE = 0;
export const TAX_RATE = 0.08875;

export interface DeliverySpeed {
  id: "express" | "standard" | "window";
  name: string;
  detail: string;
  fee: number;
  /** Minutes added to (or shaved off) the basket ETA. */
  shift: number;
}

export const SPEEDS: DeliverySpeed[] = [
  {
    id: "express",
    name: "Express",
    detail: "A dedicated courier leaves the moment it is packed",
    fee: 24,
    shift: -14,
  },
  {
    id: "standard",
    name: "Standard",
    detail: "Consolidated with other orders on the same route",
    fee: DELIVERY_FEE,
    shift: 0,
  },
  {
    id: "window",
    name: "Later Tonight",
    detail: "Pick a two-hour window after 9pm",
    fee: 8,
    shift: 95,
  },
];
