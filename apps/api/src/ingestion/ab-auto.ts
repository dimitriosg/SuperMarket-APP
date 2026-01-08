import { chromium } from 'playwright';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Συνάρτηση αποθήκευσης στη βάση
 */
async function saveProducts(products: any[]) {
    const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
    if (!store) {
        console.error("❌ Το κατάστημα AB δεν βρέθηκε στη βάση. Τρέξε το seed πρώτα.");
        return;
    }

    console.log(`💾 Αποθήκευση ${products.length} προϊόντων στη βάση...`);

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
            console.error(`⚠️ Σφάλμα στο προϊόν ${item.name}:`, err);
        }
    }
}

/**
 * Κύρια συνάρτηση Scraping
 */
async function scrapeABCategory(categoryUrl: string) {
    console.log(`🚀 Εκκίνηση browser για: ${categoryUrl}`);
    
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
                        console.log(`📦 ΜΠΙΝΓΚΟ! Λήφθηκαν ${products.length} προϊόντα.`);
                        await saveProducts(products);
                    }
                }
            } catch (e) {}
        }
    });

    try {
        console.log("🌐 Φόρτωση σελίδας...");
        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded' });
        
        // Περιμένουμε να εμφανιστεί το banner των cookies και το κλείνουμε αν μπορούμε
        // ή απλά περιμένουμε λίγο να φορτώσει το API
        console.log("⏳ Αναμονή για δεδομένα (10 δευτερόλεπτα)...");
        await page.waitForTimeout(10000);

        console.log("🖱️ Scrolling...");
        for (let i = 0; i < 3; i++) {
            await page.mouse.wheel(0, 1500);
            await page.waitForTimeout(3000);
            process.stdout.write(".");
        }

    } catch (err: any) {
        console.error("❌ Σφάλμα:", err.message);
    } finally {
        await browser.close();
        console.log("\n🏁 Browser closed.");
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
    console.log("🏁 Όλες οι κατηγορίες ολοκληρώθηκαν!");
    process.exit(0);
})();