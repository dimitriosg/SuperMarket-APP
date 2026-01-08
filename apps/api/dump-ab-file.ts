// apps/api/dump-ab-file.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function dumpFromFile() {
  try {
    const path = "./AB-JSON-RAW-REQUEST.txt";
    const file = Bun.file(path);

    if (!(await file.exists())) {
      console.error("❌ Το αρχείο δεν βρέθηκε!");
      return;
    }

    const text = await file.text();
    console.log("🧹 Εκτελώ 'Brute Force' καθαρισμό...");

    // 1. Αφαιρούμε ΟΛΟΥΣ τους χαρακτήρες αλλαγής γραμμής και tabs
    // 2. Αντικαθιστούμε τα NBSP (\u00A0) με κανονικά κενά
    // 3. Αφαιρούμε τα κενά ανάμεσα σε δομικά στοιχεία (π.χ. : , { } [ ]) 
    //    αλλά προσέχουμε να ΜΗΝ χαλάσουμε τα ονόματα μέσα στα strings.
    
    const cleanJson = text
      .replace(/\u00A0/g, " ")      // Fix NBSP
      .replace(/\uFEFF/g, "")       // Fix BOM
      .replace(/\r?\n|\r/g, " ")    // Κατάργηση όλων των Newlines
      .replace(/\s+/g, " ")         // Σύμπτυξη πολλαπλών κενών σε ένα
      .trim();

    console.log("🎯 Προσπάθεια Parsing...");
    const json = JSON.parse(cleanJson);
    const products = json.data?.categoryProductSearch?.products || [];

    if (products.length === 0) {
      console.error("❌ Το JSON διαβάστηκε αλλά η λίστα προϊόντων είναι άδεια.");
      return;
    }

    const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
    if (!store) throw new Error("Store AB not found");

    console.log(`🚀 Βρέθηκαν ${products.length} προϊόντα. Ενημέρωση DB...`);

    for (const item of products) {
      const priceValue = item.price?.current?.value || 0;
      let img = item.images?.[0]?.url || "";
      if (img.startsWith("/")) img = `https://www.ab.gr${img}`;

      const dbProduct = await prisma.product.upsert({
        where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
        update: { name: item.name, imageUrl: img },
        create: {
          storeId: store.id,
          externalId: item.code,
          name: item.name,
          imageUrl: img,
        }
      });

      await prisma.priceSnapshot.create({
        data: { 
          productId: dbProduct.id, 
          price: priceValue.toString(), 
          collectedAt: new Date() 
        }
      });
      console.log(`✅ Καταχωρήθηκε: ${item.name}`);
    }

    console.log("\n✨ ΕΠΙΤΥΧΙΑ! Ο συγχρονισμός ολοκληρώθηκε.");
  } catch (err: any) {
    console.error("❌ ΑΠΟΤΥΧΙΑ PARSING:");
    console.error(err.message);
    
    // Αν αποτύχει, θα μας δείξει πού ακριβώς "σκαλώνει"
    const pos = err.message.match(/at position (\d+)/);
    if (pos) {
      const index = parseInt(pos[1]);
      // console.log("Σφάλμα γύρω από:", text.substring(index - 20, index + 20));
    }
  } finally {
    await prisma.$disconnect();
  }
}

dumpFromFile();