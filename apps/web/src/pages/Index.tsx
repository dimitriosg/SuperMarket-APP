import { useEffect, useState } from "react";
import { ComparisonView } from "../components/ComparisonView";
import { BasketItemUI } from "../features/basketAnalysis/types";

const REGION_STORAGE_KEY = "mw_regionId";

export function Index() {
  const [basket, setBasket] = useState<BasketItemUI[]>([]);
  const [regionId, setRegionId] = useState(() => {
    if (typeof window === "undefined") return "all";
    return localStorage.getItem(REGION_STORAGE_KEY) || "all";
  });

  useEffect(() => {
    localStorage.setItem(REGION_STORAGE_KEY, regionId);
  }, [regionId]);

  return (
    <ComparisonView
      basket={basket}
      onBasketChange={setBasket}
      regionId={regionId}
      onRegionChange={setRegionId}
    />
  );
}
