import { PrismaClient, UnitType } from '@prisma/client';

const prisma = new PrismaClient();

// Βασικά Regex patterns για ελληνικά σούπερ μάρκετ
const PATTERNS = [
  { unit: UnitType.ML, regex: /(\d+(?:[.,]\d+)?)\s*(?:ml|μλ|mlit)/i },
  { unit: UnitType.L, regex: /(\d+(?:[.,]\d+)?)\s*(?:lt|l|λίτρα|λιτρα)/i },
  { unit: UnitType.G, regex: /(\d+(?:[.,]\d+)?)\s*(?:gr|g|γρ|γραμμάρια)/i },
  { unit: UnitType.KG, regex: /(\d+(?:[.,]\d+)?)\s*(?:kg|k|κιλά|κιλό)/i },
  { unit: UnitType.ITEM, regex: /(\d+)\s*(?:tem|tm|τεμ|τμχ)/i },
];

async function main() {
  console.log('🔄 Starting unit backfill...');
  
  // Φέρνουμε όλα τα προϊόντα που δεν έχουν normalized units
  const products = await prisma.product.findMany({
    where: {
      quantityValue: null,
      quantity: { not: null },
    },
  });

  console.log(`📦 Found ${products.length} products to normalize.`);

  let updatedCount = 0;

  for (const product of products) {
    if (!product.quantity) continue;

    const qtyString = product.quantity.toLowerCase().replace(',', '.'); // Normalize decimal
    let matched = false;

    for (const pattern of PATTERNS) {
      const match = qtyString.match(pattern.regex);
      if (match) {
        const value = parseFloat(match[1]);
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            quantityValue: value,
            quantityUnit: pattern.unit,
          },
        });
        
        // console.log(`✅ ${product.name}: ${product.quantity} -> ${value} ${pattern.unit}`);
        updatedCount++;
        matched = true;
        break; // Βρέθηκε match, σταματάμε
      }
    }

    if (!matched) {
      console.warn(`⚠️ Could not parse: "${product.quantity}" (ID: ${product.id})`);
    }
  }

  console.log(`🎉 Finished! Updated ${updatedCount} products.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());