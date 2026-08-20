# TONITE

**An outfit, tonight.** Same-day fashion delivery — shop the real inventory of nearby
boutiques, have a stylist pull and pack it, and get it to your door in under two hours.

A mobile-first React app built around one use case: *I need something to wear tonight.*

<!-- Run `npm run dev` and open the app at 390 × 844 (iPhone 14) for the intended frame. -->

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
npm run lint
```

No backend, no API keys, no network calls — the catalogue, the shop floor and the
courier network all live in the app.

## What is in it

| Area | Screen | Notes |
| --- | --- | --- |
| Shop by store | `/shop`, `/store/:id` | Sorted by live ETA, distance or rating; per-boutique cut-off times |
| Shop by category | `/category/:id` | Seven categories, filtered to what is genuinely in stock |
| Shop by occasion | `/occasion/:id` | Seven edits — dinner, night out, wedding guest, concert… |
| Build My Look | `/look` | Five-question brief → three complete, deliverable outfits |
| Piece detail | `/product/:id` | Live per-size stock, cut-off countdown, complete-the-look |
| Bag | `/cart` | Twenty-minute holds with live countdowns, grouped by boutique |
| Checkout | `/checkout` | Address, courier speed, payment, validation |
| Tracking | `/order/:id` | Seven-stage journey, courier, route map, live countdown |
| History | `/orders` | Every delivery, in flight or landed |

## How the interesting parts work

**Live inventory** (`src/lib/inventory.ts`) is the only mutable copy of stock in the
app. It seeds from the catalogue, persists to `localStorage` for six hours, and ticks
every seven seconds: the rest of the city buys things, weighted by each piece's *heat*,
and the occasional return goes back on the rail. React subscribes through
`useSyncExternalStore`, so a size can sell out under your cursor — the home page even
carries a ticker of what just left which neighbourhood.

**Holds.** Adding to the bag reserves the unit off the public floor for twenty minutes.
Holds are subtracted from availability, restored on reload, released when you remove a
line or let the timer lapse, and converted into sales at checkout. Two tabs cannot
promise the same last size 38.

**Delivery estimates** (`src/lib/delivery.ts`) are computed per boutique from prep time
plus distance, with an evening surge multiplier. A basket spanning several boutiques
consolidates on one route and pays eight minutes per extra stop. Every ETA on every
screen comes from that one function.

**The stylist** (`src/lib/recommend.ts`) takes the brief — occasion, vibe, budget,
sizes, urgency — and only ever considers pieces that are physically on a rail, in a
size that fits, from a boutique that can still deliver tonight. It scores on occasion
match, vibe, heat and courier speed, assembles alternating silhouettes (dress vs.
separates) so the three looks have range, and writes a styling line against the pieces
that actually landed. Any slot can be swapped for a ranked alternative; the total and
the ETA follow.

**Tracking** (`src/lib/tracking.ts`) derives its stage from elapsed time against the
promised window, so a journey resumes correctly after a reload. The screen has a
"skip ahead 10 min" control so the whole seven-stage delivery can be watched in a sitting.

## Design

Editorial luxury rather than delivery-app utility: ink on bone, one signal colour used
only for live and urgent states, `Instrument Serif` display against `Inter` at wide
tracking, and generous negative space. Every garment is drawn — each piece renders as a
studio plate: an SVG silhouette per category filled with the real colourway, with
metallics given a deeper backdrop so chrome reads. Nothing is fetched, so the lookbook
works offline and never waits on an image.

## Layout

```
src/
  data/        catalogue, boutiques, categories, occasions
  lib/         inventory, delivery maths, the stylist, tracking, formatting
  state/       cart (holds), orders, profile — all persisted
  components/  garment plates, product cards, chrome, sheets, route map
  screens/     one file per route
  styles/      tokens → global → components → screens
```
