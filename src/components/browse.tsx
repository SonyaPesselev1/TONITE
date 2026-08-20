import { Link } from "react-router-dom";
import type { Category, Occasion, Store } from "../data/types";
import { isOpenNow, minutesToCutoff, storeEta } from "../lib/delivery";
import { clockTime } from "../lib/format";
import { productsByCategory } from "../data/catalog";
import { GarmentPlate } from "./GarmentPlate";
import { IconClock, IconStar } from "./icons";

export function EtaChip({
  minutes,
  arriveBy,
  tone = "quiet",
}: {
  minutes: number;
  arriveBy?: Date;
  tone?: "quiet" | "ink";
}) {
  return (
    <span className="eta-chip" data-tone={tone}>
      <IconClock size={13} />
      <span className="num">{minutes} min</span>
      {arriveBy && <span className="eta-by">by {clockTime(arriveBy)}</span>}
    </span>
  );
}

export function StoreCard({ store, variant = "rail" }: { store: Store; variant?: "rail" | "row" }) {
  const eta = storeEta(store);
  const open = isOpenNow(store);
  const cutoff = minutesToCutoff(store);

  if (variant === "row") {
    return (
      <Link to={`/store/${store.id}`} className="s-row">
        <span
          className="s-row-swatch"
          style={{ background: `linear-gradient(150deg, ${store.hue2}, ${store.hue})` }}
        />
        <span className="s-row-body">
          <span className="s-row-top">
            <span className="display d4">{store.name}</span>
            <span className="price">{open ? `${eta.low}–${eta.high} min` : "Closed"}</span>
          </span>
          <span className="meta">
            {store.neighborhood} · {store.distanceKm} km · <IconStar /> {store.rating}
          </span>
          <span className="meta s-row-note">
            {open
              ? cutoff < 60
                ? `Last orders in ${cutoff} min`
                : `Open until ${store.closesAt}`
              : `Opens tomorrow`}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`/store/${store.id}`}
      className="s-card"
      style={{ background: `linear-gradient(155deg, ${store.hue2} 0%, ${store.hue} 78%)` }}
    >
      <div className="s-card-top">
        <span className="eyebrow s-card-hood">{store.neighborhood}</span>
        {open && cutoff < 60 && <span className="tag tag-signal">Closing {store.closesAt}</span>}
      </div>
      <div className="s-card-bottom">
        <p className="display d3">{store.name}</p>
        <p className="s-card-tag">{store.tagline}</p>
        <p className="s-card-meta num">
          {open ? `${eta.low}–${eta.high} min` : "Closed"} · {store.distanceKm} km
        </p>
      </div>
    </Link>
  );
}

export function OccasionCard({ occasion, wide = false }: { occasion: Occasion; wide?: boolean }) {
  return (
    <Link
      to={`/occasion/${occasion.id}`}
      className="o-card"
      data-wide={wide || undefined}
      style={{ background: `linear-gradient(160deg, ${occasion.hue2}, ${occasion.hue})` }}
    >
      <span className="eyebrow o-card-kicker">{occasion.kicker}</span>
      <span className="display d3">{occasion.name}</span>
      <span className="o-card-blurb">{occasion.blurb}</span>
    </Link>
  );
}

const luminance = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

export function CategoryCard({ category }: { category: Category }) {
  // Pick the deepest colourway in the category so the tile has contrast.
  const sample = [...productsByCategory(category.id)].sort(
    (a, b) => luminance(a.colorway.from) - luminance(b.colorway.from),
  )[0];
  return (
    <Link to={`/category/${category.id}`} className="c-card">
      <div className="c-card-plate">
        {sample && <GarmentPlate category={category.id} colorway={sample.colorway} ratio="1 / 1" />}
      </div>
      <span className="label">{category.name}</span>
    </Link>
  );
}
