import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { productsByStore } from "../data/catalog";
import { CATEGORIES_BY_ID, STORES_BY_ID } from "../data/stores";
import { isOpenNow, minutesToCutoff, storeEta } from "../lib/delivery";
import { clockTime } from "../lib/format";
import { inventory } from "../lib/inventory";
import { useInventoryVersion } from "../lib/useInventory";
import { ProductCard } from "../components/product";
import { TopBar } from "../components/Chrome";
import { IconClock, IconPin, IconStar } from "../components/icons";

export default function Store() {
  const { storeId = "" } = useParams();
  const store = STORES_BY_ID[storeId];
  const [category, setCategory] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(true);
  useInventoryVersion();

  const all = useMemo(() => (store ? productsByStore(store.id) : []), [store]);
  const shown = all.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (!inStockOnly || inventory.inStock(p.id)),
  );

  if (!store) return <Navigate to="/shop" replace />;

  const eta = storeEta(store);
  const open = isOpenNow(store);
  const cutoff = minutesToCutoff(store);
  const cats = [...new Set(all.map((p) => p.category))];

  return (
    <div className="screen">
      <TopBar title={store.neighborhood} transparent />
      <header
        className="store-hero"
        style={{ background: `linear-gradient(158deg, ${store.hue2}, ${store.hue})` }}
      >
        <p className="eyebrow store-hero-kicker">{store.tagline}</p>
        <h1 className="display d1">{store.name}</h1>
        <div className="store-hero-meta">
          <span>
            <IconPin size={13} /> {store.distanceKm} km
          </span>
          <span>
            <IconStar /> {store.rating}
          </span>
          <span>
            <IconClock size={13} /> {open ? `${eta.low}–${eta.high} min` : "Closed"}
          </span>
        </div>
      </header>

      <div className="store-bar pad">
        {open ? (
          <>
            <i className="live-dot" />
            <span className="label">
              Delivers by {clockTime(eta.to)} ·{" "}
              {cutoff < 120 ? `last orders in ${cutoff} min` : `open until ${store.closesAt}`}
            </span>
          </>
        ) : (
          <span className="label">Closed — opens again tomorrow at 11:00 AM</span>
        )}
      </div>

      <p className="pad store-about">{store.about}</p>

      <div className="rail filters">
        <button className="chip" data-on={category === "all"} onClick={() => setCategory("all")}>
          All
        </button>
        {cats.map((c) => (
          <button key={c} className="chip" data-on={category === c} onClick={() => setCategory(c)}>
            {CATEGORIES_BY_ID[c].name}
          </button>
        ))}
        <button className="chip" data-on={inStockOnly} onClick={() => setInStockOnly((v) => !v)}>
          In stock
        </button>
      </div>

      <div className="grid-2">
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} showStore={false} />
        ))}
      </div>
      {!shown.length && <p className="empty">Nothing left in that category tonight.</p>}
    </div>
  );
}
