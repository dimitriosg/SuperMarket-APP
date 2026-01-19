export type ProductUI = {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  unit?: string;
};

export type BasketItemUI = {
  productId: string;
  quantity: number;
};

export type StoreUI = {
  id: string;
  name: string;
};

export type RegionUI = {
  id: string;
  name: string;
};

export type ScenarioLineItem = {
  productId: string;
  storeId?: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type ScenarioResult = {
  storeId?: string;
  storeName: string;
  totalCost: number;
  foundItems: number;
  missingItems: number;
  items: ScenarioLineItem[];
  isFull: boolean;
};
