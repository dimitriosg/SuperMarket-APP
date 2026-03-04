import type { CompareBasketResultDto } from "@shared/contracts";

export type Offer = {
  store: string;
  price: string;
  date: string;
};

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
  
  // ΝΕΑ ΠΕΔΙΑ ΓΙΑ PHASE 3
  staleCount: number; 
  staleItems: { name: string; date: string }[];
}

// ΝΕΟ: Η μορφή που στέλνει το Backend για το καλάθι
export type BasketComparisonResult = CompareBasketResultDto;