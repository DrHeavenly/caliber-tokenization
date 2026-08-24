# Diameter by Caliber — Tokenization Platform Prototype

A responsive, navigable frontend prototype for a Caliber real estate
tokenization platform. The prototype uses illustrative data and is intended for
internal product review, not as a representation of live accounts or
investment results.

## What's included

- Investor dashboard with rule-based material-change alerts and a
  question box for the portfolio (`/overview`)
- Property dashboard with a data-driven property list, working search and
  asset-class filters, and a two-property comparison (`/properties`)
- Property detail pages for all ten assets (`/properties/<id>`) — financial
  metrics, ownership information, token supply, rental income, documents,
  distribution history, plus the assistant panels described below
- Offerings with a generated investment summary per vehicle (`/offerings`)
- Token ownership and custody (`/ownership`)
- Distribution history (`/distributions`)
- Asset performance (`/performance`)
- Compliance operations (`/compliance`)
- Data assurance and one educational asset record (`/records`)
- Application shell features: global search (⌘K), a notifications dropdown
  that carries material-change alerts, and a profile dropdown

All screens share one application shell and render from a single canonical
dataset in [`src/data.js`](src/data.js) so values reconcile across screens
(see [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)).

## Diameter Assistant

The assistant shows what AI could do for an investor inside the product, with
every answer grounded in the records on screen:

| Capability | Where it lives |
|---|---|
| Ask questions about a property in natural language | Property detail → *Ask about …*; portfolio questions on the dashboard |
| Explain quarterly financial results | Property detail → *Explain Q2 vs. Q1*; Asset performance |
| Compare two investments | Property dashboard → *Compare two investments* |
| Generate investment summaries | Offerings → *Investment summary* on each vehicle |
| Alert investors when performance changes materially | Dashboard *Material changes* card and the notifications bell |
| Summarize lease expirations and occupancy trends | Property detail → *Lease & occupancy outlook* |
| Simulate financing scenarios | Property detail → *Financing scenarios* sliders |

Every answer carries citations (source and effective date), stated
assumptions, data caveats (stale, disputed, or unavailable records), and an
informational-use notice. Advice-seeking and out-of-authorization questions
are declined. See [`docs/ASSISTANT.md`](docs/ASSISTANT.md) for how answers are
produced and what a production version would change.

## Local preview

```bash
npm run dev
```

The default preview is `http://localhost:3000`. To use another port:

```bash
PORT=3001 npm run dev
```

## Build and checks

```bash
npm run build
```

The build writes the static site to `public/` (eight screens plus one page per
property for deep linking) and verifies routes, navigation, required assets,
and dataset consistency rules (portfolio totals, per-vehicle share sums,
position values, distribution schedules). The project has no runtime
dependencies and deploys to Vercel as a static site
([`vercel.json`](vercel.json)).

Feature areas can be switched off in [`src/flags.js`](src/flags.js)
(`ASSURANCE_FEATURES`, `ASSISTANT_FEATURES`).

## Scope and limitations

This is a frontend prototype. There is no live blockchain integration,
custody, banking, trading, compliance decisioning, production authentication,
or external AI service. The assistant composes its answers in the browser from
the illustrative dataset; nothing is sent to a model or a third party. The
[Chainlink fit research](docs/CHAINLINK_RESEARCH.md) recommends NAVLink as the
strongest candidate and treats CRE workflows as experiments; nothing reads from
or writes to a chain. Buttons that would open transactional workflows show a
prototype notice; document downloads are stubbed. All names, values,
properties, and events are fictional and clearly labeled as illustrative.
Nothing here is investment, legal, or tax advice.

## Documentation

- [`docs/ASSISTANT.md`](docs/ASSISTANT.md) — how the assistant grounds, cites, and declines
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — proposed system boundaries
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — entities and provenance
- [`docs/CHAINLINK_RESEARCH.md`](docs/CHAINLINK_RESEARCH.md) — data assurance and oracle fit
- [`contracts/README.md`](contracts/README.md) — the isolated educational contract
