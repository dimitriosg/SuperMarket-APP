// apps/api/src/routes/search.ts
import { Elysia, t } from 'elysia';
import { prisma } from '../db';

type SearchProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  storeName: string;
  price: string;
  quantityKey: string | null;
  tokens: Set<string>;
};

type SearchGroup = {
  key: string;
  name: string;
  quantityKey: string | null;
  tokens: Set<string>;
  items: Array<{
    id: string;
    name: string;
    price: string;
    store: string;
    image: string | null;
  }>;
};

const STOP_WORDS = new Set([
  'φρεσκο',
  'φρεσκο',
  'φρέσκο',
  'φρεσκια',
  'φρέσκια',
  'ολικο',
  'ολικής',
  'πληρες',
  'πλήρες',
  'ελαφρυ',
  'ελαφρύ',
  'light',
  'χωρις',
  'χωρίς',
  'ζαχαρη',
  'ζάχαρη',
  'βιολογικο',
  'βιολογικό',
  'παραδοσιακο',
  'παραδοσιακό'
]);

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9α-ω\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractQuantityKey = (normalized: string): string | null => {
  const match =
    normalized.match(/(\d+(?:[.,]\d+)?)\s*(ml|l|lt|λιτρο|λιτρα|kg|κιλο|κιλα|g|gr|γρ|τεμ|τεμ\.|τεμαχια)/i);

  if (!match) return null;

  const rawValue = parseFloat(match[1].replace(',', '.'));
  const unit = match[2];

  if (Number.isNaN(rawValue)) return null;

  if (['l', 'lt', 'λιτρο', 'λιτρα'].includes(unit)) {
    return `${Math.round(rawValue * 1000)}ml`;
  }

  if (['kg', 'κιλο', 'κιλα'].includes(unit)) {
    return `${Math.round(rawValue * 1000)}g`;
  }

  if (['ml', 'g', 'gr', 'γρ'].includes(unit)) {
    return `${Math.round(rawValue)}${unit === 'gr' || unit === 'γρ' ? 'g' : unit}`;
  }

  return `${Math.round(rawValue)}τεμ`;
};

const buildTokenSet = (normalized: string, quantityKey: string | null) => {
  const tokens = normalized
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));

  if (quantityKey) {
    const quantityBase = quantityKey.replace(/(ml|g|τεμ)$/, '');
    return new Set(tokens.filter((token) => token !== quantityBase));
  }

  return new Set(tokens);
};

const jaccardSimilarity = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
};

const groupProducts = (products: SearchProduct[]) => {
  const groups: SearchGroup[] = [];

  for (const product of products) {
    let bestMatch: { group: SearchGroup; score: number } | null = null;

    for (const group of groups) {
      if (product.quantityKey && group.quantityKey && product.quantityKey !== group.quantityKey) {
        continue;
      }

      const score = jaccardSimilarity(product.tokens, group.tokens);
      if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { group, score };
      }
    }

    if (!bestMatch) {
      const baseKey = [...product.tokens].sort().join('-') || product.name;
      const key = product.quantityKey ? `${baseKey}-${product.quantityKey}` : baseKey;

      groups.push({
        key,
        name: product.name,
        quantityKey: product.quantityKey,
        tokens: product.tokens,
        items: [
          {
            id: product.id,
            name: product.name,
            price: product.price,
            store: product.storeName,
            image: product.imageUrl
          }
        ]
      });
    } else {
      bestMatch.group.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        store: product.storeName,
        image: product.imageUrl
      });
    }
  }

  return groups;
};

export const searchRoutes = new Elysia({ prefix: '/search' })
  .get('/', async ({ query }) => {
    const searchTerm = query.q as string;
    if (!searchTerm) return [];

    const products = await prisma.product.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      include: {
        priceSnapshots: {
          orderBy: { collectedAt: 'desc' },
          take: 1
        },
        store: true
      }
    });

    const enriched: SearchProduct[] = products.map((p) => {
      const normalized = normalizeText(p.name);
      const quantityKey = extractQuantityKey(normalized);
      const tokens = buildTokenSet(normalized, quantityKey);

      return {
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        storeName: p.store?.name || 'Άγνωστο',
        price: p.priceSnapshots?.[0]?.price?.toString() || '0',
        quantityKey,
        tokens
      };
    });

    return groupProducts(enriched);
  }, {
    query: t.Object({
      q: t.String()
    })
  });
