import puppeteer from 'puppeteer';
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

async function run() {
  logger.info("AB_SCRAPER_START", { event: "AB_SCRAPER_START", module: "ingestion/ab-scraper" });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = await browser.newPage();
  
  // Καταγραφή ΟΛΩΝ των κλήσεων για να δούμε τι συμβαίνει
  page.on('response', async (response) => {
    const url = response.url();
    // Debug: console.log("🔍 Request to:", url.substring(0, 60)); // Προαιρετικό για έλεγχο
    
    if (url.includes('graphql')) {
      try {
        const text = await response.text();
        if (text.includes('products')) {
          const json = JSON.parse(text);
          const products = json.data?.categoryProductSearch?.products || 
                           json.data?.productSearch?.products || [];
          
          if (products.length > 0) {
            logger.info("AB_SCRAPER_PRODUCTS_FOUND", { event: "AB_SCRAPER_PRODUCTS_FOUND", module: "ingestion/ab-scraper", count: products.length });
            await saveToDb(products);
          }
        }
      } catch (e) {}
    }
  });

  logger.info("AB_SCRAPER_NAVIGATING", { event: "AB_SCRAPER_NAVIGATING", module: "ingestion/ab-scraper" });
  await page.goto('https://www.ab.gr/el/eshop/Vasika-typopoiimena-trofima/Zymarika/c/010002001', {
    waitUntil: 'networkidle2'
  });

  logger.info("AB_SCRAPER_COOKIES", { event: "AB_SCRAPER_COOKIES", module: "ingestion/ab-scraper" });
  await new Promise(r => setTimeout(r, 4000));

  // ΠΕΡΙΜΕΝΟΥΜΕ ΕΝΑ ΠΡΟΪΟΝ ΧΕΙΡΟΚΙΝΗΤΑ
  logger.info("AB_SCRAPER_WAITING_LIST", { event: "AB_SCRAPER_WAITING_LIST", module: "ingestion/ab-scraper" });
  try {
    await page.waitForSelector('article', { timeout: 10000 });
  } catch (e) {
    logger.warn("AB_SCRAPER_PRODUCTS_SLOW", { event: "AB_SCRAPER_PRODUCTS_SLOW", module: "ingestion/ab-scraper" });
  }

  logger.info("AB_SCRAPER_SCROLLING", { event: "AB_SCRAPER_SCROLLING", module: "ingestion/ab-scraper" });
  for (let i = 0; i < 15; i++) {
    // Κάνουμε scroll και κουνάμε το ποντίκι λίγο για να φανεί "ανθρώπινο"
    await page.mouse.wheel(0, 400);
    await new Promise(r => setTimeout(r, 1500));
    process.stdout.write("↓");
    
    // Κάθε 3 scrolls κάνουμε ένα μικρό κλικ στο κενό για να "ξυπνήσει" η σελίδα
    if (i % 3 === 0) await page.mouse.click(100, 100);
  }

  logger.info("AB_SCRAPER_DONE", { event: "AB_SCRAPER_DONE", module: "ingestion/ab-scraper" });
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

async function saveToDb(products: any[]) {
  const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
  if (!store) return;

  for (const item of products) {
    const priceValue = item.price?.current?.value || 0;
    await prisma.product.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
      update: { name: item.name },
      create: {
        storeId: store.id,
        externalId: item.code,
        name: item.name,
        imageUrl: item.images?.[0]?.url || "",
      }
    });

    await prisma.priceSnapshot.create({
      data: {
        productId: (await prisma.product.findFirst({ where: { externalId: item.code, storeId: store.id } }))?.id || "",
        price: priceValue.toString(),
        collectedAt: new Date()
      }
    });
  }
  logger.info("AB_SCRAPER_DB_UPDATED", { event: "AB_SCRAPER_DB_UPDATED", module: "ingestion/ab-scraper" });
}

// ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΚΛΕΙΔΙ: Global catch για να δούμε το σφάλμα
logger.info("AB_SCRAPER_SCRIPT_STARTED", { event: "AB_SCRAPER_SCRIPT_STARTED", module: "ingestion/ab-scraper" });
run().catch(err => {
  logger.error("AB_SCRAPER_FATAL", { event: "AB_SCRAPER_FATAL", module: "ingestion/ab-scraper", message: err instanceof Error ? err.message : String(err), error: err });
});