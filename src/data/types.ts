export type CategoryId =
  | "dresses"
  | "tops"
  | "bottoms"
  | "outerwear"
  | "shoes"
  | "bags"
  | "jewelry";

export type OccasionId =
  | "dinner"
  | "gallery"
  | "wedding-guest"
  | "night-out"
  | "date"
  | "work-drinks"
  | "concert";

export type Vibe = "noir" | "neutral" | "bold" | "metallic" | "romantic";

export type SlotId = "anchor" | "layer" | "shoes" | "bag" | "jewelry";

export interface Colorway {
  name: string;
  /** Two-stop swatch used to render the garment plate. */
  from: string;
  to: string;
  /** Fabric treatment for the plate. */
  finish?: "matte" | "sheen" | "metal";
}

export interface Variant {
  size: string;
  /** Baseline units on the shop floor at open. Live stock lives in the inventory store. */
  stock: number;
}

export interface Product {
  id: string;
  storeId: string;
  brand: string;
  name: string;
  category: CategoryId;
  price: number;
  colorway: Colorway;
  occasions: OccasionId[];
  vibes: Vibe[];
  note: string;
  variants: Variant[];
  /** Editorial flags. */
  isExclusive?: boolean;
  isNew?: boolean;
  /** 0–1, used for the "moving fast" signal and the live-sell simulation. */
  heat: number;
}

export interface Store {
  id: string;
  name: string;
  neighborhood: string;
  /** Straight-line distance from the shopper, km. */
  distanceKm: number;
  /** Minutes a stylist needs to pull, steam and pack an order. */
  prepMinutes: number;
  tagline: string;
  about: string;
  hue: string;
  hue2: string;
  closesAt: string;
  rating: number;
  categories: CategoryId[];
}

export interface Occasion {
  id: OccasionId;
  name: string;
  kicker: string;
  blurb: string;
  vibes: Vibe[];
  hue: string;
  hue2: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  slot: SlotId;
  sizeScale: string[];
}
