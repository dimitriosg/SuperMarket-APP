import type { GroceryChainSlug } from './chains';

export interface IngestedProductRow {
  chain: GroceryChainSlug;
  storeExternalId: string;
  productExternalId: string;
  name: string;
  brand?: string;
  quantity?: string;
  ean?: string;      // barcode when available
  price: number;     // current price in EUR
  promoPrice?: number;
  inStock: boolean;
  imageUrl?: string;
  collectedAt: string; // ISO timestamp
}

export interface IngestionPlugin {
  readonly chain: GroceryChainSlug;
  /**
   * Pull latest products+prices for a specific store.
   * For Wolt/efood, storeExternalId maps to their store id.
   */
  fetchStoreSnapshot(storeExternalId: string): Promise<IngestedProductRow[]>;
}
