# SuperMarket Price-Comparison Copilot (Greece)

This repository tracks the v0 MVP plan for a mobile-first PWA that compares supermarket prices across Wolt Retail, efood, My Market, AB, and other Greek chains. It focuses on Attica and barcoded items, with virtual SKUs for produce handled later.

## Product pillars
- **Data ingestion**: Plugins for Wolt Retail API, efood JSON endpoints, and web scraping (My Market, AB). Pull products, prices, promos, and stock. Respect robots and terms.
- **Catalog unification**: Normalize to canonical SKUs keyed by EAN/GTIN; use fuzzy matching for private-label or non-barcoded goods (e.g., "ρύζι" bundles, fresh produce).
- **Basket optimisation**: Given a Greek grocery list, compute cheapest single-store and best multi-store split; apply flat €3 delivery fee per chain and display disclaimer.
- **Frontend**: Mobile-first React + Tailwind PWA; paste or voice-dictate list, show comparison table with subtotals, savings highlights, and deep-links into Wolt/efood carts.
- **Monetisation**: Evaluate affiliate links, sponsored placements, and premium subscriptions.

## System architecture (MVP)
- **Ingestion workers** (Node or Python):
  - Wolt Retail: official API via authenticated client; schedule hourly sync.
  - efood: reverse-engineered JSON endpoints; add rate limits and signature refresh.
  - Web scraping: Playwright-based scrapers for My Market and AB with user-agent rotation; cache HTML to S3-compatible storage.
- **Data store**:
  - Raw layer: JSON blobs per fetch with source metadata and timestamps.
  - Clean layer: relational tables (PostgreSQL) for `products`, `stores`, `prices`, `promos`, `stock_events`, `canonical_skus`, and `sku_links`.
- **Catalog service**:
  - Deterministic matching: exact EAN/GTIN joins, normalized brand/size parsing.
  - Fuzzy matching: cosine similarity on Greek token embeddings for private-label or missing barcodes, with manual review queue.
- **Pricing engine**:
  - Input: free-text Greek list; use keyword extraction + quantity parsing (e.g., "γάλα 1L x3").
  - Output: single-store cheapest option and multi-store split with €3 per-chain delivery fee, plus savings delta.
- **API layer**: GraphQL or REST gateway exposing search, basket optimisation, and deep-link generation endpoints.
- **Frontend**:
  - React + Tailwind PWA with offline caching for the last viewed basket.
  - Voice input via Web Speech API (where supported).
  - Comparison table with per-store subtotals, promos, and deep-links to Wolt/efood carts.

## Data model sketch
- `stores(id, name, platform, city, lat, lon)`
- `products(id, source, source_product_id, name, brand, size, ean)`
- `prices(store_id, product_id, price, currency, fetched_at)`
- `promos(store_id, product_id, promo_type, value, start_at, end_at)`
- `canonical_skus(id, name, brand, size, ean, category)`
- `sku_links(canonical_sku_id, product_id, match_confidence, method)`

## Roadmap (next steps)
1. Scaffold ingestion SDK interface (TypeScript) with adapters for Wolt, efood, and scraper-backed sources.
2. Define PostgreSQL schema migrations for the tables above; seed with sample stores.
3. Build matching service with EAN-first matching and fallback fuzzy matcher; add manual review UI stub.
4. Implement basket optimisation service with delivery-fee logic and deep-link builder for Wolt/efood.
5. Ship React + Tailwind PWA shell with grocery-list input, comparison table, and basic error states.
6. Add logging/monitoring plus GDPR-compliant data retention and user consent flows.

## Compliance notes
- Respect platform terms of service; avoid automated checkout. For scraping, honor robots.txt and rotate IPs responsibly.
- Store only necessary personal data; document retention and allow deletion. No payment data stored.
- Surface disclaimer that delivery fees and real-time stock may vary.
