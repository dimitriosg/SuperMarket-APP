import { IngestedProductRow } from "@repo/shared";
import * as cheerio from "cheerio";
import { HEADERS, CATEGORY_URLS } from "./config";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeUrl = async (url: string): Promise<IngestedProductRow[]> => {
    try {
        console.log(`[Sklavenitis] Scraping: ${url}`);
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) return [];

        const html = await res.text();
        const $ = cheerio.load(html);
        const products: IngestedProductRow[] = [];

        $(".product").each((_, element) => {
            const el = $(element);
            const name = el.find(".product__title a").text().trim();
            const priceText = el.find(".price").text().replace("€", "").replace(",", ".").trim();
            const price = parseFloat(priceText);
            
            let image = el.find("img").attr("data-src") || el.find("img").attr("src") || "";
            if (image && !image.startsWith("http")) image = `https://www.sklavenitis.gr${image}`;
            
            const link = el.find(".product__title a").attr("href") || "";
            const externalId = link.split("/").filter(Boolean).pop() || name;

            if (name && !isNaN(price)) {
                products.push({
                    externalId, name, price, isOffer: false, offerPrice: price, image,
                    url: link.startsWith("http") ? link : `https://www.sklavenitis.gr${link}`,
                    categories: [],
                });
            }
        });
        return products;
    } catch (err) {
        return [];
    }
};

export const sklavenitisIngestionPlugin = async (_storeId: string): Promise<IngestedProductRow[]> => {
    let allProducts: IngestedProductRow[] = [];
    
    // 1. Προαιρετικά: Τρέχουμε το Discovery στην αρχή για να δούμε αν υπάρχουν νέα πράγματα
    // const discoveredMap = await discoverAllCategories();

    console.log(`[Sklavenitis] Ξεκινάει η σάρωση...`);

    for (const url of CATEGORY_URLS) {
        const products = await scrapeUrl(url);
        
        // Υβριδικός έλεγχος:
        if (products.length === 0) {
            console.warn(`⚠️ Η κατηγορία ${url} φαίνεται άδεια ή άλλαξε. Ίσως χρειάζεται Discovery.`);
            // Εδώ μελλοντικά μπορούμε να προσθέσουμε αυτόματη διόρθωση
        }

        allProducts = [...allProducts, ...products];
        await wait(1000); 
    }

    return allProducts;
};

// Health Check
const discoverAllCategories = async (): Promise<Record<string, string>> => {
    console.log("[Sklavenitis] Running Discovery to find all category links...");
    try {
        const res = await fetch("https://www.sklavenitis.gr/katigories/", { headers: HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const discovered: Record<string, string> = {};

        // Ψάχνουμε όλα τα links που βρίσκονται μέσα στο κεντρικό μενού κατηγοριών
        // Με βάση το PDF που μου έστειλες, τα links είναι μέσα σε λίστες
        $("a").each((_, el) => {
            const link = $(el).attr("href");
            const name = $(el).text().trim();
            
            // Κρατάμε μόνο τα links που δείχνουν σε κατηγορίες προϊόντων
            if (link && link.startsWith("/") && name.length > 2) {
                discovered[name] = `https://www.sklavenitis.gr${link}`;
            }
        });

        return discovered;
    } catch (err) {
        console.error("[Sklavenitis] Discovery failed", err);
        return {};
    }
};