# PropertyDeed — educational Solidity example

`PropertyDeed.sol` is a deliberately small smart record for one fictional
property. It shows how an approved valuation and its appraisal fingerprint can
be recorded without turning the investor experience into a blockchain UI. It
is not intended for deployment. Its boundaries follow the research in
[docs/CHAINLINK_RESEARCH.md](../docs/CHAINLINK_RESEARCH.md).

## What it demonstrates

- **A single-property ownership record** — one `owner` address and a guarded
  `transferOwnership`, the smallest possible version of what the prototype's
  ownership screens mock at vehicle level.
- **The publishing seam** — `recordValuation(value, asOf, appraisalHash)` is
  callable only by the `publisher` address. In production that address would be a
  Chainlink SmartData NAVLink feed consumer or a CRE workflow. The
  product surfaces the result as ordinary source-and-freshness details.
- **The staleness pattern** — `isValuationStale(maxAge)` mirrors how feed
  consumers use `updatedAt`: the app's amber "stale" chip (Northsight Office
  Center's 210-day-old appraisal) is this function returning `true`.
- **Document anchoring** — `appraisalHash` shows the cheap alternative to a
  full oracle for appraisal/insurance documents: anchor the file hash,
  verify the PDF offline.

## Boundaries

- Educational and local/test-only; **not audited, never deployed, holds no
  funds**; fictional property data only; implies no legal title, securities
  compliance, or custody.
- **Isolated from the frontend**: nothing in `src/` imports this directory.
  The build embeds the source as escaped, read-only text in the asset-record
  developer view; it is never executed by the app.

## Tests

`test/PropertyDeed.t.sol` covers initial and elapsed-time freshness, valuation
recording, owner and publisher permissions, publisher rotation, ownership
transfer, zero-address guards, and future-date rejection without a
testing-library import. Run it with Foundry when available:

```bash
forge test --root contracts
```

Foundry is not a dependency of the frontend build.
