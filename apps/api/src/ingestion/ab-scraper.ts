import puppeteer from 'puppeteer';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("🚀 [1/4] Προσπάθεια εκκίνησης Browser...");

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
            console.log(`\n📦 ΜΠΙΝΓΚΟ! Βρέθηκαν ${products.length} προϊόντα.`);
            await saveToDb(products);
          }
        }
      } catch (e) {}
    }
  });

  console.log("🌐 [2/4] Μετάβαση στη σελίδα του ΑΒ...");
  await page.goto('https://www.ab.gr/el/eshop/Vasika-typopoiimena-trofima/Zymarika/c/010002001', {
    waitUntil: 'networkidle2'
  });

  console.log("🍪 ΠΑΤΑ ΤΑ COOKIES!");
  await new Promise(r => setTimeout(r, 4000));

  // ΠΕΡΙΜΕΝΟΥΜΕ ΕΝΑ ΠΡΟΪΟΝ ΧΕΙΡΟΚΙΝΗΤΑ
  console.log("⏳ Περιμένω να φορτώσει η λίστα...");
  try {
    await page.waitForSelector('article', { timeout: 10000 });
  } catch (e) {
    console.log("⚠️ Τα προϊόντα αργούν, ξεκινάω scroll ούτως ή άλλως...");
  }

  console.log("🖱️ [3/4] Scrolling με κινήσεις ποντικιού...");
  for (let i = 0; i < 15; i++) {
    // Κάνουμε scroll και κουνάμε το ποντίκι λίγο για να φανεί "ανθρώπινο"
    await page.mouse.wheel(0, 400);
    await new Promise(r => setTimeout(r, 1500));
    process.stdout.write("↓");
    
    // Κάθε 3 scrolls κάνουμε ένα μικρό κλικ στο κενό για να "ξυπνήσει" η σελίδα
    if (i % 3 === 0) await page.mouse.click(100, 100);
  }

  console.log("\n✅ [4/4] Ολοκληρώθηκε.");
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
  console.log("✨ DB Updated!");
}

// ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΚΛΕΙΔΙ: Global catch για να δούμε το σφάλμα
console.log("🎬 ΤΟ SCRIPT ΞΕΚΙΝΗΣΕ ΝΑ ΕΚΤΕΛΕΙΤΑΙ...");
run().catch(err => {
  console.error("❌ ΜΟΙΡΑΙΟ ΣΦΑΛΜΑ:");
  console.error(err);
});