import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PRODUCTS, PRODUCTS_BY_ID } from "../data/catalog";
import { CATEGORIES_BY_ID, OCCASIONS_BY_ID, STORES_BY_ID } from "../data/stores";
import { isOpenNow, minutesToCutoff, storeEta } from "../lib/delivery";
import { money, timeWindow } from "../lib/format";
import { inventory, viewersFor } from "../lib/inventory";
import { useInventoryVersion, useSizes } from "../lib/useInventory";
import { GarmentPlate } from "../components/GarmentPlate";
import { ProductCard, SizePicker } from "../components/product";
import { TopBar, Toast } from "../components/Chrome";
import { IconChevron, IconClock, IconCheck } from "../components/icons";
import { useCart } from "../state/CartContext";
import { useProfile } from "../state/ProfileContext";

export default function ProductScreen() {
  const { productId = "" } = useParams();
  const product = PRODUCTS_BY_ID[productId];
  const navigate = useNavigate();
  const { add, has } = useCart();
  const { profile, setSizes } = useProfile();
  const version = useInventoryVersion();
  const sizes = useSizes(productId);
  const [size, setSize] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const scale = product ? CATEGORIES_BY_ID[product.category] : null;

  // Pre-select the shopper's saved size when it is actually on the floor. This
  // runs per piece, not per profile change — adding the last unit of a size
  // must not wipe the selection the shopper just made.
  const savedSizes = useRef(profile.sizes);
  useEffect(() => {
    savedSizes.current = profile.sizes;
  }, [profile.sizes]);
  useEffect(() => {
    if (!product || !scale) return;
    const sizes = savedSizes.current;
    const preferred =
      scale.sizeScale.length === 1
        ? scale.sizeScale[0]
        : product.category === "shoes"
          ? sizes.shoe
          : product.category === "bottoms"
            ? sizes.bottom
            : sizes.top;
    setSize(inventory.available(product.id, preferred) > 0 ? preferred : null);
  }, [product?.id, product, scale]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Cheap enough to recompute per render, and it must follow the live floor.
  const completes = (() => {
    if (!product) return [];
    return PRODUCTS.filter(
      (p) =>
        p.id !== product.id &&
        p.category !== product.category &&
        p.occasions.some((o) => product.occasions.includes(o)) &&
        inventory.inStock(p.id),
    )
      .sort((a, b) => {
        const shared = (x: typeof a) => x.vibes.filter((v) => product.vibes.includes(v)).length;
        return shared(b) - shared(a) || b.heat - a.heat;
      })
      .slice(0, 6);
  })();

  if (!product) return <Navigate to="/shop" replace />;

  const store = STORES_BY_ID[product.storeId];
  const eta = storeEta(store);
  const open = isOpenNow(store);
  const cutoff = minutesToCutoff(store);
  const left = sizes.reduce((n, s) => n + s.left, 0);
  const viewers = viewersFor(product.id, version);
  const inBag = size ? has(product.id, size) : false;

  const onAdd = () => {
    if (!size) {
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }
    if (add(product.id, size)) {
      if (scale && scale.sizeScale.length > 1) {
        if (product.category === "shoes") setSizes({ shoe: size });
        else if (product.category === "bottoms") setSizes({ bottom: size });
        else setSizes({ top: size });
      }
      setToast(`Held for 20 minutes — ${product.name}, ${size}`);
    } else {
      setToast("That size just went. Try another.");
    }
  };

  return (
    <div className="screen product">
      <TopBar title={product.brand} transparent />

      <div className="product-plate">
        <GarmentPlate category={product.category} colorway={product.colorway} ratio="3 / 4" dim={left === 0} />
        <div className="product-plate-tags">
          {product.isExclusive && <span className="tag">Exclusive to TONITE</span>}
          {product.isNew && <span className="tag">New in</span>}
          {left > 0 && left <= 3 && <span className="tag tag-signal">{left === 1 ? "Last one" : `${left} left`}</span>}
        </div>
      </div>

      <section className="pad product-head">
        <Link to={`/store/${store.id}`} className="eyebrow product-store">
          {store.name} · {store.neighborhood} <IconChevron size={12} />
        </Link>
        <h1 className="display d2">{product.name}</h1>
        <div className="product-priceline">
          <span className="display d4">{money(product.price)}</span>
          <span className="meta">{product.colorway.name}</span>
        </div>
        <p className="product-note">{product.note}</p>
        <p className="product-viewers meta">
          <i className="live-dot" /> {viewers} people looking at this now
        </p>
      </section>

      <section className="pad">
        <div className="product-eta">
          <div className="product-eta-main">
            <IconClock size={15} />
            <div>
              <p className="label">
                {open ? `Arrives ${timeWindow(eta.from, eta.to)}` : "Closed for tonight"}
              </p>
              <p className="meta">
                {open
                  ? `${store.prepMinutes} min to pull & steam, then ${eta.low - store.prepMinutes} min across town`
                  : `${store.name} reopens tomorrow`}
              </p>
            </div>
          </div>
          {open && cutoff < 90 && (
            <p className="product-cutoff">
              <i className="live-dot" /> Order within {cutoff} min — {store.name} closes at{" "}
              {store.closesAt}
            </p>
          )}
        </div>
      </section>

      <section className="pad product-sizes" data-shake={shake || undefined}>
        <div className="product-sizes-head">
          <span className="label">Size</span>
          <span className="meta">Live from the shop floor</span>
        </div>
        <SizePicker productId={product.id} value={size} onChange={setSize} />
        {left === 0 && (
          <p className="meta product-soldout">
            Every size has gone tonight. Try {" "}
            <Link className="ul" to={`/category/${product.category}`}>
              other {CATEGORIES_BY_ID[product.category].name.toLowerCase()}
            </Link>
            .
          </p>
        )}
      </section>

      <section className="pad product-tags">
        <span className="label">Wear it to</span>
        <div className="tag-row">
          {product.occasions.map((o) => (
            <Link key={o} to={`/occasion/${o}`} className="chip">
              {OCCASIONS_BY_ID[o].name}
            </Link>
          ))}
        </div>
      </section>

      {completes.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="display d3">Complete the look</h2>
            <Link to="/look" className="more">
              Build one for me
            </Link>
          </div>
          <div className="rail">
            {completes.map((p) => (
              <div key={p.id} className="rail-card">
                <ProductCard product={p} variant="rail" />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="sticky-bar">
        <div className="sticky-bar-info">
          <span className="price">{money(product.price)}</span>
          <span className="meta">{open ? `${eta.low}–${eta.high} min` : "Closed"}</span>
        </div>
        {inBag ? (
          <button className="btn btn-primary sticky-bar-btn" onClick={() => navigate("/cart")}>
            <IconCheck size={15} /> In your bag
          </button>
        ) : (
          <button
            className="btn btn-primary sticky-bar-btn"
            onClick={onAdd}
            disabled={left === 0 || !open}
          >
            {left === 0 ? "Sold out" : size ? `Add — ${size}` : "Select a size"}
          </button>
        )}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
