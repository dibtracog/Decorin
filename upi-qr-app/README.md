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
   **Thank you** → **Add app block → UPI QR payment** → set your **UPI ID** (`9149296348@ybl`) → Save.
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
