// apps/api/src/ingestion/ab/index.ts
import { IngestedProductRow } from "@repo/shared";
import { AB_HEADERS, AB_CATEGORIES } from "./config";
import { logger } from "../../utils/logger";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchAbCategory = async (categoryId: string): Promise<IngestedProductRow[]> => {
  const variables = {
    lang: "gr",
    searchQuery: "",
    category: categoryId,
    pageNumber: 0,
    pageSize: 100, // Αυξάνουμε σε 100 για να παίρνουμε περισσότερα με τη μία
    filterFlag: true,
    fields: "PRODUCT_TILE",
    plainChildCategories: true
  };

  const extensions = {
    persistedQuery: {
      version: 1,
      sha256Hash: "afce78bc1a2f0fe85f8592403dd44fae5dd8dce455b6eeeb1fd6857cc61b00a2"
    }
  };

  const url = `https://www.ab.gr/api/v1/?operationName=GetCategoryProductSearch&variables=${encodeURIComponent(JSON.stringify(variables))}&extensions=${encodeURIComponent(JSON.stringify(extensions))}`;

try {
    const res = await fetch(url, { headers: AB_HEADERS });
    if (!res.ok) return [];

    const json = await res.json() as any;
    const items = json.data?.categoryProductSearch?.products || [];

    return items.map((item: any) => {
      // 1. Εξαγωγή Τιμής - Ο ΑΒ έχει πολλές εναλλακτικές
      // Προτεραιότητα: Προσφορά > Τρέχουσα > Unit Price
      const currentPrice = 
        item.price?.current?.value || 
        item.price?.value || 
        item.price?.unitPrice || 
        0;
      
      // 2. Εξαγωγή Εικόνας
      // Στο GraphQL συνήθως είναι στο item.images[0].url
      let imageUrl = "";
      if (item.images && item.images.length > 0) {
        imageUrl = item.images[0].url;
      } else if (item.image) {
        imageUrl = item.image;
      }
      
      // Διόρθωση URL
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `https://www.ab.gr${imageUrl}`;
      }

      return {
        externalId: item.code,
        name: item.name,
        price: currentPrice,
        isOffer: item.price?.isPromotion || false,
        offerPrice: currentPrice,
        image: imageUrl || "https://via.placeholder.com/150",
        url: `https://www.ab.gr${item.url}`,
        categories: [item.categoryName || ""],
      };
    });
  } catch (err) {
    logger.error("AB_CATEGORY_FETCH_FAILED", { event: "AB_CATEGORY_FETCH_FAILED", module: "ingestion/ab/index", categoryId, message: err instanceof Error ? err.message : String(err) });
    return [];
  }
};

export const abIngestionPlugin = async (_storeId: string): Promise<IngestedProductRow[]> => {
  let allProducts: IngestedProductRow[] = [];
  logger.info("AB_INGESTION_START", { event: "AB_INGESTION_START", module: "ingestion/ab/index", categoryCount: AB_CATEGORIES.length });

  for (const cat of AB_CATEGORIES) {
    logger.info("AB_SCANNING_CATEGORY", { event: "AB_SCANNING_CATEGORY", module: "ingestion/ab/index", name: cat.name, id: cat.id });
    const products = await fetchAbCategory(cat.id);
    logger.info("AB_CATEGORY_RESULTS", { event: "AB_CATEGORY_RESULTS", module: "ingestion/ab/index", name: cat.name, productCount: products.length });
    allProducts = [...allProducts, ...products];
    await wait(1000);
  }
  return allProducts;
};