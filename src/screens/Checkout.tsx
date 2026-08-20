import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { PRODUCTS_BY_ID } from "../data/catalog";
import { STORES_BY_ID } from "../data/stores";
import { basketEta, SPEEDS, TAX_RATE } from "../lib/delivery";
import { listOf, money2, timeWindow } from "../lib/format";
import { inventory } from "../lib/inventory";
import { TopBar } from "../components/Chrome";
import { IconCheck, IconClock } from "../components/icons";
import { useCart } from "../state/CartContext";
import { useOrders } from "../state/OrdersContext";
import { useProfile } from "../state/ProfileContext";

type Errors = Record<string, string>;

const digits = (s: string) => s.replace(/\D/g, "");

export default function Checkout() {
  const { lines, subtotal, storeIds, clear } = useCart();
  const { profile, update } = useProfile();
  const { place } = useOrders();
  const navigate = useNavigate();

  const [speedId, setSpeedId] = useState("standard");
  const [note, setNote] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);

  const speed = SPEEDS.find((s) => s.id === speedId) ?? SPEEDS[1];
  const eta = useMemo(() => {
    const base = basketEta(storeIds);
    const shift = speed.shift * 60_000;
    return {
      low: Math.max(30, base.low + speed.shift),
      high: Math.max(45, base.high + speed.shift),
      from: new Date(base.from.getTime() + shift),
      to: new Date(base.to.getTime() + shift),
    };
  }, [storeIds, speed]);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + speed.fee + tax;

  if (!lines.length && !placing) return <Navigate to="/cart" replace />;

  const validate = () => {
    const e: Errors = {};
    if (!profile.name.trim()) e.name = "We need a name for the doorstep.";
    if (digits(profile.phone).length < 10) e.phone = "A number the courier can reach.";
    if (!profile.address.trim()) e.address = "Street address required.";
    if (digits(profile.zip).length !== 5) e.zip = "Five digits.";
    if (digits(card).length !== 16) e.card = "Sixteen digits.";
    if (!/^\d{2}\/\d{2}$/.test(exp)) e.exp = "MM/YY";
    if (digits(cvc).length < 3) e.cvc = "3–4 digits.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = () => {
    if (!validate()) {
      document.querySelector(".input[aria-invalid='true']")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setPlacing(true);
    const orderLines = lines.map((l) => ({
      productId: l.productId,
      size: l.size,
      qty: l.qty,
      price: PRODUCTS_BY_ID[l.productId]?.price ?? 0,
    }));
    inventory.commit(orderLines);
    const order = place({
      placedAt: Date.now(),
      lines: orderLines,
      storeIds,
      speedId: speed.id,
      speedName: speed.name,
      etaFrom: eta.from.getTime(),
      etaTo: eta.to.getTime(),
      dropoff: {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        apt: profile.apt,
        city: profile.city,
        zip: profile.zip,
        note,
      },
      payment: { brand: cardBrand(card), last4: digits(card).slice(-4) },
      totals: { subtotal, delivery: speed.fee, tax, total },
    });
    clear();
    navigate(`/order/${order.id}`, { replace: true });
  };

  return (
    <div className="screen checkout">
      <TopBar title="Checkout" />

      <header className="pad checkout-head">
        <h1 className="display d2">Where it lands.</h1>
        <p className="meta">
          {lines.length} piece{lines.length > 1 ? "s" : ""} from{" "}
          {listOf(storeIds.map((id) => STORES_BY_ID[id]?.name ?? ""))}
        </p>
      </header>

      <section className="pad checkout-section">
        <p className="label section-label">Delivery</p>
        <label className="field">
          <span className="label">Name</span>
          <input
            className="input"
            value={profile.name}
            aria-invalid={Boolean(errors.name)}
            placeholder="Full name"
            onChange={(e) => update({ name: e.target.value })}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </label>
        <label className="field">
          <span className="label">Phone</span>
          <input
            className="input"
            inputMode="tel"
            value={profile.phone}
            aria-invalid={Boolean(errors.phone)}
            placeholder="(212) 555 0147"
            onChange={(e) => update({ phone: e.target.value })}
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </label>
        <label className="field">
          <span className="label">Street address</span>
          <input
            className="input"
            value={profile.address}
            aria-invalid={Boolean(errors.address)}
            placeholder="105 Crosby Street"
            onChange={(e) => update({ address: e.target.value })}
          />
          {errors.address && <span className="error">{errors.address}</span>}
        </label>
        <div className="row-2">
          <label className="field">
            <span className="label">Apt / floor</span>
            <input
              className="input"
              value={profile.apt}
              placeholder="4R"
              onChange={(e) => update({ apt: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="label">ZIP</span>
            <input
              className="input"
              inputMode="numeric"
              value={profile.zip}
              aria-invalid={Boolean(errors.zip)}
              placeholder="10012"
              onChange={(e) => update({ zip: digits(e.target.value).slice(0, 5) })}
            />
            {errors.zip && <span className="error">{errors.zip}</span>}
          </label>
        </div>
        <label className="field">
          <span className="label">Note for the courier</span>
          <input
            className="input"
            value={note}
            placeholder="Buzzer is second from the left"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </section>

      <section className="checkout-section">
        <p className="label section-label pad">Speed</p>
        <div className="speed-list pad">
          {SPEEDS.map((s) => {
            const base = basketEta(storeIds);
            const from = new Date(base.from.getTime() + s.shift * 60_000);
            const to = new Date(base.to.getTime() + s.shift * 60_000);
            return (
              <button
                key={s.id}
                className="speed"
                data-on={speedId === s.id}
                onClick={() => setSpeedId(s.id)}
              >
                <span className="speed-main">
                  <span className="opt-main">{s.name}</span>
                  <span className="price">{s.fee ? money2(s.fee) : "Included"}</span>
                </span>
                <span className="meta">{s.detail}</span>
                <span className="speed-eta label">
                  <IconClock size={12} /> {timeWindow(from, to)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="pad checkout-section">
        <p className="label section-label">Payment</p>
        <label className="field">
          <span className="label">Card number</span>
          <input
            className="input"
            inputMode="numeric"
            value={card}
            aria-invalid={Boolean(errors.card)}
            placeholder="4242 4242 4242 4242"
            onChange={(e) => setCard(formatCard(e.target.value))}
          />
          {errors.card && <span className="error">{errors.card}</span>}
        </label>
        <div className="row-2">
          <label className="field">
            <span className="label">Expiry</span>
            <input
              className="input"
              inputMode="numeric"
              value={exp}
              aria-invalid={Boolean(errors.exp)}
              placeholder="09/28"
              onChange={(e) => setExp(formatExp(e.target.value))}
            />
            {errors.exp && <span className="error">{errors.exp}</span>}
          </label>
          <label className="field">
            <span className="label">CVC</span>
            <input
              className="input"
              inputMode="numeric"
              value={cvc}
              aria-invalid={Boolean(errors.cvc)}
              placeholder="123"
              onChange={(e) => setCvc(digits(e.target.value).slice(0, 4))}
            />
            {errors.cvc && <span className="error">{errors.cvc}</span>}
          </label>
        </div>
        <p className="meta checkout-secure">
          <IconCheck size={13} /> Prototype checkout — no card is charged or stored anywhere.
        </p>
      </section>

      <section className="pad checkout-section">
        <p className="label section-label">Summary</p>
        {lines.map((l) => {
          const p = PRODUCTS_BY_ID[l.productId];
          if (!p) return null;
          return (
            <div key={l.key} className="total-row">
              <span className="meta">
                {p.name} · {l.size}
                {l.qty > 1 ? ` × ${l.qty}` : ""}
              </span>
              <span className="price">{money2(p.price * l.qty)}</span>
            </div>
          );
        })}
        <div className="rule" />
        <div className="total-row">
          <span className="meta">Subtotal</span>
          <span className="price">{money2(subtotal)}</span>
        </div>
        <div className="total-row">
          <span className="meta">{speed.name} courier</span>
          <span className="price">{money2(speed.fee)}</span>
        </div>
        <div className="total-row">
          <span className="meta">Tax</span>
          <span className="price">{money2(tax)}</span>
        </div>
        <div className="rule" />
        <div className="total-row" data-strong>
          <span className="label">Total</span>
          <span className="display d4">{money2(total)}</span>
        </div>
      </section>

      <div className="sticky-bar">
        <div className="sticky-bar-info">
          <span className="price">{money2(total)}</span>
          <span className="meta">Arrives {timeWindow(eta.from, eta.to)}</span>
        </div>
        <button className="btn btn-primary sticky-bar-btn" onClick={placeOrder} disabled={placing}>
          {placing ? "Placing…" : "Place order"}
        </button>
      </div>
    </div>
  );
}

function formatCard(value: string) {
  return digits(value)
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExp(value: string) {
  const d = digits(value).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

function cardBrand(value: string) {
  const d = digits(value);
  if (d.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "Card";
}
