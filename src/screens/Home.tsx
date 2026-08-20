import { Link } from "react-router-dom";
import { PRODUCTS, PRODUCTS_BY_ID } from "../data/catalog";
import { CATEGORIES, OCCASIONS, STORES } from "../data/stores";
import { basketEta, isOpenNow, storeEta } from "../lib/delivery";
import { clockTime } from "../lib/format";
import { inventory } from "../lib/inventory";
import { useFeed, useInventoryVersion } from "../lib/useInventory";
import { useTicker } from "../lib/useTicker";
import { CategoryCard, OccasionCard, StoreCard } from "../components/browse";
import { ProductCard } from "../components/product";
import { BagButton } from "../components/Chrome";
import { IconChevron, IconPin, IconSpark } from "../components/icons";
import { useProfile } from "../state/ProfileContext";

export default function Home() {
  const now = new Date(useTicker(30_000));
  useInventoryVersion();
  const { profile } = useProfile();
  const { events } = useFeed();

  const openStores = STORES.filter((s) => isOpenNow(s, now));
  const fastest = openStores.length
    ? Math.min(...openStores.map((s) => storeEta(s, now).low))
    : 0;
  const lastCall = [...openStores].sort(
    (a, b) => storeEta(a, now).low - storeEta(b, now).low,
  );

  const movingFast = PRODUCTS.filter((p) => {
    const left = inventory.total(p.id);
    return left > 0 && left <= 3;
  })
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 8);

  const newIn = PRODUCTS.filter((p) => (p.isNew || p.isExclusive) && inventory.inStock(p.id)).slice(0, 8);

  const hour = now.getHours();
  const salutation =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 22 ? "Good evening" : "Still up";

  return (
    <div className="screen home">
      <header className="home-bar">
        <span className="home-loc">
          <IconPin size={14} />
          <span className="label">{profile.city.split(",")[0] || "New York"} · SoHo</span>
        </span>
        <BagButton />
      </header>

      <section className="hero pad">
        <p className="eyebrow">
          {salutation} — it is {clockTime(now)}
        </p>
        <h1 className="display d1">
          An outfit,
          <br />
          <span className="italic">tonight.</span>
        </h1>
        <p className="hero-sub">
          Real inventory from {openStores.length} boutiques within {Math.max(...STORES.map((s) => s.distanceKm))} km.
          Picked by a stylist, steamed, and at your door in under two hours.
        </p>

        <div className="hero-live">
          <i className="live-dot" />
          <span className="label">Fastest delivery tonight · {fastest} min</span>
        </div>

        <div className="hero-cta">
          <Link to="/look" className="btn btn-primary btn-block">
            <IconSpark size={16} /> Build my look
          </Link>
          <Link to="/shop" className="btn btn-ghost btn-block">
            Shop nearby
          </Link>
        </div>
      </section>

      {events.length > 0 && (
        <section className="ticker" aria-live="polite">
          <div className="ticker-inner">
            {events.slice(0, 4).map((e, i) => {
              const p = PRODUCTS_BY_ID[e.productId];
              if (!p) return null;
              return (
                <p key={`${e.productId}-${e.at}-${i}`} className="ticker-line">
                  <i className="live-dot" />
                  <span>
                    {e.lastOne ? "Last " : ""}
                    {e.size} of <em>{p.name}</em> just left {e.neighborhood}
                  </span>
                </p>
              );
            })}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="display d3">Dressing for</h2>
          <Link to="/shop" className="more">
            All occasions
          </Link>
        </div>
        <div className="rail">
          {OCCASIONS.map((o) => (
            <OccasionCard key={o.id} occasion={o} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="display d3">Moving fast</h2>
          <span className="more">Live stock</span>
        </div>
        <div className="rail">
          {movingFast.map((p) => (
            <div key={p.id} className="rail-card">
              <ProductCard product={p} variant="rail" />
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="display d3">Boutiques near you</h2>
          <Link to="/shop" className="more">
            All stores
          </Link>
        </div>
        <div className="rail">
          {lastCall.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      </section>

      <section className="section pad promo">
        <p className="eyebrow">The 90-minute promise</p>
        <p className="display d2">
          Order now,
          <br />
          dressed by{" "}
          {clockTime(
            basketEta(
              lastCall.slice(0, 2).map((s) => s.id),
              now,
            ).to,
          )}
          .
        </p>
        <p className="promo-note">
          Every piece is pulled off a real rail, checked against your size, and packed by the
          boutique that stocks it. If a size disappears while you shop, we tell you before you pay.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="display d3">New tonight</h2>
        </div>
        <div className="rail">
          {newIn.map((p) => (
            <div key={p.id} className="rail-card">
              <ProductCard product={p} variant="rail" />
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="display d3">Shop by category</h2>
        </div>
        <div className="cat-grid pad">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      <footer className="foot pad">
        <p className="display d4 italic">TONITE</p>
        <p className="meta">
          Same-day fashion, delivered from the boutiques already around you.
        </p>
        <Link to="/orders" className="foot-link label">
          Track an order <IconChevron size={14} />
        </Link>
      </footer>
    </div>
  );
}
