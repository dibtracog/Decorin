"""Generates catalogue/products.csv for Shopify's product importer.

Edit the PRODUCTS list below and re-run:  python3 catalogue/build_products_csv.py
Then upload in Shopify admin: Products -> Import.
"""
import csv, os, re

RAW = "https://raw.githubusercontent.com/dibtracog/Decorin/main/catalogue/images/"
HEADERS = ["Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags", "Published",
           "Option1 Name", "Option1 Value", "Variant SKU", "Variant Grams", "Variant Inventory Tracker",
           "Variant Inventory Qty", "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
           "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable", "Image Src",
           "Image Position", "Image Alt Text", "Gift Card", "SEO Title", "SEO Description", "Status"]

def details(rows):
    cells = "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in rows)
    return f"<h3>Details</h3><table>{cells}</table>"

def highlights(items):
    return "<h3>Highlights</h3><ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"

PRODUCTS = [
    # ---------------- Real products ----------------
    dict(
        title="Diya Cascade Fountain", type="Tabletop Fountains", tags="fountains, new-year-pick, featured",
        price="2499", grams=1700,
        images=["diya-cascade-fountain-1.webp", "diya-cascade-fountain-2.webp", "diya-cascade-fountain-3.webp"],
        seo="A four-tier tabletop water fountain with a warm LED glow and sandstone-textured finish.",
        body=(
            "<p>Water spills gently from bowl to bowl down a sweeping, sandstone-textured curve, "
            "coming to rest in a softly glowing diya-style basin. The quiet sound of flowing water and "
            "warm LED light bring a calm, grounding presence to any room. A serene way to welcome the new year.</p>"
            + highlights([
                "Four-tier cascading water flow",
                "Built-in warm LED light",
                "Sandstone-textured finish on a charcoal base",
                "Perfect for living rooms, desks, meditation corners and Vastu placement",
            ])
            + details([
                ("Dimensions", "22 × 40 × 29.5 cm (L × W × H)"),
                ("Weight", "1.7 kg"),
                ("Material", "Polyresin"),
                ("Colour", "Sandstone beige with charcoal base"),
                ("Lighting", "Warm LED"),
                ("Origin", "Made in India"),
            ])
        ),
    ),
]

# ---------------- Sample filler products (tagged "sample" so they are easy to bulk-delete) ----------------
FILLER = [
    ("Amber Glass Lantern", "Candles & Lanterns", 1299, None, 900, "Hand-blown amber glass that turns a single candle into a warm, golden glow.", ("Glass, brass", "18 × 18 × 32 cm")),
    ("Brass Taper Holders — Set of 3", "Candles & Lanterns", 1599, 1999, 1100, "Three slender brass holders in staggered heights for an effortless tablescape.", ("Brass", "8 × 8 × 15/20/25 cm")),
    ("Sandalwood Pillar Candle Trio", "Candles & Lanterns", 899, None, 1200, "Slow-burning pillar candles with a soft, woody sandalwood scent.", ("Soy wax", "7.5 × 7.5 × 10/12/15 cm")),
    ("Moroccan Mosaic Tealight", "Candles & Lanterns", 749, None, 400, "Jewel-toned mosaic glass that scatters candlelight across the room.", ("Glass", "9 × 9 × 10 cm")),
    ("Ribbed Ceramic Vase", "Vases & Planters", 1349, None, 1300, "A sculptural, softly ribbed vase in a matte ivory glaze.", ("Ceramic", "14 × 14 × 28 cm")),
    ("Terracotta Bud Vases — Set of 3", "Vases & Planters", 999, None, 800, "Earthy little vases made for single stems and dried grasses.", ("Terracotta", "8 × 8 × 12 cm each")),
    ("Woven Rattan Planter", "Vases & Planters", 1799, None, 1500, "A hand-woven basket planter that brings natural texture to any corner.", ("Rattan", "30 × 30 × 28 cm")),
    ("Speckled Stoneware Planter", "Vases & Planters", 1199, 1499, 1400, "Speckled stoneware with a drainage hole and matching saucer.", ("Stoneware", "16 × 16 × 15 cm")),
    ("Fluted Glass Bottle Vase", "Vases & Planters", 1099, None, 700, "Smoky fluted glass that looks beautiful with or without flowers.", ("Glass", "10 × 10 × 26 cm")),
    ("Gilded Round Mirror", "Wall Art & Mirrors", 4999, 5999, 4200, "A slim gold frame that adds light and quiet glamour to any wall.", ("Metal, glass", "60 cm diameter")),
    ("Abstract Gold Leaf Print", "Wall Art & Mirrors", 2499, None, 1800, "Soft neutral tones with hand-applied gold leaf accents, framed and ready to hang.", ("Paper, wooden frame", "40 × 50 cm")),
    ("Macramé Wall Hanging", "Wall Art & Mirrors", 1899, None, 600, "Hand-knotted cotton macramé on a natural wooden dowel.", ("Cotton, wood", "45 × 90 cm")),
    ("Brass Sunburst Wall Accent", "Wall Art & Mirrors", 3299, None, 2000, "A radiant sunburst sculpture to brighten an entryway or living room.", ("Brass-finished metal", "50 cm diameter")),
    ("Botanical Line Art Set of 2", "Wall Art & Mirrors", 1999, None, 1500, "Minimal botanical illustrations in slim black frames.", ("Paper, wooden frame", "30 × 40 cm each")),
    ("Bouclé Cushion — Ivory", "Cushions & Throws", 1499, None, 600, "Cloud-soft bouclé with a plump feather-blend insert.", ("Polyester bouclé", "45 × 45 cm")),
    ("Velvet Cushion — Midnight", "Cushions & Throws", 1399, None, 600, "Deep midnight velvet with a subtle sheen, made for winter evenings.", ("Cotton velvet", "45 × 45 cm")),
    ("Linen Throw — Sand", "Cushions & Throws", 2799, None, 1100, "A stonewashed linen throw that only gets softer with time.", ("Linen", "130 × 170 cm")),
    ("Chunky Knit Throw", "Cushions & Throws", 3499, 3999, 2000, "An oversized hand-knit throw for slow, cosy mornings.", ("Acrylic wool blend", "120 × 150 cm")),
    ("Block Print Cushion Cover", "Cushions & Throws", 899, None, 300, "Hand block-printed cotton in a classic Jaipur motif.", ("Cotton", "40 × 40 cm")),
    ("White Marble Tray", "Tabletop Decor", 2299, None, 2500, "A polished marble tray to style candles, perfume or keys.", ("Marble", "30 × 15 cm")),
    ("Brass Urli Bowl", "Tabletop Decor", 2699, None, 1600, "A traditional urli for floating flowers and tealights at the entrance.", ("Brass", "30 cm diameter")),
    ("Wooden Bead Garland", "Tabletop Decor", 649, None, 200, "Natural wood beads with jute tassels for shelves and coffee tables.", ("Mango wood, jute", "90 cm long")),
    ("Ceramic Buddha Head", "Tabletop Decor", 1899, None, 1800, "A serene matte-finish Buddha bust for calm, mindful spaces.", ("Ceramic", "15 × 15 × 25 cm")),
    ("Reed Diffuser — Winter Spice", "Tabletop Decor", 1149, None, 500, "Warm notes of cinnamon, clove and orange peel. Lasts up to 8 weeks.", ("Glass, rattan reeds", "100 ml")),
]

for title, ptype, price, compare, grams, blurb, (material, size) in FILLER:
    PRODUCTS.append(dict(
        title=title, type=ptype, tags=f"sample, {ptype.lower()}", price=str(price),
        compare=str(compare) if compare else "", grams=grams, images=[], seo=blurb,
        body=f"<p>{blurb}</p>" + details([("Dimensions", size), ("Material", material)]),
    ))

def handle(title):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", title.lower().replace("&", "and"))).strip("-")

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "products.csv")
with open(out, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=HEADERS)
    w.writeheader()
    for i, p in enumerate(PRODUCTS, 1):
        h = handle(p["title"])
        imgs = p["images"]
        w.writerow({
            "Handle": h, "Title": p["title"], "Body (HTML)": p["body"], "Vendor": "Decorin",
            "Type": p["type"], "Tags": p["tags"], "Published": "TRUE",
            "Option1 Name": "Title", "Option1 Value": "Default Title", "Variant SKU": f"DEC-{i:03d}",
            "Variant Grams": p["grams"], "Variant Inventory Policy": "deny",
            "Variant Fulfillment Service": "manual", "Variant Price": p["price"],
            "Variant Compare At Price": p.get("compare", ""), "Variant Requires Shipping": "TRUE",
            "Variant Taxable": "TRUE",
            "Image Src": RAW + imgs[0] if imgs else "", "Image Position": 1 if imgs else "",
            "Image Alt Text": p["title"] if imgs else "", "Gift Card": "FALSE",
            "SEO Title": p["title"], "SEO Description": p["seo"], "Status": "active",
        })
        for pos, img in enumerate(imgs[1:], 2):
            w.writerow({"Handle": h, "Image Src": RAW + img, "Image Position": pos, "Image Alt Text": p["title"]})
print(f"Wrote {len(PRODUCTS)} products to {out}")
