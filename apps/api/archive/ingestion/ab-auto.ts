import { chromium } from 'playwright';
import { PrismaClient } from "@prisma/client";
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Συνάρτηση αποθήκευσης στη βάση
 */
async function saveProducts(products: any[]) {
    const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
    if (!store) {
        logger.error("AB_AUTO_STORE_NOT_FOUND", { event: "AB_AUTO_STORE_NOT_FOUND", module: "ingestion/ab-auto" });
        return;
    }

    logger.info("AB_AUTO_SAVING", { event: "AB_AUTO_SAVING", module: "ingestion/ab-auto", count: products.length });

    for (const item of products) {
        try {
            const priceValue = item.price?.value || item.price?.current?.value || 0;
            const imageUrl = item.images?.find((img: any) => img.format === "xlarge")?.url || 
                             item.images?.[0]?.url || "";

            const dbProduct = await prisma.product.upsert({
                where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
                update: { 
                    name: item.name,
                    imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.ab.gr${imageUrl}`
                },
                create: {
                    storeId: store.id,
                    externalId: item.code,
                    name: item.name,
                    imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.ab.gr${imageUrl}`
                }
            });

            await prisma.priceSnapshot.create({
                data: {
                    productId: dbProduct.id,
                    price: priceValue.toString(),
                    collectedAt: new Date()
                }
            });
        } catch (err) {
            logger.error("AB_AUTO_PRODUCT_ERROR", { event: "AB_AUTO_PRODUCT_ERROR", module: "ingestion/ab-auto", product: item.name, message: err instanceof Error ? err.message : String(err) });
        }
    }
}

/**
 * Κύρια συνάρτηση Scraping
 */
async function scrapeABCategory(categoryUrl: string) {
    logger.info("AB_AUTO_BROWSER_START", { event: "AB_AUTO_BROWSER_START", module: "ingestion/ab-auto", categoryUrl });
    
    const browser = await chromium.launch({ 
        headless: false, // Βάλτο false για να βλέπεις αν όντως ανοίγει!
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }); 
    
    const context = await browser.newContext();
    const page = await context.newPage();

    // Αυξάνουμε τα timeouts γιατί ο ΑΒ είναι βαρύς
    page.setDefaultTimeout(60000);

    page.on('response', async (response) => {
        if (response.url().includes('graphql')) {
            try {
                const text = await response.text();
                if (text.includes('categoryProductSearch')) {
                    const json = JSON.parse(text);
                    const products = json.data?.categoryProductSearch?.products || [];
                    if (products.length > 0) {
                        logger.info("AB_AUTO_PRODUCTS_FOUND", { event: "AB_AUTO_PRODUCTS_FOUND", module: "ingestion/ab-auto", count: products.length });
                        await saveProducts(products);
                    }
                }
            } catch (e) {}
        }
    });

    try {
        logger.info("AB_AUTO_PAGE_LOADING", { event: "AB_AUTO_PAGE_LOADING", module: "ingestion/ab-auto" });
        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded' });
        
        // Περιμένουμε να εμφανιστεί το banner των cookies και το κλείνουμε αν μπορούμε
        // ή απλά περιμένουμε λίγο να φορτώσει το API
        logger.info("AB_AUTO_WAITING", { event: "AB_AUTO_WAITING", module: "ingestion/ab-auto" });
        await page.waitForTimeout(10000);

        logger.info("AB_AUTO_SCROLLING", { event: "AB_AUTO_SCROLLING", module: "ingestion/ab-auto" });
        for (let i = 0; i < 3; i++) {
            await page.mouse.wheel(0, 1500);
            await page.waitForTimeout(3000);
            process.stdout.write(".");
        }

    } catch (err: any) {
        logger.error("AB_AUTO_SCRAPE_ERROR", { event: "AB_AUTO_SCRAPE_ERROR", module: "ingestion/ab-auto", message: err.message });
    } finally {
        await browser.close();
        logger.info("AB_AUTO_BROWSER_CLOSED", { event: "AB_AUTO_BROWSER_CLOSED", module: "ingestion/ab-auto" });
    }
}

// Λίστα με κατηγορίες που θες να "χτενίσεις"
const categories = [
    "https://www.ab.gr/el/eshop/Vasika-typopoiimena-trofima/Zymarika/c/010002001",
    "https://www.ab.gr/el/eshop/Vasika-typopoiimena-trofima/Ryzi-Ospria/c/010002002"
];

// Εκτέλεση
(async () => {
    for (const url of categories) {
        await scrapeABCategory(url);
    }
    logger.info("AB_AUTO_ALL_CATEGORIES_DONE", { event: "AB_AUTO_ALL_CATEGORIES_DONE", module: "ingestion/ab-auto" });
    process.exit(0);
})();