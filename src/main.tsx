import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CartProvider } from "./state/CartContext";
import { OrdersProvider } from "./state/OrdersContext";
import { ProfileProvider } from "./state/ProfileContext";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/screens.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        <CartProvider>
          <OrdersProvider>
            <App />
          </OrdersProvider>
        </CartProvider>
      </ProfileProvider>
    </BrowserRouter>
  </StrictMode>,
);
