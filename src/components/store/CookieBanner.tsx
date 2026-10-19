"use client";
import { useEffect, useState } from "react";

const KEY = "consent-v1";
interface Consent {
  analytics: boolean;
  at: number;
}

/** Cloudflare Web Analytics: no cookies, no fingerprinting. Loaded ONLY after the visitor accepts. */
function loadBeacon(token: string) {
  if (!token || document.getElementById("cf-beacon")) return;
  const s = document.createElement("script");
  s.id = "cf-beacon";
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token }));
  document.head.appendChild(s);
}

export default function CookieBanner({ analyticsToken }: { analyticsToken: string }) {
  const hasAnalytics = !!analyticsToken;
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    let c: Consent | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      c = raw ? (JSON.parse(raw) as Consent) : null;
    } catch {
      /* ignore */
    }
    if (c) {
      setAnalytics(!!c.analytics);
      if (c.analytics) loadBeacon(analyticsToken);
    } else {
      setOpen(true);
    }
    setReady(true);
    const reopen = () => {
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener("open-cookie-settings", reopen);
    return () => window.removeEventListener("open-cookie-settings", reopen);
  }, [analyticsToken]);

  function save(a: boolean) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ analytics: a, at: Date.now() } satisfies Consent));
    } catch {
      /* ignore */
    }
    const wasOn = !!document.getElementById("cf-beacon");
    setAnalytics(a);
    setOpen(false);
    setDetails(false);
    if (a) loadBeacon(analyticsToken);
    else if (wasOn) window.location.reload(); // a loaded script can't be unloaded; reload without it
  }

  if (!ready || !open) return null;

  return (
    <div className="sf-cookie" role="dialog" aria-label="Cookie settings">
      {hasAnalytics ? (
        <>
          <p>
            <b>We respect your privacy.</b> Essential storage keeps your cart and wishlist working. With your OK we also use privacy-friendly analytics (no ads, no selling data) to see which pages are popular.
          </p>
          {details && (
            <div className="opts">
              <label><input type="checkbox" checked disabled /> Essential — cart, wishlist, your choice (always on)</label>
              <label><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> Analytics — anonymous visit statistics</label>
            </div>
          )}
          <div className="btns">
            <button type="button" className="ghost" onClick={() => save(false)}>Reject</button>
            {details ? (
              <button type="button" className="ghost" onClick={() => save(analytics)}>Save choices</button>
            ) : (
              <button type="button" className="ghost" onClick={() => setDetails(true)}>Choose</button>
            )}
            <button type="button" className="solid" onClick={() => save(true)}>Accept all</button>
          </div>
        </>
      ) : (
        <>
          <p><b>Just so you know:</b> this site only uses essential storage to keep your cart and wishlist working. No tracking, no ads.</p>
          <div className="btns">
            <button type="button" className="solid" onClick={() => save(false)}>Got it</button>
          </div>
        </>
      )}
    </div>
  );
}