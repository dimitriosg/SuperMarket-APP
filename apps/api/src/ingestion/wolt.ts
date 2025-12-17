import type { IngestionPlugin, IngestedProductRow } from '@shared/ingestion';
import type { GroceryChainSlug } from '@shared/chains';

const WOLT_CHAIN: GroceryChainSlug = 'wolt';

export const woltIngestionPlugin: IngestionPlugin = {
  chain: WOLT_CHAIN,
  async fetchStoreSnapshot(storeExternalId: string): Promise<IngestedProductRow[]> {
    const now = new Date().toISOString();

    return [
      {
        chain: WOLT_CHAIN,
        storeExternalId,
        productExternalId: 'debug-1',
        name: 'DEBUG Γάλα 1L',
        brand: 'DEBUG',
        quantity: '1L',
        ean: '5200000000001',
        price: 1.49,
        promoPrice: 1.29,
        inStock: true,
        imageUrl: 'https://via.placeholder.com/200x200?text=Milk',
        collectedAt: now,
      },
      {
        chain: WOLT_CHAIN,
        storeExternalId,
        productExternalId: 'debug-2',
        name: 'DEBUG Ρύζι 500g',
        brand: 'DEBUG',
        quantity: '500g',
        ean: '5200000000002',
        price: 1.10,
        inStock: true,
        imageUrl: 'https://via.placeholder.com/200x200?text=Rice',
        collectedAt: now,
      },
    ];
  },
};
