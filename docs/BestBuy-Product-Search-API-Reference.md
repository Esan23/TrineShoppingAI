# Best Buy API Reference (Product Search)
> Source: https://bestbuyapis.github.io/api-documentation/ (the live docs; `developer.bestbuy.com/documentation/*` now 404s) | Extracted: 2026-06-28
> Scoped for the **Trine Shopping AI** `curate` function — product search, pricing, reviews, images, availability.

## Quick reference
- **Auth**: API key as a query param — `?apiKey=YOUR_KEY` on every request
- **Base URL**: `https://api.bestbuy.com/v1`
- **Get a key**: https://developer.bestbuy.com/login (free, email signup)
- **Free tier**: Yes — **5 requests/sec, 50,000 calls/day** (enterprise limits on request)
- **Response format**: single item via `.json` extension; collections via `?format=json` — **defaults to XML if you omit `format`** ⚠️
- **SDKs**: Node.js — `npm install bestbuy` (official)
- **Sandbox**: None (production catalog only; keys are free)
- **OpenAPI spec**: Not published

---

## Products API — Search

### Overview
REST interface over Best Buy's entire catalog (1M+ current & historical products): pricing, availability, specs, descriptions, reviews, and images. Pricing/availability update near real-time. This is the endpoint Trine should use to fetch real listings.

### Authentication
API key on the query string. There is no header/OAuth flow.
```
?apiKey=YOUR_KEY
```
`403` is returned if the key is invalid **or** the daily call limit is exceeded.

### Base URL
```
https://api.bestbuy.com/v1
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products(<filters>)` | Search/filter the catalog (collection) |
| GET | `/products/{sku}.json` | Fetch one product by SKU |
| GET | `/products((search=term))` | Keyword search across common text fields |

Filters go **inside the parentheses**; output controls (`format`, `show`, `sort`, `pageSize`, `page`, `facet`) go in the **query string** after them.

#### GET /products(\<filters\>) — attribute search

**Search grammar**: each term is `attribute<operator>value`. Combine terms with `&` (AND) or `|` (OR); group with parentheses. Attribute **names are case-sensitive**, values are not.

**Operators**: `=` `!=` `>` `<` `>=` `<=` `in(a,b,c)`
> Tip from the docs: prefer `sku in(...)` over many `|` ORs to avoid Query-Per-Second (QPS) errors.

**Output params**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `format` | string | `xml` | Set to `json`. **Always pass this.** |
| `show` | csv | (all) | Attributes to return, e.g. `show=sku,name,salePrice`. `show=all` returns everything. |
| `sort` | string | — | `attr.asc` / `attr.desc`, comma-separated for multi-sort, e.g. `sort=customerReviewAverage.desc` |
| `pageSize` | int | `10` | Results per page, **max 100** |
| `page` | int | `1` | Page number (use `cursorMark` past page 10) |
| `facet` | string | — | Summary counts, e.g. `facet=manufacturer,5` |

**Request example** (in-stock Canon items under $1000, best-rated first):
```http
GET /v1/products(manufacturer=canon&salePrice<1000&onlineAvailability=true)?format=json&show=sku,name,salePrice,regularPrice,image,url,customerReviewAverage,customerReviewCount&sort=customerReviewAverage.desc&pageSize=10&apiKey=YOUR_KEY
Host: api.bestbuy.com
```

**Response example**:
```json
{
  "from": 1,
  "to": 10,
  "total": 307,
  "currentPage": 1,
  "totalPages": 31,
  "queryTime": "0.005",
  "totalTime": "0.035",
  "partial": false,
  "canonicalUrl": "/v1/products(manufacturer=canon&salePrice<1000)?show=...&format=json&apiKey=YOUR_KEY",
  "products": [
    {
      "sku": 6323759,
      "name": "Canon - EOS Rebel T7 DSLR Video Two Lens Kit",
      "salePrice": 549.99,
      "regularPrice": 599.99,
      "image": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6323/6323759_sa.jpg",
      "url": "https://api.bestbuy.com/click/-/6323759/pdp",
      "customerReviewAverage": "4.8",
      "customerReviewCount": 1477
    }
  ]
}
```

#### GET /products((search=term)) — keyword search
Searches across `name`, `manufacturer`, `shortDescription`, `longDescription`, `features.feature`, `details.value`. Multi-word phrases: join words with `&` (AND); a single `search=` or `|` is OR.

**Request example** ("stainless steel oven"):
```http
GET /v1/products((search=oven&search=stainless&search=steel))?format=json&show=sku,name,salePrice&apiKey=YOUR_KEY
Host: api.bestbuy.com
```

#### GET /products/{sku}.json — single product
```http
GET /v1/products/8880044.json?apiKey=YOUR_KEY
Host: api.bestbuy.com
```
```json
{ "sku": 8880044, "productId": 1484301, "name": "Batman Begins (Blu-ray Disc)" }
```

#### Search by reviews (great for Trine's ranking)
```http
GET /v1/products(customerReviewAverage>=4&customerReviewCount>100)?format=json&show=name,sku,customerReviewAverage,customerReviewCount&apiKey=YOUR_KEY
```

### Key product attributes (for `show=` and filtering)
| Attribute | Type | Notes |
|-----------|------|-------|
| `sku` | long | Unique product id |
| `name` | string | Product name |
| `salePrice` | float | Current price |
| `regularPrice` | float | List price |
| `onSale` | bool | salePrice < regularPrice |
| `dollarSavings` / `percentSavings` | num | Discount amount / percent |
| `manufacturer` | string | Brand |
| `modelNumber` | string | Mfr model number |
| `color` | string | |
| `condition` | string | new / refurbished / pre-owned |
| `customerReviewAverage` | float | Avg star rating |
| `customerReviewCount` | int | Number of reviews |
| `customerTopRated` | bool | true if avg ≥ 4.5 and ≥ 15 ratings |
| `image` | url | Standard PDP image |
| `thumbnailImage` / `largeImage` | url | Listing thumb / large |
| `shortDescription` / `longDescription` | string | |
| `url` | url | BESTBUY.COM product page (expires in 7 days) |
| `addToCartUrl` | url | Adds item to a BESTBUY.COM cart |
| `onlineAvailability` | bool | Buyable online |
| `inStoreAvailability` / `inStorePickup` | bool | In-store buy / pickup |
| `orderable` | string | Ordering status |
| `categoryPath.id` / `categoryPath.name` | string | Category filters (see Categories API) |

### Rate limits
| Tier | Requests | Window | Notes |
|------|----------|--------|-------|
| Free (default key) | 5 | per second | "QPS" errors if exceeded |
| Free (default key) | 50,000 | per day | `403` when the daily limit is exceeded |
| Enterprise | higher | — | Contact Best Buy |
> The docs themselves only reference "Query Per Second (QPS) errors" and the `403` limit code; the 5/sec + 50k/day figures are Best Buy's standard published free-tier limits.

### Pagination meta (every collection response)
`from`, `to`, `total`, `currentPage`, `totalPages`, `queryTime`, `totalTime`, `partial`, `canonicalUrl`, then the `products[]` array. Past 10 pages, switch from `page` to `cursorMark`.

### Common errors
| Code | Meaning |
|------|---------|
| 200 | OK |
| 400 | Missing key info / malformed query |
| 403 | Invalid API key, **or** call limit exceeded |
| 404 | Item not found |
| 405 | Method not allowed (e.g. POST) |
| 500 / 501 / 503 | Best Buy server error |

---

## Categories API
Resolve and filter by category. Use `categoryPath.id` (preferred) or `categoryPath.name` as a filter on `/products`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories?format=json` | List all categories (~4,300) |
| GET | `/categories(name=Sony DSLR Camera*)` | Search categories by name (wildcard `*`) |

```http
GET /v1/categories(name=Cameras*)?format=json&show=id,name,path&apiKey=YOUR_KEY
```
Then filter products: `/v1/products(categoryPath.id=abcat0401000&search=mirrorless)?format=json&...`

---

## Recommendations API  *(JSON only — no XML)*
Useful for "trending" / "people also bought" modules.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products/trendingViewed(categoryId={id})` | Trending in a category |
| GET | `/products/mostViewed` | Most-viewed overall |
| GET | `/products/{sku}/alsoViewed` | Customers also viewed |
| GET | `/products/{sku}/alsoBought` | Customers also bought |
| GET | `/products/{sku}/viewedUltimatelyBought` | Viewed → ultimately bought |

```http
GET /v1/products/trendingViewed(categoryId=abcat0400000)?apiKey=YOUR_KEY
```
Response uses `results[]` with nested `customerReviews.averageScore`, `images.standard`, `names.title`, `prices.*`. **Must query trending by category `id`, not name.**

---

## Buying Options (Open Box) API
Discounted open-box inventory (note the `/beta/` base).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/beta/products/{sku}/openBox` | Open-box offers for one SKU |
| GET | `/beta/products/openBox(sku in(...))` | Open-box for a list of SKUs |
| GET | `/beta/products/openBox(categoryId={id})` | Open-box by category |

---

## Stores API (brief)
Store locations, hours, services, and **store-specific** in-store availability. Base `https://api.bestbuy.com/v1/stores(...)`, with an `area(lat,lng,radius)` function for geo search. Out of scope for Trine's online product search but available if you add a "buy near me" feature.

---

## SDKs
| Language | Package | Type | Install |
|----------|---------|------|---------|
| Node.js | `bestbuy` | Official | `npm install bestbuy` |
```js
const bby = require('bestbuy')('YOUR_KEY');
const data = await bby.products(
  'manufacturer=canon&salePrice<1000',
  { show: 'sku,name,salePrice,image,url,customerReviewAverage', sort: 'customerReviewAverage.desc', pageSize: 10 }
);
```

## Pricing
| Plan | Price | Calls included |
|------|-------|----------------|
| Developer (default) | Free | 50,000/day @ 5/sec |
| Enterprise | Contact Best Buy | Negotiated |

---

## Notes for developers (Trine integration)
Trine already calls Best Buy in [`netlify/functions/curate.ts`](../netlify/functions/curate.ts) (the `retailers` tier, alongside eBay). This reference maps cleanly onto Trine's `ShortlistOption`:

| `ShortlistOption` field | Best Buy attribute |
|-------------------------|--------------------|
| `name` | `name` |
| `price` | `salePrice` (fall back to `regularPrice`) |
| `imageUrl` | `image` (or `largeImage`) |
| `retailer` | constant `"Best Buy"` |
| `reviewScore` | `customerReviewAverage` |
| `url` | `url` (PDP click link) |

**Recommended single query for the curate function** — keyword + budget + in-stock, best-rated first, one round-trip:
```
https://api.bestbuy.com/v1/products((search=<kw1>&search=<kw2>)&salePrice<=<budgetMax>&onlineAvailability=true)
  ?format=json
  &show=sku,name,salePrice,regularPrice,image,url,addToCartUrl,customerReviewAverage,customerReviewCount,manufacturer,modelNumber
  &sort=customerReviewAverage.desc
  &pageSize=10
  &apiKey=${BESTBUY_API_KEY}
```

**Gotchas to bake in:**
- Always send `format=json` — collections default to **XML**.
- `url`/`addToCartUrl` links **expire after 7 days**; per Best Buy's ToS you may only cache responses temporarily — fetch fresh, don't store long-term.
- Stay under **5 req/sec**; batch SKU lookups with `sku in(...)` rather than parallel calls to avoid QPS errors.
- Set the env var **`BESTBUY_API_KEY`** in Netlify (currently unset — the `retailers` tier silently falls back to the `ai`/`demo` tier without it).
- Music/movie data requires joining Best Buy's Affiliate Program; for affiliate sale credit, use `affiliateUrl`/`affiliateAddToCartUrl` with your Impact Partner ID.
