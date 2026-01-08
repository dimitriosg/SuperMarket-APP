// apps/api/src/ingestion/ab/index.ts
import { IngestedProductRow } from "@repo/shared";
import { AB_HEADERS, AB_CATEGORIES } from "./config";

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
    console.error(`[AB] Failed for ${categoryId}:`, err);
    return [];
  }
};

export const abIngestionPlugin = async (_storeId: string): Promise<IngestedProductRow[]> => {
  let allProducts: IngestedProductRow[] = [];
  console.log(`[AB] Ξεκινάει η σάρωση για ${AB_CATEGORIES.length} κατηγορίες...`);

  for (const cat of AB_CATEGORIES) {
    console.log(`[AB] Scanning: ${cat.name} (${cat.id})`);
    const products = await fetchAbCategory(cat.id);
    console.log(`   > Βρέθηκαν ${products.length} προϊόντα.`);
    allProducts = [...allProducts, ...products];
    await wait(1000);
  }
  return allProducts;
};