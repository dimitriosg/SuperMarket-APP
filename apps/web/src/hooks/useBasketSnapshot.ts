import { useEffect, useCallback } from "react";
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

  useEffect(() => {
    // Save snapshot whenever basket is non-empty
    if (basket.length > 0) {
      setSnapshot({ items: basket, savedAt: new Date().toISOString() });
    }
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
