import { test, expect } from "@playwright/test";

const searchResults = [
  {
    id: "milk-1",
    name: "Γάλα Πλήρες 1L",
    image: null,
    ean: "1234567890",
    bestPrice: 1.5,
    offers: [
      { store: "Σκλαβενίτης", price: "1.50", date: "2024-01-01" },
      { store: "ΑΒ Βασιλόπουλος", price: "1.60", date: "2024-01-02" },
    ],
  },
  {
    id: "milk-2",
    name: "Γάλα Χαμηλών Λιπαρών 1L",
    image: null,
    ean: "0987654321",
    bestPrice: 1.7,
    offers: [
      { store: "Σκλαβενίτης", price: "1.70", date: "2024-01-01" },
      { store: "ΑΒ Βασιλόπουλος", price: "1.80", date: "2024-01-02" },
    ],
  },
];

const comparisonResponse = {
  data: [
    {
      storeName: "Σκλαβενίτης",
      logo: "https://placehold.co/40x40?text=S",
      totalCost: 3.2,
      foundItems: 2,
      missingItems: 0,
      items: [],
    },
    {
      storeName: "ΑΒ Βασιλόπουλος",
      logo: "https://placehold.co/40x40?text=AB",
      totalCost: 3.4,
      foundItems: 2,
      missingItems: 0,
      items: [],
    },
  ],
};

test("User can search for \"γάλα\" and see results", async ({ page }) => {
  await page.route("**/products/search**", async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(query?.toLowerCase().includes("γάλα") ? searchResults : []),
    });
  });

  await page.goto("/home");
  await page.click("#product-search-input");
  await page.fill("#product-search-input", "γάλα");
  await page.keyboard.press("Enter");

  await expect(page.getByText("Γάλα Πλήρες 1L")).toBeVisible();
  await expect(page.getByText("Γάλα Χαμηλών Λιπαρών 1L")).toBeVisible();
});

test("User can add products to basket", async ({ page }) => {
  await page.route("**/products/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(searchResults),
    });
  });

  await page.goto("/home");
  await page.click("#product-search-input");
  await page.fill("#product-search-input", "γάλα");
  await page.keyboard.press("Enter");

  const addButtons = page.getByRole("button", { name: "Προσθηκη" });
  await addButtons.nth(0).click();
  const basketPanel = page.locator("aside");
  await expect(basketPanel.getByText("Γάλα Πλήρες 1L")).toBeVisible();

  await page.getByRole("button", { name: "✕" }).click();

  await addButtons.nth(1).click();
  await expect(basketPanel.getByText("Γάλα Χαμηλών Λιπαρών 1L")).toBeVisible();
});

test("User can compare basket across 2 stores", async ({ page }) => {
  await page.route("**/products/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(searchResults),
    });
  });

  await page.route("**/basket/analyze", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(comparisonResponse),
    });
  });

  await page.goto("/home");
  await page.click("#product-search-input");
  await page.fill("#product-search-input", "γάλα");
  await page.keyboard.press("Enter");

  await page.getByRole("button", { name: "Προσθηκη" }).first().click();

  const basketPanel = page.locator("aside");
  await expect(basketPanel.getByText("Σκλαβενίτης")).toBeVisible();
  await expect(basketPanel.getByText("ΑΒ Βασιλόπουλος")).toBeVisible();
});

test("User can get AI suggestions and add them to basket", async ({ page }) => {
  await page.route("**/api/ai/suggestions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        suggestions: [
          {
            id: "ai-1",
            name: "Μπανάνες",
            category: "Φρούτα",
            price: 2.5,
            rationale: "Ταιριάζει με το πρωινό σου",
          },
        ],
        metadata: { model: "test", latency_ms: 120 },
      }),
    });
  });

  await page.goto("/shopping-list");
  await page.click("text=✨ Δώσε μου ιδέες");

  await expect(page.getByText("Μπανάνες")).toBeVisible();
  await page.getByRole("button", { name: "Προσθήκη" }).click();
  await expect(page.getByRole("listitem", { name: "Μπανάνες" })).toBeVisible();
});

test("User sees error message if search fails", async ({ page }) => {
  await page.route("**/products/search**", async (route) => {
    await route.fulfill({ status: 500, body: "Server error" });
  });

  await page.goto("/home");
  await page.click("#product-search-input");
  await page.fill("#product-search-input", "γάλα");
  await page.keyboard.press("Enter");

  await expect(page.getByText("Η αναζήτηση απέτυχε. Δοκίμασε ξανά.")).toBeVisible();
});

test("User can retry failed requests", async ({ page }) => {
  let attempts = 0;

  await page.route("**/products/search**", async (route) => {
    attempts += 1;

    if (attempts === 1) {
      await route.fulfill({ status: 500, body: "Server error" });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(searchResults),
    });
  });

  await page.goto("/home");
  await page.click("#product-search-input");
  await page.fill("#product-search-input", "γάλα");
  await page.keyboard.press("Enter");

  await expect(page.getByText("Η αναζήτηση απέτυχε. Δοκίμασε ξανά.")).toBeVisible();
  await page.click("text=Δοκίμασε ξανά");

  await expect(page.getByText("Γάλα Πλήρες 1L")).toBeVisible();
});
