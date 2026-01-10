export type Offer = {
  store: string;
  price: string;
  date: string;
};

export type ProductResult = {
  id: string;
  name: string;
  image: string | null;
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