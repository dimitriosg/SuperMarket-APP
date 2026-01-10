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

// Τύπος για τα στατιστικά σύγκρισης (για το BasketComparison)
export type StoreComparisonStat = {
  name: string;
  total: number;
  count: number;
  isFull: boolean;
  missing: {
    name: string;
    bestAlternative: { store: string; price: number } | null;
  }[];
};