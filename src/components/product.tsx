import { Link } from "react-router-dom";
import { STORES_BY_ID } from "../data/stores";
import type { Product } from "../data/types";
import { storeEta } from "../lib/delivery";
import { money } from "../lib/format";
import { useSizes } from "../lib/useInventory";
import { GarmentPlate } from "./GarmentPlate";

export function StockLine({ productId, verbose = false }: { productId: string; verbose?: boolean }) {
  const sizes = useSizes(productId);
  const total = sizes.reduce((n, s) => n + s.left, 0);
  const open = sizes.filter((s) => s.left > 0);

  if (total === 0) return <span className="stock stock-out">Sold out tonight</span>;
  if (total === 1) {
    return (
      <span className="stock stock-low">
        <i className="live-dot" />
        Last one — {open[0].size}
      </span>
    );
  }
  if (total <= 3) {
    return (
      <span className="stock stock-low">
        <i className="live-dot" />
        {total} left {verbose ? `across ${open.length} size${open.length > 1 ? "s" : ""}` : ""}
      </span>
    );
  }
  return (
    <span className="stock">
      {verbose ? `On the floor in ${open.length} sizes` : `${open.length} sizes available`}
    </span>
  );
}

export function ProductCard({
  product,
  variant = "grid",
  showStore = true,
}: {
  product: Product;
  variant?: "grid" | "rail" | "row";
  showStore?: boolean;
}) {
  const sizes = useSizes(product.id);
  const soldOut = sizes.every((s) => s.left === 0);
  const store = STORES_BY_ID[product.storeId];
  const eta = storeEta(store);

  if (variant === "row") {
    return (
      <Link to={`/product/${product.id}`} className="p-row">
        <div className="p-row-plate">
          <GarmentPlate category={product.category} colorway={product.colorway} ratio="1 / 1" dim={soldOut} />
        </div>
        <div className="p-row-body">
          <p className="eyebrow">{product.brand}</p>
          <p className="p-name">{product.name}</p>
          <p className="price">{money(product.price)}</p>
          <StockLine productId={product.id} />
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${product.id}`} className="p-card" data-variant={variant}>
      <div className="p-card-plate">
        <GarmentPlate category={product.category} colorway={product.colorway} dim={soldOut} />
        <div className="p-card-tags">
          {soldOut ? (
            <span className="tag tag-ink">Sold out</span>
          ) : (
            <>
              {product.isExclusive && <span className="tag">Exclusive</span>}
              {product.isNew && !product.isExclusive && <span className="tag">New in</span>}
            </>
          )}
        </div>
        <span className="p-card-eta num">{eta.low}′</span>
      </div>
      <div className="p-card-body">
        <p className="eyebrow">{showStore ? store.name : product.brand}</p>
        <p className="p-name">{product.name}</p>
        <div className="p-card-foot">
          <span className="price">{money(product.price)}</span>
          <StockLine productId={product.id} />
        </div>
      </div>
    </Link>
  );
}

export function SizePicker({
  productId,
  value,
  onChange,
}: {
  productId: string;
  value: string | null;
  onChange: (size: string) => void;
}) {
  const sizes = useSizes(productId);
  return (
    <div className="sizes" role="radiogroup" aria-label="Size">
      {sizes.map((s) => (
        <button
          key={s.size}
          role="radio"
          aria-checked={value === s.size}
          disabled={s.left === 0}
          onClick={() => onChange(s.size)}
          className="size"
          data-on={value === s.size}
          data-out={s.left === 0}
        >
          <span className="size-label">{s.size}</span>
          <span className="size-left">
            {s.left === 0 ? "gone" : s.left === 1 ? "last" : `${s.left} left`}
          </span>
        </button>
      ))}
    </div>
  );
}
