# Data Assurance and Chainlink Fit

Status: Complete for the current prototype. Primary sources were reviewed on
August 13, 2026. No oracle, wallet, network, or deployed contract is part of
the application.

## Working principle

An oracle can make delivery attributable and tamper-evident; it cannot make a
bad appraisal, ledger entry, or private API truthful. Diameter should use
Chainlink only where an on-chain action needs a carefully defined input. For
ordinary reporting, a dated source record is simpler and more useful.

The UI implementation of these decisions is the structured `ORACLE_FEEDS`
model in `src/data.js`. Every record contains the business question, authority,
privacy boundary, cadence and staleness rule, checking and aggregation method,
dispute and failure response, on-chain and off-chain consumers, placement,
operating load, and recommendation.

## Decision summary

| Candidate | Primary authority | Cadence / stale after | Placement | Recommendation |
|---|---|---|---|---|
| Property valuation / NAV | Independent appraisal accepted by the fund administrator | Quarterly / 180 days | Approved value may be attested; workpapers stay private | **Use when NAV drives on-chain settlement** |
| Appraisal document | Signed independent appraisal | Each appraisal / valuation window | Keep PDF private; anchor its fingerprint directly | **Keep off-chain** |
| SOFR benchmark | Federal Reserve Bank of New York | U.S. business daily / 3 business days | Use official data off-chain until a contract needs it | **Explore** |
| Treasury yield | U.S. Department of the Treasury | U.S. business daily / 3 business days | Use official data off-chain until a contract needs it | **Keep off-chain** |
| Occupancy | Property-management system plus signed operating report | Monthly / 45 days | Keep rent roll private; expose a defined aggregate | **Explore** |
| Rental collections | Reconciled fund-accounting ledger | Monthly close / 35 days | Attest only an approved total when it gates a distribution | **Use only with automation** |
| Insurance status | Carrier or broker-issued certificate | Issue and renewal / policy expiry | Keep document private; track term and fingerprint | **Do not use an oracle today** |
| Debt terms | Executed loan documents plus lender or servicer statement | Monthly and on change / 45 days for balances | Keep detailed terms and documents off-chain | **Keep off-chain** |
| Cash and reserves | Administrator ledger after custodian-bank reconciliation | Monthly and before release / 35 days or same-day | Attest an aggregate only if it gates a release | **Explore** |

## Complete candidate records

### Property valuation / NAV

- **Decision and consumers:** establishes the approved value for property
  reporting and token NAV. Diameter and the NAV publishing queue consume it
  today; a future redemption or settlement contract is the only justified
  on-chain consumer.
- **Source, privacy, and checks:** match an independent signed appraisal to the
  administrator's approved NAV workpaper. Publish only the accepted value and
  effective date; do not average conflicting appraisals silently.
- **Failure and dispute:** keep the last value visibly dated, mark disputes
  under review, and pause NAV publication after 180 days or until a replacement
  is approved. A correction is a new event, not a silent edit.
- **Chainlink and operations:** SmartData NAVLink is the strongest candidate,
  but only if settlement consumes the value. It still requires an appraiser,
  administrator, publisher monitoring, and a correction procedure.

### Appraisal document

- **Decision and consumers:** proves that the document in the room is the exact
  version used for valuation. The document room consumes this off-chain; a
  simple registry could consume the fingerprint on-chain.
- **Source, privacy, and checks:** hash the signed appraiser PDF and compare it
  with the fingerprint on the approved value. There is no aggregation. The PDF
  remains confidential.
- **Failure and dispute:** remove the matched state, retain the prior fingerprint,
  and request a corrected signed file. Its freshness follows the valuation.
- **Chainlink and operations:** an administrator can anchor the fingerprint
  directly. CRE adds value only if an independent workflow must retrieve and
  anchor it, so the current recommendation is to keep it off-chain.

### SOFR benchmark

- **Decision and consumers:** provides refinance context or a floating-rate
  input. The UI may consume the official publication; there is no current
  on-chain consumer because the prototype's loans are fixed-rate.
- **Source, privacy, and checks:** use the Federal Reserve Bank of New York's
  public SOFR observation. Record the exact benchmark, date, units, retrieval
  time, and—before any Chainlink use—network address and heartbeat. Never blend
  benchmarks or tenors.
- **Failure and dispute:** follow official corrections, stop rate-sensitive
  calculations after three business days, and show the last value only as
  dated context.
- **Chainlink and operations:** explore only after confirming the exact feed.
  A dashboard does not justify address, heartbeat, network, and incident
  monitoring.

### Treasury yield

- **Decision and consumers:** provides a disclosed comparison tenor for debt
  and refinance reporting. Diameter is the current consumer; a future
  spread-based covenant is only a hypothetical on-chain consumer.
- **Source, privacy, and checks:** use the U.S. Treasury's public Daily Treasury
  Par Yield Curve Rates. Store observation date, tenor, units, and retrieval
  time. Any spread or interpolation is a separate calculated metric.
- **Failure and dispute:** follow official revisions, suspend comparisons when
  the selected observation is missing, and expire it after three business days.
- **Chainlink and operations:** direct official data is enough today. Confirm a
  specific supported network feed before proposing an on-chain dependency.

### Occupancy

- **Decision and consumers:** supports operating review on the dashboard and
  property detail. There is no current on-chain consumer; a future covenant
  could use a precisely defined property-level aggregate.
- **Source, privacy, and checks:** reconcile the private property-management
  record to the signed monthly operating report. Publish only the percentage,
  period, and whether its basis is units, rooms, or leased area.
- **Failure and dispute:** show the last report with its date, mark disagreement
  under review, retain both sources internally, and require asset-manager
  approval. The freshness limit is 45 days.
- **Chainlink and operations:** CRE could provide delivery assurance, not truth.
  Private credentials, reconciliation, privacy, and exception ownership make
  this a medium-operational-load experiment.

### Rental collections

- **Decision and consumers:** confirms whether approved cash supports a
  distribution run. Income and distribution approval consume it off-chain; a
  future distribution contract could consume the approved total.
- **Source, privacy, and checks:** tie one property-period total from the fund
  accounting ledger to the completed bank reconciliation. Tenant payments and
  bank records remain private.
- **Failure and dispute:** after 35 days or any disagreement, block automated
  distribution, mark the period under review, and require accounting sign-off
  on a correction.
- **Chainlink and operations:** a CRE workflow is useful only when the total
  gates a real contract action. Accounting close, credentials, monitoring, and
  incident handling make this a high-load integration.

### Insurance status

- **Decision and consumers:** supports compliance exceptions, renewal work, and
  the document room. There is no current on-chain consumer.
- **Source, privacy, and checks:** match the carrier or broker certificate's
  fingerprint and term to the policy record. Do not aggregate policies or
  expose the confidential document.
- **Failure and dispute:** remove the current state before expiry or when records
  differ, then require broker confirmation or a replacement certificate.
- **Chainlink and operations:** without a reliable authoritative carrier API,
  an oracle has nothing useful to transport. Track the signed source document
  and revisit only if that source changes.

### Debt terms

- **Decision and consumers:** drives LTV, debt-service coverage, maturity, and
  refinance review in Diameter. No present contract consumes it.
- **Source, privacy, and checks:** reconcile balances to lender or servicer
  statements and fixed terms to executed loan documents. Loan-level aggregation
  requires matching currency, lien priority, and effective dates.
- **Failure and dispute:** freeze affected ratios, retain the last terms as
  dated context, and route differences to fund accounting. Balance data expires
  after 45 days; fixed terms remain current until amended.
- **Chainlink and operations:** keep private documents and terms off-chain. A
  document fingerprint provides integrity without an oracle; revisit only for
  a defined on-chain covenant and machine-readable servicer source.

### Cash and reserves

- **Decision and consumers:** tests whether an approved reserve is sufficient
  before a distribution or capital release. Diameter consumes it off-chain; a
  future release contract is the possible on-chain consumer.
- **Source, privacy, and checks:** reconcile the administrator ledger to the
  custodian-bank statement and approval record. Aggregate only accounts covered
  by the disclosed reserve policy; never expose account details.
- **Failure and dispute:** pause a dependent release, retain the previous dated
  balance, and require administrator approval for a correction. Use a 35-day
  reporting window and same-day evidence for an actual release.
- **Chainlink and operations:** explore CRE only with an independent custodian
  source and an on-chain release rule. Bank access, reconciliation, approval
  separation, and incident response make this high-load.

## Shared implementation rules

- Use push-style updates for these slow records; low-latency Data Streams are
  unnecessary.
- Every consumer checks its own freshness limit and continues to render dated
  source data when safe. A missing attestation must not break the underlying
  product page.
- `current`, `stale`, `under review`, and `unavailable` are product states, not
  claims that Chainlink proved a fact true.
- Manual correction requires a new attributable record. A serious future
  consumer would also need bounds, pause authority, and disclosed overrides.
- No cost estimate is invented here. Any on-chain write adds network and
  service costs plus monitoring, access control, and incident response.

## Primary sources

Accessed August 13, 2026:

- [Chainlink Data Feeds](https://docs.chain.link/data-feeds)
- [Using Data Feeds](https://docs.chain.link/data-feeds/using-data-feeds)
- [Chainlink SmartData](https://docs.chain.link/data-feeds/smartdata)
- [Rate and Volatility Feeds](https://docs.chain.link/data-feeds/rates-feeds)
- [Chainlink Runtime Environment](https://docs.chain.link/cre)
- [Chainlink Functions sunset notice](https://docs.chain.link/chainlink-functions)
- [Chainlink Automation sunset notice](https://docs.chain.link/chainlink-automation)
- [Federal Reserve Bank of New York SOFR](https://www.newyorkfed.org/markets/reference-rates/sofr)
- [U.S. Treasury Daily Treasury Rates](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_)
- [Solidity documentation](https://docs.soliditylang.org/en/latest/)
