"use client";

export default function CookieSettingsLink() {
  return (
    <button type="button" className="sf-cookie-link" onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}>
      Cookie settings
    </button>
  );
}