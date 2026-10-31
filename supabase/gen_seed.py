"""Epic Menswear STARTER catalogue: one list, two outputs.

Run:  python3 supabase/gen_seed.py      (./supabase/build.sh runs it and rebuilds setup.sql)

Writes:
  supabase/parts/07_seed.sql              → loaded into Supabase by setup.sql
  src/lib/commerce/demo-catalog.json      → shown by the website while no database is connected

These are placeholder products so the store isn't empty on day one. Replace them with your real
stock in Admin → Products (add photos, real prices and quantities), or delete them.
No photos are included: each product is shown with a coloured illustration until you upload photos.
Every row uses an `epic-` legacy_id and ON CONFLICT DO NOTHING, so running setup.sql again never
overwrites edits made in the admin portal.
"""
import json
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NS = uuid.UUID("6f1c2b8e-5d1a-4c3e-9a77-0e5e1c0e0001")  # stable ids for the demo catalogue

def uid(key):
    return str(uuid.uuid5(NS, key))

def q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"

def arr(items):
    return "array[" + ",".join(q(i) for i in items) + "]::text[]"

# Keep in sync with supabase/parts/06_categories.sql and src/lib/commerce/default-categories.ts
CATEGORIES = [
    ("formal-suits", "Formal Suits", "Two-piece, three-piece, double-breasted and tuxedo suits."),
    ("formal-shirts", "Formal Shirts", "Dress shirts, French cuff and tuxedo shirts."),
    ("formal-shoes", "Formal Shoes", "Oxfords, loafers and patent tuxedo shoes."),
    ("casual-shoes", "Casual Shoes", "Leather sneakers, boots and driving loafers."),
    ("accessories", "Accessories", "Ties, bow ties, belts, pocket squares and cufflinks."),
]

COLLECTIONS = [
    ("epic-col-wedding", "wedding-prom", "Wedding & Prom", "2026", "Tuxedos, suits, shoes and finishing touches for the big night.", "Look the part on the day everyone remembers.", 1),
    ("epic-col-office", "office-edit", "The Office Edit", "Core", "Suits, shirts and shoes that work Monday to Friday.", "Sharp every day, not just on special days.", 2),
]

C = {  # colour name -> (hex, family)
    "Navy": ("#1E2A3F", "blue"), "Charcoal": ("#3A3B3E", "grey"), "Black": ("#16171A", "black"),
    "Light Grey": ("#A7A9AC", "grey"), "Brown Check": ("#6B4F3A", "brown"), "Blue Check": ("#3E5A80", "blue"),
    "Midnight Navy": ("#141C2E", "blue"), "Burgundy": ("#5B1F28", "red"), "White": ("#F2F2EF", "white"),
    "Light Blue": ("#BCD3EA", "blue"), "Pink": ("#E8C4C8", "red"), "Tan": ("#A8835A", "brown"),
    "Brown": ("#5A3B26", "brown"), "Dark Brown": ("#3E2A1E", "brown"), "Silver": ("#B9BCC2", "grey"),
    "Gold": ("#C9A34E", "beige"),
}

SUIT = ["38R", "40R", "42R", "44R", "46R"]
SHIRT = ["S", "M", "L", "XL", "XXL"]
SHOE = ["8", "9", "10", "11", "12"]
BELT = ["32", "34", "36", "38", "40"]
ONE = ["One Size"]

SUIT_CARE = ["Dry clean only", "Hang on a shaped hanger between wears", "Steam to remove creases"]
SHIRT_CARE = ["Machine wash cold", "Tumble dry low or hang dry", "Warm iron"]
SHOE_CARE = ["Wipe clean with a soft cloth", "Polish or condition regularly", "Use shoe trees to keep the shape"]
SUEDE_CARE = ["Brush with a suede brush", "Protect with a suede spray", "Keep away from heavy rain"]
SNEAKER_CARE = ["Wipe with a damp cloth", "Air dry away from direct heat"]
ACC_CARE = ["Spot clean only", "Store flat or rolled"]

SHIP = "Tracked shipping anywhere in the US. Unworn items can be returned within 30 days."

P = [
    # legacy, sku, slug, title, subtitle, category, collection, price, compare, material, care, fit, colours, sizes, new, featured, best, description
    # ---- Formal suits
    ("epic-01", "EM-SU-01", "classic-two-piece-suit", "Classic Two-Piece Suit", "Notch lapel, two-button",
     "formal-suits", "office-edit", 299, None, "Wool-blend suiting. Fully lined jacket.", SUIT_CARE,
     "Modern fit through the chest and waist. Pants come with an unfinished hem for tailoring.", ["Navy", "Charcoal", "Black"], SUIT, True, True, True,
     "A versatile two-button suit with a notch lapel, flap pockets and a clean flat-front pant. The one suit that covers interviews, weddings and the office."),
    ("epic-02", "EM-SU-02", "slim-fit-three-piece-suit", "Slim-Fit Three-Piece Suit", "Jacket, vest and pants",
     "formal-suits", "wedding-prom", 349, 399, "Wool-blend suiting with stretch. Fully lined jacket and vest.", SUIT_CARE,
     "Slim fit. If between sizes, size up.", ["Light Grey", "Navy"], SUIT, True, True, False,
     "A slim three-piece with a matching five-button vest. Wear all three for a wedding, or the jacket alone with denim."),
    ("epic-03", "EM-SU-03", "modern-plaid-suit", "Modern Plaid Suit", "Windowpane check",
     "formal-suits", None, 279, None, "Poly-viscose blend with stretch.", SUIT_CARE,
     "Slim fit.", ["Brown Check", "Blue Check"], SUIT, False, False, False,
     "A bold windowpane-check suit with peak lapels and a tapered pant, for when navy feels too safe."),
    ("epic-04", "EM-SU-04", "double-breasted-suit", "Double-Breasted Suit", "Six-button, peak lapel",
     "formal-suits", "office-edit", 379, None, "Wool-blend suiting. Fully lined.", SUIT_CARE,
     "Tailored fit. Wear buttoned for the sharpest line.", ["Midnight Navy", "Charcoal"], SUIT, True, False, False,
     "A six-button double-breasted suit with strong peak lapels: a confident choice for boardrooms and black-tie-optional events."),
    ("epic-05", "EM-SU-05", "black-tuxedo-suit", "Black Tuxedo Suit", "Satin peak lapel, one button",
     "formal-suits", "wedding-prom", 399, None, "Wool-blend with satin lapel and trims.", SUIT_CARE,
     "Modern fit. Pants have a satin side stripe.", ["Black"], SUIT, False, True, True,
     "A one-button tuxedo with satin peak lapels, jetted pockets and matching striped pants. Black tie, done properly."),
    # ---- Formal shirts
    ("epic-06", "EM-SH-01", "slim-fit-stretch-dress-shirt", "Slim-Fit Stretch Dress Shirt", "Spread collar",
     "formal-shirts", "office-edit", 59, None, "Cotton-blend with stretch. Easy care.", SHIRT_CARE,
     "Slim fit. Choose your usual size.", ["White", "Light Blue", "Black"], SHIRT, False, True, True,
     "A crisp spread-collar dress shirt with a little stretch, so it stays comfortable from the first meeting to the last dance."),
    ("epic-07", "EM-SH-02", "non-iron-twill-dress-shirt", "Non-Iron Twill Dress Shirt", "Wrinkle-resistant cotton",
     "formal-shirts", "office-edit", 69, None, "100% cotton twill, non-iron finish.", SHIRT_CARE,
     "Regular fit.", ["White", "Pink", "Light Blue"], SHIRT, True, False, False,
     "A smooth twill dress shirt with a non-iron finish that comes out of the wash ready to wear."),
    ("epic-08", "EM-SH-03", "french-cuff-dress-shirt", "French Cuff Dress Shirt", "Double cuffs for cufflinks",
     "formal-shirts", "wedding-prom", 75, 89, "100% cotton poplin.", SHIRT_CARE,
     "Slim fit.", ["White", "Light Blue"], SHIRT, False, False, False,
     "A sharp poplin shirt with French cuffs, made to be worn with cufflinks for weddings and formal events."),
    ("epic-09", "EM-SH-04", "pleated-tuxedo-shirt", "Pleated Tuxedo Shirt", "Pleated bib, French cuffs",
     "formal-shirts", "wedding-prom", 69, None, "100% cotton.", SHIRT_CARE,
     "Regular fit.", ["White"], SHIRT, False, False, False,
     "A classic pleated-front tuxedo shirt with French cuffs, ready for studs, cufflinks and a bow tie."),
    # ---- Formal shoes
    ("epic-10", "EM-FS-01", "leather-oxford-shoes", "Leather Oxford Shoes", "Cap toe, closed lacing",
     "formal-shoes", "office-edit", 149, None, "Leather upper and lining. Rubber heel.", SHOE_CARE,
     "True to size. Half sizes: go up.", ["Black", "Dark Brown"], SHOE, True, True, True,
     "A polished cap-toe oxford with closed lacing: the dress shoe that goes with every suit."),
    ("epic-11", "EM-FS-02", "penny-loafers", "Penny Loafers", "Slip-on, moc toe",
     "formal-shoes", None, 129, None, "Leather upper. Leather sole.", SHOE_CARE,
     "Fits snug at first and softens with wear.", ["Brown", "Burgundy"], SHOE, False, False, False,
     "Classic penny loafers with a hand-stitched moc toe. Dress them up with a suit or down with chinos."),
    ("epic-12", "EM-FS-03", "patent-leather-tuxedo-shoes", "Patent Leather Tuxedo Shoes", "High-shine finish",
     "formal-shoes", "wedding-prom", 139, 169, "Patent leather upper.", ["Wipe with a soft dry cloth", "Store in the dust bag"],
     "True to size.", ["Black"], SHOE, False, True, False,
     "High-shine patent oxfords made for tuxedos, weddings and prom night."),
    # ---- Casual shoes
    ("epic-13", "EM-CS-01", "leather-sneakers", "Leather Sneakers", "Clean, minimal low-top",
     "casual-shoes", None, 99, None, "Leather upper. Rubber cup sole.", SNEAKER_CARE,
     "True to size.", ["White", "Black"], SHOE, True, True, True,
     "Minimal leather low-tops that work with jeans, chinos and even a relaxed suit."),
    ("epic-14", "EM-CS-02", "suede-chelsea-boots", "Suede Chelsea Boots", "Elastic sides, pull tab",
     "casual-shoes", None, 159, 189, "Suede upper. Rubber sole.", SUEDE_CARE,
     "True to size.", ["Tan", "Brown"], SHOE, True, False, False,
     "Easy pull-on Chelsea boots in soft suede with elastic side panels."),
    ("epic-15", "EM-CS-03", "suede-driving-loafers", "Suede Driving Loafers", "Flexible pebble sole",
     "casual-shoes", None, 109, None, "Suede upper. Rubber pebble sole.", SUEDE_CARE,
     "Snug fit; they relax with wear.", ["Navy", "Tan"], SHOE, False, False, False,
     "Soft suede drivers with a flexible pebble sole, made for weekends and warm days."),
    # ---- Accessories
    ("epic-16", "EM-AC-01", "silk-tie", "Silk Tie", "Classic 3-inch width",
     "accessories", "office-edit", 39, None, "100% silk.", ACC_CARE,
     "Standard length, 3 in wide.", ["Navy", "Burgundy", "Silver"], ONE, False, False, True,
     "A smooth silk tie in a classic width. The easy way to change the whole look of a suit."),
    ("epic-17", "EM-AC-02", "pre-tied-bow-tie", "Pre-Tied Bow Tie", "Adjustable band",
     "accessories", "wedding-prom", 25, None, "Satin.", ACC_CARE,
     "Adjustable to fit most neck sizes.", ["Black", "Burgundy"], ONE, False, False, False,
     "A pre-tied satin bow tie with an adjustable band, the finishing touch for any tuxedo."),
    ("epic-18", "EM-AC-03", "leather-dress-belt", "Leather Dress Belt", "Polished buckle",
     "accessories", None, 49, None, "Genuine leather.", ["Wipe clean with a damp cloth", "Condition occasionally"],
     "Order your pant waist size.", ["Black", "Brown"], BELT, False, False, False,
     "A slim leather dress belt with a polished buckle to match your shoes."),
    ("epic-19", "EM-AC-04", "silk-pocket-square", "Silk Pocket Square", "Hand-rolled edges",
     "accessories", "wedding-prom", 19, None, "100% silk.", ACC_CARE,
     "12 x 12 in.", ["White", "Burgundy", "Navy"], ONE, False, False, False,
     "A silk pocket square with hand-rolled edges: the small detail that finishes a suit."),
    ("epic-20", "EM-AC-05", "classic-cufflinks", "Classic Cufflinks", "Polished round face",
     "accessories", "wedding-prom", 35, None, "Polished metal. Gift box included.", ["Wipe with a soft dry cloth", "Store in the gift box"],
     "For French cuff shirts.", ["Silver", "Gold"], ONE, False, False, False,
     "Polished round cufflinks in a gift box, made for French cuff shirts."),
]

def stock(i, j, k):
    v = (i * 7 + j * 5 + k * 3) % 15
    return 0 if v == 13 else (2 if v in (4, 9) else v + 1)

def code(colour):
    return "".join(w[0] for w in colour.split()).upper() if " " in colour else colour[:3].upper()

# ------------------------------------------------------------------ SQL seed
out = ["-- Generated by supabase/gen_seed.py: Epic Menswear STARTER catalogue (placeholders, edit or delete in the admin)"]
for leg, slug, name, season, desc, quote, sort in COLLECTIONS:
    out.append(
        f"insert into public.collections (legacy_id, slug, name, season, description, story_quote, sort_order) values "
        f"({q(leg)}, {q(slug)}, {q(name)}, {q(season)}, {q(desc)}, {q(quote)}, {sort}) on conflict do nothing;")

for i, (leg, sku, slug, title, sub, cat, col, price, compare, mat, care, fit, colours, sizes, new, feat, best, desc) in enumerate(P):
    out.append(f"""
insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ({q(leg)}, {q(sku)}, {q(slug)}, {q(title)}, {q(sub)}, {q(desc)}, {price}, {compare if compare else 'null'}, 'USD',
  (select id from public.categories where slug = {q(cat)}),
  {f"(select id from public.collections where slug = {q(col)})" if col else 'null'},
  'men', {q(mat)}, {arr(care)}, {q(fit)}, {q(SHIP)},
  {q(title + ' | Epic Menswear')}, {q(desc[:155])}, {str(new).lower()}, {str(feat).lower()}, {str(best).lower()}, 'active', now() - interval '{i} hours')
on conflict do nothing;""".rstrip())
    rows = []
    for j, colour in enumerate(colours):
        hx, fam = C[colour]
        for k, size in enumerate(sizes):
            sz = size.replace(" ", "")
            rows.append(
                f"({q(leg + '-' + code(colour) + '-' + sz)}, {q(sku + '-' + code(colour) + '-' + sz)}, {q(colour + ' / ' + size)}, "
                f"{q(colour)}, {q(hx)}, {q(fam)}, {q(size)}, {price}::numeric, {compare if compare else 'null'}::numeric, {stock(i, j, k)})")
    out.append(
        "insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)\n"
        f"select p.id, v.* from public.products p, (values\n  " + ",\n  ".join(rows) +
        f"\n) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)\n"
        f"where p.legacy_id = {q(leg)}\non conflict do nothing;")

parts = Path(__file__).with_name("parts")
parts.mkdir(exist_ok=True)
parts.joinpath("07_seed.sql").write_text("\n".join(out) + "\n")

# ------------------------------------------------------------ demo catalogue
# Same shape as the Supabase query in catalog.ts, so the site maps it with the same code.
cat_name = {slug: name for slug, name, _ in CATEGORIES}
col_name = {slug: name for _, slug, name, *_ in COLLECTIONS}
demo_products = []
for i, (leg, sku, slug, title, sub, cat, col, price, compare, mat, care, fit, colours, sizes, new, feat, best, desc) in enumerate(P):
    variants = []
    for j, colour in enumerate(colours):
        hx, fam = C[colour]
        for k, size in enumerate(sizes):
            sz = size.replace(" ", "")
            variants.append({
                "id": uid(f"{leg}-{code(colour)}-{sz}"), "sku": f"{sku}-{code(colour)}-{sz}", "name": f"{colour} / {size}",
                "color": colour, "color_hex": hx, "color_family": fam, "size": size, "price": price,
                "compare_at_price": compare, "inventory_quantity": stock(i, j, k), "is_active": True, "image_url": None,
            })
    demo_products.append({
        "id": uid(leg), "legacy_id": leg, "sku": sku, "slug": slug, "title": title, "subtitle": sub,
        "description": desc, "price": price, "compare_at_price": compare, "currency": "USD", "gender": "men",
        "material": mat, "care_instructions": care, "craftsmanship_notes": None, "fit_info": fit, "shipping_info": SHIP,
        "seo_title": f"{title} | Epic Menswear", "seo_description": desc[:155],
        "is_new_arrival": new, "is_featured": feat, "is_bestseller": best,
        "related_product_slugs": [], "complete_the_look_slugs": [],
        "published_at": f"2026-01-01T{23 - i:02d}:00:00Z", "created_at": "2026-01-01T00:00:00Z",
        "category": {"slug": cat, "name": cat_name[cat]},
        "collection": {"slug": col, "name": col_name[col]} if col else None,
        "product_images": [], "product_variants": variants,
    })

demo = {
    "_note": "Generated by supabase/gen_seed.py. Shown only while no Supabase database is connected.",
    "categories": [
        {"id": uid("cat-" + slug), "slug": slug, "name": name, "gender": "men", "description": d, "hero_image_url": None, "is_active": True}
        for slug, name, d in CATEGORIES
    ],
    "collections": [
        {"id": uid(leg), "slug": slug, "name": name, "season": season, "description": desc, "story_quote": quote, "hero_image_url": None}
        for leg, slug, name, season, desc, quote, _ in COLLECTIONS
    ],
    "products": demo_products,
}
demo_path = ROOT / "src" / "lib" / "commerce" / "demo-catalog.json"
demo_path.write_text(json.dumps(demo, indent=1) + "\n")
print("wrote", len(P), "products (SQL seed + demo catalogue)")
