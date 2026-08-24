// Diameter Assistant — grounded answer drafting for the prototype.
//
// Every answer is composed from records in data.js and carries the citations
// (source and effective date) for the figures it uses. Nothing here calls an
// external model or service: the drafting is deterministic so the prototype
// stays hostable as a static site and every sentence can be traced to a
// record. The `Answer` shape below is the contract a model-backed service
// would have to satisfy later — answer text, citations, assumptions, and the
// data it could not find — so the UI does not change when the engine does.

import {
  AS_OF,
  INCOME_MONTHS,
  INVESTOR,
  NOTIFICATIONS,
  OFFERINGS,
  PROPERTIES,
  VEHICLES,
  distributionsFor,
  feedFor,
  incomeSeries,
  portfolioTotals,
  propertiesOf,
  shareOfVehicle,
  vehicleById,
  vehicleOf,
} from "./data.js";

const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const usdM = (n) => `$${(n / 1e6).toFixed(1)}M`;
const usdK = (n) => `$${Math.round(n / 1000).toLocaleString("en-US")}K`;
const pct = (n, d = 1) => `${n.toFixed(d)}%`;
const pts = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)} pts`;
const signed = (n, d = 1) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(d)}%`;
const num = (s) => Number(String(s).replace(/[^0-9.\-−]/g, "").replace("−", "-"));
const list = (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

// Reporting quarters inside the twelve-month income series.
export const QUARTERS = [
  { label: "Q4 2025", months: [2, 3, 4] },
  { label: "Q1 2026", months: [5, 6, 7] },
  { label: "Q2 2026", months: [8, 9, 10] },
];
const OCC_QUARTERS = ["Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026"];

const cite = (label, value, source, effective) => ({ label, value, source, effective });

const citeFeed = (property, kind, label, value) => {
  const feed = feedFor(property, kind);
  return { label, value, source: feed.source, effective: feed.effective, status: feed.status };
};

const quarterIncome = (property, q) => QUARTERS[q].months.reduce((sum, m) => sum + incomeSeries(property)[m], 0);
const quarterNoi = (property, q) => quarterIncome(property, q) * (property.noi / property.grossIncome);
const variance = (property) => num(property.budgetVariance);
const ltv = (property) => num(property.debt.ltv) / 100;
const rate = (property) => num(property.debt.rate) / 100;
const dscr = (property) => num(property.debt.dscr);

const answer = ({ title, summary, points = [], rows = null, citations = [], assumptions = [], missing = [], followUps = [], tone = "info" }) => ({
  title, summary, points, rows, citations, assumptions, missing, followUps, tone, generatedAt: AS_OF,
});

/* ---------- 1. Explain quarterly results ---------- */

export const explainQuarter = (property, q = 2) => {
  const prev = q - 1;
  const income = quarterIncome(property, q);
  const incomePrev = quarterIncome(property, prev);
  const change = ((income - incomePrev) / incomePrev) * 100;
  const noi = quarterNoi(property, q);
  const occNow = property.occupancyHistory.at(-1);
  const occPrev = property.occupancyHistory.at(-2);
  const occDelta = occNow - occPrev;
  const v = variance(property);
  const seasonal = property.type === "Hospitality";
  const direction = change >= 0 ? "rose" : "fell";
  const points = [
    `Gross ${property.type === "Hospitality" ? "operating" : "rental"} income ${direction} ${signed(change)} versus ${QUARTERS[prev].label}, from ${usdK(incomePrev)} to ${usdK(income)}${seasonal ? " — consistent with Arizona hospitality seasonality, where the spring peak gives way to the summer trough" : ""}.`,
    `${property.occupancyLabel} ${occDelta >= 0 ? "improved" : "declined"} ${pts(occDelta)} to ${pct(occNow)} (${pct(occPrev)} in ${QUARTERS[prev].label}).`,
    `Estimated NOI for the quarter was ${usdK(noi)} at a ${pct((property.noi / property.grossIncome) * 100, 0)} margin; trailing-twelve-month NOI is ${usdM(property.noi)}, ${property.budgetVariance.toLowerCase()}.`,
    `Management commentary: ${property.commentary}`,
  ];
  const citations = [
    cite("Monthly gross income", `${usdK(incomePrev)} → ${usdK(income)}`, "Q2 2026 operating statement · fund accounting", "Jun 30, 2026"),
    citeFeed(property, "occupancy", property.occupancyLabel, `${pct(occPrev)} → ${pct(occNow)}`),
    citeFeed(property, "collections", "NOI vs. budget", property.budgetVariance),
    cite("Management commentary", "Q2 2026 operating report", "Asset management", "Jul 21, 2026"),
  ];
  const missing = [];
  if (feedFor(property, "occupancy").status === "disputed") missing.push("The occupancy figure is under review while sources are reconciled; treat the occupancy comparison as provisional.");
  if (feedFor(property, "collections").status === "unavailable") missing.push("The collections source is not connected, so NOI is taken from the signed operating report rather than an attested ledger total.");
  if (property.valuation.stale) missing.push("The asset value is outside its freshness window; no valuation change is included in this explanation.");
  return answer({
    title: `${QUARTERS[q].label} results — ${property.name}`,
    summary: `${QUARTERS[q].label} ${change >= 0 ? "was a stronger" : "was a softer"} quarter than ${QUARTERS[prev].label}: income ${direction} ${signed(change)}, ${property.occupancyLabel.toLowerCase()} moved ${pts(occDelta)}, and NOI finished ${v >= 0 ? "ahead of" : "behind"} budget (${property.budgetVariance}).`,
    points,
    citations,
    assumptions: ["Quarterly NOI is estimated by applying the trailing-twelve-month NOI margin to the quarter's gross income; the audited quarterly statement governs."],
    missing,
    followUps: [`Why did ${property.occupancyLabel.toLowerCase()} change?`, "How does this compare with budget?", "What distributions did this asset support?"],
    tone: v < -1.5 || occDelta < -2 ? "warn" : "info",
  });
};

/* ---------- 2. Compare two investments ---------- */

export const compareProperties = (a, b) => {
  const rows = [
    ["Asset value", usdM(a.value), usdM(b.value)],
    ["Cash yield", pct(a.yieldPct), pct(b.yieldPct)],
    ["Cap rate", pct((a.noi / a.value) * 100), pct((b.noi / b.value) * 100)],
    [a.occupancyLabel === b.occupancyLabel ? a.occupancyLabel : "Occupancy", pct(a.occupancy), pct(b.occupancy)],
    ["Occupancy trend (4 qtrs)", pts(a.occupancy - a.occupancyHistory[0]), pts(b.occupancy - b.occupancyHistory[0])],
    ["NOI vs. budget", a.budgetVariance.split(" ")[0], b.budgetVariance.split(" ")[0]],
    ["Loan-to-value", a.debt.ltv, b.debt.ltv],
    ["Debt service coverage", a.debt.dscr, b.debt.dscr],
    ["Vehicle · token", `${vehicleOf(a).name} · ${vehicleOf(a).token.symbol}`, `${vehicleOf(b).name} · ${vehicleOf(b).token.symbol}`],
  ];
  const higherYield = a.yieldPct >= b.yieldPct ? a : b;
  const lowerYield = higherYield === a ? b : a;
  const steadier = dscr(a) >= dscr(b) ? a : b;
  const trendA = a.occupancy - a.occupancyHistory[0];
  const trendB = b.occupancy - b.occupancyHistory[0];
  const points = [
    `${higherYield.name} pays the higher cash yield (${pct(higherYield.yieldPct)} vs. ${pct(lowerYield.yieldPct)}), a gap of ${pct(higherYield.yieldPct - lowerYield.yieldPct)}.`,
    `${steadier.name} carries more debt coverage (DSCR ${steadier.debt.dscr} vs. ${(steadier === a ? b : a).debt.dscr}), which leaves more room if income softens.`,
    `Over four quarters ${a.name}'s ${a.occupancyLabel.toLowerCase()} moved ${pts(trendA)} while ${b.name}'s moved ${pts(trendB)}.`,
    a.type !== b.type
      ? `They are different asset classes (${a.type} vs. ${b.type}): ${a.type === "Hospitality" || b.type === "Hospitality" ? "hospitality income resets nightly and is seasonal, while leased assets are contracted in advance" : "lease terms and tenant concentration differ, so occupancy moves for different reasons"}.`
      : `Both are ${a.type.toLowerCase()} assets, so the comparison is reasonably like-for-like.`,
  ];
  const missing = [];
  for (const p of [a, b]) {
    if (p.valuation.stale) missing.push(`${p.name}'s valuation is outside its freshness window (${p.valuation.date}); value-based ratios use the dated figure.`);
    if (feedFor(p, "occupancy").status === "disputed") missing.push(`${p.name}'s occupancy is under review.`);
  }
  return answer({
    title: `${a.name} vs. ${b.name}`,
    summary: `Same-period comparison on income, occupancy, and leverage. ${higherYield.name} yields more; ${steadier.name} is more conservatively financed.`,
    points,
    rows,
    citations: [
      citeFeed(a, "valuation", `${a.name} value`, usdM(a.value)),
      citeFeed(b, "valuation", `${b.name} value`, usdM(b.value)),
      citeFeed(a, "occupancy", `${a.name} ${a.occupancyLabel.toLowerCase()}`, pct(a.occupancy)),
      citeFeed(b, "occupancy", `${b.name} ${b.occupancyLabel.toLowerCase()}`, pct(b.occupancy)),
      citeFeed(a, "debt", "Debt terms", `${a.debt.ltv} LTV · ${a.debt.dscr}`),
      citeFeed(b, "debt", "Debt terms", `${b.debt.ltv} LTV · ${b.debt.dscr}`),
    ],
    assumptions: ["Yields are trailing cash distribution yields; cap rate is TTM NOI over the latest accepted value. Figures are normalized to the same reporting period (Jun 30, 2026)."],
    missing,
    followUps: [`Explain ${a.name}'s latest quarter`, `Explain ${b.name}'s latest quarter`],
  });
};

/* ---------- 3. Investment summaries ---------- */

export const summarizeOffering = (offering) => {
  const vehicle = offering.vehicleId ? vehicleById[offering.vehicleId] : null;
  if (!vehicle) {
    return answer({
      title: `${offering.name} — summary`,
      summary: `${offering.name} is an announced ${offering.strategy.toLowerCase()} strategy with a ${offering.targetReturn} objective. No properties, token, or operating history exist yet, so there is nothing to summarize beyond the announced terms.`,
      points: [`Minimum investment ${offering.minInvestment}; ${offering.closes.toLowerCase()}.`, offering.blurb],
      citations: [cite("Announcement", offering.status, "Offerings desk", "Jul 29, 2026")],
      missing: ["No offering memorandum, portfolio, or performance record is available for an announced offering."],
      followUps: [],
    });
  }
  const props = propertiesOf(vehicle);
  const gav = props.reduce((s, p) => s + p.value, 0);
  const noi = props.reduce((s, p) => s + p.noi, 0);
  const occ = props.reduce((s, p) => s + p.occupancy * p.value, 0) / gav;
  const paid = vehicle.distributions.filter(([, , s]) => s === "Paid");
  const monthly = paid.filter(([, , , meta]) => !meta).map(([, r]) => r);
  const cashYield = props.reduce((s, p) => s + p.yieldPct * p.value, 0) / gav;
  const markets = [...new Set(props.map((p) => p.market))];
  const watch = props.filter((p) => p.statusKind !== "active" || variance(p) < -1.5);
  const points = [
    `${props.length} ${props.length === 1 ? "property" : "properties"} in ${list(markets)} with ${usdM(gav)} of gross asset value and ${usdM(noi)} of trailing NOI; value-weighted ${vehicle.id === "cht" ? "occupancy" : "occupancy"} is ${pct(occ)}.`,
    `Token ${vehicle.token.symbol} is priced at $${vehicle.token.price.toFixed(3)} on the ${vehicle.token.navDate} NAV; ${vehicle.token.holders.toLocaleString("en-US")} holders; ${vehicle.token.restrictions.toLowerCase()}.`,
    `Distributions have been paid monthly, most recently $${monthly.at(-1).toFixed(4)} per token on ${paid.at(-1)[0]}; the value-weighted cash yield of the underlying properties is ${pct(cashYield)} against a ${vehicle.targetReturn} target.${vehicle.id === "csof" ? " An April refinance of Rio Salado Commerce Park returned an additional $0.045 per token." : ""}`,
    watch.length ? `Items to read before investing: ${list(watch.map((p) => `${p.name} (${p.status.toLowerCase()}, ${p.budgetVariance.toLowerCase()})`))}.` : "No property in the vehicle is currently flagged for budget or status exceptions.",
    `Structure: ${vehicle.structure}, ${vehicle.offering}; sponsor co-investment ${vehicle.sponsorStake}; minimum ${offering.minInvestment}; ${offering.closes.toLowerCase()}.`,
  ];
  const staleNav = vehicle.token.navDate === "Mar 31, 2026";
  return answer({
    title: `${vehicle.name} — investment summary`,
    summary: `${vehicle.strategy} vehicle holding ${props.length} assets with a ${pct(cashYield)} value-weighted cash yield (target ${vehicle.targetReturn}) and monthly distributions.`,
    points,
    citations: [
      cite("Gross asset value", usdM(gav), "Accepted appraisals · fund administration", "Jun 30, 2026"),
      cite("NAV per token", `$${vehicle.token.price.toFixed(3)}`, "Fund administrator NAV statement", vehicle.token.navDate),
      cite("Distribution rate", `$${monthly.at(-1).toFixed(4)} / token`, "Transfer agent payment record", paid.at(-1)[0]),
      cite("Offering terms", vehicle.offering, `${vehicle.name} offering memorandum`, "Mar 03, 2025"),
    ],
    assumptions: ["The cash yield is the trailing distribution yield of the underlying properties weighted by value; it is not a forecast."],
    missing: staleNav ? ["The NAV is from Mar 31, 2026 — the Q2 NAV is held in the publishing queue pending an expense-variance review."] : [],
    followUps: ["Compare this vehicle's properties", "What are the transfer restrictions?"],
    tone: staleNav ? "warn" : "info",
  });
};

/* ---------- 4. Material-change alerts (rules detect, assistant explains) ---------- */

const daysBetween = (from, to) => Math.round((new Date(to) - new Date(from)) / 86_400_000);
const asOfDate = AS_OF.split(" · ")[0];

export const materialAlerts = () => {
  const alerts = [];
  for (const p of PROPERTIES) {
    const occDelta = p.occupancy - p.occupancyHistory.at(-2);
    const v = variance(p);
    // Hospitality occupancy is seasonal, so its threshold is wider.
    const occThreshold = p.type === "Hospitality" ? 3 : 2;
    if (occDelta <= -occThreshold) {
      alerts.push({
        severity: "high", property: p, rule: `${p.occupancyLabel} change beyond ±${occThreshold} pts quarter over quarter`,
        title: `${p.occupancyLabel} fell ${pts(occDelta).replace("−", "")} at ${p.name}`,
        explanation: `${p.occupancyLabel} moved from ${pct(p.occupancyHistory.at(-2))} to ${pct(p.occupancy)} this quarter. ${p.commentary.split(". ")[0]}.`,
        facts: [citeFeed(p, "occupancy", p.occupancyLabel, `${pct(p.occupancyHistory.at(-2))} → ${pct(p.occupancy)}`)],
      });
    }
    if (Math.abs(v) >= 1.5) {
      alerts.push({
        severity: v < 0 ? "high" : "info", property: p, rule: "NOI variance to budget beyond ±1.5%",
        title: `NOI ${v < 0 ? "below" : "above"} budget by ${Math.abs(v).toFixed(1)}% at ${p.name}`,
        explanation: v < 0 ? `Trailing NOI is ${usdM(p.noi)}, ${p.budgetVariance.toLowerCase()}. ${p.commentary.split(". ").at(-1)}` : `Trailing NOI is ${usdM(p.noi)}, ${p.budgetVariance.toLowerCase()}. ${p.commentary.split(". ")[0]}.`,
        facts: [citeFeed(p, "collections", "NOI vs. budget", p.budgetVariance)],
      });
    }
    if (p.valuation.stale) {
      alerts.push({
        severity: "medium", property: p, rule: "Accepted valuation older than its 180-day freshness window",
        title: `Valuation is ${daysBetween(p.valuation.date, asOfDate)} days old at ${p.name}`,
        explanation: `${p.valuation.stale} Until the new appraisal is accepted, the ${usdM(p.value)} value and any NAV that depends on it are dated figures, not current ones.`,
        facts: [citeFeed(p, "valuation", "Accepted value", usdM(p.value))],
      });
    }
    if (dscr(p) < 1.35) {
      alerts.push({
        severity: "medium", property: p, rule: "Debt service coverage below 1.35×",
        title: `Debt coverage at ${p.debt.dscr} for ${p.name}`,
        explanation: `Coverage of ${p.debt.dscr} on a ${p.debt.rate} loan at ${p.debt.ltv} LTV leaves a thin cushion; a further ${pct(((dscr(p) - 1) / dscr(p)) * 100, 0)} decline in NOI would bring coverage to 1.0×.`,
        facts: [citeFeed(p, "debt", "Debt terms", `${p.debt.ltv} LTV · ${p.debt.rate} · ${p.debt.dscr}`)],
      });
    }
    for (const kind of ["occupancy", "collections", "insurance"]) {
      const feed = feedFor(p, kind);
      if (feed.status !== "normal") {
        alerts.push({
          severity: kind === "insurance" ? "medium" : "low", property: p, rule: `Source record not current (${feed.status})`,
          title: `${feed.label} source is ${feed.status === "disputed" ? "under review" : feed.status} at ${p.name}`,
          explanation: `${feed.note} ${feed.failure}`,
          facts: [citeFeed(p, kind, feed.label, feed.status)],
        });
      }
    }
  }
  for (const vehicle of VEHICLES) {
    const age = daysBetween(vehicle.token.navDate, asOfDate);
    if (age > 90) {
      alerts.push({
        severity: "medium", vehicle, rule: "Published NAV older than 90 days",
        title: `${vehicle.token.symbol} NAV is ${age} days old`,
        explanation: `The last published NAV ($${vehicle.token.price.toFixed(3)}) is dated ${vehicle.token.navDate}. The Q2 NAV is in the publishing queue pending an expense-variance review, so position values for ${vehicle.name} are stated on a dated price.`,
        facts: [cite("NAV per token", `$${vehicle.token.price.toFixed(3)}`, "Fund administrator NAV statement", vehicle.token.navDate)],
      });
    }
  }
  const order = { high: 0, medium: 1, low: 2, info: 3 };
  return alerts
    .map((alert) => ({ ...alert, route: alert.property ? `properties/${alert.property.id}` : "ownership", holderImpact: holderImpact(alert) }))
    .sort((x, y) => order[x.severity] - order[y.severity]);
};

const holderImpact = (alert) => {
  const vehicle = alert.vehicle ?? vehicleOf(alert.property);
  const tokens = INVESTOR.positions[vehicle.id] ?? 0;
  if (!tokens) return "You hold no tokens in this vehicle.";
  const exposure = alert.property ? tokens * vehicle.token.price * shareOfVehicle(alert.property) : tokens * vehicle.token.price;
  return `About ${usd(exposure)} of your ${vehicle.token.symbol} position is attributable to ${alert.property ? "this asset" : "this vehicle"}.`;
};

/* ---------- 5. Lease expirations and occupancy trends ---------- */

export const leaseOutlook = (property) => {
  const hist = property.occupancyHistory;
  const trend = hist.at(-1) - hist[0];
  const direction = Math.abs(trend) < 0.5 ? "flat" : trend > 0 ? "rising" : "falling";
  const trendLine = `${property.occupancyLabel} has been ${direction} over the last four quarters: ${hist.map((v, i) => `${pct(v)} (${OCC_QUARTERS[i]})`).join(" → ")}.`;
  const l = property.leases;
  const citations = [citeFeed(property, "occupancy", `${property.occupancyLabel} history`, hist.map((v) => pct(v)).join(" · "))];
  let points = [trendLine];
  let summary;
  let tone = "info";
  if (!l) {
    summary = `Hospitality assets do not carry leases; demand resets nightly, so the useful forward indicators are booking pace and seasonality rather than an expiration schedule.`;
    const series = incomeSeries(property);
    const peak = series.indexOf(Math.max(...series));
    const trough = series.indexOf(Math.min(...series));
    points.push(`Income peaks in ${INCOME_MONTHS[peak]} (${usdK(series[peak])}) and troughs in ${INCOME_MONTHS[trough]} (${usdK(series[trough])}); the next two months are in the seasonal low.`);
    points.push(`${property.extra.map(([k, v]) => `${k} ${v}`).join(" · ")} per the latest STR report.`);
    citations.push(cite("ADR / RevPAR", property.extra.map(([, v]) => v).join(" / "), "STR performance report · June 2026", "Jun 30, 2026"));
  } else if (l.kind === "residential") {
    const nearTerm = l.expiringByQuarter[0][1];
    summary = `${nearTerm}% of leases expire in the next 90 days against a ${l.renewalRate}% renewal rate, implying roughly ${Math.round(nearTerm * (1 - l.renewalRate / 100))}% of units turn over this quarter.`;
    points.push(`Expiration schedule: ${l.expiringByQuarter.map(([q, v]) => `${q} ${v}%`).join(" · ")} (average term ${l.avgTerm}).`);
    points.push(`At the current renewal rate, ${Math.round((nearTerm * l.renewalRate) / 100)}% of units renew and ${Math.round(nearTerm * (1 - l.renewalRate / 100))}% re-lease at market; the ${property.extra[0][0].toLowerCase()} is ${property.extra[0][1]}.`);
    citations.push(cite("Lease expirations", `${nearTerm}% next 90 days`, "Rent roll summary · June 2026", "Jun 30, 2026"));
    citations.push(cite("Renewal rate", `${l.renewalRate}%`, "Property-management system", "Jun 30, 2026"));
  } else {
    const nearTerm = l.expiringByYear[0][1];
    summary = `${nearTerm}% of contracted rent expires in ${l.expiringByYear[0][0]} and ${l.expiringByYear[1][1]}% in ${l.expiringByYear[1][0]}; weighted average lease term is ${l.walt}.`;
    points.push(`Rollover schedule by share of rent: ${l.expiringByYear.map(([y, v]) => `${y} ${v}%`).join(" · ")}.`);
    points.push(`Largest tenant accounts for ${l.largestTenant}; ${l.renewalsInNegotiation} renewal${l.renewalsInNegotiation === 1 ? " is" : "s are"} in negotiation.`);
    if (nearTerm >= 25) {
      tone = "warn";
      points.push(`Near-term rollover is concentrated: if the ${l.expiringByYear[0][0]} expirations are not renewed, occupancy could fall toward ${pct(Math.max(0, property.occupancy - nearTerm))} before backfill.`);
    }
    citations.push(cite("Lease expirations", `${nearTerm}% of rent in ${l.expiringByYear[0][0]}`, "Lease & tenancy schedule · Q2 2026", "Jun 30, 2026"));
    citations.push(cite("Tenant concentration", l.largestTenant, "Lease & tenancy schedule · Q2 2026", "Jun 30, 2026"));
  }
  points.push(`Management commentary: ${property.commentary}`);
  const missing = feedFor(property, "occupancy").status === "disputed" ? ["The leased figure is under review during the anchor renewal; the occupancy series may be restated."] : [];
  return answer({
    title: `Lease & occupancy outlook — ${property.name}`,
    summary, points, citations, missing, tone,
    assumptions: l ? ["Turnover estimates apply the trailing renewal rate to scheduled expirations; individual tenant decisions are not known in advance.", "Tenant-identifying details are aggregated."] : ["Hospitality demand is described from trailing seasonality, not forward bookings."],
    followUps: ["Explain this quarter's results", "What happens if the anchor tenant leaves?"],
  });
};

/* ---------- 6. Financing scenarios (deterministic math + explanation) ---------- */

const annualDebtService = (principal, annualRate, amortYears) => {
  if (amortYears === 0) return principal * annualRate;
  const r = annualRate / 12;
  const n = amortYears * 12;
  return ((principal * r) / (1 - (1 + r) ** -n)) * 12;
};

export const financingScenario = (property, input = {}) => {
  const base = { ltv: ltv(property) * 100, rate: rate(property) * 100, amort: 30, noiChange: 0 };
  const s = { ...base, ...input };
  const equityBase = property.value * (1 - base.ltv / 100);
  const loan = property.value * (s.ltv / 100);
  const equity = property.value - loan;
  const noi = property.noi * (1 + s.noiChange / 100);
  const service = annualDebtService(loan, s.rate / 100, s.amort);
  const coverage = noi / service;
  const cashFlow = noi - service;
  const cashOnCash = (cashFlow / equity) * 100;
  const baseService = annualDebtService(property.value * (base.ltv / 100), base.rate / 100, base.amort);
  const baseCashOnCash = ((property.noi - baseService) / equityBase) * 100;
  const breakevenNoi = service;
  const breakevenDrop = ((noi - breakevenNoi) / noi) * 100;
  const changes = [];
  if (s.ltv !== base.ltv) changes.push(`leverage ${s.ltv > base.ltv ? "up" : "down"} to ${pct(s.ltv, 0)} LTV`);
  if (s.rate !== base.rate) changes.push(`rate ${s.rate > base.rate ? "up" : "down"} to ${pct(s.rate, 2)}`);
  if (s.amort !== base.amort) changes.push(s.amort === 0 ? "interest-only" : `${s.amort}-year amortization`);
  if (s.noiChange) changes.push(`NOI ${signed(s.noiChange)}`);
  const tone = coverage < 1.25 ? "warn" : "info";
  return {
    metrics: { loan, equity, service, coverage, cashFlow, cashOnCash, breakevenDrop },
    answer: answer({
      title: `Financing scenario — ${property.name}`,
      summary: changes.length
        ? `With ${list(changes)}, debt service is ${usd(service)} a year, coverage is ${coverage.toFixed(2)}× and cash-on-cash is ${pct(cashOnCash)} (base case ${pct(baseCashOnCash)}).`
        : `Base case: ${usd(loan)} of debt at ${pct(s.rate, 2)} over ${s.amort} years costs ${usd(service)} a year, for ${coverage.toFixed(2)}× coverage and ${pct(cashOnCash)} cash-on-cash on ${usd(equity)} of equity.`,
      points: [
        `Annual cash flow after debt service is ${usd(cashFlow)}; NOI could fall ${pct(Math.max(0, breakevenDrop), 0)} before coverage reaches 1.0×.`,
        coverage < 1.25 ? `Coverage below 1.25× would typically breach a lender covenant and trap cash at the property, pausing distributions from this asset.` : `Coverage stays above a typical 1.25× covenant level.`,
        s.ltv > 65 ? `Leverage above 65% LTV is outside the range of the current loans in this portfolio (50–62%).` : `Leverage is within the range of the current loans in this portfolio (50–62%).`,
        `Reported terms today: ${property.debt.ltv} LTV at ${property.debt.rate}, ${property.debt.dscr} coverage.`,
      ],
      citations: [
        citeFeed(property, "debt", "Current debt terms", `${property.debt.ltv} · ${property.debt.rate} · ${property.debt.dscr}`),
        citeFeed(property, "valuation", "Asset value", usdM(property.value)),
        citeFeed(property, "collections", "NOI (TTM)", usdM(property.noi)),
        citeFeed(property, "benchmark", "Benchmark rate context", "SOFR · daily"),
      ],
      assumptions: [
        "Fixed rate, monthly payments, level amortization; no fees, reserves, prepayment costs, or tax effects.",
        "The scenario changes only the inputs you set. It is an arithmetic illustration, not a quote, forecast, or recommendation.",
      ],
      tone,
    }),
  };
};

/* ---------- 7. Natural-language questions ---------- */

const findProperties = (q) => PROPERTIES.filter((p) => {
  const name = p.name.toLowerCase();
  const first = name.split(" ")[0];
  return q.includes(name) || (first.length > 4 && q.includes(first));
});
const findVehicle = (q) => VEHICLES.find((v) => q.includes(v.name.toLowerCase()) || q.includes(v.token.symbol.toLowerCase()));
const has = (q, ...terms) => terms.some((t) => q.includes(t));

const refusal = (title, summary) => answer({ title, summary, tone: "refuse", followUps: ["What changed this quarter?", "Summarize lease expirations", "Compare two properties"] });

const propertyQuestion = (p, q) => {
  const vehicle = vehicleOf(p);
  if (has(q, "compare", " vs", "versus")) {
    const others = findProperties(q).filter((x) => x !== p);
    if (others.length) return compareProperties(p, others[0]);
  }
  if (has(q, "lease", "expir", "renew", "tenant", "rollover", "turnover")) return leaseOutlook(p);
  if (has(q, "financ", "refinanc", "interest rate", "leverage", "ltv", "dscr", "coverage", "loan", "debt")) {
    if (has(q, "what if", "scenario", "simulate", "if rates", "higher rate", "lower rate")) return financingScenario(p, { rate: rate(p) * 100 + 1 }).answer;
    return answer({
      title: `Debt terms — ${p.name}`,
      summary: `${p.name} carries a ${p.debt.rate} loan at ${p.debt.ltv} loan-to-value with ${p.debt.dscr} debt service coverage — about ${usd(p.value * ltv(p))} of debt against the ${usdM(p.value)} value.`,
      points: [`Coverage of ${p.debt.dscr} means NOI covers annual debt service ${p.debt.dscr.replace("×", "")} times over.`, "Use the financing scenarios panel to test a different rate, leverage, or amortization."],
      citations: [citeFeed(p, "debt", "Debt terms", `${p.debt.ltv} · ${p.debt.rate} · ${p.debt.dscr}`)],
      followUps: ["What if rates were 1% higher?"],
    });
  }
  if (has(q, "occupan", "adr", "revpar", "vacan")) {
    const hist = p.occupancyHistory;
    const delta = hist.at(-1) - hist.at(-2);
    return answer({
      title: `${p.occupancyLabel} — ${p.name}`,
      summary: `${p.occupancyLabel} is ${pct(p.occupancy)} as of June 2026, ${delta === 0 ? "unchanged" : `${delta > 0 ? "up" : "down"} ${pts(delta).replace(/^[+−]/, "")}`} from the prior quarter and ${pts(hist.at(-1) - hist[0])} over four quarters.`,
      points: [`Quarterly series: ${hist.map((v, i) => `${OCC_QUARTERS[i]} ${pct(v)}`).join(" · ")}.`, `Management commentary: ${p.commentary}`],
      citations: [citeFeed(p, "occupancy", p.occupancyLabel, pct(p.occupancy))],
      missing: feedFor(p, "occupancy").status === "disputed" ? ["This figure is under review while two sources are reconciled."] : [],
      followUps: ["Summarize lease expirations", "Explain this quarter's results"],
      tone: delta <= -2 ? "warn" : "info",
    });
  }
  if (has(q, "quarter", "q2", "q1", "results", "changed", "change", "why", "budget", "noi", "income", "revenue", "perform")) return explainQuarter(p);
  if (has(q, "worth", "value", "valuation", "apprais", "cap rate")) {
    return answer({
      title: `Valuation — ${p.name}`,
      summary: `The accepted value is ${usdM(p.value)} (${p.valuation.source}, effective ${p.valuation.date}), against a ${usd(p.acquired.price)} purchase in ${p.acquired.date} — ${signed(((p.value - p.acquired.price) / p.acquired.price) * 100)} since acquisition. Implied cap rate on TTM NOI is ${pct((p.noi / p.value) * 100)}.`,
      points: p.valuation.stale ? [p.valuation.stale] : [],
      citations: [citeFeed(p, "valuation", "Accepted value", usdM(p.value)), cite("Acquisition", usd(p.acquired.price), "Closing statement", p.acquired.date)],
      missing: p.valuation.stale ? ["The valuation is outside its 180-day freshness window; NAV publishing that depends on it is paused."] : [],
      tone: p.valuation.stale ? "warn" : "info",
    });
  }
  if (has(q, "distribut", "paid", "payment", "dividend", "cash flow", "yield")) {
    const rows = distributionsFor(p);
    const paid = rows.filter((r) => r.status === "Paid");
    const total = paid.reduce((s, r) => s + r.amount, 0);
    const next = rows.find((r) => r.status === "Scheduled");
    return answer({
      title: `Distributions — ${p.name}`,
      summary: `${p.name} supported ${usd(total)} of ${vehicle.name} distributions across ${paid.length} payments this year (its ${pct(shareOfVehicle(p) * 100)} share of the vehicle), and the cash yield is ${pct(p.yieldPct)}. The next payment of $${next.rate.toFixed(4)} per token is scheduled for ${next.date}.`,
      points: [`Your ${INVESTOR.positions[vehicle.id].toLocaleString("en-US")} ${vehicle.token.symbol} tokens would receive about ${usd(INVESTOR.positions[vehicle.id] * next.rate)} from that payment across the whole vehicle.`],
      citations: [cite("Payment history", `${paid.length} paid · 1 scheduled`, "Transfer agent payment record", paid[0].date)],
      followUps: ["Explain this quarter's results"],
    });
  }
  if (has(q, "token", "holder", "supply", "nav", "price")) {
    return answer({
      title: `Token — ${p.name}`,
      summary: `${p.name} is held through ${vehicle.name} (${vehicle.token.symbol}), priced at $${vehicle.token.price.toFixed(3)} on the ${vehicle.token.navDate} NAV with ${vehicle.token.holders.toLocaleString("en-US")} holders. About ${Math.round(vehicle.token.issued * shareOfVehicle(p)).toLocaleString("en-US")} of the ${vehicle.token.issued.toLocaleString("en-US")} issued tokens are attributable to this asset by value.`,
      points: [vehicle.token.restrictions],
      citations: [cite("NAV per token", `$${vehicle.token.price.toFixed(3)}`, "Fund administrator NAV statement", vehicle.token.navDate)],
    });
  }
  if (has(q, "document", "report", "apprais", "insurance", "memorandum")) {
    return answer({
      title: `Documents — ${p.name}`,
      summary: `Five documents are on file: the Q2 2026 operating statement, the June operations report, the appraisal (${p.valuation.source}, ${p.valuation.date}), the 2026–27 insurance certificate, and the ${vehicle.name} offering memorandum.`,
      citations: [cite("Document register", "5 files", "Diameter document store", "Jul 21, 2026")],
      missing: feedFor(p, "insurance").status === "stale" ? ["The insurance certificate is in its renewal window; renewal is due."] : [],
    });
  }
  if (has(q, "risk", "concern", "watch", "wrong", "problem", "alert")) {
    const mine = materialAlerts().filter((a) => a.property === p);
    return answer({
      title: `Open items — ${p.name}`,
      summary: mine.length ? `${mine.length} item${mine.length === 1 ? "" : "s"} currently meet an alert rule for ${p.name}.` : `No rule-based alert is currently open for ${p.name}.`,
      points: mine.map((a) => `${a.title}: ${a.explanation}`),
      citations: mine.flatMap((a) => a.facts),
      tone: mine.some((a) => a.severity === "high") ? "warn" : "info",
    });
  }
  return answer({
    title: `About ${p.name}`,
    summary: `${p.description} Held through ${vehicle.name}; valued at ${usdM(p.value)}, ${p.occupancyLabel.toLowerCase()} ${pct(p.occupancy)}, cash yield ${pct(p.yieldPct)}, NOI ${usdM(p.noi)} (${p.budgetVariance.toLowerCase()}).`,
    points: [`Management commentary: ${p.commentary}`],
    citations: [citeFeed(p, "valuation", "Value", usdM(p.value)), citeFeed(p, "occupancy", p.occupancyLabel, pct(p.occupancy))],
    followUps: ["Why did occupancy change?", "Explain this quarter's results", "Summarize lease expirations", "What are the debt terms?"],
  });
};

const portfolioQuestion = (q) => {
  const totals = portfolioTotals();
  const positionValue = Object.entries(INVESTOR.positions).reduce((s, [id, qty]) => s + qty * vehicleById[id].token.price, 0);
  if (has(q, "alert", "changed materially", "material", "watch", "risk", "concern")) {
    const alerts = materialAlerts();
    return answer({
      title: "Material changes across your holdings",
      summary: `${alerts.length} alerts are open: ${alerts.filter((a) => a.severity === "high").length} high, ${alerts.filter((a) => a.severity === "medium").length} medium. The most significant is "${alerts[0].title}".`,
      points: alerts.slice(0, 4).map((a) => `${a.title} — ${a.explanation}`),
      citations: alerts.slice(0, 4).flatMap((a) => a.facts),
      tone: "warn",
    });
  }
  if (has(q, "highest", "best", "most", "lowest", "worst", "least")) {
    const low = has(q, "lowest", "worst", "least");
    const metric = has(q, "occupan") ? "occupancy" : has(q, "value", "largest", "biggest") ? "value" : "yieldPct";
    const sorted = [...PROPERTIES].sort((a, b) => (low ? a[metric] - b[metric] : b[metric] - a[metric]));
    const fmt = (p) => (metric === "value" ? usdM(p.value) : pct(p[metric]));
    const label = { occupancy: "occupancy", value: "asset value", yieldPct: "cash yield" }[metric];
    return answer({
      title: `${low ? "Lowest" : "Highest"} ${label}`,
      summary: `${sorted[0].name} has the ${low ? "lowest" : "highest"} ${label} at ${fmt(sorted[0])}, followed by ${sorted[1].name} (${fmt(sorted[1])}) and ${sorted[2].name} (${fmt(sorted[2])}).`,
      citations: sorted.slice(0, 3).map((p) => citeFeed(p, metric === "occupancy" ? "occupancy" : "valuation", p.name, fmt(p))),
      followUps: sorted.slice(0, 2).map((p) => `Tell me about ${p.name}`),
    });
  }
  if (has(q, "next distribution", "next payment", "when", "distribut", "paid", "income")) {
    return answer({
      title: "Distributions",
      summary: `An estimated $12,410 across your three vehicles is scheduled for Aug 15, 2026; distributions year to date are $81,940, 9.2% above the prior-year period. Your Q3 reinvestment election (currently 100% cash) closes Aug 14.`,
      citations: [cite("Scheduled distributions", "$12,410 · Aug 15", "Transfer agent payment schedule", "Jul 29, 2026")],
      followUps: ["Which property supports the most income?"],
    });
  }
  if (has(q, "lockup", "lock-up", "sell", "liquid", "transfer", "redeem")) {
    return answer({
      title: "Liquidity and lockups",
      summary: `$702,600 of your portfolio (56%) is free of lockups. The 250,000 CaliberCore Plus tokens remain locked until Oct 19, 2026, and the Jan 2026 CHT lot of 120,000 tokens is locked until Jan 08, 2027. Transfers of eligible tokens go through policy checks and transfer-agent review; there is no exchange or guaranteed buyer.`,
      citations: [cite("Lockup schedule", "2 lots locked", "Transfer agent ownership lots", "Jul 29, 2026")],
    });
  }
  if (has(q, "should i", "recommend", "buy", "invest more", "good investment", "advice", "allocate")) {
    return refusal("Not something the assistant decides", "Diameter can explain the records behind an investment, but it does not give personalized buy, sell, or allocation recommendations. Your advisor can use the summaries and comparisons here as inputs to that conversation.");
  }
  if (has(q, "other investor", "someone else", "another investor", "who owns", "list of investors")) {
    return refusal("Outside your authorization", "The assistant only reads records you are authorized to view. Other investors' holdings and identities are not available.");
  }
  if (has(q, "portfolio", "worth", "how much", "total", "value", "return", "yield", "holding")) {
    return answer({
      title: "Your portfolio",
      summary: `Your three positions are worth ${usd(positionValue)} at the latest published NAVs (CHT Jun 30, CSOF Jun 30, CCP Mar 31) and $1,248,920 including cash and private credit — a 16.7% total return since inception with a 7.2% annualized yield. The underlying ten properties total ${usdM(totals.value)} of gross asset value at ${pct(totals.occupancy)} value-weighted occupancy.`,
      citations: VEHICLES.map((v) => cite(`${v.token.symbol} NAV`, `$${v.token.price.toFixed(3)}`, "Fund administrator NAV statement", v.token.navDate)),
      missing: ["The CaliberCore Plus NAV is from Mar 31, 2026; the Q2 NAV is pending an expense-variance review."],
      followUps: ["What changed materially?", "Which property has the highest yield?"],
    });
  }
  return null;
};

export const askQuestion = (question, context = {}) => {
  const q = ` ${question.toLowerCase().trim()} `;
  if (!q.trim()) return null;
  if (has(q, "should i", "recommend", "buy", "sell", "invest more", "good investment", "advice", "allocate", "predict", "will the price", "forecast")) {
    return refusal("Not something the assistant decides", "Diameter explains the records behind an investment; it does not give personalized buy, sell, or allocation recommendations or predict prices. The comparisons and summaries here are informational inputs for a conversation with your advisor.");
  }
  const mentioned = findProperties(q);
  if (mentioned.length >= 2 && has(q, "compare", " vs", "versus", "or ", "better")) return compareProperties(mentioned[0], mentioned[1]);
  const vehicle = findVehicle(q);
  if (vehicle && !mentioned.length && has(q, "summar", "overview", "about", "what is")) return summarizeOffering(OFFERINGS.find((o) => o.vehicleId === vehicle.id));
  const property = mentioned[0] ?? context.property;
  if (property) return propertyQuestion(property, q);
  return portfolioQuestion(q) ?? answer({
    title: "I could not ground that question",
    summary: "The assistant answers from property, vehicle, distribution, and source records on this platform. Try naming a property (for example, “Why did occupancy fall at Presidio Exchange?”) or asking about your portfolio, distributions, lockups, or open alerts.",
    tone: "refuse",
    followUps: ["What changed materially?", "Compare Skyline Hotel Phoenix and Roosevelt Commons", "Summarize Caliber Hospitality Trust"],
  });
};

// Rule-based alerts are injected into the notification feed so the bell
// reflects material changes, each with its explanation attached.
export const alertNotifications = () =>
  materialAlerts()
    .filter((a) => a.severity === "high" || a.severity === "medium")
    .map((a) => ({ title: a.title, body: a.explanation, time: "Jul 29 · 10:42 AM", route: a.route, unread: true, alert: true }));

export const seedAlertNotifications = () => {
  if (NOTIFICATIONS.some((n) => n.alert)) return;
  NOTIFICATIONS.unshift(...alertNotifications());
};

export const SUGGESTED_PORTFOLIO_QUESTIONS = [
  "What changed materially across my holdings?",
  "Which property has the highest yield?",
  "When is my next distribution?",
  "Compare Skyline Hotel Phoenix and Roosevelt Commons",
];

export const suggestedPropertyQuestions = (p) => [
  `Why did ${p.occupancyLabel.toLowerCase()} change?`,
  "What changed this quarter?",
  p.leases ? "Summarize lease expirations" : "How seasonal is the income?",
  "What if rates were 1% higher?",
];
