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

## UPI payments (recommended setup)

Customers check out through Shopify, choose a manual **UPI** payment method, and the order is created as
**Payment pending**. On the Thank you page a **Pay with UPI** button reveals a QR for the exact total. That block
is a small private app in [`upi-qr-app/`](upi-qr-app/README.md), which has the full setup steps. You then confirm,
cancel, fulfill and mark delivered in Shopify admin.

## Theme UPI payment page (fallback)

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

## Delivery area: Jaipur only (for now)

**Theme settings → Delivery area** controls where you deliver. The defaults are city *Jaipur*, state *Rajasthan*, and pincodes `302` (every Jaipur city pincode, 302001–302044). The theme then:

- shows the delivery message first in the announcement bar, in the footer, and on every product page (with a pincode checker);
- locks **Check out** on the cart page until the shopper enters a pincode you deliver to. The pincode is saved on the order as the *Delivery pincode* note;
- sends shoppers from other cities to the **"Interested in buying? Let us know"** form.

**Make checkout itself refuse other addresses (do this too).** The theme can't control Shopify's checkout pages. A custom app can't either: address checks at checkout (checkout rules and checkout UI extensions) only work on Shopify Plus. Shopify's shipping settings work on every plan:

1. Settings → **Shipping and delivery** → **Shipping** → open your shipping profile. Delete the shipping rates for India, or remove India from the zone, so Shopify doesn't ship anywhere by regular shipping.
2. Same page → **Local delivery** → turn it on for your location → **Delivery zones: Use postal codes** → enter `302` (or the exact Jaipur pincodes you serve). Set the price (₹0 for free) and delivery information → Save.
3. Shoppers with an address outside those pincodes now see "no delivery options available" at checkout and can't place the order.

To expand later, add pincodes in both places: Local delivery, and Theme settings → Delivery area. To lift the limit completely, untick *Deliver to one city only* and add normal shipping rates back.

## "Interested in buying? Let us know"

`sections/interest-form.liquid` sits on the home page (link: `/#interest`). It asks for name, phone, city and state, plus an optional email and product. It uses Shopify's own contact form, so **each entry arrives as an email** at your store contact email (Settings → General). No app is needed. The subject is "New customer message", and the body lists the city and state.

Optional standalone page: Online Store → Pages → Add page, title "Interested", template **page.interest** → then choose it in Theme settings → Delivery area → *"Let us know" page*.

If entries don't arrive, check spam, and check that Online Store → Preferences → Spam protection isn't blocking contact forms.

## Product reviews (no app needed)

Every product page has a **Reviews** section, with star ratings under the product title and on catalogue cards.
Reviews are stored as **comments on one blog post** and approved in Shopify admin.

One-time setup in Shopify admin:
1. **Online Store → Blog posts → Manage blogs → Add blog**. Title: `Reviews`.
   Under *Comments*, choose **"Comments are allowed, pending moderation"**.
   Make sure the blog's URL handle is `reviews`.
2. **Blog posts → Add blog post**. Title: `Product reviews`, Blog: `Reviews`, Visibility: **Visible**.
   Its handle must be `product-reviews`; check the SEO section at the bottom.
3. That's it. Manage reviews from the **Customer reviews** card on each product page in admin (see `upi-qr-app/README.md`). Shopify's own **Online Store → Blog posts → Manage comments** works too.

Reviewers don't sign up or log in; they give a **name and phone number**. Shopify comments need an email address, so the phone is stored in the email field as `91XXXXXXXXXX@example.com`. That keeps it private: only you see it, in admin.
   Each comment starts with a tag like `[[diya-cascade-fountain|5|Glows beautifully]]`, which shows the product, rating and headline. Don't edit the tag.

The blog post path can be changed in **Theme settings → Reviews**. Card stars can also be switched off there.
Approved reviews are read from the blog post page itself (`sections/review-data.liquid`), up to 500 in total.

**Troubleshooting:** open any product page with `?reviews_debug=1` added to the URL. A line under the reviews section tells you what it found, for example "HTTP 404 … does the blog post exist and is it visible?" or "Reviews OK: 3 approved in total".

## Branded checkout

Shopify's checkout can't be styled by the theme. Brand it in **Settings → Checkout → Customize → Settings (brush icon)**.
Ready-made images are in `catalogue/checkout/`:

| Editor setting | Value |
| --- | --- |
| Logo | `checkout-logo-light.png` when using the banner, otherwise `checkout-logo-dark.png` |
| Header → Banner / background image | `checkout-banner.png` |
| Main area background color | `#FAF6EF` (ivory) |
| Order summary background color | `#F1E7D6` (sand) |
| Accent color | `#9A7430` (deep gold) |
| Button color | `#0D1330` (midnight) |
| Errors color | `#B3261E` |
| Heading font | Playfair Display |
| Body font | Assistant |
| Corner radius | Large / rounded |
