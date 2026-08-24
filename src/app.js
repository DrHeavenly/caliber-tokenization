import {
  FEED_STATES,
  INCOME_MONTHS,
  INCOME_PERIOD,
  INVESTOR,
  KEY_RECORD_KINDS,
  NOTIFICATIONS,
  OFFERINGS,
  ORACLE_FEEDS,
  PROPERTIES,
  RECOMMENDATIONS,
  SMART_RECORD,
  distributionsFor,
  documentsFor,
  feedFor,
  incomeSeries,
  keyRecords,
  portfolioTotals,
  propertiesOf,
  shareOfVehicle,
  vehicleById,
  vehicleOf,
} from "./data.js";
import { ASSISTANT_FEATURES, ASSURANCE_FEATURES } from "./flags.js";
import {
  SUGGESTED_PORTFOLIO_QUESTIONS,
  askQuestion,
  compareProperties,
  explainQuarter,
  financingScenario,
  leaseOutlook,
  materialAlerts,
  seedAlertNotifications,
  suggestedPropertyQuestions,
  summarizeOffering,
} from "./assistant.js";

const labels = {
  overview: "Investor dashboard",
  offerings: "Explore offerings",
  properties: "Property dashboard",
  ownership: "Token ownership",
  distributions: "Distribution history",
  performance: "Asset performance",
  compliance: "Compliance dashboard",
};

// Asset-records screen — hidden unless the flag is on (route, nav, search palette).
if (ASSURANCE_FEATURES) labels.records = "Asset records";

const propertyById = Object.fromEntries(PROPERTIES.map((p) => [p.id, p]));
const listState = { filter: "all", query: "" };

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const usdM = (n) => `$${(n / 1e6).toFixed(1)}M`;
const pct = (n) => `${n.toFixed(1)}%`;
const int = (n) => n.toLocaleString("en-US");

const toast = (message) => {
  const el = document.querySelector(".toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
};

/* ---------- Property list ---------- */

const propertyCard = (p) => {
  const vehicle = vehicleOf(p);
  return `<article class="property-card">
    <a class="property-link" href="/properties/${p.id}" data-route="properties/${p.id}" aria-label="View ${esc(p.name)}">
      <div class="property-image ${p.image}"><span class="status ${p.statusKind}">${esc(p.status)}</span></div>
      <div class="property-body">
        <span class="eyebrow">${esc(p.type.toUpperCase())} / ${esc(p.market.toUpperCase())}</span>
        <h3>${esc(p.name)}</h3>
        <div class="property-stats">
          <span><small>Asset value</small><strong>${usdM(p.value)}</strong></span>
          <span><small>Annual yield</small><strong>${pct(p.yieldPct)}</strong></span>
          <span><small>${esc(p.occupancyLabel)}</small><strong>${pct(p.occupancy)}</strong></span>
        </div>
        <footer><span><code>${esc(vehicle.token.symbol)}</code> $${vehicle.token.price.toFixed(3)} · ${int(vehicle.token.holders)} holders</span><strong>View asset →</strong></footer>
      </div>
    </a>
  </article>`;
};

const renderPropertyList = () => {
  const query = listState.query.trim().toLowerCase();
  const matches = PROPERTIES.filter(
    (p) =>
      (listState.filter === "all" || p.type === listState.filter) &&
      (!query || `${p.name} ${p.market} ${p.type} ${vehicleOf(p).token.symbol} ${vehicleOf(p).name}`.toLowerCase().includes(query)),
  );
  document.getElementById("property-list").innerHTML = matches.length
    ? matches.map(propertyCard).join("")
    : `<p class="empty-note">No properties match the current search and filters.</p>`;
};

const renderPropertiesScreen = () => {
  const totals = portfolioTotals();
  document.getElementById("m-gav").textContent = usdM(totals.value);
  document.getElementById("m-noi").textContent = usdM(totals.noi);
  document.getElementById("m-occ").textContent = pct(totals.occupancy);
  document.getElementById("m-count").textContent = totals.count;
  document.getElementById("m-markets").textContent = `${totals.markets} markets · ${totals.types} asset classes`;
  document.querySelectorAll(".filter[data-filter]").forEach((button) => {
    const type = button.dataset.filter;
    button.querySelector("b").textContent = type === "all" ? PROPERTIES.length : PROPERTIES.filter((p) => p.type === type).length;
  });
  renderPropertyList();
};

/* ---------- Property detail ---------- */

const profileRow = ([label, value]) => `<div class="profile-row"><span>${esc(label)}</span><strong>${value}</strong></div>`;

// The tag says "source" on its face so the reader knows what the pill is for;
// the vendor wording (NAVLink, CRE) lives in the dialog, where it is explained.
const sourceTag = (p, kind) => {
  if (!ASSURANCE_FEATURES) return "";
  const feed = feedFor(p, kind);
  const state = FEED_STATES[feed.status];
  return `<button type="button" class="source-tag ${feed.status}" data-source-kind="${esc(kind)}" data-property-id="${esc(p.id)}" title="${esc(feed.label)} · ${esc(state.meaning)} Open for source, freshness, and fallback." aria-label="View the source record for ${esc(feed.label)} — ${esc(state.label)}"><i aria-hidden="true"></i><span>${esc(state.label)}</span><small>source</small></button>`;
};

const renderAssuranceSummary = () => {
  if (!ASSURANCE_FEATURES) return;
  const target = document.getElementById("assurance-summary");
  if (!target) return;
  const records = keyRecords();
  const current = records.filter((record) => record.status === "normal").length;
  const exceptions = records.filter((record) => record.status !== "normal");
  const kinds = KEY_RECORD_KINDS.map((kind) => ORACLE_FEEDS[kind].label.toLowerCase());
  // Each exception names its property and links to it, so the counts are a way
  // into the work rather than three numbers with no referent.
  const chips = exceptions.length
    ? exceptions
        .map(
          (record) => `<a class="${record.status}" href="/properties/${record.property.id}" data-route="properties/${record.property.id}">
            <i aria-hidden="true"></i><span><strong>${esc(FEED_STATES[record.status].label)} · ${esc(record.label)}</strong><small>${esc(record.property.name)}</small></span></a>`,
        )
        .join("")
    : `<span class="assurance-clear"><i aria-hidden="true"></i>No open exceptions</span>`;
  target.innerHTML = `
    <div class="assurance-mark" aria-hidden="true"><span>✓</span></div>
    <div class="assurance-copy">
      <span>DATA ASSURANCE</span>
      <strong>${current} of ${records.length} key records are current</strong>
      <small>All ${PROPERTIES.length} properties keep three records their published numbers depend on — ${esc(kinds.slice(0, -1).join(", "))} and ${esc(kinds.at(-1))}. Any figure with a source tag opens its origin, its last check, and the fallback if that source fails.</small>
    </div>
    <div class="assurance-states" aria-label="Records needing attention">${chips}</div>
    <button class="text-button" data-route="records">See how a record works →</button>`;
};

const sourceDialog = document.getElementById("source-dialog");

const openSourceDialog = (property, kind) => {
  const feed = feedFor(property, kind);
  const state = FEED_STATES[feed.status];
  const fit = RECOMMENDATIONS[feed.recommendation];
  sourceDialog.className = `source-dialog ${feed.status}`;
  sourceDialog.innerHTML = `
    <div class="source-dialog-head">
      <div>
        <span class="eyebrow">${esc(property.name.toUpperCase())} · SOURCE RECORD</span>
        <h2>${esc(feed.label)}</h2>
        <p>${esc(feed.question)}</p>
      </div>
      <button type="button" class="dialog-close" data-action="close-source" aria-label="Close source details">×</button>
    </div>
    <div class="source-status"><i aria-hidden="true"></i><strong>${esc(state.label)}</strong><span>${esc(state.meaning)}</span></div>
    ${feed.note ? `<p class="source-alert">${esc(feed.note)}</p>` : ""}
    <dl class="source-facts">
      <div><dt>Comes from</dt><dd>${esc(feed.source)}</dd></div>
      <div><dt>Effective date</dt><dd>${esc(feed.effective)}</dd></div>
      <div><dt>Last checked</dt><dd>${esc(feed.checked)}</dd></div>
      <div><dt>Refreshed</dt><dd>${esc(feed.cadence)} · counts as stale after ${esc(feed.maxAge)}</dd></div>
    </dl>
    <div class="source-decision"><span>What is published</span><p>${esc(feed.classification)}</p></div>
    <div class="source-decision"><span>How it is checked</span><p>${esc(feed.verification)}</p></div>
    <div class="source-decision"><span>If sources disagree</span><p>${esc(feed.dispute)}</p></div>
    <div class="source-decision"><span>If the source fails</span><p>${esc(feed.failure)}</p></div>
    <details class="source-more">
      <summary>Who uses it, and what it costs to run</summary>
      <div class="source-decision"><span>Used in Diameter by</span><p>${esc(feed.offchainConsumer)}</p></div>
      <div class="source-decision"><span>Would be used on-chain by</span><p>${esc(feed.onchainConsumer)}</p></div>
      <div class="source-decision"><span>How it is combined</span><p>${esc(feed.aggregation)}</p></div>
      <div class="source-decision"><span>What may leave Diameter</span><p>${esc(feed.placement)}</p></div>
      <div class="source-decision"><span>Operating load</span><p>${esc(feed.operations)}</p></div>
    </details>
    <footer class="source-dialog-foot">
      <strong>Does this need a blockchain oracle?</strong>
      <p><b class="fit ${esc(fit.tone)}">${esc(fit.label.toUpperCase())}</b> ${esc(fit.meaning)}</p>
      <p>${esc(feed.chainlink)} <em>(${esc(feed.method)})</em></p>
      <small>An oracle is a service that carries outside data to a smart contract. This is an illustrative design — Diameter connects to no live feed and no blockchain.</small>
    </footer>`;
  sourceDialog.showModal();
};

const incomeChart = (p) => {
  const series = incomeSeries(p);
  const max = Math.max(...series);
  const bars = series
    .map((v, i) => `<i style="--h:${Math.round((v / max) * 88)}%" title="${esc(INCOME_MONTHS[i])}: ${usd(v)}"><b>${Math.round(v / 1000)}</b></i>`)
    .join("");
  const months = INCOME_MONTHS.map((m) => `<span>${esc(m.split(" ")[0])}</span>`).join("");
  return `<div class="bar-chart detail-bars" aria-label="Monthly gross income, $ thousands"><div class="bars">${bars}</div><div class="x-labels">${months}</div></div>`;
};

const detailHTML = (p) => {
  const vehicle = vehicleOf(p);
  const { token } = vehicle;
  const share = shareOfVehicle(p);
  const positionTokens = INVESTOR.positions[vehicle.id] ?? 0;
  const positionPct = (positionTokens / token.issued) * 100;
  const exposure = positionTokens * token.price * share;
  const opex = p.grossIncome - p.noi;
  const capRate = (p.noi / p.value) * 100;

  const distributionRows = distributionsFor(p)
    .map(
      (d) => `<tr><td>${esc(d.date)}</td><td>${esc(d.type)}</td><td>$${d.rate.toFixed(4)}</td><td><strong>${usd(d.amount)}</strong></td><td><span class="status ${d.status === "Paid" ? "active" : "review"}">${esc(d.status)}</span></td></tr>`,
    )
    .join("");

  const documentRows = documentsFor(p)
    .map(
      (doc) => `<div class="doc-row"><span class="doc-badge">PDF</span><div><strong>${esc(doc.title)}</strong><small>${esc(doc.category)} · ${esc(doc.date)} · ${esc(doc.size)}${doc.note ? ` · ${esc(doc.note)}` : ""}</small></div>${doc.feed ? sourceTag(p, doc.feed) : ""}<button class="text-button" data-toast="Sample document — downloads are stubbed in this prototype.">Download</button></div>`,
    )
    .join("");

  const assistant = detailAssistantHTML(p);
  const mixRows = vehicle.investorMix
    .map(([label, value], i) => `<div><span><i class="swatch s${i + 1}"></i>${esc(label)}</span><b>${value}%</b><progress value="${value}" max="100"></progress></div>`)
    .join("");

  return `
    <a class="back-link" href="/properties" data-route="properties">← All properties</a>
    <div class="page-heading">
      <div><span class="eyebrow">${esc(p.type.toUpperCase())} / ${esc(p.market.toUpperCase())}</span><h1>${esc(p.name)}</h1><p>${esc(p.description)}</p></div>
      <div class="as-of"><span>Valuation as of</span><strong>${esc(p.valuation.date)} · ${esc(p.valuation.source)}</strong></div>
    </div>
    ${p.valuation.stale ? `<div class="stale-banner"><i>!</i>${esc(p.valuation.stale)}</div>` : ""}
    <div class="property-image detail-banner ${p.image}"><span class="status ${p.statusKind}">${esc(p.status)}</span><span class="detail-banner-size">${esc(p.size)}</span></div>
    <div class="metric-grid metric-grid--four">
      <article class="metric featured"><span>Asset value</span><strong>${usdM(p.value)}</strong><footer><small>Appraised ${esc(p.valuation.date)}</small>${sourceTag(p, "valuation")}</footer></article>
      <article class="metric"><span>Annual yield</span><strong>${pct(p.yieldPct)}</strong><footer><small>Cash distribution yield</small></footer></article>
      <article class="metric"><span>${esc(p.occupancyLabel)}</span><strong>${pct(p.occupancy)}</strong><footer><small>Reported Jun 2026</small>${sourceTag(p, "occupancy")}</footer></article>
      <article class="metric"><span>Net operating income</span><strong>${usdM(p.noi)}</strong><footer><small>${esc(INCOME_PERIOD)}</small>${sourceTag(p, "collections")}</footer></article>
    </div>
    ${assistant.ask}
    <div class="detail-columns">
      <div class="detail-stack">
        <article class="card">
          <header><div><h2>${p.type === "Hospitality" ? "Operating income" : "Rental income"}</h2><p>Monthly gross income, $ thousands · ${esc(INCOME_PERIOD)}</p></div>${sourceTag(p, "collections")}</header>
          ${incomeChart(p)}
          <div class="income-summary">
            <div><span>Gross income</span><strong>${usdM(p.grossIncome)}</strong></div>
            <div><span>Operating expenses</span><strong>${usdM(opex)}</strong></div>
            <div><span>NOI</span><strong>${usdM(p.noi)}</strong></div>
            <div><span>Vs. budget</span><strong>${esc(p.budgetVariance)}</strong></div>
          </div>
          ${assistant.explain}
        </article>
        ${assistant.lease}
        ${assistant.financing}
        <article class="card">
          <header><div><h2>Distribution history</h2><p>${esc(vehicle.name)} payments attributed pro rata by this asset's ${pct(share * 100)} share of vehicle value</p></div></header>
          <div class="table-wrap"><table>
            <thead><tr><th>Payment date</th><th>Type</th><th>Rate / token</th><th>Property share</th><th>Status</th></tr></thead>
            <tbody>${distributionRows}</tbody>
          </table></div>
        </article>
        <article class="card">
          <header><div><h2>Documents</h2><p>Reporting, valuation, and offering materials</p></div><span class="status active">${documentsFor(p).length} files</span></header>
          ${documentRows}
        </article>
      </div>
      <div class="detail-stack">
        <article class="card">
          <header><div><h2>Financial metrics</h2><p>Latest reported figures</p></div>${sourceTag(p, "debt")}</header>
          ${[
            ["Gross asset value", usd(p.value)],
            ["Acquired", `${usd(p.acquired.price)} · ${esc(p.acquired.date)}`],
            ["Cap rate", pct(capRate)],
            ["NOI (TTM)", usd(p.noi)],
            ["Loan-to-value", esc(p.debt.ltv)],
            ["Debt rate", esc(p.debt.rate)],
            ["Debt service coverage", esc(p.debt.dscr)],
            ...p.extra,
          ].map(profileRow).join("")}
        </article>
        <article class="card">
          <header><div><h2>Token & supply</h2><p>Tokenized through ${esc(vehicle.name)}</p></div><div class="header-actions"><span class="token-badge ${token.badgeClass}">${esc(token.badge)}</span>${p.id === SMART_RECORD.propertyId && ASSURANCE_FEATURES ? `<button class="text-button" data-route="records">Asset record →</button>` : ""}</div></header>
          ${[
            ["Token price", `$${token.price.toFixed(3)} <small class="basis-note">${esc(token.priceBasis)} · ${esc(token.navDate)}</small> ${sourceTag(p, "valuation")}`],
            ["Issued supply", `${int(token.issued)} ${esc(token.symbol)}`],
            ["Authorized supply", int(token.authorized)],
            ["Token holders", int(token.holders)],
            ["Share of vehicle", pct(share * 100)],
            ["Tokens attributable", `≈ ${int(Math.round(token.issued * share))}`],
          ].map(profileRow).join("")}
          <div class="supply-bar" role="img" aria-label="${int(token.issued)} of ${int(token.authorized)} tokens issued"><i style="width:${((token.issued / token.authorized) * 100).toFixed(1)}%"></i></div>
          <p class="card-footnote">${esc(token.restrictions)}</p>
        </article>
        <article class="card">
          <header><div><h2>Ownership</h2><p>${esc(vehicle.structure)}</p></div></header>
          ${[
            ["Offering type", esc(vehicle.offering)],
            ["Target return", esc(vehicle.targetReturn)],
            ["Sponsor co-investment", esc(vehicle.sponsorStake)],
            ["Top-10 holder concentration", esc(vehicle.top10Concentration)],
          ].map(profileRow).join("")}
          <div class="progress-list">${mixRows}</div>
          <div class="your-position"><span>Your position</span><strong>${int(positionTokens)} ${esc(token.symbol)} · ${positionPct.toFixed(2)}% of issued supply</strong><small>≈ ${usd(exposure)} of your position value is attributable to this asset</small></div>
        </article>
      </div>
    </div>`;
};


/* ---------- Diameter Assistant ---------- */

// One renderer for every generated answer, so the label, citations, and
// disclaimer are always present however the answer was produced.
const assistantMark = (className = "") => `<span class="assistant-mark${className ? ` ${className}` : ""}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7.25"/><path d="m7 17 10-10"/><circle class="assistant-mark__point" cx="7" cy="17" r="1.25"/><circle class="assistant-mark__point" cx="17" cy="7" r="1.25"/></svg></span>`;

const citationChip = (c) => `<span class="cite${c.status && c.status !== "normal" ? ` ${esc(c.status)}` : ""}"><strong>${esc(c.label)}</strong><span>${esc(c.value)}</span><small>${esc(c.source)} · ${esc(c.effective)}</small></span>`;

const answerHTML = (a, { heading = true } = {}) => {
  if (!a) return "";
  const rows = a.rows
    ? `<div class="table-wrap"><table class="compare-table"><tbody>${a.rows.map(([k, x, y]) => `<tr><th>${esc(k)}</th><td>${esc(x)}</td><td>${esc(y)}</td></tr>`).join("")}</tbody></table></div>`
    : "";
  return `<div class="answer ${esc(a.tone)}">
    ${heading ? `<div class="answer-head"><span class="assistant-signature">${assistantMark()}<span><strong>Diameter intelligence</strong><small>Grounded in platform records</small></span></span><time>Generated ${esc(a.generatedAt)}</time></div>` : ""}
    <h3>${esc(a.title)}</h3>
    <p class="answer-summary">${esc(a.summary)}</p>
    ${a.points.length ? `<ul class="answer-points">${a.points.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    ${rows}
    ${a.missing.length ? `<div class="answer-note missing"><strong>Data caveats</strong>${a.missing.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
    ${a.assumptions.length ? `<div class="answer-note"><strong>Assumptions</strong>${a.assumptions.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
    ${a.citations.length ? `<details class="answer-sources"><summary><span>Source records</span><strong>${a.citations.length} ${a.citations.length === 1 ? "record" : "records"}</strong><span class="source-toggle">View +</span></summary><div class="answer-cites">${a.citations.map(citationChip).join("")}</div></details>` : ""}
    ${a.followUps.length ? `<div class="answer-follow">${a.followUps.map((q) => `<button type="button" class="chip" data-ask="${esc(q)}">${esc(q)}</button>`).join("")}</div>` : ""}
    <p class="answer-foot">Drafted from platform records, not from outside information. Informational only — not investment, legal, or tax advice.</p>
  </div>`;
};

const askForm = (scope, suggestions, placeholder) => {
  const inputId = `ask-${scope.replace(/[^a-z0-9-]/gi, "-")}`;
  return `
  <form class="ask-form" data-scope="${esc(scope)}">
    <div class="ask-label"><label for="${esc(inputId)}">Ask a question</label><div class="ask-input">${assistantMark("small")}<input id="${esc(inputId)}" name="q" placeholder="${esc(placeholder)}" autocomplete="off"><button type="submit" class="primary-button compact"><span>Ask Diameter</span><b aria-hidden="true">→</b></button></div></div>
    <div class="ask-suggest"><span class="suggest-label">Suggested</span>${suggestions.map((q) => `<button type="button" class="chip" data-ask="${esc(q)}"><span>${esc(q)}</span><b aria-hidden="true">↗</b></button>`).join("")}</div>
    <div class="ask-answer" aria-live="polite"></div>
  </form>`;
};

const severityLabel = { high: "High", medium: "Medium", low: "Low", info: "Info" };

const renderOverviewAssistant = () => {
  const target = document.getElementById("overview-assistant");
  if (!target) return;
  const alerts = materialAlerts();
  const rows = alerts.slice(0, 5).map((a) => `
    <details class="alert-row ${esc(a.severity)}">
      <summary><span class="priority ${esc(a.severity)}">${esc(severityLabel[a.severity])}</span><span class="alert-copy"><strong>${esc(a.title)}</strong><small>Rule: ${esc(a.rule)}</small></span><span class="alert-chevron" aria-hidden="true">⌄</span></summary>
      <div class="alert-body"><p>${esc(a.explanation)}</p><p class="alert-impact">${esc(a.holderImpact)}</p><div class="answer-cites">${a.facts.map(citationChip).join("")}</div><a class="text-button" href="/${esc(a.route)}" data-route="${esc(a.route)}">Open →</a></div>
    </details>`).join("");
  target.innerHTML = `
    <article class="card alerts-card">
      <header><div><span class="assistant-kicker">Automated monitoring</span><h2>Material changes</h2><p>Rules flag exceptions; Diameter explains the underlying records</p></div><span class="alert-total"><strong>${alerts.length}</strong><small>signals</small></span></header>
      ${rows}
      <p class="card-footnote">Thresholds: occupancy ±2 pts (±3 for hospitality), NOI ±1.5% to budget, valuation older than 180 days, NAV older than 90 days, coverage below 1.35×, any source record not current.</p>
    </article>
    <article class="card ask-card">
      <header><div class="assistant-heading">${assistantMark()}<div><span class="assistant-kicker">Portfolio intelligence</span><h2>Ask Diameter</h2><p>Clear answers about your holdings, sourced to platform records</p></div></div><span class="assistant-grounding"><i></i>Records only</span></header>
      ${askForm("portfolio", SUGGESTED_PORTFOLIO_QUESTIONS, "Ask about a property, distributions, lockups, or what changed…")}
    </article>`;
};

const renderComparePanel = (aId = "skyline-hotel-phoenix", bId = "roosevelt-commons") => {
  const target = document.getElementById("compare-panel");
  if (!target) return;
  const option = (id, selected) => PROPERTIES.map((p) => `<option value="${esc(p.id)}"${p.id === selected ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  target.innerHTML = `
    <details class="card compare-card" ${target.dataset.open === "true" ? "open" : ""}>
      <summary>${assistantMark("small")}<strong>Compare two investments</strong><small>Same-period figures side by side, with the differences explained</small><span class="text-button disclosure-label" aria-hidden="true"></span></summary>
      <div class="compare-controls">
        <label>First<select data-compare="a">${option("a", aId)}</select></label>
        <span aria-hidden="true">vs.</span>
        <label>Second<select data-compare="b">${option("b", bId)}</select></label>
      </div>
      <div class="compare-answer">${aId === bId ? `<p class="empty-note">Choose two different properties.</p>` : answerHTML(compareProperties(propertyById[aId], propertyById[bId]), { heading: false })}</div>
    </details>`;
};

const renderPerformanceAssistant = () => {
  const target = document.getElementById("performance-assistant");
  if (!target) return;
  target.innerHTML = `<details class="card explain-card"><summary>${assistantMark("small")}<strong>Explain Roosevelt Commons' quarter</strong><small>Q2 2026 versus Q1 2026, from the operating statement</small><span class="text-button disclosure-label" aria-hidden="true"></span></summary>${answerHTML(explainQuarter(propertyById["roosevelt-commons"]), { heading: false })}</details>`;
};

const financingPanel = (p, input = {}) => {
  const { metrics, answer } = financingScenario(p, input);
  const s = { ltv: Number(p.debt.ltv.replace("%", "")), rate: Number(p.debt.rate.split("%")[0]), amort: 30, noiChange: 0, ...input };
  const field = (name, label, value, min, max, step, fmt) => `<label class="scenario-field"><span>${label}<b data-out="${name}">${fmt}</b></span><input type="range" name="${name}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label}"></label>`;
  return `
    <div class="scenario-controls">
      ${field("ltv", "Loan-to-value", s.ltv, 40, 80, 1, `${s.ltv}%`)}
      ${field("rate", "Interest rate", s.rate, 3, 10, 0.1, `${s.rate.toFixed(2)}%`)}
      ${field("noiChange", "NOI change", s.noiChange, -30, 20, 1, `${s.noiChange > 0 ? "+" : ""}${s.noiChange}%`)}
      <label class="scenario-field"><span>Amortization</span><select name="amort" aria-label="Amortization">${[[30, "30 years"], [25, "25 years"], [20, "20 years"], [0, "Interest only"]].map(([v, l]) => `<option value="${v}"${v === Number(s.amort) ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <button type="button" class="text-button" data-scenario-reset>Reset to current terms</button>
    </div>
    <div class="scenario-metrics">
      <div><span>Loan</span><strong>${usdM(metrics.loan)}</strong></div>
      <div><span>Annual debt service</span><strong>${usd(metrics.service)}</strong></div>
      <div class="${metrics.coverage < 1.25 ? "bad" : ""}"><span>Coverage</span><strong>${metrics.coverage.toFixed(2)}×</strong></div>
      <div><span>Cash-on-cash</span><strong>${pct(metrics.cashOnCash)}</strong></div>
    </div>
    ${answerHTML(answer, { heading: false })}`;
};

const detailAssistantHTML = (p) => {
  if (!ASSISTANT_FEATURES) return { ask: "", lease: "", financing: "", explain: "" };
  return {
    ask: `<article class="card ask-card"><header><div class="assistant-heading">${assistantMark()}<div><span class="assistant-kicker">Property intelligence</span><h2>Ask about ${esc(p.name)}</h2><p>Answers grounded in this property's records</p></div></div><span class="assistant-grounding"><i></i>Records only</span></header>${askForm(`property:${p.id}`, suggestedPropertyQuestions(p), `Ask about occupancy, income, leases, debt, documents…`)}</article>`,
    explain: `<div class="explain-row"><button type="button" class="secondary-button compact" data-explain="${esc(p.id)}"><span class="ai-badge"><i aria-hidden="true"></i></span>Explain Q2 vs. Q1</button><div class="explain-target"></div></div>`,
    lease: `<article class="card outlook-card"><header><div><h2>${p.leases ? "Lease & occupancy outlook" : "Demand & occupancy outlook"}</h2><p>Expirations, renewals, and the four-quarter trend</p></div><span class="ai-badge"><i aria-hidden="true"></i>Diameter Assistant</span></header>${answerHTML(leaseOutlook(p), { heading: false })}</article>`,
    financing: `<article class="card scenario-card" data-scenario-property="${esc(p.id)}"><header><div><h2>Financing scenarios</h2><p>Move the inputs; the arithmetic is deterministic and the explanation is drafted from it</p></div><span class="ai-badge"><i aria-hidden="true"></i>Diameter Assistant</span></header><div class="scenario-body">${financingPanel(p)}</div></article>`,
  };
};

const runAsk = (form, question) => {
  const scope = form.dataset.scope;
  const property = scope.startsWith("property:") ? propertyById[scope.split(":")[1]] : null;
  const target = form.querySelector(".ask-answer");
  form.querySelector("input[name=q]").value = question;
  target.innerHTML = `<p class="answer-thinking"><i aria-hidden="true"></i>Reading the records…</p>`;
  setTimeout(() => {
    target.innerHTML = answerHTML(askQuestion(question, { property }));
    target.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, 350);
};

/* ---------- Offerings screen ---------- */

const renderOfferingsScreen = () => {
  document.getElementById("offerings-grid").innerHTML = OFFERINGS.map((offering) => {
    const vehicle = offering.vehicleId ? vehicleById[offering.vehicleId] : null;
    const name = vehicle ? vehicle.name : offering.name;
    const rows = vehicle
      ? [
          ["Strategy", esc(vehicle.strategy)],
          ["Structure", esc(vehicle.structure)],
          ["Offering type", esc(vehicle.offering)],
          ["Target return", esc(vehicle.targetReturn)],
          ["Token price", `$${vehicle.token.price.toFixed(3)} <small class="basis-note">${esc(vehicle.token.priceBasis)} · ${esc(vehicle.token.navDate)}</small>`],
          ["Token holders", int(vehicle.token.holders)],
          ["Properties", `${propertiesOf(vehicle).length} · ${usdM(propertiesOf(vehicle).reduce((sum, p) => sum + p.value, 0))} GAV`],
          ["Minimum investment", esc(offering.minInvestment)],
        ]
      : [
          ["Strategy", esc(offering.strategy)],
          ["Target return", esc(offering.targetReturn)],
          ["Minimum investment", esc(offering.minInvestment)],
        ];
    const action = vehicle
      ? `<button class="secondary-button" data-toast="Prototype interaction — allocation requests are not part of the current build.">Request allocation</button>
         <button class="text-button" data-route="properties">View properties →</button>`
      : `<button class="secondary-button" data-toast="Prototype interaction — the waitlist is not part of the current build.">Join waitlist</button>`;
    return `<article class="panel-card">
      <header><div><h3>${esc(name)}</h3><small>${esc(offering.closes)}</small></div><span class="status ${offering.statusKind}">${esc(offering.status)}</span></header>
      <p class="panel-blurb">${esc(offering.blurb)}</p>
      ${rows.map(profileRow).join("")}
      ${ASSISTANT_FEATURES ? `<details class="offering-summary"><summary><span class="ai-badge"><i aria-hidden="true"></i>Diameter Assistant</span><strong>Investment summary</strong><span class="text-button">Read +</span></summary>${answerHTML(summarizeOffering(offering), { heading: false })}</details>` : ""}
      <footer class="panel-actions">${action}</footer>
    </article>`;
  }).join("");
};

const renderAssetRecordsScreen = () => {
  if (!ASSURANCE_FEATURES) return;
  const target = document.getElementById("asset-record-screen");
  if (!target) return;
  const property = propertyById[SMART_RECORD.propertyId];
  const vehicle = vehicleOf(property);
  const sourceTemplate = document.getElementById("contract-source");
  const contractSource = sourceTemplate?.content?.textContent?.trim() ?? "";
  const events = SMART_RECORD.events.map((event, index) => `
    <div class="record-event ${index === 0 ? "latest" : ""}"><i aria-hidden="true"></i><div><time>${esc(event.date)}</time><strong>${esc(event.title)}</strong><small>${esc(event.detail)}</small></div><span class="status ${event.status === "Review" ? "review" : "active"}">${esc(event.status)}</span></div>`).join("");
  const decisions = Object.entries(ORACLE_FEEDS).map(([kind, feed]) => {
    const fit = RECOMMENDATIONS[feed.recommendation];
    return `<button type="button" data-source-kind="${esc(kind)}" data-property-id="${esc(property.id)}"><span class="fit ${esc(fit.tone)}">${esc(fit.label.toUpperCase())}</span><strong>${esc(feed.label)}</strong><small>From ${esc(feed.shortSource)}</small></button>`;
  }).join("");
  const legend = Object.values(RECOMMENDATIONS)
    .map((fit) => `<div><span class="fit ${esc(fit.tone)}">${esc(fit.label.toUpperCase())}</span><p>${esc(fit.meaning)}</p></div>`)
    .join("");
  target.innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">OPERATIONS / DATA ASSURANCE</span><h1>Asset records</h1><p>One worked example: how an approved value for ${esc(property.name)} becomes a record investors can trace, and which property data would justify a blockchain oracle at all.</p></div>
      <div class="as-of"><span>Register updated</span><strong>Jul 29, 2026 · 10:42 AM</strong></div>
    </div>
    <article class="record-hero">
      <div class="record-identity">
        <span class="eyebrow">${esc(vehicle.token.symbol)} / ${esc(SMART_RECORD.recordId)}</span>
        <h2>${esc(property.name)}</h2>
        <p>${esc(property.market)} · ${esc(property.size)} · ${esc(vehicle.name)}</p>
        <div class="record-hero-actions"><a href="/properties/${esc(property.id)}" data-route="properties/${esc(property.id)}" class="secondary-button">View property</a>${sourceTag(property, "valuation")}</div>
      </div>
      <div class="record-seal" aria-label="Illustrative smart record"><span>SMART<br>RECORD</span><small>${esc(SMART_RECORD.network)}</small></div>
      <div class="record-metrics">
        <div><span>Approved value</span><strong>${usdM(property.value)}</strong><small>Effective ${esc(property.valuation.date)}</small></div>
        <div><span>Backed by</span><strong>${esc(property.valuation.source)}</strong><small>Signed appraisal · fingerprint ${esc(SMART_RECORD.appraisalHash)}</small></div>
        <div><span>Record owner</span><strong>${esc(SMART_RECORD.custodian)}</strong><small>Fictional role · no wallet connected</small></div>
      </div>
      <p class="record-disclaimer">A <b>smart record</b> here is a small program that holds one approved value, its effective date, and a fingerprint of the appraisal behind it. This one runs only in local tests: it is never deployed, holds no money, moves no tokens, and confers no legal ownership.</p>
    </article>
    <div class="contract-layout">
      <article class="card record-activity">
        <header><div><h2>Record activity</h2><p>Everything that has changed on this record, newest first</p></div><span class="status active">Current</span></header>
        ${events}
      </article>
      <article class="card record-controls">
        <header><div><h2>What the example can do</h2><p>Who is allowed to change what</p></div><span class="doc-badge">SOL</span></header>
        ${SMART_RECORD.controls.map(profileRow).join("")}
        <p class="card-footnote">The fingerprint is a hash of the signed appraisal PDF — change one byte of the file and it stops matching the record. The document itself stays in Diameter; only the fingerprint would ever be published.</p>
      </article>
    </div>
    <article class="card record-flow-card">
      <header><div><h2>From appraisal to published value</h2><p>Four steps, each of which can stop the value from being published</p></div></header>
      <div class="record-flow" role="list" aria-label="Valuation recording flow">
        <div role="listitem"><b>1</b><span><strong>Appraiser signs a report</strong><small>Independent of Caliber</small></span></div>
        <i aria-hidden="true">→</i>
        <div role="listitem"><b>2</b><span><strong>Administrator approves it</strong><small>Value must match the signed document</small></span></div>
        <i aria-hidden="true">→</i>
        <div role="listitem"><b>3</b><span><strong>Data service writes the record</strong><small>The one step an oracle could perform</small></span></div>
        <i aria-hidden="true">→</i>
        <div role="listitem"><b>4</b><span><strong>Diameter shows the number</strong><small>With its source and last check attached</small></span></div>
      </div>
    </article>
    <article class="card record-flow-card">
      <header><div><h2>Which data needs an oracle?</h2><p>Nine kinds of property data Diameter reports, each judged on whether a blockchain oracle would add anything. Open one for its source, freshness, fallback, and privacy boundary.</p></div></header>
      <div class="fit-legend">${legend}</div>
      <div class="fit-grid fit-grid--decisions">${decisions}</div>
    </article>
    <details class="card developer-view">
      <summary><span><strong>Developer view</strong><small>The Solidity behind the example — ${esc(SMART_RECORD.contract)}.sol · ^${esc(SMART_RECORD.version)} · compiled and unit-tested locally, never deployed</small></span><span>View source +</span></summary>
      <div class="developer-toolbar"><span>Read-only educational contract</span><button type="button" class="text-button" data-action="copy-contract">Copy source</button></div>
      <pre class="code-block" id="contract-code">${esc(contractSource)}</pre>
    </details>`;
};

/* ---------- Search palette (overlay) and dropdown popovers ---------- */

const overlay = document.getElementById("overlay");
const palette = document.getElementById("palette");
const paletteInput = document.getElementById("palette-input");
const paletteResults = document.getElementById("palette-results");
const popover = document.getElementById("popover");
let popoverKind = null;
let lastFocus = null;
let paletteIndex = 0;

const closeOverlay = () => {
  if (overlay.hidden) return;
  overlay.hidden = true;
  palette.hidden = true;
  document.body.classList.remove("overlay-open");
  lastFocus?.focus?.();
  lastFocus = null;
};

const closePopover = () => {
  popover.hidden = true;
  popoverKind = null;
};

const openPalette = () => {
  closePopover();
  lastFocus ??= document.activeElement;
  overlay.hidden = false;
  palette.hidden = false;
  document.body.classList.add("overlay-open");
  paletteInput.value = "";
  renderPalette("");
  paletteInput.focus();
};

const updateBellDot = () => {
  document.querySelector(".notification").classList.toggle("all-read", !NOTIFICATIONS.some((n) => n.unread));
};

const notificationsPopover = () => {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const rows = NOTIFICATIONS.map(
    (n, i) => `<button class="notif-row${n.unread ? " unread" : ""}${n.alert ? " alert" : ""}" type="button" data-route="${esc(n.route)}" data-notif="${i}">
      <i aria-hidden="true"></i>
      <span><strong>${esc(n.title)}</strong><small>${esc(n.body)}</small><time>${n.alert ? `<b class="ai-badge"><i aria-hidden="true"></i>Material change</b> · ` : ""}${esc(n.time)}</time></span>
    </button>`,
  ).join("");
  return `
    <header class="popover-head"><strong>Notifications</strong><small>${unread ? `${unread} unread` : "All caught up"}</small><button class="text-button" data-action="mark-read">Mark all as read</button></header>
    ${rows}`;
};

const profilePopover = () => {
  const totalValue = Object.entries(INVESTOR.positions).reduce((sum, [vehicleId, quantity]) => sum + quantity * vehicleById[vehicleId].token.price, 0);
  const positions = Object.entries(INVESTOR.positions)
    .map(([vehicleId, quantity]) => {
      const vehicle = vehicleById[vehicleId];
      return `<div class="pos-row"><span class="token-badge ${vehicle.token.badgeClass}">${esc(vehicle.token.badge)}</span><span><strong>${esc(vehicle.name)}</strong><small>${int(quantity)} tokens</small></span><strong>${usd(quantity * vehicle.token.price)}</strong></div>`;
    })
    .join("");
  const eligibility = [
    ["Accredited investor", INVESTOR.accreditation],
    ["Identity & KYC / AML", INVESTOR.kyc],
    ["Tax certification", INVESTOR.tax],
  ]
    .map(
      ([label, item]) => `<div class="check-row"><span class="check">✓</span><div><strong>${esc(label)}</strong><small>${esc(item.detail)}</small></div><span class="status active">${esc(item.status)}</span></div>`,
    )
    .join("");
  return `
    <div class="profile-head">
      <span class="avatar avatar-lg">${esc(INVESTOR.initials)}</span>
      <div><strong>${esc(INVESTOR.name)}</strong><small>${esc(INVESTOR.email)} · ${esc(INVESTOR.investorId)}</small></div>
    </div>
    <p class="popover-label">Positions · ${usd(totalValue)} total</p>
    ${positions}
    <div class="popover-menu-row"><button class="text-button" data-route="ownership">View ownership →</button></div>
    <p class="popover-label">Eligibility</p>
    ${eligibility}
    <p class="popover-label">Accounts</p>
    ${[["Custody", esc(INVESTOR.custody)], ["Default payout", esc(INVESTOR.payout)]].map(profileRow).join("")}
    <footer class="popover-foot">
      <button class="text-button" data-toast="Sample document — statement downloads are stubbed in this prototype.">Download statement</button>
      <button class="text-button" data-toast="Prototype interaction — there is no authentication in this build.">Sign out</button>
    </footer>`;
};

const positionPopover = (kind) => {
  const anchor = document.querySelector(kind === "notifications" ? ".notification" : ".user-card");
  const rect = anchor.getBoundingClientRect();
  popover.style.top = popover.style.right = popover.style.bottom = popover.style.left = "auto";
  if (kind === "notifications") {
    popover.style.top = `${Math.round(rect.bottom + 10)}px`;
    popover.style.right = `${Math.round(Math.max(12, innerWidth - rect.right))}px`;
  } else {
    popover.style.bottom = `${Math.round(innerHeight - rect.top + 10)}px`;
    popover.style.left = `${Math.round(Math.max(12, rect.left))}px`;
  }
};

const openPopover = (kind) => {
  closeOverlay();
  if (popoverKind === kind) {
    closePopover();
    return;
  }
  popover.innerHTML = kind === "notifications" ? notificationsPopover() : profilePopover();
  popover.setAttribute("aria-label", kind === "notifications" ? "Notifications" : "Profile");
  popover.hidden = false;
  popoverKind = kind;
  positionPopover(kind);
};

/* ---------- Search palette ---------- */

const searchItems = [
  ...Object.entries(labels).map(([route, label]) => ({ label, sub: "Screen", route, group: "Screens" })),
  ...PROPERTIES.map((p) => ({
    label: p.name,
    sub: `${p.type} · ${p.market} · ${vehicleOf(p).token.symbol}`,
    route: `properties/${p.id}`,
    group: "Properties",
  })),
  { label: "Notifications", sub: "Recent account activity", panel: "notifications", group: "Actions" },
  { label: "View profile", sub: `${INVESTOR.name} · ${INVESTOR.investorId}`, panel: "profile", group: "Actions" },
];

const renderPalette = (query) => {
  const q = query.trim().toLowerCase();
  const matches = searchItems.filter((item) => !q || `${item.label} ${item.sub}`.toLowerCase().includes(q));
  paletteIndex = 0;
  if (!matches.length) {
    paletteResults.innerHTML = `<p class="empty-note">No matches. Try a property, screen, or token symbol.</p>`;
    return;
  }
  let group = null;
  paletteResults.innerHTML = matches
    .map((item, i) => {
      const heading = item.group === group ? "" : `<p class="palette-group">${esc((group = item.group))}</p>`;
      const target = item.route ? `data-route="${esc(item.route)}"` : `data-panel="${esc(item.panel)}"`;
      return `${heading}<button class="palette-row${i === paletteIndex ? " active" : ""}" type="button" ${target} data-index="${i}">
        <strong>${esc(item.label)}</strong><small>${esc(item.sub)}</small>
      </button>`;
    })
    .join("");
};

const movePaletteIndex = (delta) => {
  const rows = [...paletteResults.querySelectorAll(".palette-row")];
  if (!rows.length) return;
  paletteIndex = (paletteIndex + delta + rows.length) % rows.length;
  rows.forEach((row, i) => row.classList.toggle("active", i === paletteIndex));
  rows[paletteIndex].scrollIntoView({ block: "nearest" });
};

paletteInput.addEventListener("input", () => renderPalette(paletteInput.value));
paletteInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") { event.preventDefault(); movePaletteIndex(1); }
  else if (event.key === "ArrowUp") { event.preventDefault(); movePaletteIndex(-1); }
  else if (event.key === "Enter") { event.preventDefault(); paletteResults.querySelector(".palette-row.active")?.click(); }
});

/* ---------- Routing ---------- */

const routeFromPath = () => {
  const slug = location.pathname.replace(/^\/|\/$/g, "");
  if (labels[slug]) return slug;
  const match = slug.match(/^properties\/([\w-]+)$/);
  if (match && propertyById[match[1]]) return slug;
  return "overview";
};

const show = (route, push = false) => {
  const detail = route.startsWith("properties/") ? propertyById[route.split("/")[1]] : null;
  if (!detail && !labels[route]) route = "overview";
  const screen = detail ? "property-detail" : route;
  const navRoute = detail ? "properties" : route;
  const label = detail ? detail.name : labels[route];

  if (detail) document.getElementById("property-detail").innerHTML = detailHTML(detail);
  document.body.dataset.view = route;
  document.querySelectorAll("[data-screen]").forEach((el) => {
    el.classList.toggle("active", el.dataset.screen === screen);
  });
  document.querySelectorAll(".nav [data-route]").forEach((el) => {
    el.classList.toggle("active", el.dataset.route === navRoute);
    if (el.dataset.route === navRoute) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  document.getElementById("crumb").textContent = detail ? `Properties · ${detail.name}` : label;
  document.title = `${label} — Diameter by Caliber`;
  document.body.classList.remove("nav-open");
  if (push && location.pathname !== `/${route}`) history.pushState({ route }, "", `/${route}`);
  if (push) document.getElementById("main").focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: push ? "smooth" : "auto" });
};

/* ---------- Events ---------- */

document.addEventListener("click", (event) => {
  // A click anywhere outside an open dropdown (and not on a trigger) closes it.
  if (!popover.hidden && !event.target.closest("#popover") && !event.target.closest("[data-panel]")) closePopover();
  const ask = event.target.closest("[data-ask]");
  if (ask) {
    // Follow-up chips inside an answer reuse the form they sit in; chips in
    // the overview alerts card fall back to the nearest ask form on the page.
    const form = ask.closest(".ask-form") ?? ask.closest(".screen.active")?.querySelector(".ask-form") ?? document.querySelector(".screen.active .ask-form");
    if (form) runAsk(form, ask.dataset.ask);
    else toast("Open a property page to ask follow-up questions.");
    return;
  }
  const explain = event.target.closest("[data-explain]");
  if (explain) {
    const holder = explain.parentElement.querySelector(".explain-target");
    const open = holder.innerHTML !== "";
    holder.innerHTML = open ? "" : answerHTML(explainQuarter(propertyById[explain.dataset.explain]));
    explain.setAttribute("aria-expanded", String(!open));
    return;
  }
  if (event.target.closest("[data-scenario-reset]")) {
    const card = event.target.closest("[data-scenario-property]");
    card.querySelector(".scenario-body").innerHTML = financingPanel(propertyById[card.dataset.scenarioProperty]);
    return;
  }
  if (event.target.closest("summary") || event.target.closest(".ask-form button[type=submit]")) return;
  const sourceTrigger = event.target.closest("[data-source-kind]");
  if (sourceTrigger) {
    const property = propertyById[sourceTrigger.dataset.propertyId];
    if (property) openSourceDialog(property, sourceTrigger.dataset.sourceKind);
    return;
  }
  const routeLink = event.target.closest("[data-route]");
  if (routeLink) {
    event.preventDefault();
    if (routeLink.dataset.notif) NOTIFICATIONS[routeLink.dataset.notif].unread = false;
    updateBellDot();
    closeOverlay();
    closePopover();
    show(routeLink.dataset.route, true);
    return;
  }
  const panelTrigger = event.target.closest("[data-panel]");
  if (panelTrigger) {
    if (panelTrigger.dataset.panel === "search") openPalette();
    else openPopover(panelTrigger.dataset.panel);
    return;
  }
  const action = event.target.closest("[data-action]");
  if (action?.dataset.action === "close-source") {
    sourceDialog.close();
    return;
  }
  if (action?.dataset.action === "copy-contract") {
    navigator.clipboard?.writeText(document.getElementById("contract-code")?.textContent ?? "");
    toast("Contract source copied.");
    return;
  }
  if (action?.dataset.action === "mark-read") {
    NOTIFICATIONS.forEach((n) => (n.unread = false));
    updateBellDot();
    popover.innerHTML = notificationsPopover();
    return;
  }
  if (event.target === overlay) {
    closeOverlay();
    return;
  }
  const menu = event.target.closest(".menu-button");
  if (menu) {
    document.body.classList.toggle("nav-open");
    return;
  }
  const filter = event.target.closest(".filter[data-filter]");
  if (filter) {
    listState.filter = filter.dataset.filter;
    document.querySelectorAll(".filter[data-filter]").forEach((button) => button.classList.toggle("active", button === filter));
    renderPropertyList();
    return;
  }
  const segment = event.target.closest(".segmented button");
  if (segment) {
    segment.parentElement.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button === segment);
      button.setAttribute("aria-pressed", String(button === segment));
    });
    return;
  }
  const interactive = event.target.closest("button");
  if (interactive && !interactive.classList.contains("menu-button")) {
    toast(interactive.dataset.toast ?? "Prototype interaction — this workflow is not part of the current build.");
  }
});

sourceDialog.addEventListener("click", (event) => {
  if (event.target === sourceDialog) sourceDialog.close();
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest(".ask-form");
  if (!form) return;
  event.preventDefault();
  const question = form.querySelector("input[name=q]").value.trim();
  if (question) runAsk(form, question);
});

const scenarioState = new WeakMap();
const onScenarioInput = (event) => {
  const card = event.target.closest("[data-scenario-property]");
  if (!card) return;
  const p = propertyById[card.dataset.scenarioProperty];
  const values = {};
  card.querySelectorAll("input[type=range], select").forEach((el) => (values[el.name] = Number(el.value)));
  scenarioState.set(card, values);
  const focused = event.target.name;
  card.querySelector(".scenario-body").innerHTML = financingPanel(p, values);
  // Keep the pointer on the slider being dragged after the rerender.
  const again = card.querySelector(`[name="${focused}"]`);
  again?.focus({ preventScroll: true });
};
document.addEventListener("input", onScenarioInput);
document.addEventListener("change", (event) => {
  if (event.target.matches("select[data-compare]")) {
    const a = document.querySelector("select[data-compare=a]").value;
    const b = document.querySelector("select[data-compare=b]").value;
    document.getElementById("compare-panel").dataset.open = "true";
    renderComparePanel(a, b);
    return;
  }
  if (event.target.matches("select[name=amort]")) onScenarioInput(event);
});

document.getElementById("property-search").addEventListener("input", (event) => {
  listState.query = event.target.value;
  renderPropertyList();
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openPalette();
  } else if (event.key === "Escape") {
    closeOverlay();
    closePopover();
  }
});

addEventListener("resize", () => {
  if (popoverKind) positionPopover(popoverKind);
});

addEventListener("popstate", () => show(routeFromPath()));

if (ASSISTANT_FEATURES) seedAlertNotifications();
renderPropertiesScreen();
renderOfferingsScreen();
renderAssuranceSummary();
renderAssetRecordsScreen();
if (ASSISTANT_FEATURES) {
  renderOverviewAssistant();
  renderComparePanel();
  renderPerformanceAssistant();
}
updateBellDot();
show(document.body.dataset.view === "__INITIAL_VIEW__" ? routeFromPath() : document.body.dataset.view);
