import { useState } from "react";
import { handleCartClick, totalItems, useShop, type Img } from "./cart";

const NAV = [
  { id: "portfolio", label: "Flash wall" },
  { id: "about", label: "Get tattooed" },
  { id: "shop", label: "Merch" },
  { id: "findme", label: "Find the studio" },
];

/** Sticky pill header: nav, mobile menu and the cart button. */
export default function Header({ betty }: { betty: Img }) {
  const { cart, cartShake } = useShop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const count = totalItems(cart);

  return (
    <header className="c-top">
      <div className="c-in">
        <a className="c-pill" href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <img {...betty} sizes="26px" alt="" width={26} height={22} decoding="async" style={{ color: "transparent" }} />
          Ellie
        </a>
        <nav className="c-nav" aria-label="Main">
          {NAV.map((l) => (
            <a key={l.id} className="c-pill" href={`#${l.id}`}>{l.label}</a>
          ))}
        </nav>
        <button
          type="button"
          className="c-pill c-menu-btn"
          aria-expanded={mobileMenuOpen}
          aria-controls="c-menu"
          onClick={() => setMobileMenuOpen((o) => !o)}
        >
          {mobileMenuOpen ? "Close" : "Menu"}
        </button>
        <button
          type="button"
          className={`c-pill pink c-cart${cartShake ? " cart-shake" : ""}`}
          onClick={handleCartClick}
          aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
        >
          Cart <span className="count">{count}</span>
        </button>
      </div>
      {mobileMenuOpen && (
        <nav id="c-menu" className="c-menu" aria-label="Mobile">
          {NAV.map((l) => (
            <a key={l.id} className="c-pill" href={`#${l.id}`} onClick={() => setMobileMenuOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
