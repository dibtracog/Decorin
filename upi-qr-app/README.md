# DecorIn UPI QR (private Shopify app)

Adds a **"Pay with UPI"** block to Shopify's **Thank you** page. It appears only when the customer chose a
manual payment method (your "UPI" method). Pressing the button shows a UPI QR for the exact order total, and the
UPI note carries the order's confirmation number so you can match payments to orders.

```
UPI note = "DecorIn " + <order confirmation number> + " Rs" + <amount>      e.g. DecorIn X7K2P9QAB Rs499.00
```

The confirmation number is shown on the order page in Shopify admin, so match it against the note in your UPI app.

No merchant account or payment gateway needed. It works on every Shopify plan.

## One-time setup (about 15 minutes, on your computer)

1. **Tools:** install [Node.js](https://nodejs.org) (LTS), then the Shopify CLI:
   ```bash
   npm install -g @shopify/cli@latest
   ```
2. **Partner account:** create a free account at [partners.shopify.com](https://partners.shopify.com).
3. **Create & deploy the app:** from this folder:
   ```bash
   cd upi-qr-app
   npm install
   shopify app config link
   shopify app deploy
   ```
   `config link` asks you to log in, then create a new app (or **pick the existing "DecorIn UPI QR"**). It fills in `shopify.app.toml`.
   The `deploy` output must list the extension **upi-qr-payment**. Confirm with **Yes** to release.
   Check: Dev Dashboard → DecorIn UPI QR → Versions → the Active version should show the extension.
4. **Install it on your store:** Partner dashboard → Apps → DecorIn UPI QR → **Distribution → Custom distribution**
   → enter your store's `.myshopify.com` domain → open the install link → Install.
5. **Add the block:** Shopify admin → **Settings → Checkout → Customize** → switch the page dropdown to
   **Thank you** → **Add app block → UPI QR payment** → set your **UPI ID** (for example `yourname@okbank`) → Save. The block stays hidden until a UPI ID is set.
6. **Create the payment method:** Shopify admin → **Settings → Payments → Manual payment methods →
   Create custom payment method**
   - Name: `UPI (Scan & Pay)`
   - Additional details: `Pay instantly with Google Pay, PhonePe, Paytm or any UPI app.`
   - Payment instructions: `On the next page, tap "Pay with UPI" to see your QR code. Your order is confirmed once we receive the payment.`

## Running orders

| Step | Shopify admin action | Customer sees |
|---|---|---|
| Customer places order | (automatic) order is **Payment pending** | Thank you page → Pay with UPI → QR → "Processing payment" |
| You see the payment in your UPI app (note has the confirmation number) | Order → **Mark as paid** | Order status page shows Paid |
| No / wrong payment | Order → **Cancel order** (refund the UPI payment from your UPI app if they paid) | Cancellation email |
| You ship it | **Fulfill items** (add tracking if any) | Shipping confirmation email + status |
| Delivered | **Mark as delivered** | Delivered status |

Tip: Settings → Notifications lets you customise these emails. Shopify Flow (free) can email "Payment received"
when an order is marked paid.

## "My orders" page (customer account)

`extensions/order-tracker` adds a **My orders** page to your customers' account (the page they reach from the person icon in the shop header). It sorts their orders into groups:

| Group | When an order is here | What you do in Shopify admin to move it on |
|---|---|---|
| **Payment processing** | Order placed, payment pending | You receive the UPI payment → order → **Mark as paid** |
| **Being delivered** | Paid, not fulfilled yet | You deliver it → **Fulfill items** |
| **Fulfilled** | Fulfilled (shows **Delivered** after **Mark as delivered**) | Nothing more |
| **Cancelled** | Cancelled orders | |

It reads live order data each time the page opens, so the status changes as soon as you change the order in admin.

**Setup (once):**
1. Deploy as usual (`shopify app deploy` in this folder, answer **Yes** to release), then approve the new permissions in your store (the app asks to read customers' own orders).
2. If deploy says the app needs **protected customer data** access: Dev Dashboard → DecorIn UPI QR → **API access** → **Protected customer data** → request access → tick *Name* and *Email*, give the reason "Show customers their own orders" → Save. Then deploy again.
3. Shopify admin → **Settings → Customer accounts** → make sure accounts are on and **Customer accounts** (the new, passwordless version) is selected.
4. Add the page to the account menu: **Content/Online Store → Menus → Customer account menu** → **Add menu item** → choose **Apps → My orders** → Save.

Customers sign in with the email they used at checkout (Shopify emails them a 6-digit code; there's no password).

## Review manager (admin block)

`extensions/review-manager` adds a **Customer reviews** card to every product page in Shopify admin (**Products → open a product**, near the bottom).
It needs no hosting and no extra app.

For each review it shows the stars, headline, text, the reviewer's **name and phone number**, the date and the status (Pending / Published / Spam).
- **Approve**: publishes a pending review on the store.
- **Spam / Hide (spam)**: takes it off the store but keeps it.
- **Delete**: removes it permanently, after a confirmation step.
- **Show** filter: All / Pending approval / Published / Spam.
- **All products** switch: manage every product's reviews from any one product page.

The app needs the `read_content,write_content` scopes (already set in `shopify.app.toml`).

Deploy it the same way as the UPI block, from the `upi-qr-app` folder:

    shopify app deploy

When Shopify says the app needs new permissions, open **Apps → DecorIn UPI QR** in admin and approve the update.
If you don't see the card on a product page, click **⋯ / "Customize blocks"** (the apps icon) at the bottom of the product page and pin **DecorIn reviews**.
