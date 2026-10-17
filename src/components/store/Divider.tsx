import { DiamondStar } from "./icons";

export function HeroDivider() {
  return (
    <div className="sf-herowrap" style={{ paddingBottom: 0 }}>
      <div className="sf-divider"><i /><DiamondStar /><i /></div>
      <div className="sf-fade" style={{ margin: "0 -16px" }} />
    </div>
  );
}

/** Thin gold line with a small star, used on the product page under the product block. */
export function GoldDivider() {
  return (
    <div className="sf-section" style={{ paddingTop: 108 }}>
      <div className="sf-divider plain" style={{ margin: 0, padding: "0 6px" }}>
        <i /><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccb38b" strokeWidth="1.5" aria-hidden><path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5C16.9 12.6 12.6 16.9 12 22.5 11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5z" strokeLinejoin="round" /></svg><i />
      </div>
    </div>
  );
}
