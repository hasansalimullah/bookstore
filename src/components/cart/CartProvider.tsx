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
}

const CartCtx = createContext<Ctx | null>(null);
const KEY = "cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Load after mount (avoids server/client hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setItems(parsed.filter((i) => Number.isInteger(i?.bookId) && Number.isInteger(i?.qty) && i.qty > 0));
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

  const add = (bookId: number, qty = 1) => {
    const found = items.find((i) => i.bookId === bookId);
    save(found ? items.map((i) => (i.bookId === bookId ? { ...i, qty: Math.min(10, i.qty + qty) } : i)) : [...items, { bookId, qty: Math.min(10, qty) }]);
  };
  const setQty = (bookId: number, qty: number) =>
    save(qty <= 0 ? items.filter((i) => i.bookId !== bookId) : items.map((i) => (i.bookId === bookId ? { ...i, qty: Math.min(10, qty) } : i)));
  const remove = (bookId: number) => save(items.filter((i) => i.bookId !== bookId));
  const clear = () => save([]);

  return (
    <CartCtx.Provider value={{ items, ready, count: items.reduce((n, i) => n + i.qty, 0), add, setQty, remove, clear }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart(): Ctx {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
