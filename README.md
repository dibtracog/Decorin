# DecorIn

A minimal Shopify Online Store 2.0 theme, meant as a starting point.

## Structure

| Folder       | Purpose |
|--------------|---------|
| `layout/`    | Page wrappers. `theme.liquid` wraps every page (must contain `content_for_header` and `content_for_layout`); `password.liquid` is for the password page. |
| `templates/` | One JSON file per page type (home, product, collection, cart, …) listing which sections appear on it. |
| `sections/`  | Reusable, editor-configurable blocks of Liquid. Each has a `{% schema %}` defining its settings. `header-group.json` / `footer-group.json` are section groups loaded by the layout. |
| `snippets/`  | Small partials included with `{% render 'name' %}`. |
| `assets/`    | CSS, JS, images. Referenced with `{{ 'base.css' \| asset_url }}`. |
| `config/`    | Theme-wide settings (`settings_schema.json`) and their saved values (`settings_data.json`). |
| `locales/`   | Translation strings used via `{{ 'key' \| t }}`. |

## Connect to Shopify

1. Shopify admin → **Online Store → Themes → Add theme → Connect from GitHub**.
2. Pick the `dibtracog/Decorin` repo and the `main` branch.
3. Commits to `main` sync to the theme automatically (and edits in the theme editor commit back).

## Products (catalogue/)

Products live in Shopify admin, not in the theme, so the catalogue ships as an import file:

- `catalogue/products.csv`: 25 products (Diya Cascade Fountain + 24 sample items tagged `sample`).
- `catalogue/images/`: product photos. The CSV links to them on GitHub so Shopify can download them on import.
- `catalogue/build_products_csv.py`: edit the product list here and re-run `python3 catalogue/build_products_csv.py` to regenerate the CSV.

**Import:** Shopify admin → **Products → Import** → upload `products.csv`.
To remove the filler later: filter products by tag `sample` → select all → Delete.

**Test product:** "Test Item — Dev Only" (₹1, tag `test`, no shipping required) is for testing the cart and checkout.
If you already imported `products.csv`, import `catalogue/test-product.csv` on its own to add just this item. Delete it before launch.

The homepage carousel's first slot is linked to the product handle `diya-cascade-fountain`, so it fills in automatically once the product is imported.

## Catalogue filters & sorting

The catalogue and search pages use Shopify's native filtering. Availability and Price work out of the box.
To add more filters (e.g. **Product type**, which our CSV fills in for every product), install the free
**Shopify Search & Discovery** app → Filters → Add filter → Product type → Save.

## UPI payment page

The cart's checkout button opens the payment page at **`/cart?view=payment`** (template `cart.payment.json`).
No admin setup is needed. It shows the order breakdown (product cost = price − handling fee, shipping struck
through as FREE) and a UPI QR for the exact total. On phones, a "Pay with UPI app" button opens the UPI app directly.

UPI ID, payee name, note prefix and fees are in **Customize → Cart (payment view) → UPI payment**.

### Payment reference formula

```
reference = "DI" + YYMMDD + "-" + UPPER( first 6 hex of sha256( cartToken + ":" + totalInPaise + ":" + itemCount ) )
UPI note  = "DecorIn " + reference + " Rs" + amount        e.g.  DecorIn DI261120-A9878C Rs499.00
```

- Unique per cart **and** its contents/amount: if the cart changes, the reference changes.
- Saved on the Shopify cart as attributes `Payment reference`, `Payment amount`, `Payment method`, so they
  appear on the order once checkout is connected to Shopify later.
- Payments by QR go straight to your UPI account; Shopify does not create an order for them yet. Match incoming
  payments by the reference in the UPI note.

## Local development (optional)

```bash
npm install -g @shopify/cli
shopify theme dev --store your-store.myshopify.com
shopify theme check
```
