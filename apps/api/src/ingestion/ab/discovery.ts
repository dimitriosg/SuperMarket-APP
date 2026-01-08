// apps/api/src/ingestion/ab/discovery.ts
import { AB_HEADERS } from "./config";

export const discoverAbCategories = async () => {
  console.log("[AB Discovery] Fetching category tree...");

  const body = {
    operationName: "GetCategories",
    variables: { lang: "gr" },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: "6c65083161678120300d02778734e320509a909990e793910f81d1276082a690" 
      }
    }
  };

  try {
    const res = await fetch("https://www.ab.gr/api/v1/", {
      method: "POST",
      headers: {
        ...AB_HEADERS,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const json = await res.json() as any;
    
    // Διόρθωση στο path: Ο ΑΒ τις επιστρέφει στο json.data.categories
    const categories = json.data?.categories || [];

    if (categories.length === 0) {
        console.warn("[AB Discovery] No categories found. Check if the Hash or Cookies expired.");
        return [];
    }

    const flatCategories = categories.map((cat: any) => ({
      id: cat.code,
      name: cat.name,
      // Προσθέτουμε και τις πρώτες υποκατηγορίες για να έχουμε καλύτερη εικόνα
      subCategories: cat.childCategories?.map((c: any) => c.name).join(", ").substring(0, 50) + "..."
    }));

    console.log(`[AB Discovery] Found ${flatCategories.length} main categories:`);
    console.table(flatCategories);
    
    return flatCategories;
  } catch (err) {
    console.error("[AB Discovery] Failed:", err);
    return [];
  }
};