import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { productsByCategory, productsByOccasion } from "../data/catalog";
import { CATEGORIES_BY_ID, OCCASIONS_BY_ID, STORES_BY_ID } from "../data/stores";
import type { CategoryId, OccasionId, Product } from "../data/types";
import { storeEta } from "../lib/delivery";
import { inventory } from "../lib/inventory";
import { useInventoryVersion } from "../lib/useInventory";
import { ProductCard } from "../components/product";
import { TopBar } from "../components/Chrome";

type Sort = "eta" | "price-low" | "price-high" | "heat";

function sortProducts(list: Product[], sort: Sort) {
  const copy = [...list];
  switch (sort) {
    case "price-low":
      return copy.sort((a, b) => a.price - b.price);
    case "price-high":
      return copy.sort((a, b) => b.price - a.price);
    case "heat":
      return copy.sort((a, b) => b.heat - a.heat);
    default:
      return copy.sort(
        (a, b) => storeEta(STORES_BY_ID[a.storeId]).low - storeEta(STORES_BY_ID[b.storeId]).low,
      );
  }
}

export function CategoryScreen() {
  const { categoryId = "" } = useParams();
  const category = CATEGORIES_BY_ID[categoryId];
  return category ? (
    <Listing
      kicker="Category"
      title={category.name}
      blurb={`Every ${category.name.toLowerCase()} on a rail within delivery range tonight.`}
      source={() => productsByCategory(categoryId as CategoryId)}
    />
  ) : (
    <Navigate to="/shop" replace />
  );
}

export function OccasionScreen() {
  const { occasionId = "" } = useParams();
  const occasion = OCCASIONS_BY_ID[occasionId];
  return occasion ? (
    <Listing
      kicker={occasion.kicker}
      title={occasion.name}
      blurb={occasion.blurb}
      hue={[occasion.hue2, occasion.hue]}
      source={() => productsByOccasion(occasionId as OccasionId)}
    />
  ) : (
    <Navigate to="/shop" replace />
  );
}

function Listing({
  kicker,
  title,
  blurb,
  source,
  hue,
}: {
  kicker: string;
  title: string;
  blurb: string;
  source: () => Product[];
  hue?: [string, string];
}) {
  const [sort, setSort] = useState<Sort>("eta");
  const [inStockOnly, setInStockOnly] = useState(true);
  useInventoryVersion();

  const items = useMemo(() => {
    const base = source().filter((p) => (inStockOnly ? inventory.inStock(p.id) : true));
    return sortProducts(base, sort);
  }, [source, sort, inStockOnly]);

  return (
    <div className="screen">
      <TopBar title={kicker} transparent={Boolean(hue)} />
      <header
        className={hue ? "listing-hero listing-hero-color" : "listing-hero"}
        style={hue ? { background: `linear-gradient(158deg, ${hue[0]}, ${hue[1]})` } : undefined}
      >
        <p className="eyebrow">{kicker}</p>
        <h1 className="display d1">{title}</h1>
        <p className="listing-blurb">{blurb}</p>
      </header>

      <div className="rail filters">
        {(
          [
            ["eta", "Fastest"],
            ["heat", "Most wanted"],
            ["price-low", "Price ↑"],
            ["price-high", "Price ↓"],
          ] as [Sort, string][]
        ).map(([id, label]) => (
          <button key={id} className="chip" data-on={sort === id} onClick={() => setSort(id)}>
            {label}
          </button>
        ))}
        <button className="chip" data-on={inStockOnly} onClick={() => setInStockOnly((v) => !v)}>
          In stock
        </button>
      </div>

      <p className="pad listing-count meta">{items.length} pieces</p>

      <div className="grid-2">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!items.length && <p className="empty">Nothing available in this edit tonight.</p>}
    </div>
  );
}
