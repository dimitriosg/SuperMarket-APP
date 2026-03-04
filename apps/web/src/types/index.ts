import type { BasketAnalyzeStoreResultDto, ProductOfferDto } from "@supermarket/shared";

export type Offer = ProductOfferDto;

export type ProductResult = {
  id: string;
  name: string;
  image: string | null;
  ean?: string;
  bestPrice: number;
  offers: Offer[];
};

export type BasketItem = ProductResult & {
  quantity: number;
};

export interface StoreComparisonStat {
  name: string;
  total: number;
  count: number;
  isFull: boolean;
  missing: { name: string; bestAlternative: { store: string; price: number } | null }[];
  staleCount: number;
  staleItems: { name: string; date: string }[];
}

export type BasketComparisonResult = BasketAnalyzeStoreResultDto;
