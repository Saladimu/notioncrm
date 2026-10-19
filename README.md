# Notion Market Dashboard

A single-file, offline-capable web dashboard for analyzing your Notion Market sales
CSV exports. Upload a CSV (or load sample data) and get KPIs, charts, and a product
breakdown instantly. No build step, no backend, no account required.

**Live site:** https://notioncrm.pages.dev/

## Features

- KPI cards: total downloads, free vs paid, revenue, net earnings, unique customers,
  average order value, and conversion rate.
- Charts: free vs paid split, monthly download trend, monthly revenue, top products,
  stacked free/paid breakdown, and locale distribution.
- Product breakdown table with search, click-to-sort columns, and Mixed (free + paid) badges.
- Filters: year, month, product type (free/paid), locale, and order status
  (exclude refunds, all, refunded/cancelled).
- Lead export: download a deduplicated customer list (email, first/last seen, downloads,
  products, locale) that respects the active filters.
- Local persistence: uploaded data is saved in the browser and restored on reload.
- Sample data loader so you can preview the dashboard without a file (loads the bundled
  `sample-data.csv` with 1,960 sample orders).

## Getting Started

The hosted version is available at https://notioncrm.pages.dev/ — just open it in a browser.

To run it locally, open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

The dashboard loads Chart.js and PapaParse from a CDN, so an internet connection is
required on first load for the charts and CSV parsing to work.

## Usage

1. Click **Settings**.
2. Drag and drop your CSV file, or click **Sample Data** (or **Load Sample Data** on the
   empty screen) to try it with the bundled sample.
3. Use the filter bar to narrow by year, month, type, locale, or status.
4. Search and sort the product table as needed.
5. Click **Export Lead CSV** to download the customer list for the current selection.

### Expected CSV columns

`Date`, `Listing price`, `Discounted price`, `Tax amount`,
`Total customer payment`, `Seller transfer amount`, `Product name`,
`Product slug`, `Product Type`, `Locale`, `Status`, `Customer email`, `Coupon code`.

Column names are matched case-insensitively and tolerate surrounding whitespace, so most
Notion Market exports work as-is. Rows missing `Date` or `Product name` are skipped.

### How values are derived

- A row is **paid** when the listing price or total customer payment is greater than zero.
- A row is **refunded** when its status contains refund, cancel, fail, or void. Refunded
  rows are excluded by default (Status = Exclude Refunds).
- **Revenue** sums total customer payment; **Net earnings** sums seller transfer amount.
- **Conversion rate** is paid orders divided by total orders.

## AI Assistant

The **Ask AI** button answers natural-language questions about the data in the current
filters (top products, best month, conversion ideas, summaries). Answers are generated
from aggregated statistics only — customer emails are never included in the request.

The AI is served by a Cloudflare Pages Function at `functions/api/ai.js` (`POST /api/ai`),
so the API key stays on the server and is never sent to the browser.

### Setup

1. Set these environment variables in the Cloudflare Pages project
   (Settings -> Environment variables) for both Production and Preview:

   - `USER_LLM_API_KEY` — your own LLM API key
   - `USER_LLM_BASE_URL` — e.g. `https://api.openai.com/v1`
   - `USER_LLM_MODEL` — e.g. `gpt-4o-mini`
   - `ALLOWED_ORIGINS` — comma-separated origins (defaults include `notioncrm.pages.dev`)

2. Redeploy. Cloudflare picks up the function from the `functions/` directory automatically.

### Local development

Pages Functions do not run under a plain static server. A simple preview such as
`python3 -m http.server 8000` cannot serve `POST /api/ai`, so the **Ask AI** panel will
report that the endpoint is unavailable there. Use Wrangler for local AI testing:

```bash
cp .env.example .dev.vars
npx wrangler pages dev .
```

Then open the URL Wrangler prints (usually http://localhost:8788). Wrangler reads
`.dev.vars` automatically; `.env` and `.dev.vars` are git-ignored.

For production, deploy through Cloudflare Pages. The function in `functions/` is detected
automatically, and the variables must be set in the Pages project (not in a committed file).

### AI notes

- `USER_LLM_API_KEY` is read only on the server via `env`; client code never reads it and
  the key is never sent to the browser.
- Only aggregated statistics (totals, top products, monthly trends, locales) are sent to the
  model. Customer emails and other personal data are excluded.
- `ALLOWED_ORIGINS` restricts which browser origins may call the endpoint. This is a basic
  safeguard, not authentication.
- There is no built-in rate limiting or usage quota. Add a Cloudflare rate-limiting or WAF
  rule before making the endpoint publicly reachable, otherwise a third party could consume
  your LLM quota.
- The request context is capped at ~12 KB and the question at 500 characters.
- The endpoint returns generic errors and does not echo upstream responses, so provider
  details and credentials are not exposed to the client.

### Troubleshooting

- **"AI endpoint not available"** — you are on a static server; deploy to Pages or run
  `npx wrangler pages dev .`.
- **"AI is not configured on the server"** — `USER_LLM_API_KEY` is missing from the Pages
  environment (set it for both Production and Preview, then redeploy).
- **"Origin not allowed"** — add your site origin to `ALLOWED_ORIGINS`.
- **"AI provider error (401/403)"** — the key is invalid or lacks access to the chosen model.
- **"AI provider error (429)"** — rate limit or quota reached at the provider.

## Notes

- All processing happens in the browser. Your CSV and customer emails never leave the device;
  the AI feature sends only aggregated statistics (no emails).
- Data is stored in `localStorage` under the key `nm_dashboard_data_v1`. Use
  **Clear Saved Data** in Settings to remove it.
- Because emails are persisted locally, avoid using this on a shared or public computer.

## Project Structure

```
index.html           The entire application (markup, styles, and logic)
sample-data.csv      Bundled sample export used by the Sample Data button
icon.png             Favicon and app icon
functions/api/ai.js  Cloudflare Pages Function (server-side AI proxy)
.env.example         Placeholder env vars for the AI function
wrangler.toml        Optional local dev config for Pages Functions
README.md            This file
```

The Sample Data button fetches `sample-data.csv` from the same directory, so the page
should be served over HTTP (see Getting Started) for it to load.

## License

Provided as-is for personal use with your own Notion Market data.
