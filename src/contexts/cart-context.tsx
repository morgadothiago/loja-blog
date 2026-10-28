"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

type State = { items: CartItem[]; hydrated: boolean };

type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: Omit<CartItem, "quantity">; quantity: number }
  | { type: "setQuantity"; id: string; quantity: number }
  | { type: "remove"; id: string }
  | { type: "clear" };

const STORAGE_KEY = "cart:v1";

function clamp(quantity: number, stock: number) {
  return Math.max(1, Math.min(quantity, Math.max(stock, 1)));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, hydrated: true };
    case "add": {
      const existing = state.items.find((i) => i.id === action.item.id);
      const items = existing
        ? state.items.map((i) =>
            i.id === existing.id
              ? { ...i, ...action.item, quantity: clamp(i.quantity + action.quantity, action.item.stock) }
              : i,
          )
        : [...state.items, { ...action.item, quantity: clamp(action.quantity, action.item.stock) }];
      return { ...state, items };
    }
    case "setQuantity":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: clamp(action.quantity, i.stock) } : i,
        ),
      };
    case "remove":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "clear":
      return { ...state, items: [] };
  }
}

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  totalCents: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });

  useEffect(() => {
    let items: CartItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) items = JSON.parse(raw);
    } catch {}
    dispatch({ type: "hydrate", items });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
  }, [state]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      hydrated: state.hydrated,
      count: state.items.reduce((n, i) => n + i.quantity, 0),
      totalCents: state.items.reduce((n, i) => n + i.quantity * i.priceCents, 0),
      addItem: (item, quantity = 1) => dispatch({ type: "add", item, quantity }),
      setQuantity: (id, quantity) => dispatch({ type: "setQuantity", id, quantity }),
      removeItem: (id) => dispatch({ type: "remove", id }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
