/**
 * "Build My Look" — the stylist.
 *
 * Takes a brief (occasion, vibe, budget, sizes, how fast) and assembles whole
 * outfits out of what is genuinely on a rail within delivery range right now.
 * Nothing is proposed that cannot be delivered tonight in the shopper's size.
 */
import { PRODUCTS } from "../data/catalog";
import { CATEGORIES_BY_ID, STORES_BY_ID } from "../data/stores";
import type { CategoryId, OccasionId, Product, SlotId, Vibe } from "../data/types";
import { basketEta, isOpenNow, storeEta } from "./delivery";
import { inventory } from "./inventory";

export interface Brief {
  occasion: OccasionId;
  vibe: Vibe;
  budget: number;
  sizes: { top: string; bottom: string; shoe: string };
  /** How much time there is before you need to be dressed. */
  urgency: "asap" | "tonight" | "flexible";
  /** Optional finishing pieces. */
  extras: SlotId[];
}

export interface LookPiece {
  product: Product;
  size: string;
  /** false when we had to move a size to keep it deliverable tonight */
  exact: boolean;
  slot: SlotId;
}

export interface Look {
  id: string;
  title: string;
  line: string;
  pieces: LookPiece[];
  /** One line of styling, written against the pieces that actually landed. */
  note: string;
  total: number;
  storeIds: string[];
  etaLow: number;
  etaHigh: number;
  /** 0–100, how well it answers the brief */
  match: number;
}

export const DEFAULT_BRIEF: Brief = {
  occasion: "dinner",
  vibe: "noir",
  budget: 900,
  sizes: { top: "M", bottom: "M", shoe: "38" },
  urgency: "tonight",
  extras: ["jewelry"],
};

/* ── Sizing ─────────────────────────────────────────────────────────── */

function wantedSize(p: Product, brief: Brief) {
  const scale = CATEGORIES_BY_ID[p.category].sizeScale;
  if (scale.length === 1) return scale[0];
  if (p.category === "shoes") return brief.sizes.shoe;
  if (p.category === "bottoms") return brief.sizes.bottom;
  return brief.sizes.top;
}

/** The closest size still on the shelf, preferring an exact match. */
export function resolveSize(p: Product, brief: Brief) {
  const scale = CATEGORIES_BY_ID[p.category].sizeScale;
  const want = wantedSize(p, brief);
  if (inventory.available(p.id, want) > 0) return { size: want, exact: true };
  const i = scale.indexOf(want);
  if (i < 0) return null;
  for (let d = 1; d < scale.length; d++) {
    for (const j of [i + d, i - d]) {
      if (j >= 0 && j < scale.length && inventory.available(p.id, scale[j]) > 0) {
        return { size: scale[j], exact: false };
      }
    }
  }
  return null;
}

/* ── Scoring ────────────────────────────────────────────────────────── */

function speedScore(p: Product, brief: Brief) {
  const store = STORES_BY_ID[p.storeId];
  if (!store) return 0;
  const eta = storeEta(store).low;
  const weight = brief.urgency === "asap" ? 0.09 : brief.urgency === "tonight" ? 0.04 : 0.015;
  return -eta * weight;
}

function score(p: Product, brief: Brief) {
  let s = 0;
  if (p.occasions.includes(brief.occasion)) s += 4;
  if (p.vibes.includes(brief.vibe)) s += 3.2;
  const occ = OCCASION_VIBES[brief.occasion] ?? [];
  s += p.vibes.filter((v) => occ.includes(v)).length * 0.7;
  s += p.heat * 0.8;
  if (p.isExclusive) s += 0.5;
  if (p.isNew) s += 0.3;
  s += speedScore(p, brief);
  return s;
}

const OCCASION_VIBES: Record<OccasionId, Vibe[]> = {
  dinner: ["neutral", "noir"],
  "night-out": ["noir", "metallic", "bold"],
  date: ["romantic", "neutral"],
  gallery: ["noir", "neutral", "bold"],
  "wedding-guest": ["romantic", "bold", "neutral"],
  "work-drinks": ["neutral", "noir"],
  concert: ["bold", "metallic", "noir"],
};

/** Every product that can be on a doorstep tonight, in a size that fits. */
export function eligible(brief: Brief, category?: CategoryId) {
  return PRODUCTS.filter((p) => {
    if (category && p.category !== category) return false;
    const store = STORES_BY_ID[p.storeId];
    if (!store || !isOpenNow(store)) return false;
    return resolveSize(p, brief) !== null;
  })
    .map((p) => ({ p, s: score(p, brief) }))
    .sort((a, b) => b.s - a.s);
}

function toPiece(p: Product, brief: Brief, slot: SlotId): LookPiece | null {
  const size = resolveSize(p, brief);
  return size ? { product: p, size: size.size, exact: size.exact, slot } : null;
}

/* ── Assembly ───────────────────────────────────────────────────────── */

/** Small deterministic PRNG so a set of looks is stable until regenerated. */
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const TITLES: Record<Vibe, string[]> = {
  noir: ["The Long Way Home", "After Hours", "Low Light"],
  neutral: ["Quiet Room", "Off Duty, Formally", "The Understatement"],
  bold: ["Loud Enough", "Front Left", "Colour Theory"],
  metallic: ["Reflective Surface", "Chrome Hour", "Catching Light"],
  romantic: ["Soft Focus", "The Slow Yes", "Something Borrowed"],
};

const LINES: Record<SlotId, string> = {
  anchor: "the piece everything answers to",
  layer: "for the walk between places",
  shoes: "vetted for standing",
  bag: "holds a phone and a key",
  jewelry: "one loud detail",
};

const OCCASION_NOTE: Record<OccasionId, string> = {
  dinner: "Built to read across a table rather than a room",
  "night-out": "Engineered for a dark room and a long night",
  date: "Soft at first glance, sharp on the second",
  gallery: "Architectural enough to hold its own against the work",
  "wedding-guest": "Colour that behaves through a ceremony and a dance floor",
  "work-drinks": "Sharp at six, loosened by nine",
  concert: "Made to be stood up in for three hours",
};

/** A line of styling written against the pieces that actually landed. */
function stylistNote(pieces: LookPiece[], brief: Brief) {
  const shoe = pieces.find((p) => p.slot === "shoes");
  const jewel = pieces.find((p) => p.slot === "jewelry");
  const bag = pieces.find((p) => p.slot === "bag");
  const layer = pieces.find((p) => p.slot === "layer");
  const anchor = pieces.find((p) => p.slot === "anchor");

  const parts = [OCCASION_NOTE[brief.occasion]];
  if (anchor) parts.push(`anchored on the ${anchor.product.colorway.name.toLowerCase()} ${short(anchor.product)}`);
  if (shoe) parts.push(`finished with the ${short(shoe.product)}`);
  else if (jewel) parts.push(`finished with the ${short(jewel.product)}`);
  if (layer) parts.push(`take the ${short(layer.product)} for the walk between places`);
  else if (bag && !shoe) parts.push(`the ${short(bag.product)} carries the rest`);
  return `${parts.slice(0, 3).join(", ")}.`;
}

const short = (p: Product) => p.name.split(",")[0].toLowerCase();

function pieceLine(pieces: LookPiece[]) {
  const anchor = pieces.find((x) => x.slot === "anchor");
  const stores = new Set(pieces.map((x) => x.product.storeId));
  const where =
    stores.size === 1
      ? `all from ${STORES_BY_ID[[...stores][0]].name}`
      : `pulled from ${stores.size} boutiques`;
  return anchor
    ? `${anchor.product.colorway.name.toLowerCase()} ${anchor.product.category === "dresses" ? "dress" : "separates"}, ${where}`
    : where;
}

interface Assembly {
  pieces: LookPiece[];
  used: Set<string>;
}

function fill(
  assembly: Assembly,
  brief: Brief,
  category: CategoryId,
  slot: SlotId,
  budgetLeft: number,
  pool: { p: Product; s: number }[],
  jitter: () => number,
) {
  const options = pool.filter(
    (c) =>
      c.p.category === category &&
      !assembly.used.has(c.p.id) &&
      c.p.price <= budgetLeft,
  );
  if (!options.length) return 0;
  // Take from the top of the ranking, with a little taste-variance.
  const idx = Math.min(options.length - 1, Math.floor(jitter() * Math.min(3, options.length)));
  const piece = toPiece(options[idx].p, brief, slot);
  if (!piece) return 0;
  assembly.pieces.push(piece);
  assembly.used.add(piece.product.id);
  return piece.product.price;
}

export function buildLooks(brief: Brief, seed = 1, count = 3): Look[] {
  const pool = eligible(brief);
  const jitter = rng(seed);
  const looks: Look[] = [];
  const usedAnchors = new Set<string>();

  for (let n = 0; n < count * 3 && looks.length < count; n++) {
    const assembly: Assembly = { pieces: [], used: new Set(usedAnchors) };
    let left = brief.budget;

    // Silhouette: alternate between a dress and separates so the set has range.
    const wantsDress = n % 2 === 0;
    const dressPool = pool.filter((c) => c.p.category === "dresses");
    const useDress = wantsDress ? dressPool.length > 0 : dressPool.length > 0 && jitter() < 0.25;

    if (useDress) {
      left -= fill(assembly, brief, "dresses", "anchor", left, pool, jitter);
    } else {
      left -= fill(assembly, brief, "tops", "anchor", left, pool, jitter);
      left -= fill(assembly, brief, "bottoms", "anchor", left, pool, jitter);
    }
    if (!assembly.pieces.length) break;

    // Shoes get a generous slice; a look without them isn't a look.
    left -= fill(assembly, brief, "shoes", "shoes", left, pool, jitter);

    if (brief.extras.includes("bag")) left -= fill(assembly, brief, "bags", "bag", left, pool, jitter);
    if (brief.extras.includes("jewelry"))
      left -= fill(assembly, brief, "jewelry", "jewelry", left, pool, jitter);
    if (brief.extras.includes("layer"))
      left -= fill(assembly, brief, "outerwear", "layer", left, pool, jitter);

    const anchors = assembly.pieces.filter((p) => p.slot === "anchor");
    if (!anchors.length) continue;
    const signature = anchors.map((a) => a.product.id).sort().join("+");
    if (looks.some((l) => l.pieces.filter((p) => p.slot === "anchor").map((p) => p.product.id).sort().join("+") === signature))
      continue;
    anchors.forEach((a) => usedAnchors.add(a.product.id));

    const storeIds = [...new Set(assembly.pieces.map((p) => p.product.storeId))];
    const eta = basketEta(storeIds);
    const total = assembly.pieces.reduce((sum, p) => sum + p.product.price, 0);
    const titles = TITLES[brief.vibe];

    looks.push({
      id: `look-${seed}-${looks.length}`,
      title: titles[looks.length % titles.length],
      line: pieceLine(assembly.pieces),
      note: stylistNote(assembly.pieces, brief),
      pieces: assembly.pieces,
      total,
      storeIds,
      etaLow: eta.low,
      etaHigh: eta.high,
      match: matchScore(assembly.pieces, brief),
    });
  }

  return looks;
}

function matchScore(pieces: LookPiece[], brief: Brief) {
  if (!pieces.length) return 0;
  const occ = pieces.filter((p) => p.product.occasions.includes(brief.occasion)).length / pieces.length;
  const vibe = pieces.filter((p) => p.product.vibes.includes(brief.vibe)).length / pieces.length;
  const sized = pieces.filter((p) => p.exact).length / pieces.length;
  return Math.round((occ * 0.45 + vibe * 0.35 + sized * 0.2) * 100);
}

/** Ranked stand-ins for one slot of a look, excluding what is already worn. */
export function alternatives(look: Look, slot: SlotId, brief: Brief) {
  const current = look.pieces.find((p) => p.slot === slot && p.product.category);
  if (!current) return [];
  const worn = new Set(look.pieces.map((p) => p.product.id));
  return eligible(brief, current.product.category)
    .filter((c) => !worn.has(c.p.id))
    .slice(0, 8)
    .map((c) => c.p);
}

export function slotOf(category: CategoryId): SlotId {
  return CATEGORIES_BY_ID[category]?.slot ?? "anchor";
}

export const SLOT_CAPTION = LINES;
