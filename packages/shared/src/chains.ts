export type GroceryChainSlug = 'wolt' | 'efood' | 'ab' | 'my-market' | 'sklavenitis';

export interface ChainMeta {
  slug: GroceryChainSlug;
  label: string;
}

export const SUPPORTED_CHAINS: ChainMeta[] = [
  { slug: 'wolt', label: 'Wolt Market / Retail' },
  { slug: 'efood', label: 'efood Market / Retail' },
  { slug: 'ab', label: 'AB Βασιλόπουλος' },
  { slug: 'my-market', label: 'My Market' },
  { slug: 'sklavenitis', label: 'Σκλαβενίτης' },
];
