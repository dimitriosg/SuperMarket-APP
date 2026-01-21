import { prisma } from "../db";
import type { Suggestion } from "../ai/suggestions.service";

const DEFAULT_LIMIT = 5;
const LOCAL_EMBEDDING_DIMENSION = 128;
const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MIN_SIMILARITY = 0.2;

type ProductEmbeddingRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  embedding: number[] | null;
};

type EmbeddingCache = {
  loadedAt: number;
  items: ProductEmbeddingRow[];
};

let embeddingCache: EmbeddingCache | null = null;

const localHasher = (text: string, dimension = LOCAL_EMBEDDING_DIMENSION) => {
  const vector = Array(dimension).fill(0);
  const normalized = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  for (let i = 0; i < normalized.length - 2; i += 1) {
    const trigram = normalized.slice(i, i + 3);
    let hash = 5381;
    for (let j = 0; j < trigram.length; j += 1) {
      hash = (hash << 5) + hash + trigram.charCodeAt(j);
      hash &= 0xffffffff;
    }
    const idx = Math.abs(hash) % dimension;
    vector[idx] += 1;
  }

  return normalizeVector(vector);
};

const normalizeVector = (vector: number[]) => {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
};

const cosineSimilarity = (a: number[], b: number[]) => {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
  }
  return dot;
};

const fetchEmbeddingsFromEndpoint = async (texts: string[]) => {
  const endpoint = process.env.EMBEDDINGS_ENDPOINT;
  if (!endpoint) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: texts }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (!payload?.embeddings || !Array.isArray(payload.embeddings)) {
      return null;
    }

    return payload.embeddings as number[][];
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const getTextEmbeddings = async (texts: string[]) => {
  const remoteEmbeddings = await fetchEmbeddingsFromEndpoint(texts);
  if (remoteEmbeddings) {
    return remoteEmbeddings.map((vector) => normalizeVector(vector));
  }

  return texts.map((text) => localHasher(text));
};

const loadProductEmbeddings = async (): Promise<ProductEmbeddingRow[]> => {
  const now = Date.now();
  if (embeddingCache && now - embeddingCache.loadedAt < CACHE_TTL_MS) {
    return embeddingCache.items;
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      embedding: true,
    },
  });

  embeddingCache = {
    loadedAt: now,
    items: products,
  };

  return products;
};

const fetchLatestPrices = async (productIds: string[]) => {
  if (productIds.length === 0) {
    return new Map<string, number>();
  }

  const priceSnapshots = await prisma.priceSnapshot.findMany({
    where: {
      productId: { in: productIds },
    },
    orderBy: [{ productId: "asc" }, { collectedAt: "desc" }],
    distinct: ["productId"],
    select: {
      productId: true,
      price: true,
    },
  });

  return new Map(
    priceSnapshots.map((snapshot) => [snapshot.productId, Number(snapshot.price)])
  );
};

const buildQueryEmbedding = async (items: string[]) => {
  if (items.length === 0) {
    return null;
  }

  const embeddings = await getTextEmbeddings(items);
  if (embeddings.length === 0) {
    return null;
  }

  const averaged = Array(embeddings[0].length).fill(0);
  embeddings.forEach((vector) => {
    vector.forEach((value, index) => {
      averaged[index] += value;
    });
  });

  const normalized = normalizeVector(
    averaged.map((value) => value / embeddings.length)
  );

  return normalized;
};

const formatSimilarityRationale = (similarity: number) =>
  `Ομοιότητα ${(similarity * 100).toFixed(1)}% με τη λίστα σου`;

export const embeddingSuggestionsService = {
  async getSuggestions(items: string[], limit = DEFAULT_LIMIT): Promise<Suggestion[]> {
    try {
      const queryEmbedding = await buildQueryEmbedding(items);
      if (!queryEmbedding) {
        return [];
      }

      const products = await loadProductEmbeddings();
      if (products.length === 0) {
        return [];
      }

      const minSimilarity = Number(process.env.EMBEDDINGS_MIN_SIMILARITY ?? DEFAULT_MIN_SIMILARITY);

      const scored = products
        .map((product) => {
          const vector =
            product.embedding && product.embedding.length > 0
              ? normalizeVector(product.embedding)
              : localHasher(product.name);
          const similarity = cosineSimilarity(queryEmbedding, vector);

          return {
            ...product,
            similarity,
          };
        })
        .filter((item) => item.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      if (scored.length === 0) {
        return [];
      }

      const priceMap = await fetchLatestPrices(scored.map((item) => item.id));

      return scored.map((item) => ({
        id: item.id,
        name: item.name,
        category: "Προϊόντα",
        price: priceMap.get(item.id) ?? 0,
        rationale: formatSimilarityRationale(item.similarity),
        image: item.imageUrl ?? undefined,
      }));
    } catch (error) {
      return [];
    }
  },

  async getRandomSuggestions(limit = DEFAULT_LIMIT): Promise<Suggestion[]> {
    try {
      const products = await prisma.$queryRaw<ProductEmbeddingRow[]>`
        SELECT "id", "name", "imageUrl", "embedding"
        FROM "Product"
        WHERE "isActive" = true
        ORDER BY RANDOM()
        LIMIT ${limit}
      `;

      if (!products.length) {
        return [];
      }

      const priceMap = await fetchLatestPrices(products.map((item) => item.id));

      return products.map((item) => ({
        id: item.id,
        name: item.name,
        category: "Προϊόντα",
        price: priceMap.get(item.id) ?? 0,
        rationale: "Τυχαία επιλογή από τον κατάλογο",
        image: item.imageUrl ?? undefined,
      }));
    } catch (error) {
      return [];
    }
  },
};
