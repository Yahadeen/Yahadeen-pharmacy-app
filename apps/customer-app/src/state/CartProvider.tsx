/**
 * Cart state, persisted to AsyncStorage so closing the app doesn't lose it.
 *
 * Prices are snapshotted per line for display only — the server re-derives every
 * amount from `products.price_kobo` at checkout, so a stale or tampered cart can
 * never change what someone is charged.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subtotalKobo as sumKobo, type ProductWithStock } from '@pharmago/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

const STORAGE_KEY = 'Yahadeen.cart.v1';

export interface CartLine {
  product_id: string;
  name: string;
  pack_size: string | null;
  image_url: string | null;
  unit_price_kobo: number;
  quantity: number;
  requires_prescription: boolean;
  /** Stock as it was when the line was added; re-checked server-side at checkout. */
  stock: number;
}

type CartValue = {
  lines: CartLine[];
  /** False until the persisted cart has been read — avoids a flash of "empty". */
  hydrated: boolean;
  count: number;
  subtotalKobo: number;
  requiresPrescription: boolean;
  qtyOf: (productId: string) => number;
  add: (product: ProductWithStock, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed as CartLine[]);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  // Persist after hydration only, or the initial empty state would clobber the
  // saved cart before it has been read.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines)).catch(() => undefined);
  }, [lines, hydrated]);

  const add = useCallback((product: ProductWithStock, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product_id === product.id);
      const cap = Math.max(1, product.quantity);
      if (existing) {
        return prev.map((l) =>
          l.product_id === product.id
            ? { ...l, quantity: Math.min(cap, l.quantity + qty), stock: product.quantity }
            : l,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          pack_size: product.pack_size,
          image_url: product.image_url,
          unit_price_kobo: product.price_kobo,
          quantity: Math.min(cap, qty),
          requires_prescription: product.requires_prescription,
          stock: product.quantity,
        },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product_id !== productId)
        : prev.map((l) => (l.product_id === productId ? { ...l, quantity: qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product_id !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    return {
      lines,
      hydrated,
      count,
      subtotalKobo: sumKobo(lines),
      requiresPrescription: lines.some((l) => l.requires_prescription),
      qtyOf: (productId) => lines.find((l) => l.product_id === productId)?.quantity ?? 0,
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, hydrated, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}
