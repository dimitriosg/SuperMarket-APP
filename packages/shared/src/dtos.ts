export type ProductOfferDto = {
  store: string;
  price: number;
  date: string;
};

export type ProductSearchItemDto = {
  id: string;
  name: string;
  image: string | null;
  ean?: string;
  bestPrice: number;
  offers: ProductOfferDto[];
};

export type ProductSearchResponseDto = ProductSearchItemDto[];

export type BasketAnalyzeItemDto = {
  ean: string;
  quantity: number;
};

export type BasketAnalyzeRequestDto = {
  items: BasketAnalyzeItemDto[];
};

export type BasketAnalyzeStoreLineItemDto = {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type BasketAnalyzeStoreResultDto = {
  storeName: string;
  logo: string;
  totalCost: number;
  foundItems: number;
  missingItems: number;
  items: BasketAnalyzeStoreLineItemDto[];
};

export type BasketAnalyzeResponseDto =
  | {
      success: true;
      data: BasketAnalyzeStoreResultDto[];
    }
  | {
      success: false;
      error: {
        message: string;
      };
    };
