import { useEffect, useCallback, useRef } from "react";
import { useStore } from "../store";
import { useLocalStorageState } from "./useLocalStorageState";
import {
  BASKET_SNAPSHOT_KEY,
  BASKET_RESTORE_DISMISSED_KEY,
} from "../constants/storageKeys";
import type { BasketItem } from "../types";

export type BasketSnapshot = {
  items: BasketItem[];
  savedAt: string;
};

/** Stable signature derived from basket contents (sorted id:qty pairs). */
function basketSignature(items: BasketItem[]): string {
  return items
    .map((i) => `${i.id}:${i.quantity}`)
    .sort()
    .join(",");
}

/**
 * Persists the last non-empty basket to localStorage and exposes
 * helpers to restore or dismiss the saved snapshot.
 */
export function useBasketSnapshot() {
  const basket = useStore((s) => s.basket);
  const setBasket = useStore((s) => s.actions.setBasket);
  const setBasketOpen = useStore((s) => s.actions.setBasketOpen);

  const [snapshot, setSnapshot] = useLocalStorageState<BasketSnapshot | null>(
    BASKET_SNAPSHOT_KEY,
    null,
  );
  const [dismissed, setDismissed] = useLocalStorageState<boolean>(
    BASKET_RESTORE_DISMISSED_KEY,
    false,
  );

  const prevSigRef = useRef<string>("");

  useEffect(() => {
    if (basket.length === 0) return;

    const sig = basketSignature(basket);
    if (sig === prevSigRef.current) return;

    prevSigRef.current = sig;
    setSnapshot({ items: basket, savedAt: new Date().toISOString() });
    // Note: we intentionally do NOT clear the snapshot when basket becomes empty,
    // because that is when we want to offer restore.
  }, [basket, setSnapshot]);

  const canRestore = basket.length === 0 && snapshot !== null && !dismissed;

  const restore = useCallback(() => {
    if (!snapshot) return;
    setBasket(snapshot.items);
    setBasketOpen(true);
  }, [snapshot, setBasket, setBasketOpen]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, [setDismissed]);

  return { snapshot, canRestore, restore, dismiss };
}
