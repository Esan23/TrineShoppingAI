-- Trine — deeper Firecrawl extraction signals on the scrape cache.
-- Additive/nullable: existing rows keep NULL (treated as "unknown"), and the
-- curate reader/ranker degrade gracefully when these are absent.

alter table public.scraped_products
  add column if not exists original_price numeric,  -- pre-discount list price when on sale
  add column if not exists in_stock       boolean;  -- availability; null = unknown
