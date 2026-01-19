import { useCallback, useMemo, useState } from "react";
import { api, LOCATIONS, STORES_DATA, getStoreIdByName } from "../../services/api";
import { ProductResult } from "../../types";
import { toProductUI, toRegionUI, toStoreUI, ProductDataRow } from "./adapters";
import { ProductUI, RegionUI, StoreUI } from "./types";

type PriceMap = Map<string, Map<string, number>>;

type BasketAnalysisData = {
  regions: RegionUI[];
  stores: StoreUI[];
  products: ProductUI[];
  productLookup: Map<string, ProductUI>;
  priceMap: PriceMap;
  isLoading: boolean;
  error?: unknown;
  searchProducts: (term: string) => void;
};

const DEFAULT_CATEGORY = "Λοιπά";

export function useBasketAnalysisData(regionId: string): BasketAnalysisData {
  const [searchResults, setSearchResults] = useState<ProductDataRow[]>([]);
  const [productCatalog, setProductCatalog] = useState<Record<string, ProductDataRow>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  const regions = useMemo(() => LOCATIONS.map(toRegionUI), []);

  const stores = useMemo(() => {
    return STORES_DATA.filter((store) => store.regions.includes("all") || store.regions.includes(regionId)).map(toStoreUI);
  }, [regionId]);

  const searchProducts = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const results = await api.search(term);
      const normalized = results as ProductDataRow[];
      setSearchResults(normalized);
      setProductCatalog((prev) => {
        const next = { ...prev };
        normalized.forEach((product) => {
          next[product.id] = {
            ...product,
            category: product.category || DEFAULT_CATEGORY
          };
        });
        return next;
      });
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const products = useMemo(() => searchResults.map(toProductUI), [searchResults]);

  const productLookup = useMemo(() => {
    const map = new Map<string, ProductUI>();
    Object.values(productCatalog).forEach((product) => {
      map.set(product.id, toProductUI(product));
    });
    return map;
  }, [productCatalog]);

  const priceMap = useMemo(() => {
    const map: PriceMap = new Map();
    const availableStoreIds = new Set(stores.map((store) => store.id));

    stores.forEach((store) => {
      map.set(store.id, new Map());
    });

    Object.values(productCatalog).forEach((product: ProductResult) => {
      product.offers?.forEach((offer) => {
        const storeId = getStoreIdByName(offer.store);
        if (!availableStoreIds.has(storeId)) return;

        const priceValue = Number(offer.price);
        if (!Number.isFinite(priceValue)) return;

        if (!map.has(storeId)) {
          map.set(storeId, new Map());
        }
        const storePrices = map.get(storeId)!;
        const existing = storePrices.get(product.id);
        if (existing === undefined || priceValue < existing) {
          storePrices.set(product.id, priceValue);
        }
      });
    });

    return map;
  }, [productCatalog, stores]);

  return {
    regions,
    stores,
    products,
    productLookup,
    priceMap,
    isLoading,
    error,
    searchProducts
  };
}
