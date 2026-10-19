"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CartItem {
  bookId: number;
  qty: number;
}

interface Ctx {
  items: CartItem[];
  ready: boolean;
  count: number;
  add: (bookId: number, qty?: number) => void;
  setQty: (bookId: number, qty: number) => void;
  remove: (bookId: number) => void;
  clear: () => void;
  /** Discount code typed by the customer (validated on the server). */
  code: string;
  setCode: (code: string) => void;
}

const CartCtx = createContext<Ctx | null>(null);
const KEY = "cart-v1";
const CODE_KEY = "cart-code-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [code, setCodeState] = useState("");

  // Load after mount (avoids server/client hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setItems(parsed.filter((i) => Number.isInteger(i?.bookId) && Number.isInteger(i?.qty) && i.qty > 0));
    } catch {
      /* ignore */
    }
    try {
      setCodeState(localStorage.getItem(CODE_KEY) ?? "");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const save = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setCode = (c: string) => {
    const v = c.trim().toUpperCase().slice(0, 32);
    setCodeState(v);
    try {
      if (v) localStorage.setItem(CODE_KEY, v);
      else localStorage.removeItem(CODE_KEY);
    } catch {
      /* ignore */
    }
  };

  const add = (bookId: number, qty = 1) => {
    const found = items.find((i) => i.bookId === bookId);
    save(found ? items.map((i) => (i.bookId === bookId ? { ...i, qty: Math.min(10, i.qty + qty) } : i)) : [...items, { bookId, qty: Math.min(10, qty) }]);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cart:added")); // opens the mini-cart popup
  };
  const setQty = (bookId: number, qty: number) =>
    save(qty <= 0 ? items.filter((i) => i.bookId !== bookId) : items.map((i) => (i.bookId === bookId ? { ...i, qty: Math.min(10, qty) } : i)));
  const remove = (bookId: number) => save(items.filter((i) => i.bookId !== bookId));
  const clear = () => {
    save([]);
    setCode("");
  };

  return (
    <CartCtx.Provider value={{ items, ready, count: items.reduce((n, i) => n + i.qty, 0), add, setQty, remove, clear, code, setCode }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart(): Ctx {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}