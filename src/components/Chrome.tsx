import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useCart } from "../state/CartContext";
import { IconBack, IconBag, IconHome, IconRail, IconRoute, IconSpark } from "./icons";

export function TopBar({
  title,
  back = true,
  right,
  transparent = false,
}: {
  title?: ReactNode;
  back?: boolean;
  right?: ReactNode;
  transparent?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <header className="topbar" data-transparent={transparent || undefined}>
      <div className="topbar-side">
        {back && (
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <IconBack />
          </button>
        )}
      </div>
      <div className="topbar-title label">{title}</div>
      <div className="topbar-side topbar-right">{right ?? <BagButton />}</div>
    </header>
  );
}

export function BagButton() {
  const { count } = useCart();
  return (
    <NavLink to="/cart" className="icon-btn" aria-label={`Bag, ${count} items`}>
      <IconBag />
      {count > 0 && <span className="bag-count num">{count}</span>}
    </NavLink>
  );
}

const TABS = [
  { to: "/", label: "Tonite", Icon: IconHome, end: true },
  { to: "/shop", label: "Shop", Icon: IconRail, end: false },
  { to: "/look", label: "My Look", Icon: IconSpark, end: false },
  { to: "/cart", label: "Bag", Icon: IconBag, end: false },
  { to: "/orders", label: "Orders", Icon: IconRoute, end: false },
];

export function TabBar() {
  const { count } = useCart();
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tab">
          <span className="tab-icon">
            <Icon />
            {to === "/cart" && count > 0 && <span className="tab-dot" />}
          </span>
          <span className="tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Toast({ message, onDone }: { message: string; onDone?: () => void }) {
  return (
    <div className="toast" role="status" onClick={onDone}>
      {message}
    </div>
  );
}
