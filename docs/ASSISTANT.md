# Diameter Assistant

The assistant demonstrates seven investor-facing AI capabilities inside the
prototype. It is implemented in [`src/assistant.js`](../src/assistant.js).

## Principle

AI should help an investor understand authorized records. It should not invent
property facts, obscure source dates, or give personalized investment advice.

## How an answer is produced

1. **Grounding.** Every answer reads only from the canonical dataset
   (`src/data.js`): property financials, occupancy history, lease schedules,
   management commentary, valuations with their source and effective date,
   debt terms, distributions, token records, and the source/freshness state of
   each record.
2. **Deterministic math.** Quarter comparisons, comparisons between assets,
   debt service, coverage, and cash-on-cash are calculated in code. The
   explanation is drafted from the calculated result, never the other way
   around.
3. **Rules detect, the assistant explains.** Material-change alerts come from
   fixed thresholds (occupancy ±2 pts, ±3 for hospitality; NOI ±1.5% to
   budget; valuation older than 180 days; NAV older than 90 days; coverage
   below 1.35×; any source record not current). A model is never the sole
   detector of a financial exception.
4. **Structured answer.** Each answer is an object with a title, summary,
   supporting points, optional comparison rows, citations (label, value,
   source, effective date, record status), assumptions, missing or disputed
   data, follow-up questions, and a tone (`info`, `warn`, `refuse`).
5. **One renderer.** The UI renders every answer through the same component,
   so the "Diameter Assistant" label, citations, caveats, and informational
   notice are always present.

## Guardrails

- No personalized buy, sell, or allocation recommendations; such questions
  return a refusal that points to the advisor conversation.
- No access to other investors' records.
- Stale, disputed, or unavailable records are surfaced as caveats, and the
  citation chip is styled to match the record's state.
- Lease summaries aggregate tenant information rather than naming tenants.
- Financing scenarios change only the inputs the user sets and say so.

## What this build does not do

The drafting engine is rule-based and runs in the browser; no language model
or external service is called. That keeps the prototype static, free of
credentials, and fully traceable. A production version would replace the
drafting step with a model-backed service behind the same answer contract,
add retrieval over real documents, log prompt/model/source versions, and run
the evaluation set (factual, stale, disputed, advice-seeking, out-of-scope,
and calculation questions) before release.
