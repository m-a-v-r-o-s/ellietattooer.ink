import { useState, useEffect, useCallback } from "react";

// Cookie-consent persistence. Bump the version suffix to re-prompt everyone.
const COOKIE_CONSENT_KEY = "ellie_cookie_consent_v1";

// Publish the analytics choice so any analytics that loads later can honour it.
// No-ops cleanly when nothing (e.g. Google Consent Mode) is present.
function applyConsent(analytics: boolean) {
  if (typeof window === "undefined") return;
  (window as unknown as { __analyticsConsent?: boolean }).__analyticsConsent =
    analytics;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
    });
  }
}

/** Cookie consent card (Greek copy), shown until the visitor decides. */
export default function CookieConsent() {
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);
  const [cookieManage, setCookieManage] = useState(false);
  const [analyticsPref, setAnalyticsPref] = useState(false);

  // Show the cookie banner only when we have no stored decision yet.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { analytics?: boolean };
        applyConsent(!!saved.analytics);
      } else {
        // localStorage only exists after hydration, so this read has to live in an effect.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCookieBannerOpen(true);
      }
    } catch {
      setCookieBannerOpen(true);
    }
  }, []);

  const persistCookieConsent = useCallback((analytics: boolean) => {
    try {
      localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({ analytics, ts: Date.now() }),
      );
    } catch {
      // Storage unavailable — the choice still applies for this session.
    }
    applyConsent(analytics);
    setCookieManage(false);
    setCookieBannerOpen(false);
  }, []);

  return (
    <>
    {/* COOKIE CONSENT */}
    {cookieBannerOpen && (
      <div
        className="cookie-card"
        role="dialog"
        aria-label="Cookies"
        aria-live="polite"
      >
        <div className="cookie-label">Cookies</div>

        {!cookieManage ? (
          <>
            <p className="cookie-body">
              Αυτός ο ιστότοπος χρησιμοποιεί απαραίτητα cookies για να
              λειτουργεί. Με τη συγκατάθεσή σου, προαιρετικά cookies όπως
              analytics με βοηθούν να τον βελτιώσω. Έχεις τον έλεγχο: αποδοχή,
              απόρριψη ή διαχείριση προτιμήσεων. Δες την{" "}
              <a href="/privacy">
                Πολιτική Απορρήτου
              </a>
              .
            </p>
            <div className="cookie-actions">
              <button
                className="cookie-btn ink"
                onClick={() => persistCookieConsent(true)}
              >
                Αποδοχή όλων
              </button>
              <button
                className="cookie-btn"
                onClick={() => persistCookieConsent(false)}
              >
                Απόρριψη όλων
              </button>
            </div>
            <button
              className="cookie-link"
              onClick={() => {
                setAnalyticsPref(false);
                setCookieManage(true);
              }}
            >
              Διαχείριση προτιμήσεων
            </button>
          </>
        ) : (
          <>
            <div className="cookie-row">
              <label className="cookie-row-head">
                <input
                  type="checkbox"
                  className="cookie-checkbox"
                  checked
                  disabled
                  readOnly
                />
                <span className="cookie-row-title">Απολύτως απαραίτητα</span>
                <span className="cookie-badge">Πάντα ενεργά</span>
              </label>
              <p className="cookie-row-desc">
                Απαραίτητα για τη λειτουργία του ιστότοπου, όπως ασφάλεια και η
                αποθήκευση αυτής της επιλογής.
              </p>
            </div>
            <div className="cookie-row">
              <label className="cookie-row-head cookie-row-clickable">
                <input
                  type="checkbox"
                  className="cookie-checkbox"
                  checked={analyticsPref}
                  onChange={(e) => setAnalyticsPref(e.target.checked)}
                />
                <span className="cookie-row-title">Analytics</span>
              </label>
              <p className="cookie-row-desc">
                Ανώνυμα στατιστικά που με βοηθούν να καταλάβω πώς
                χρησιμοποιείται ο ιστότοπος.
              </p>
            </div>
            <div className="cookie-actions">
              <button
                className="cookie-btn"
                onClick={() => persistCookieConsent(analyticsPref)}
              >
                Αποθήκευση προτιμήσεων
              </button>
              <button
                className="cookie-btn ink"
                onClick={() => persistCookieConsent(true)}
              >
                Αποδοχή όλων
              </button>
            </div>
          </>
        )}
      </div>
    )}
    </>
  );
}
