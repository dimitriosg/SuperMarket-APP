export type ProductSearchOfferDto = {
  store: string;
  price: number | string;
  date: string;
};

export type ProductSearchResultDto = {
  id: string;
  name: string;
  image: string | null;
  ean?: string | null;
  bestPrice: number;
  offers: ProductSearchOfferDto[];
};

export type CompareBasketItemDto = {
  ean: string;
  quantity: number;
};

export type CompareBasketStoreItemDto = {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type CompareBasketResultDto = {
  storeName: string;
  logo: string;
  totalCost: number;
  foundItems: number;
  missingItems: number;
  items: CompareBasketStoreItemDto[];
};

export type CompareBasketResponseDto = {
  success: boolean;
  data?: CompareBasketResultDto[];
};
