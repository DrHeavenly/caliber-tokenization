# Proposed Architecture

Status: Design proposal only. None of the future services described here are
currently implemented.

## Architectural principle

The core investor experience should work with ordinary verified business data.
Blockchain and AI should be optional layers with explicit boundaries, not
requirements for rendering a property or explaining its performance.

## Current state

The repository contains a dependency-free static frontend prototype:

- data-driven screens and review interactions in `src/`;
- a build script that writes `public/`;
- a local static server.

The data-assurance layer adds a mock verification envelope, source/freshness dialogs, and an
isolated Solidity example embedded as read-only text at build time. There is no
backend, database, authentication, external API, live blockchain, or AI
service.

## Future logical layers

### 1. Presentation layer

Responsibilities:

- dashboard and property views;
- ownership, distributions, performance, documents, and compliance surfaces;
- loading, empty, stale, error, and illustrative-data states;
- accessible responsive presentation.

The presentation layer should consume stable application models rather than
vendor-specific API responses.

### 2. Application/data access layer

Responsibilities:

- retrieve properties, valuations, operating metrics, token records,
  distributions, and documents;
- normalize dates, units, and provenance;
- enforce role-aware data access;
- present a replaceable mock-data implementation in the prototype.

Planned interfaces:

- `PropertyRepository`
- `FinancialMetricsRepository`
- `OwnershipRepository`
- `DistributionRepository`
- `DocumentRepository`
- `ComplianceRepository`
- `MarketDataRepository`

These are conceptual boundaries, not filenames that must be created now.

### 3. Source adapters

Possible future adapters may represent:

- property-management systems;
- accounting or fund-administration systems;
- appraisal providers;
- transfer-agent or cap-table records;
- document storage;
- market and benchmark-rate providers.

Each adapter should return normalized values with provenance and freshness.

### 4. Verification/oracle layer

The prototype adds a frontend verification interface around selected data. The
application does not call a blockchain; future integration should remain
behind one adapter rather than being called directly from every component.

A proposed `VerifiedMetric` model can distinguish:

- source-reported;
- independently attested;
- Chainlink-delivered;
- manually overridden;
- stale or disputed.

Chainlink research must determine whether a feed exists, whether a custom
oracle workflow is realistic, and what remains off-chain.

### 5. AI assistance layer

The prototype's Diameter Assistant (`src/assistant.js`) drafts answers
deterministically from the canonical dataset and returns a structured answer
(text, citations, assumptions, missing data). A model-backed implementation
should keep that contract and sit behind a separate service boundary that:

- retrieves authorized structured records;
- provides citations to those records;
- logs prompt, model, and source versions for evaluation;
- applies financial-advice and data-access guardrails;
- returns structured answers the UI can label and inspect.

The underlying application must remain usable when this layer is disabled.

## Proposed route map

The exact framework is undecided, but the future information architecture may
use:

- `/` or `/dashboard`
- `/properties`
- `/properties/:propertyId`
- `/ownership`
- `/distributions`
- `/performance`
- `/compliance`

## Configuration boundaries

Future environment variables should be documented in `.env.example` only when
they are actually introduced. Expected categories may include:

- public application URL;
- server-side database connection;
- approved source-system credentials;
- Chainlink/network configuration for oracle experiments;
- AI provider and model configuration for the assistant service.

No secret should use a public/client-exposed prefix.

## Failure states to design before integration

- source unavailable;
- value stale;
- reporting period incomplete;
- values disagree across sources;
- manual override active;
- document missing;
- transfer record pending review;
- oracle update delayed;
- AI grounding record unavailable.

## Security and privacy preparation

- use fictional data until a formal data-handling plan exists;
- minimize investor-identifying fields;
- keep privileged integrations server-side;
- define authorization by role and resource;
- never log documents, tax identifiers, wallet keys, or full bank details;
- separate public-demo content from internal operational data.
