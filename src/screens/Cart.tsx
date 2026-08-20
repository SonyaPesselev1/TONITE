import { Link, useNavigate } from "react-router-dom";
import { PRODUCTS_BY_ID } from "../data/catalog";
import { STORES_BY_ID } from "../data/stores";
import { basketEta, DELIVERY_FEE, TAX_RATE } from "../lib/delivery";
import { countdown, money, money2, timeWindow } from "../lib/format";
import { useInventoryVersion } from "../lib/useInventory";
import { useTicker } from "../lib/useTicker";
import { GarmentPlate } from "../components/GarmentPlate";
import { TopBar } from "../components/Chrome";
import { IconClock, IconMinus, IconPlus, IconSpark } from "../components/icons";
import { HOLD_MS, useCart } from "../state/CartContext";

export default function Cart() {
  const { lines, subtotal, storeIds, setQty, remove, extend, clear, expiredNotice, dismissNotice } =
    useCart();
  const now = useTicker(1000);
  useInventoryVersion();
  const navigate = useNavigate();

  const eta = basketEta(storeIds);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + (lines.length ? DELIVERY_FEE : 0) + tax;

  const grouped = storeIds.map((storeId) => ({
    store: STORES_BY_ID[storeId],
    lines: lines.filter((l) => PRODUCTS_BY_ID[l.productId]?.storeId === storeId),
  }));

  if (!lines.length) {
    return (
      <div className="screen">
        <TopBar title="Your bag" back={false} right={<span />} />
        <div className="pad empty-block">
          <h1 className="display d2">
            Nothing held
            <br />
            <span className="italic">yet.</span>
          </h1>
          <p className="meta">
            Pieces you add are taken off the shop floor and held for twenty minutes while you decide.
          </p>
          {expiredNotice && (
            <p className="notice" onClick={dismissNotice}>
              {expiredNotice}
            </p>
          )}
          <Link to="/look" className="btn btn-primary btn-block">
            <IconSpark size={15} /> Build my look
          </Link>
          <Link to="/shop" className="btn btn-ghost btn-block">
            Shop boutiques
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen cart">
      <TopBar
        title="Your bag"
        back={false}
        right={
          <button className="icon-btn label" onClick={clear}>
            Clear
          </button>
        }
      />

      <div className="pad cart-eta">
        <div className="cart-eta-main">
          <IconClock size={15} />
          <div>
            <p className="label">Arrives {timeWindow(eta.from, eta.to)}</p>
            <p className="meta">
              {eta.low}–{eta.high} min · {storeIds.length} boutique{storeIds.length > 1 ? "s" : ""}{" "}
              consolidated on one route
            </p>
          </div>
        </div>
      </div>

      {expiredNotice && (
        <p className="notice pad" onClick={dismissNotice}>
          {expiredNotice}
        </p>
      )}

      {grouped.map(({ store, lines: storeLines }) => (
        <section key={store.id} className="cart-group">
          <header className="cart-group-head pad">
            <Link to={`/store/${store.id}`} className="label">
              {store.name}
            </Link>
            <span className="meta">{store.neighborhood}</span>
          </header>

          {storeLines.map((line) => {
            const product = PRODUCTS_BY_ID[line.productId];
            if (!product) return null;
            const msLeft = line.addedAt + HOLD_MS - now;
            const urgent = msLeft < 5 * 60_000;
            return (
              <article key={line.key} className="cart-line pad">
                <Link to={`/product/${product.id}`} className="cart-line-plate">
                  <GarmentPlate
                    category={product.category}
                    colorway={product.colorway}
                    ratio="1 / 1"
                  />
                </Link>
                <div className="cart-line-body">
                  <p className="eyebrow">{product.brand}</p>
                  <p className="p-name">{product.name}</p>
                  <p className="meta">
                    {product.colorway.name} · Size {line.size}
                    {line.lookTitle && <span className="cart-look"> · {line.lookTitle}</span>}
                  </p>
                  <p className="cart-hold" data-urgent={urgent || undefined}>
                    <i className="live-dot" /> Held {countdown(msLeft)}
                    <button className="ul cart-extend" onClick={() => extend(line.key)}>
                      extend
                    </button>
                  </p>
                  <div className="cart-line-foot">
                    <div className="stepper">
                      <button onClick={() => setQty(line.key, line.qty - 1)} aria-label="Fewer">
                        <IconMinus size={14} />
                      </button>
                      <span className="num">{line.qty}</span>
                      <button onClick={() => setQty(line.key, line.qty + 1)} aria-label="More">
                        <IconPlus size={14} />
                      </button>
                    </div>
                    <span className="price">{money(product.price * line.qty)}</span>
                  </div>
                </div>
                <button className="cart-remove label" onClick={() => remove(line.key)}>
                  Remove
                </button>
              </article>
            );
          })}
        </section>
      ))}

      <section className="pad cart-totals">
        <Row label="Subtotal" value={money2(subtotal)} />
        <Row label="Courier" value={money2(DELIVERY_FEE)} />
        <Row label="Estimated tax" value={money2(tax)} />
        <div className="rule" />
        <Row label="Total" value={money2(total)} strong />
      </section>

      <p className="pad cart-note meta">
        Holds release automatically. Anything that lapses goes straight back onto the boutique floor
        for someone else.
      </p>

      <div className="sticky-bar">
        <div className="sticky-bar-info">
          <span className="price">{money2(total)}</span>
          <span className="meta">{eta.low}–{eta.high} min</span>
        </div>
        <button className="btn btn-primary sticky-bar-btn" onClick={() => navigate("/checkout")}>
          Checkout
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="total-row" data-strong={strong || undefined}>
      <span className={strong ? "label" : "meta"}>{label}</span>
      <span className={strong ? "display d4" : "price"}>{value}</span>
    </div>
  );
}
