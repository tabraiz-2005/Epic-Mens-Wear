# Epic Menswear — store + admin portal

Next.js 15 storefront for **Epic Menswear** (formal suits, formal shirts, formal shoes, casual shoes and accessories), with a built-in **admin portal** at `/admin`.

**Store:** 2200 Eastridge Loop Ste 2066, San Jose, CA 95122, United States (Eastridge Center)

Built on the same code structure as the Cicero store, adapted for the US:

| | Cicero | Epic Menswear |
|---|---|---|
| Currency | PKR (Rs) | **USD ($)** |
| Payment | Cash on Delivery | **Card via Stripe Checkout** (Apple Pay / Google Pay where enabled) |
| Departments | Men + Women | **Men only** |
| Checkout address | Pakistani city / province, +92 phone | **US street, city, state, ZIP, US phone** |
| Database | Cicero's Supabase | **Its own, new Supabase project** |

- **Store**: `/`, `/men`, `/shop?category=…`, `/sale`, `/products/…`, `/collections/…`, bag, checkout (Stripe), wishlist, search, light/dark mode.
- **Admin** (`/admin`): Dashboard · Orders (ship, track, refund, CSV export) · Products (photos, colours × sizes, stock, pricing, publish) · Inventory · Categories · Collections · Discounts · Store settings (announcement, homepage hero, shipping rates, phone, hours) · Team.

---

## Preview without a database

Until Supabase is connected, the site shows the 20 starter products from `src/lib/commerce/demo-catalog.json`, so you can click through the whole store. Checkout and the admin need the database.

## Before you go live: fill in the placeholders

| What | Where |
|---|---|
| Store phone, email, Instagram, opening hours | Admin → **Store settings** (defaults live in `src/lib/commerce/types.ts`) |
| About page story | `src/app/(store)/about/page.tsx` (marked `PLACEHOLDER COPY`) |
| 20 starter products | Shown with coloured illustrations (no photos). Upload real photos in Admin → **Products → Photos** and they replace the illustration, or delete the products |
| Homepage photo | Shows an illustration until you add one in Admin → Store settings → hero image |
| Privacy & terms | `src/app/(store)/privacy` and `terms` are templates; have them reviewed |
| Sales tax | Turn on **Stripe Tax** in Stripe, then uncomment `automatic_tax` in `src/app/api/checkout/route.ts` |

Logo: `src/components/store/Logo.tsx` (drawn after the store sign) · Favicon: `src/app/icon.svg` · Colours: `src/app/globals.css`

---

## Go live in 5 steps

### 1. Create the database (one time)
Create a **new** Supabase project for Epic Menswear → **SQL Editor** → **New query** → paste all of [`supabase/setup.sql`](supabase/setup.sql) → **Run**.

It creates the catalogue tables, orders, discount codes (starter code `EPIC10`), the admin team table, the `product-images` storage bucket, the 5 categories (Formal Suits, Formal Shirts, Formal Shoes, Casual Shoes, Accessories) and 20 starter products. Safe to run again: it never overwrites what you change in the admin.

### 2. Add environment variables
Locally: `cp .env.example .env.local` and fill it in. On Vercel: **Settings → Environment Variables** (Production + Preview):

| Name | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API Keys → publishable (or legacy `anon`) |
| `SUPABASE_SECRET_KEY` | Supabase → API Keys → secret (or legacy `service_role`) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | from step 4 |
| `ADMIN_EMAILS` | **your** email (comma-separate several) |
| `NEXT_PUBLIC_SITE_URL` | your domain, e.g. `https://www.epicmenswear.com` |

The app builds and runs without these; it shows an empty store and tells you what's missing.

### 3. Deploy
Create a new GitHub repo and a new Vercel project for Epic (don't reuse Cicero's). Push, and Vercel deploys automatically.

### 4. Connect Stripe payments
Stripe → Developers → **Webhooks** → Add endpoint
- URL: `https://YOUR-DOMAIN/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

How a payment works: checkout reserves the stock for 40 minutes and sends the customer to Stripe. When they pay, the order is confirmed (by the webhook, and again on the thank-you page as a safety net). If they abandon payment, the stock is released when the Stripe session expires.

### 5. Create your admin login
Open `https://YOUR-DOMAIN/admin` → **Create owner account** → use the email from `ADMIN_EMAILS`. The **Dashboard** shows a setup checklist until everything is connected.

---

## Newsletter sign-ups
The footer newsletter form saves emails to the `newsletter_subscribers` table (included in `supabase/setup.sql`,
or run `supabase/parts/08_newsletter.sql` on its own). See sign-ups in Supabase → Table Editor → newsletter_subscribers.

## Everyday tasks (all in `/admin`)

| I want to… | Go to |
|---|---|
| Add a product | Products → **Add product** → name, price, photos, colours + sizes (presets for suit sizes 38R–46R, waist, neck), stock → **Save & publish** |
| Put something on sale | Set a **Compare-at price** above the price: it appears on `/sale` automatically |
| Change stock | **Inventory** or inside the product |
| See what to ship | **Orders → To fulfil** → open order → add tracking → **Mark shipped** |
| Refund | Open the order → **Refund full amount** (through Stripe, optionally restocks) |
| Run a promotion | **Discounts** |
| Change homepage / announcement / shipping prices | **Store settings** |
| Add a category (e.g. Shoes) | **Categories** |

---

## Local development
```bash
cp .env.example .env.local   # fill in values
npm install
npm run dev                   # http://localhost:3000  ·  admin: /admin  (uses Turbopack)
npm run dev:webpack           # the classic dev server, if you ever need it
```
Edit SQL in `supabase/parts/`, then run `./supabase/build.sh` to regenerate `supabase/setup.sql` (starter catalogue lives in `supabase/gen_seed.py`).

## Project map
```
src/app/(store)/        storefront pages
src/app/admin/          admin portal (login, (panel)/… pages, _actions/ server actions)
src/app/api/            checkout (Stripe), discount preview, search, stripe webhook
src/components/store/   storefront UI (Header, Logo, Catalogue, ProductView, CartDrawer…)
src/components/admin/   admin UI (ProductForm, VariantEditor, ImageManager…)
src/lib/                env, Supabase/Stripe clients, catalogue queries, pricing, phone, local SEO
supabase/setup.sql      the one file to run in Supabase
```
