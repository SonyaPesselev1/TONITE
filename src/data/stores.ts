import type { Category, Occasion, Store } from "./types";

export const STORES: Store[] = [
  {
    id: "atelier-nord",
    name: "Atelier Nord",
    neighborhood: "SoHo",
    distanceKm: 1.2,
    prepMinutes: 22,
    tagline: "Scandinavian tailoring, cut sharp",
    about:
      "A single-room atelier on Crosby. Nord keeps four of everything and never restocks a season — what is on the rail tonight is what exists.",
    hue: "#1b1b1e",
    hue2: "#3a3a40",
    closesAt: "9:00 PM",
    rating: 4.9,
    categories: ["dresses", "tops", "bottoms", "outerwear"],
  },
  {
    id: "maison-lune",
    name: "Maison Lune",
    neighborhood: "West Village",
    distanceKm: 2.4,
    prepMinutes: 28,
    tagline: "Evening wear for the long way home",
    about:
      "Bias-cut slips, liquid satins and one very good coat. Lune's stylists pack every order with a hand-written wear note.",
    hue: "#2a2338",
    hue2: "#4b3f63",
    closesAt: "10:00 PM",
    rating: 4.8,
    categories: ["dresses", "tops", "shoes", "jewelry"],
  },
  {
    id: "prova",
    name: "PROVA",
    neighborhood: "Lower East Side",
    distanceKm: 3.1,
    prepMinutes: 18,
    tagline: "Loud things, made quietly",
    about:
      "Colour-forward and unbothered. PROVA works with six independent designers and sells the samples first.",
    hue: "#7a2118",
    hue2: "#c4442b",
    closesAt: "11:00 PM",
    rating: 4.7,
    categories: ["dresses", "tops", "bottoms", "bags"],
  },
  {
    id: "the-annex",
    name: "The Annex",
    neighborhood: "Tribeca",
    distanceKm: 1.8,
    prepMinutes: 25,
    tagline: "Archive denim & heavy cotton",
    about:
      "Two floors of workwear that has been washed properly. Everything is measured on the body before it ships.",
    hue: "#243244",
    hue2: "#4a637f",
    closesAt: "8:30 PM",
    rating: 4.6,
    categories: ["tops", "bottoms", "outerwear", "shoes"],
  },
  {
    id: "casa-verde",
    name: "Casa Verde",
    neighborhood: "Nolita",
    distanceKm: 1.5,
    prepMinutes: 20,
    tagline: "Soft power, softer fabrics",
    about:
      "Linen, silk-cotton and a house dye garden. Casa Verde's colours shift a shade each season and never come back.",
    hue: "#2f4034",
    hue2: "#5d7a5f",
    closesAt: "9:30 PM",
    rating: 4.8,
    categories: ["dresses", "tops", "bottoms", "bags"],
  },
  {
    id: "hall-of-mirrors",
    name: "Hall of Mirrors",
    neighborhood: "NoHo",
    distanceKm: 2.9,
    prepMinutes: 30,
    tagline: "Chrome, crystal, consequence",
    about:
      "Party dressing with a metallic bias. The back room holds one-off jewellery from a Brooklyn silversmith.",
    hue: "#3a3a3f",
    hue2: "#8e8f96",
    closesAt: "11:30 PM",
    rating: 4.7,
    categories: ["dresses", "tops", "jewelry", "bags"],
  },
  {
    id: "corso",
    name: "Corso",
    neighborhood: "Flatiron",
    distanceKm: 3.6,
    prepMinutes: 26,
    tagline: "Italian shoes, kept in stock",
    about:
      "A footwear-only floor with a proper fitting bench. Corso ships with the box, the bag and the horn.",
    hue: "#432a1d",
    hue2: "#7d5539",
    closesAt: "8:00 PM",
    rating: 4.9,
    categories: ["shoes", "bags"],
  },
  {
    id: "studio-ferro",
    name: "Studio Ferro",
    neighborhood: "Greenpoint",
    distanceKm: 5.2,
    prepMinutes: 16,
    tagline: "Hardware for the body",
    about:
      "A metal studio that started making earrings and never stopped. Everything is cast within twenty feet of the till.",
    hue: "#2b2b2b",
    hue2: "#6f6a5c",
    closesAt: "9:00 PM",
    rating: 4.8,
    categories: ["jewelry", "bags"],
  },
];

export const STORES_BY_ID: Record<string, Store> = Object.fromEntries(
  STORES.map((s) => [s.id, s]),
);

export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];
export const SHOE_SIZES = ["36", "37", "38", "39", "40", "41"];
export const ONE_SIZE = ["OS"];

export const CATEGORIES: Category[] = [
  { id: "dresses", name: "Dresses", slot: "anchor", sizeScale: APPAREL_SIZES },
  { id: "tops", name: "Tops", slot: "anchor", sizeScale: APPAREL_SIZES },
  { id: "bottoms", name: "Bottoms", slot: "anchor", sizeScale: APPAREL_SIZES },
  { id: "outerwear", name: "Outerwear", slot: "layer", sizeScale: APPAREL_SIZES },
  { id: "shoes", name: "Shoes", slot: "shoes", sizeScale: SHOE_SIZES },
  { id: "bags", name: "Bags", slot: "bag", sizeScale: ONE_SIZE },
  { id: "jewelry", name: "Jewelry", slot: "jewelry", sizeScale: ONE_SIZE },
];

export const CATEGORIES_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export const OCCASIONS: Occasion[] = [
  {
    id: "dinner",
    name: "Dinner Reservation",
    kicker: "8:30, somewhere with a tablecloth",
    blurb: "Quiet luxury that photographs well under warm light.",
    vibes: ["neutral", "noir"],
    hue: "#3b2f2a",
    hue2: "#7a6355",
  },
  {
    id: "night-out",
    name: "Night Out",
    kicker: "Doors at eleven",
    blurb: "Built to move, engineered to be seen from across a dark room.",
    vibes: ["noir", "metallic", "bold"],
    hue: "#191922",
    hue2: "#494960",
  },
  {
    id: "date",
    name: "First Date",
    kicker: "Wine bar, low ceilings",
    blurb: "Softness with a sharp edge. Nothing you have to keep adjusting.",
    vibes: ["romantic", "neutral"],
    hue: "#4a2b34",
    hue2: "#8d5b66",
  },
  {
    id: "gallery",
    name: "Gallery Opening",
    kicker: "Free wine, serious lighting",
    blurb: "Architectural shapes, restrained palette, one loud detail.",
    vibes: ["noir", "neutral", "bold"],
    hue: "#2c2c2e",
    hue2: "#6d6d72",
  },
  {
    id: "wedding-guest",
    name: "Wedding Guest",
    kicker: "Six p.m., garden ceremony",
    blurb: "Colour that behaves, hems that survive grass.",
    vibes: ["romantic", "bold", "neutral"],
    hue: "#3c4a33",
    hue2: "#7d9068",
  },
  {
    id: "work-drinks",
    name: "Work Drinks",
    kicker: "Desk to bar, no detour",
    blurb: "Tailoring you can loosen. Reads sharp at six, easy at nine.",
    vibes: ["neutral", "noir"],
    hue: "#2b3440",
    hue2: "#63748a",
  },
  {
    id: "concert",
    name: "Concert",
    kicker: "General admission, front left",
    blurb: "Hardware, texture and shoes that forgive standing.",
    vibes: ["bold", "metallic", "noir"],
    hue: "#3a1f2e",
    hue2: "#7c3f5e",
  },
];

export const OCCASIONS_BY_ID: Record<string, Occasion> = Object.fromEntries(
  OCCASIONS.map((o) => [o.id, o]),
);
