import { useMemo, useState } from "react";
import { PRODUCTS } from "../data/catalog";
import { CATEGORIES, OCCASIONS, STORES, STORES_BY_ID } from "../data/stores";
import { isOpenNow, storeEta } from "../lib/delivery";
import { inventory } from "../lib/inventory";
import { useInventoryVersion } from "../lib/useInventory";
import { CategoryCard, OccasionCard, StoreCard } from "../components/browse";
import { ProductCard } from "../components/product";
import { TopBar } from "../components/Chrome";

type Tab = "stores" | "categories" | "occasions" | "all";
type Sort = "eta" | "distance" | "rating";

export default function Shop() {
  const [tab, setTab] = useState<Tab>("stores");
  const [sort, setSort] = useState<Sort>("eta");
  const [openOnly, setOpenOnly] = useState(true);
  useInventoryVersion();

  const stores = useMemo(() => {
    const list = STORES.filter((s) => (openOnly ? isOpenNow(s) : true));
    return [...list].sort((a, b) => {
      if (sort === "distance") return a.distanceKm - b.distanceKm;
      if (sort === "rating") return b.rating - a.rating;
      return storeEta(a).low - storeEta(b).low;
    });
  }, [sort, openOnly]);

  // Recomputed as the floor moves, so a sold-out piece leaves the grid.
  const everything = PRODUCTS.filter((p) => inventory.inStock(p.id)).sort(
    (a, b) => storeEta(STORES_BY_ID[a.storeId]).low - storeEta(STORES_BY_ID[b.storeId]).low,
  );

  return (
    <div className="screen">
      <TopBar back={false} title="Shop" />
      <div className="pad shop-head">
        <h1 className="display d2">
          Everything on a rail
          <br />
          <span className="italic">within reach</span>
        </h1>
        <p className="meta shop-sub">
          {STORES.filter((s) => isOpenNow(s)).length} boutiques open · {everything.length} pieces in
          stock right now
        </p>
      </div>

      <div className="segmented pad">
        {(
          [
            ["stores", "Stores"],
            ["categories", "Categories"],
            ["occasions", "Occasions"],
            ["all", "Everything"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} className="seg" data-on={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "stores" && (
        <>
          <div className="rail filters">
            {(
              [
                ["eta", "Fastest"],
                ["distance", "Closest"],
                ["rating", "Top rated"],
              ] as [Sort, string][]
            ).map(([id, label]) => (
              <button key={id} className="chip" data-on={sort === id} onClick={() => setSort(id)}>
                {label}
              </button>
            ))}
            <button className="chip" data-on={openOnly} onClick={() => setOpenOnly((v) => !v)}>
              Open now
            </button>
          </div>
          <div className="list pad">
            {stores.map((s) => (
              <StoreCard key={s.id} store={s} variant="row" />
            ))}
            {!stores.length && <p className="empty">Every boutique has closed for the night.</p>}
          </div>
        </>
      )}

      {tab === "categories" && (
        <div className="cat-grid pad">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      )}

      {tab === "occasions" && (
        <div className="occ-grid pad">
          {OCCASIONS.map((o) => (
            <OccasionCard key={o.id} occasion={o} wide />
          ))}
        </div>
      )}

      {tab === "all" && (
        <div className="grid-2">
          {everything.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
