import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchFromAB(categoryCode: string) {
  console.log(`📡 Κλήση API για την κατηγορία: ${categoryCode}...`);

  const query = `
    query GetCategoryProductSearch($categoryCode: String, $currentPage: Int, $pageSize: Int, $sort: String) {
      categoryProductSearch(categoryCode: $categoryCode, currentPage: $currentPage, pageSize: $pageSize, sort: $sort) {
        products {
          code
          name
          price {
            current {
              value
            }
          }
          images {
            url
          }
        }
        pagination {
          totalResults
        }
      }
    }
  `;

  const variables = {
    categoryCode: categoryCode,
    currentPage: 0,
    pageSize: 100, // Ζητάμε 100 προϊόντα με τη μία
    sort: "relevance"
  };

  try {
    const response = await fetch("https://www.ab.gr/gyre/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://www.ab.gr",
        "Referer": "https://www.ab.gr/"
      },
      body: JSON.stringify({
        operationName: "GetCategoryProductSearch",
        query: query,
        variables: variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: Μας μπλόκαρε η Akamai`);
    }

    const json: any = await response.json();
    const products = json.data?.categoryProductSearch?.products || [];

    if (products.length === 0) {
      console.log("⚠️ Το API δεν επέστρεψε προϊόντα. Ίσως χρειάζεται φρεσκάρισμα το categoryCode.");
      return;
    }

    console.log(`✅ Λήφθηκαν ${products.length} προϊόντα από το API.`);
    await saveToDb(products);

  } catch (error: any) {
    console.error("❌ Αποτυχία API:", error.message);
  }
}

async function saveToDb(products: any[]) {
  const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
  if (!store) return;

  for (const item of products) {
    const priceValue = item.price?.current?.value || 0;
    const imgUrl = item.images?.[0]?.url || "";
    const fullImgUrl = imgUrl.startsWith('http') ? imgUrl : `https://www.ab.gr${imgUrl}`;

    const dbProduct = await prisma.product.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
      update: { name: item.name, imageUrl: fullImgUrl },
      create: {
        storeId: store.id,
        externalId: item.code,
        name: item.name,
        imageUrl: fullImgUrl,
      }
    });

    await prisma.priceSnapshot.create({
      data: {
        productId: dbProduct.id,
        price: priceValue.toString(),
        collectedAt: new Date()
      }
    });
  }
  console.log("✨ Η βάση ενημερώθηκε!");
}

// Κωδικοί κατηγοριών ΑΒ:
// Ζυμαρικά: "010002001"
// Ρύζι/Όσπρια: "010002002"
fetchFromAB("010002001");