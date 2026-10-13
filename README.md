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

## Notes

- All processing happens in the browser. Your CSV and customer emails never leave the device.
- Data is stored in `localStorage` under the key `nm_dashboard_data_v1`. Use
  **Clear Saved Data** in Settings to remove it.
- Because emails are persisted locally, avoid using this on a shared or public computer.

## Project Structure

```
index.html       The entire application (markup, styles, and logic)
sample-data.csv  Bundled sample export used by the Sample Data button
icon.png         Favicon and app icon
README.md        This file
```

The Sample Data button fetches `sample-data.csv` from the same directory, so the page
should be served over HTTP (see Getting Started) for it to load.

## License

Provided as-is for personal use with your own Notion Market data.
