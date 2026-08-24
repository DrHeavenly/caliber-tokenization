# Planned Data Model

Status: Conceptual schema with a mock `ExternalMetric` envelope
implemented in `src/data.js`.

## Data envelope

Material metrics should use a shared envelope:

| Field | Purpose |
|---|---|
| `value` | Numeric, text, or boolean value |
| `unit` | USD, percent, tokens, square feet, ratio, etc. |
| `effectiveAt` | When the value became true |
| `periodStart` / `periodEnd` | Reporting period when applicable |
| `sourceName` | Human-readable originating system or provider |
| `sourceRecordId` | Non-secret reference for traceability |
| `updatedAt` | When the platform last received the value |
| `verificationStatus` | Reported, attested, oracle-verified, overridden, stale, disputed |
| `notes` | Optional explanation visible to reviewers |

The prototype expresses these fields through `ORACLE_FEEDS` and
`feedFor()`. They remain illustrative records, not responses from a live source
or chain.

Each `ORACLE_FEEDS` proposal also records the oracle-fit decision metadata that is
not part of a reported value itself: business question, authoritative source,
classification, verification and aggregation method, cadence and maximum age,
dispute and failure handling, on-chain and off-chain consumers, placement,
Chainlink fit, operational load, and recommendation.

## Core entities

### Property

- identifier;
- name and location;
- asset type;
- lifecycle and operating status;
- acquisition date;
- gross property value;
- ownership vehicle;
- related token;
- image or visual placeholder;
- latest appraisal and valuation source.

### PropertyFinancials

- property identifier;
- reporting period;
- rental or operating income;
- net operating income;
- expenses;
- annual yield;
- occupancy;
- ADR/RevPAR where appropriate;
- debt service coverage;
- budget and variance;
- capital expenditures.

### InvestmentVehicle

- identifier;
- legal/display name;
- strategy;
- related properties;
- offering type;
- target return and holding period;
- reporting status.

### Token

- identifier and symbol;
- investment vehicle or property identifier;
- token price;
- NAV per token;
- total supply;
- circulating/issued supply;
- holder count;
- transfer restrictions;
- valuation date;
- price basis: NAV, last transaction, or other.

### OwnershipPosition

- investor placeholder identifier;
- token identifier;
- quantity;
- ownership percentage;
- cost basis;
- acquisition lots;
- lockup status;
- custody display reference;
- transfer eligibility summary.

### Distribution

- identifier;
- vehicle/property and token identifiers;
- record and payment dates;
- reporting period;
- amount per token;
- eligible token count;
- gross amount;
- withholding;
- payment method;
- reinvestment election;
- status;
- related statement or tax document.

### Document

- identifier;
- property/vehicle relationship;
- category;
- title;
- reporting period;
- publication date;
- version;
- access classification;
- mock download reference during prototype work.

### ComplianceRecord

- subject placeholder identifier;
- control type;
- policy version;
- status;
- checked time;
- expiration time;
- reviewer or automated source;
- exception reason;
- resolution status.

### ExternalMetric

- metric name;
- property or vehicle relationship;
- data envelope;
- candidate verification method;
- acceptable staleness;
- fallback behavior.

### AIAnswer

Future assistant evaluation record only:

- question;
- answer;
- cited record identifiers;
- model and prompt version;
- generated time;
- confidence/limitations;
- human feedback;
- refusal or escalation reason.

## Consistency rules

- property-list values must match the latest property-detail values;
- token position quantity multiplied by the displayed price should reconcile
  with displayed position value, allowing documented rounding;
- token holder count and supply should share the same effective date;
- distributions must reconcile between property, vehicle, and investor views;
- all ratios and returns must define their period and calculation basis;
- no screen should mix valuation dates silently.

## Demo dataset rules

- use fictional names and identifiers;
- use enough records to show normal, stale, pending, and exception states;
- avoid copying real investor details or confidential Caliber figures;
- keep one canonical fixture per entity;
- document any intentionally inconsistent record used to demonstrate a warning.
