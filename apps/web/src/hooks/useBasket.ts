import { useBasketContext } from "../context/BasketContext";

// Αυτό το αρχείο υπάρχει πλέον για λόγους συμβατότητας (Backward Compatibility)
// ώστε να μην χρειαστεί να αλλάξουμε τα imports στα Pages.
export function useBasket() {
  return useBasketContext();
}