import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FEED_STATES, INVESTOR, KEY_RECORD_KINDS, ORACLE_FEEDS, PROPERTIES, RECOMMENDATIONS, SMART_RECORD, VEHICLES, documentsFor, feedFor, keyRecords, propertiesOf, shareOfVehicle } from "../src/data.js";
import { ASSURANCE_FEATURES } from "../src/flags.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");
const routes = ["overview", "offerings", "properties", "ownership", "distributions", "performance", "compliance", ...(ASSURANCE_FEATURES ? ["records"] : [])];
const requiredScreens = {
  overview: ["INVESTOR DASHBOARD", "Available after lockups", "Your investments"],
  offerings: ["INVESTOR / OFFERINGS", "Explore offerings", 'id="offerings-grid"'],
  properties: ["PROPERTY DASHBOARD", "NAV publishing queue", "Development budget"],
  ownership: ["TOKEN OWNERSHIP", "ownership lots", "Transfer eligibility"],
  distributions: ["DISTRIBUTION HISTORY", "reinvestment election", "Payment history"],
  performance: ["ASSET PERFORMANCE", "ASSET-LEVEL VIEW", "Return attribution"],
  compliance: ["COMPLIANCE DASHBOARD", "Active transfer request", "Recent control activity"],
  records: ["asset-record-screen", "contract PropertyDeed", "source-dialog"],
};
const failures = [];
const files = await readdir(out);

for (const route of routes) {
  const file = `${route}.html`;
  if (!files.includes(file)) failures.push(`missing ${file}`);
  else {
    const html = await readFile(join(out, file), "utf8");
    if (!html.includes(`data-view="${route}"`)) failures.push(`${file}: wrong initial view`);
    for (const target of routes) {
      if (!html.includes(`href="/${target}"`)) failures.push(`${file}: missing link to /${target}`);
      if (!html.includes(`data-screen="${target}"`)) failures.push(`${file}: missing ${target} screen`);
    }
    if (!html.includes('data-screen="property-detail"')) failures.push(`${file}: missing property-detail screen`);
    for (const shell of ['id="palette"', 'id="popover"', 'data-panel="notifications"', 'data-panel="profile"', 'data-panel="search"']) {
      if (!html.includes(shell)) failures.push(`${file}: missing overlay shell ${shell}`);
    }
    for (const marker of requiredScreens[route]) {
      if (!html.includes(marker)) failures.push(`${file}: missing required mockup content "${marker}"`);
    }
    if (!html.includes("Frontend mockup · Illustrative data only")) {
      failures.push(`${file}: frontend-only scope is not labeled`);
    }
  }
}
// Every property gets a deep-linkable page.
const propertyFiles = await readdir(join(out, "properties")).catch(() => []);
for (const property of PROPERTIES) {
  const file = `${property.id}.html`;
  if (!propertyFiles.includes(file)) failures.push(`missing properties/${file}`);
  else {
    const html = await readFile(join(out, "properties", file), "utf8");
    if (!html.includes(`data-view="properties/${property.id}"`)) failures.push(`properties/${file}: wrong initial view`);
  }
}

for (const asset of ["site.css", "app.js", "data.js", "flags.js", "assistant.js"]) {
  try { await readFile(join(out, "static", asset)); }
  catch { failures.push(`missing static/${asset}`); }
}
// Dataset consistency rules from docs/DATA_MODEL.md.
const totalValue = PROPERTIES.reduce((sum, p) => sum + p.value, 0);
if (totalValue !== 184_200_000) failures.push(`dataset: portfolio GAV is $${totalValue.toLocaleString()}, expected $184,200,000`);
for (const property of PROPERTIES) {
  if (!(property.occupancy > 0 && property.occupancy < 100)) failures.push(`dataset: ${property.id} occupancy out of range`);
  if (property.noi >= property.grossIncome) failures.push(`dataset: ${property.id} NOI exceeds gross income`);
  if (documentsFor(property).length < 5) failures.push(`dataset: ${property.id} has fewer than 5 documents`);
}
for (const vehicle of VEHICLES) {
  const shareSum = propertiesOf(vehicle).reduce((sum, p) => sum + shareOfVehicle(p), 0);
  if (Math.abs(shareSum - 1) > 1e-9) failures.push(`dataset: ${vehicle.id} property shares do not sum to 100%`);
  if (vehicle.token.issued > vehicle.token.authorized) failures.push(`dataset: ${vehicle.id} issued supply exceeds authorized`);
  const scheduled = vehicle.distributions.filter(([, , status]) => status === "Scheduled");
  if (scheduled.length !== 1 || vehicle.distributions.at(-1)[2] !== "Scheduled") {
    failures.push(`dataset: ${vehicle.id} must have exactly one scheduled distribution, last in the list`);
  }
}

// Feed proposals must cover every data domain and evaluation field.
const requiredFeedKinds = ["valuation", "appraisal", "benchmark", "treasury", "occupancy", "collections", "insurance", "debt", "reserves"];
for (const kind of requiredFeedKinds) {
  if (!ORACLE_FEEDS[kind]) failures.push(`feeds: missing ${kind} proposal`);
}
for (const [kind, feed] of Object.entries(ORACLE_FEEDS)) {
  for (const field of [
    "label", "shortSource", "question", "authority", "cadence", "maxAge", "classification",
    "verification", "aggregation", "dispute", "onchainConsumer", "offchainConsumer",
    "failure", "placement", "chainlink", "operations", "recommendation", "method",
  ]) {
    if (!feed[field]) failures.push(`feed ${kind}: missing ${field}`);
  }
  if (!RECOMMENDATIONS[feed.recommendation]) {
    failures.push(`feed ${kind}: invalid recommendation ${feed.recommendation}`);
  }
}
// No state or verdict may reach the UI as a bare word: each one owes the reader
// an explanation, and the assurance summary counts a known set of records.
for (const [state, copy] of Object.entries(FEED_STATES)) {
  if (!copy.label || !copy.meaning) failures.push(`feed state ${state}: missing label or meaning`);
}
for (const [key, fit] of Object.entries(RECOMMENDATIONS)) {
  if (!fit.label || !fit.meaning || !fit.tone) failures.push(`recommendation ${key}: missing label, meaning, or tone`);
}
if (keyRecords().length !== PROPERTIES.length * KEY_RECORD_KINDS.length) {
  failures.push("assurance summary: key record count does not cover every property and kind");
}
const feedStates = new Set(PROPERTIES.flatMap((property) => ["valuation", "occupancy", "collections", "insurance"].map((kind) => feedFor(property, kind).status)));
for (const state of ["normal", "stale", "disputed", "unavailable"]) {
  if (!feedStates.has(state)) failures.push(`feed states: missing ${state} example`);
}
if (!PROPERTIES.some((property) => property.id === SMART_RECORD.propertyId)) failures.push("smart record: property does not exist");
const contractSource = await readFile(join(root, "contracts", "PropertyDeed.sol"), "utf8").catch(() => "");
const contractTests = await readFile(join(root, "contracts", "test", "PropertyDeed.t.sol"), "utf8").catch(() => "");
for (const marker of ["holds no funds", "does not represent legal title", "onlyOwner", "onlyPublisher", "isValuationStale"]) {
  if (!contractSource.includes(marker)) failures.push(`smart record contract: missing ${marker}`);
}
for (const testName of [
  "testZeroPublisherIsRejected", "testStartsWithoutAValuation", "testApprovedPublisherCanRecordValuation",
  "testOtherCallerCannotRecordValuation", "testValuationBecomesStaleAfterTheAllowedWindow",
  "testFutureValuationDateIsRejected", "testOwnerCanTransferTheRecord",
  "testOtherCallerCannotTransferTheRecord", "testOwnerCanRotateThePublisher",
  "testNewOwnerCanRotateThePublisher", "testZeroOwnerAndPublisherAreRejected",
]) {
  if (!contractTests.includes(`function ${testName}`)) failures.push(`smart record tests: missing ${testName}`);
}
// Investor position values shown on the static overview screen must reconcile
// with quantity × token price from the dataset.
const overview = await readFile(join(out, "overview.html"), "utf8").catch(() => "");
for (const vehicle of VEHICLES) {
  const quantity = INVESTOR.positions[vehicle.id];
  const value = `$${Math.round(quantity * vehicle.token.price).toLocaleString("en-US")}`;
  if (!overview.includes(value)) failures.push(`overview.html: missing position value ${value} for ${vehicle.token.symbol}`);
}

if (failures.length) {
  console.error(`check: ${failures.length} problem(s)`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exit(1);
}
console.log(`check: ${routes.length} screens, ${PROPERTIES.length} property pages, navigation, assets, and dataset consistency verified`);
