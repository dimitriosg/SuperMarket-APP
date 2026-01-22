import { BasketItemUI, ScenarioResult, StoreUI } from "./types";

type PriceMap = Map<string, Map<string, number>>;

export function findBestSingleStore(
  basket: BasketItemUI[],
  stores: StoreUI[],
  priceMap: PriceMap
): ScenarioResult | null {
  if (basket.length === 0 || stores.length === 0) return null;

  const results = stores.map((store) => {
    const storePrices = priceMap.get(store.id);
    let totalCost = 0;
    let foundItems = 0;
    const items = basket.flatMap((item) => {
      const price = storePrices?.get(item.productId);
      if (price === undefined) {
        return [];
      }
      const subtotal = price * item.quantity;
      totalCost += subtotal;
      foundItems += 1;
      return [
        {
          productId: item.productId,
          storeId: store.id,
          price,
          quantity: item.quantity,
          subtotal
        }
      ];
    });

    const missingItems = basket.length - foundItems;

    return {
      storeId: store.id,
      storeName: store.name,
      totalCost: Number(totalCost.toFixed(2)),
      foundItems,
      missingItems,
      items,
      isFull: missingItems === 0
    } satisfies ScenarioResult;
  });

  const sorted = results.sort((a, b) => {
    if (a.missingItems !== b.missingItems) {
      return a.missingItems - b.missingItems;
    }
    return a.totalCost - b.totalCost;
  });

  return sorted[0] ?? null;
}

export function findBestMultiStore(
  basket: BasketItemUI[],
  stores: StoreUI[],
  priceMap: PriceMap
): ScenarioResult | null {
  if (basket.length === 0 || stores.length === 0) return null;

  const items = [] as ScenarioResult["items"];
  let totalCost = 0;
  let foundItems = 0;

  basket.forEach((item) => {
    let bestPrice = Number.POSITIVE_INFINITY;
    let bestStoreId: string | undefined;

    stores.forEach((store) => {
      const storePrices = priceMap.get(store.id);
      const price = storePrices?.get(item.productId);
      if (price === undefined) return;
      if (price < bestPrice) {
        bestPrice = price;
        bestStoreId = store.id;
      }
    });

    if (bestStoreId && Number.isFinite(bestPrice)) {
      const subtotal = bestPrice * item.quantity;
      totalCost += subtotal;
      foundItems += 1;
      items.push({
        productId: item.productId,
        storeId: bestStoreId,
        price: bestPrice,
        quantity: item.quantity,
        subtotal
      });
    }
  });

  const missingItems = basket.length - foundItems;

  return {
    storeName: "Mix & Match",
    totalCost: Number(totalCost.toFixed(2)),
    foundItems,
    missingItems,
    items,
    isFull: missingItems === 0
  } satisfies ScenarioResult;
}
