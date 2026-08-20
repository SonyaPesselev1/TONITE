import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import { CartProvider } from "./state/CartContext";
import { OrdersProvider } from "./state/OrdersContext";
import { ProfileProvider } from "./state/ProfileContext";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/screens.css";

// Static hosts without SPA rewrites (a published preview build) need hash URLs.
const Router = import.meta.env.VITE_ROUTER === "hash" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <ProfileProvider>
        <CartProvider>
          <OrdersProvider>
            <App />
          </OrdersProvider>
        </CartProvider>
      </ProfileProvider>
    </Router>
  </StrictMode>,
);
