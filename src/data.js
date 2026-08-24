// Canonical illustrative dataset for the Diameter by Caliber prototype.
//
// Every investor, property, value, and event is fictional. Screens must read
// from this module instead of hardcoding figures so the property list, detail,
// ownership, and distribution views stay reconciled (see docs/DATA_MODEL.md).
// Dollar amounts are plain numbers in USD; percentages are 0–100.

export const AS_OF = "Jul 29, 2026 · 10:42 AM";
export const INCOME_PERIOD = "TTM Aug 2025 – Jul 2026";
export const INCOME_MONTHS = ["Aug '25", "Sep", "Oct", "Nov", "Dec", "Jan '26", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

// Monthly gross-income shape per asset class (multipliers sum to 12), so
// hospitality shows Arizona seasonality while residential stays flat.
const SEASONALITY = {
  Hospitality: [0.72, 0.82, 0.98, 1.05, 0.95, 1.18, 1.30, 1.32, 1.15, 1.02, 0.78, 0.73],
  Multifamily: [0.96, 0.97, 0.98, 0.99, 1.00, 1.00, 1.01, 1.01, 1.02, 1.02, 1.02, 1.02],
  Commercial: [0.98, 0.98, 0.99, 0.99, 1.00, 1.00, 1.00, 1.01, 1.01, 1.01, 1.02, 1.01],
};

export const VEHICLES = [
  {
    id: "cht",
    name: "Caliber Hospitality Trust",
    strategy: "Hospitality income",
    structure: "Delaware statutory trust",
    offering: "Reg D 506(c) private placement",
    targetReturn: "8.5% net annualized",
    sponsorStake: "5.2%",
    top10Concentration: "22.7%",
    investorMix: [
      ["Individual investors", 54],
      ["Advisory & wealth platforms", 31],
      ["Institutional & family office", 15],
    ],
    token: {
      symbol: "CHT",
      badge: "CHT",
      badgeClass: "",
      price: 1.133,
      priceBasis: "Quarterly NAV",
      navDate: "Jun 30, 2026",
      issued: 22_800_000,
      authorized: 30_000_000,
      holders: 1214,
      restrictions: "Reg D transfer restrictions · 12-month lockup on new issuance",
    },
    // [payment date, $ per token, status]; the last entry is the scheduled run.
    distributions: [
      ["Feb 13, 2026", 0.0136, "Paid"],
      ["Mar 13, 2026", 0.0138, "Paid"],
      ["Apr 15, 2026", 0.0139, "Paid"],
      ["May 15, 2026", 0.0140, "Paid"],
      ["Jun 15, 2026", 0.0141, "Paid"],
      ["Jul 15, 2026", 0.0142, "Paid"],
      ["Aug 15, 2026", 0.0144, "Scheduled"],
    ],
  },
  {
    id: "csof",
    name: "Southwest Opportunity Fund",
    strategy: "Mixed-use value add",
    structure: "Delaware limited partnership",
    offering: "Reg D 506(c) private placement",
    targetReturn: "8.0% net annualized",
    sponsorStake: "4.5%",
    top10Concentration: "25.1%",
    investorMix: [
      ["Individual investors", 58],
      ["Advisory & wealth platforms", 27],
      ["Institutional & family office", 15],
    ],
    token: {
      symbol: "CSOF",
      badge: "CS",
      badgeClass: "teal",
      price: 1.170,
      priceBasis: "Quarterly NAV",
      navDate: "Jun 30, 2026",
      issued: 24_600_000,
      authorized: 28_000_000,
      holders: 864,
      restrictions: "Reg D transfer restrictions · right of first refusal",
    },
    distributions: [
      ["Feb 13, 2026", 0.0112, "Paid"],
      ["Mar 13, 2026", 0.0113, "Paid"],
      ["Apr 15, 2026", 0.0114, "Paid"],
      ["Apr 15, 2026", 0.0450, "Paid", { type: "Refinance proceeds", propertyId: "rio-salado-commerce" }],
      ["May 15, 2026", 0.0116, "Paid"],
      ["Jun 15, 2026", 0.0117, "Paid"],
      ["Jul 15, 2026", 0.0118, "Paid"],
      ["Aug 15, 2026", 0.0119, "Scheduled"],
    ],
  },
  {
    id: "ccp",
    name: "CaliberCore Plus",
    strategy: "Core-plus multifamily",
    structure: "Delaware limited liability company",
    offering: "Reg A+ Tier 2",
    targetReturn: "6.5% net annualized",
    sponsorStake: "6.0%",
    top10Concentration: "19.8%",
    investorMix: [
      ["Individual investors", 63],
      ["Advisory & wealth platforms", 24],
      ["Institutional & family office", 13],
    ],
    token: {
      symbol: "CCP",
      badge: "CP",
      badgeClass: "gold",
      price: 1.045,
      priceBasis: "Quarterly NAV",
      navDate: "Mar 31, 2026",
      issued: 27_200_000,
      authorized: 32_000_000,
      holders: 618,
      restrictions: "Contractual lockups by issuance lot · quarterly windows",
    },
    distributions: [
      ["Feb 13, 2026", 0.0104, "Paid"],
      ["Mar 13, 2026", 0.0105, "Paid"],
      ["Apr 15, 2026", 0.0106, "Paid"],
      ["May 15, 2026", 0.0107, "Paid"],
      ["Jun 15, 2026", 0.0108, "Paid"],
      ["Jul 15, 2026", 0.0109, "Paid"],
      ["Aug 15, 2026", 0.0110, "Scheduled"],
    ],
  },
];

export const PROPERTIES = [
  {
    id: "skyline-hotel-phoenix",
    name: "Skyline Hotel Phoenix",
    vehicleId: "cht",
    type: "Hospitality",
    market: "Phoenix, AZ",
    image: "hotel",
    status: "Performing",
    statusKind: "active",
    description: "233-key full-service hotel on the Camelback corridor, repositioned in 2024 with renovated meeting space and a rooftop restaurant.",
    size: "233 keys",
    value: 38_400_000,
    valuation: { date: "Jun 30, 2026", source: "Verity Valuation Group" },
    acquired: { date: "Jun 12, 2023", price: 33_100_000 },
    occupancy: 88.2,
    occupancyLabel: "Occupancy",
    noi: 3_100_000,
    grossIncome: 9_950_000,
    yieldPct: 7.4,
    budgetVariance: "+2.4% NOI vs. budget",
    debt: { ltv: "58%", rate: "5.9% fixed", dscr: "1.62×" },
    extra: [["ADR", "$186"], ["RevPAR", "$164"]],
    occupancyHistory: [86.1, 84.8, 90.4, 88.2],
    leases: null,
    commentary: "Second-quarter occupancy eased from the winter peak as group bookings normalized after March conferences; ADR held because renovated meeting space is still pricing above the 2024 comp set. Rooftop F&B contributed to the budget outperformance.",
  },
  {
    id: "mesa-verde-resort",
    name: "Mesa Verde Resort & Spa",
    vehicleId: "cht",
    type: "Hospitality",
    market: "Scottsdale, AZ",
    image: "resort",
    status: "Performing",
    statusKind: "active",
    description: "178-key resort with spa and golf adjacency in North Scottsdale, acquired off-market from a private family office.",
    size: "178 keys",
    value: 27_600_000,
    valuation: { date: "Jun 30, 2026", source: "Verity Valuation Group" },
    acquired: { date: "Nov 2, 2023", price: 24_900_000 },
    occupancy: 84.5,
    occupancyLabel: "Occupancy",
    noi: 2_050_000,
    grossIncome: 7_120_000,
    yieldPct: 6.9,
    budgetVariance: "+1.1% NOI vs. budget",
    debt: { ltv: "55%", rate: "6.1% fixed", dscr: "1.48×" },
    extra: [["ADR", "$214"], ["RevPAR", "$181"]],
    occupancyHistory: [80.2, 82.9, 87.1, 84.5],
    leases: null,
    commentary: "Resort demand is seasonal: the second quarter trails the spring peak by design. Spa and golf packages lifted ADR, while the summer soft period was met with reduced staffing per the operating plan.",
  },
  {
    id: "canyon-gate-suites",
    name: "Canyon Gate Suites",
    vehicleId: "cht",
    type: "Hospitality",
    market: "Tucson, AZ",
    image: "suites",
    status: "Performing",
    statusKind: "active",
    description: "122-key extended-stay property near the University of Arizona medical district serving traveling clinical staff.",
    size: "122 keys",
    value: 16_900_000,
    valuation: { date: "Jun 30, 2026", source: "Verity Valuation Group" },
    acquired: { date: "Feb 20, 2024", price: 15_600_000 },
    occupancy: 81.9,
    occupancyLabel: "Occupancy",
    noi: 1_180_000,
    grossIncome: 4_310_000,
    yieldPct: 6.2,
    budgetVariance: "−0.8% NOI vs. budget",
    debt: { ltv: "57%", rate: "6.3% fixed", dscr: "1.41×" },
    extra: [["ADR", "$139"], ["RevPAR", "$114"]],
    occupancyHistory: [83.4, 82.6, 85.1, 81.9],
    leases: null,
    commentary: "Extended-stay occupancy slipped in the quarter after a corporate housing contract ended in May. Management is rebidding the contract and has shifted inventory to leisure channels for the summer.",
  },
  {
    id: "roosevelt-commons",
    name: "Roosevelt Commons",
    vehicleId: "ccp",
    type: "Multifamily",
    market: "Tempe, AZ",
    image: "apartments",
    status: "Performing",
    statusKind: "active",
    description: "376-unit multifamily conversion near Tempe Town Lake; phase-two amenity build-out is 63% complete against budget.",
    size: "376 units",
    value: 29_800_000,
    valuation: { date: "Mar 31, 2026", source: "Sonoran Appraisal Partners" },
    acquired: { date: "Mar 8, 2024", price: 26_500_000 },
    occupancy: 95.1,
    occupancyLabel: "Occupancy",
    noi: 2_400_000,
    grossIncome: 4_370_000,
    yieldPct: 6.6,
    budgetVariance: "+3.2% NOI vs. budget",
    debt: { ltv: "62%", rate: "5.6% fixed", dscr: "1.55×" },
    extra: [["Average in-place rent", "$1,685 / unit"], ["Development budget used", "63%"]],
    occupancyHistory: [93.2, 94.0, 94.6, 95.1],
    leases: { kind: "residential", avgTerm: "12 months", renewalRate: 71, expiring90Days: 18, expiringByQuarter: [["Q3 2026", 18], ["Q4 2026", 27], ["Q1 2027", 31], ["Q2 2027", 24]] },
    commentary: "Lease-up of the final converted phase completed in the quarter, lifting occupancy to 95.1%. Renewal rents grew about 3% and the development budget remains 63% drawn with soft costs over plan.",
  },
  {
    id: "aster-park-residences",
    name: "Aster Park Residences",
    vehicleId: "ccp",
    type: "Multifamily",
    market: "Phoenix, AZ",
    image: "flats",
    status: "Performing",
    statusKind: "active",
    description: "224-unit garden-style community in the Deer Valley employment corridor with in-progress unit interior upgrades.",
    size: "224 units",
    value: 18_900_000,
    valuation: { date: "Mar 31, 2026", source: "Sonoran Appraisal Partners" },
    acquired: { date: "Jul 30, 2024", price: 17_400_000 },
    occupancy: 94.3,
    occupancyLabel: "Occupancy",
    noi: 1_310_000,
    grossIncome: 2_380_000,
    yieldPct: 6.1,
    budgetVariance: "+0.6% NOI vs. budget",
    debt: { ltv: "60%", rate: "5.8% fixed", dscr: "1.50×" },
    extra: [["Average in-place rent", "$1,490 / unit"], ["Units renovated", "96 of 224"]],
    occupancyHistory: [93.9, 94.1, 93.7, 94.3],
    leases: { kind: "residential", avgTerm: "12 months", renewalRate: 66, expiring90Days: 22, expiringByQuarter: [["Q3 2026", 22], ["Q4 2026", 28], ["Q1 2027", 26], ["Q2 2027", 24]] },
    commentary: "The renovation program reached 96 of 224 units; renovated units are leasing at a premium of roughly $140 per month. Turnover stayed in line with the prior year.",
  },
  {
    id: "northsight-office-center",
    name: "Northsight Office Center",
    vehicleId: "csof",
    type: "Commercial",
    market: "Scottsdale, AZ",
    image: "office",
    status: "Appraisal due",
    statusKind: "review",
    description: "96,400 sq ft Class B office in the Scottsdale Airpark; annual appraisal is scheduled for Aug 06, 2026.",
    size: "96,400 sq ft",
    value: 14_200_000,
    valuation: { date: "Dec 31, 2025", source: "Verity Valuation Group", stale: "Valuation is 210 days old — updated appraisal scheduled Aug 06, 2026." },
    acquired: { date: "Sep 15, 2022", price: 13_100_000 },
    occupancy: 87.4,
    occupancyLabel: "Leased",
    noi: 1_040_000,
    grossIncome: 1_660_000,
    yieldPct: 6.5,
    budgetVariance: "+0.9% NOI vs. budget",
    debt: { ltv: "54%", rate: "6.4% fixed", dscr: "1.38×" },
    extra: [["Weighted avg. lease term", "3.8 yrs"], ["Largest tenant", "11.6% of rent"]],
    occupancyHistory: [89.0, 88.2, 87.9, 87.4],
    leases: { kind: "commercial", walt: "3.8 years", expiringByYear: [["2026", 6], ["2027", 14], ["2028", 22], ["2029+", 58]], largestTenant: "11.6% of rent", renewalsInNegotiation: 2 },
    commentary: "Occupancy drifted lower as two small suites went dark; both are under proposal. The valuation is outside its freshness window and a new appraisal is scheduled for Aug 06, so the reported value should be read as dated.",
  },
  {
    id: "copper-line-lofts",
    name: "Copper Line Lofts",
    vehicleId: "csof",
    type: "Multifamily",
    market: "Phoenix, AZ",
    image: "lofts",
    status: "Performing",
    statusKind: "active",
    description: "148-unit adaptive-reuse lofts along the Valley Metro light-rail line in the Roosevelt Row arts district.",
    size: "148 units",
    value: 12_600_000,
    valuation: { date: "Jun 30, 2026", source: "Sonoran Appraisal Partners" },
    acquired: { date: "May 4, 2023", price: 11_200_000 },
    occupancy: 96.2,
    occupancyLabel: "Occupancy",
    noi: 840_000,
    grossIncome: 1_530_000,
    yieldPct: 6.0,
    budgetVariance: "+1.7% NOI vs. budget",
    debt: { ltv: "59%", rate: "5.7% fixed", dscr: "1.52×" },
    extra: [["Average in-place rent", "$1,415 / unit"], ["Renewal rate", "68%"]],
    occupancyHistory: [95.4, 95.8, 96.0, 96.2],
    leases: { kind: "residential", avgTerm: "12 months", renewalRate: 68, expiring90Days: 20, expiringByQuarter: [["Q3 2026", 20], ["Q4 2026", 25], ["Q1 2027", 30], ["Q2 2027", 25]] },
    commentary: "Stable quarter with renewal rate at 68% and modest rent growth; operating expenses came in under budget on lower utilities.",
  },
  {
    id: "saguaro-flats",
    name: "Saguaro Flats",
    vehicleId: "csof",
    type: "Multifamily",
    market: "Tempe, AZ",
    image: "flats",
    status: "Performing",
    statusKind: "active",
    description: "118-unit workforce housing community two miles from the Arizona State University campus.",
    size: "118 units",
    value: 9_700_000,
    valuation: { date: "Jun 30, 2026", source: "Sonoran Appraisal Partners" },
    acquired: { date: "Aug 22, 2023", price: 9_000_000 },
    occupancy: 93.8,
    occupancyLabel: "Occupancy",
    noi: 620_000,
    grossIncome: 1_150_000,
    yieldPct: 5.8,
    budgetVariance: "−0.4% NOI vs. budget",
    debt: { ltv: "58%", rate: "6.0% fixed", dscr: "1.44×" },
    extra: [["Average in-place rent", "$1,320 / unit"], ["Renewal rate", "74%"]],
    occupancyHistory: [94.6, 94.2, 93.5, 93.8],
    leases: { kind: "residential", avgTerm: "12 months", renewalRate: 74, expiring90Days: 16, expiringByQuarter: [["Q3 2026", 16], ["Q4 2026", 24], ["Q1 2027", 33], ["Q2 2027", 27]] },
    commentary: "Occupancy recovered slightly after first-quarter turnover; NOI is marginally under budget on higher insurance premiums at renewal.",
  },
  {
    id: "rio-salado-commerce",
    name: "Rio Salado Commerce Park",
    vehicleId: "csof",
    type: "Commercial",
    market: "Tempe, AZ",
    image: "flex",
    status: "Performing",
    statusKind: "active",
    description: "132,000 sq ft flex-industrial park refinanced in April 2026; proceeds were distributed to Southwest Opportunity Fund holders.",
    size: "132,000 sq ft",
    value: 10_400_000,
    valuation: { date: "Jun 30, 2026", source: "Verity Valuation Group" },
    acquired: { date: "Jan 18, 2023", price: 9_600_000 },
    occupancy: 90.5,
    occupancyLabel: "Leased",
    noi: 780_000,
    grossIncome: 1_200_000,
    yieldPct: 6.8,
    budgetVariance: "+2.0% NOI vs. budget",
    debt: { ltv: "52%", rate: "6.2% fixed", dscr: "1.58×" },
    extra: [["Weighted avg. lease term", "4.6 yrs"], ["Tenants", "14"]],
    occupancyHistory: [88.9, 89.6, 90.1, 90.5],
    leases: { kind: "commercial", walt: "4.6 years", expiringByYear: [["2026", 4], ["2027", 9], ["2028", 17], ["2029+", 70]], largestTenant: "9.8% of rent", renewalsInNegotiation: 1 },
    commentary: "A flex-industrial suite was backfilled in April, and the April refinance returned $0.045 per token to holders. Leasing spreads on renewals were positive.",
  },
  {
    id: "presidio-exchange",
    name: "Presidio Exchange",
    vehicleId: "csof",
    type: "Commercial",
    market: "Tucson, AZ",
    image: "plaza",
    status: "Monitor",
    statusKind: "review",
    description: "61,200 sq ft neighborhood retail center; the anchor tenant's renewal is in negotiation ahead of a Q4 2026 expiration.",
    size: "61,200 sq ft",
    value: 5_700_000,
    valuation: { date: "Jun 30, 2026", source: "Verity Valuation Group" },
    acquired: { date: "Oct 9, 2024", price: 5_400_000 },
    occupancy: 83.0,
    occupancyLabel: "Leased",
    noi: 410_000,
    grossIncome: 660_000,
    yieldPct: 5.4,
    budgetVariance: "−1.9% NOI vs. budget",
    debt: { ltv: "50%", rate: "6.6% fixed", dscr: "1.31×" },
    extra: [["Weighted avg. lease term", "3.1 yrs"], ["Anchor share of rent", "34%"]],
    occupancyHistory: [91.5, 90.8, 86.2, 83.0],
    leases: { kind: "commercial", walt: "3.1 years", expiringByYear: [["2026", 34], ["2027", 12], ["2028", 18], ["2029+", 36]], largestTenant: "34% of rent (anchor)", renewalsInNegotiation: 1 },
    commentary: "Occupancy declined as the anchor tenant's renewal moved into negotiation and two inline spaces were vacated. The leased figure is under review while the anchor lease is reconciled; NOI is below budget on the vacancy.",
  },
];

// Demo investor shown across the investor-facing screens. Eligibility and
// account details mirror the ownership and compliance screens.
export const INVESTOR = {
  name: "Alex Morgan",
  initials: "AM",
  email: "alex.morgan@example.com",
  investorId: "INV-88142",
  memberSince: "Sep 2024",
  roles: "Demo account · investor, asset manager, and fund administrator views",
  accreditation: { status: "Verified", detail: "Rule 506(c) · expires Jan 15, 2027" },
  kyc: { status: "Current", detail: "KYC / AML verified Jul 18, 2026" },
  tax: { status: "On file", detail: "Form W-9 · submitted Feb 2026" },
  custody: "Qualified custody account ending •4821",
  payout: "Wire · account •8820",
  positions: { cht: 420_000, csof: 310_000, ccp: 250_000 },
};

// Offerings surfaced by the "Explore offerings" panel. Vehicle-backed entries
// reference VEHICLES; announced offerings have no token yet.
export const OFFERINGS = [
  {
    vehicleId: "cht",
    status: "Open",
    statusKind: "active",
    minInvestment: "$25,000",
    closes: "Continuous quarterly closings",
    blurb: "Full-service and extended-stay hotels across Arizona's business corridors.",
  },
  {
    vehicleId: "csof",
    status: "Closing Sep 30",
    statusKind: "review",
    minInvestment: "$50,000",
    closes: "Final close Sep 30, 2026",
    blurb: "Value-add mixed-use portfolio spanning multifamily, office, and flex-industrial.",
  },
  {
    vehicleId: "ccp",
    status: "Open",
    statusKind: "active",
    minInvestment: "$10,000",
    closes: "Monthly closings under Reg A+",
    blurb: "Stabilized core-plus multifamily communities with in-place income.",
  },
  {
    name: "Caliber Industrial Income Fund",
    strategy: "Industrial & logistics",
    targetReturn: "9.0% net (target)",
    status: "Announced",
    statusKind: "review",
    minInvestment: "$50,000",
    closes: "First close targeted Q4 2026",
    blurb: "Waitlist is open for a planned last-mile logistics portfolio in the Southwest.",
  },
];

// Notification feed for the demo account, consistent with on-screen events.
export const NOTIFICATIONS = [
  {
    title: "Distribution scheduled",
    body: "An estimated $12,410 across your vehicles is scheduled for Aug 15.",
    time: "Today · 9:12 AM",
    route: "distributions",
    unread: true,
  },
  {
    title: "Reinvestment election closing",
    body: "Your Q3 election window closes Aug 14. Current election: 100% cash.",
    time: "Yesterday · 4:30 PM",
    route: "distributions",
    unread: true,
  },
  {
    title: "Appraisal scheduled",
    body: "Northsight Office Center is scheduled for reappraisal on Aug 06.",
    time: "Jul 27 · 11:05 AM",
    route: "properties/northsight-office-center",
    unread: true,
  },
  {
    title: "Transfer in review",
    body: "Transfer request TR-2261 (1,200 CHT) is with the transfer agent.",
    time: "Jul 27 · 9:14 AM",
    route: "compliance",
    unread: false,
  },
  {
    title: "Q2 statements available",
    body: "Quarterly statements and operating reports are ready for all three vehicles.",
    time: "Jul 21 · 8:00 AM",
    route: "ownership",
    unread: false,
  },
];

// Where each reported figure would come from once Chainlink-powered feeds are
// wired in (see docs/CHAINLINK_RESEARCH.md). Illustrative only:
// nothing is on-chain in this prototype, and a chip never means "verified".
// The four states a record can be in, and what each one means for the reader.
// The UI never shows a bare state word without this explanation behind it.
export const FEED_STATES = {
  normal: { label: "Current", meaning: "Checked inside its freshness window and accepted by fund administration." },
  stale: { label: "Stale", meaning: "Past its freshness window. Anything that depends on it is paused until it is refreshed." },
  disputed: { label: "Under review", meaning: "Two sources disagree, so the figure is shown but held back from downstream use." },
  unavailable: { label: "Unavailable", meaning: "No connected source right now. The last approved figure stays visible and dated." },
};

// Whether a record justifies a blockchain oracle at all. Shown as a legend on
// /records so the badges are never just labels.
export const RECOMMENDATIONS = {
  use: { label: "Use when needed", tone: "use", meaning: "Worth delivering on-chain, but only once a contract actually depends on the number." },
  explore: { label: "Explore", tone: "explore", meaning: "Plausible later. It needs an authoritative machine-readable source and a real on-chain consumer first." },
  offchain: { label: "Keep off-chain", tone: "skip", meaning: "Diameter can read this from the official source directly. An oracle would add cost without adding trust." },
  "do-not-use": { label: "Don't use", tone: "skip", meaning: "No dependable machine-readable source exists, so an oracle would only add false confidence." },
};

// The three records tracked on every property. They are the ones investor
// reporting depends on, so the property dashboard counts them.
export const KEY_RECORD_KINDS = ["valuation", "occupancy", "collections"];

export const ORACLE_FEEDS = {
  valuation: {
    label: "Property valuation",
    shortSource: "an independent appraisal firm",
    question: "What is the latest value approved for NAV reporting?",
    authority: "Independent appraisal, accepted by the fund administrator",
    cadence: "Quarterly",
    maxAge: "180 days",
    classification: "Confidential before approval; publish only the accepted property value and effective date.",
    verification: "Match the signed appraisal to the administrator's approved NAV workpaper.",
    aggregation: "One administrator-approved value; do not average conflicting appraisals silently.",
    dispute: "Mark the value under review, pause NAV publication, and record any replacement as a new event.",
    onchainConsumer: "A future token settlement or redemption contract that uses approved NAV.",
    offchainConsumer: "Property detail, token NAV, and the NAV publishing queue.",
    failure: "Keep the last accepted value visible; pause NAV publishing when it expires.",
    placement: "Attest the approved value only if token redemption or settlement uses it on-chain.",
    chainlink: "A SmartData NAVLink feed is the strongest fit when an on-chain consumer exists.",
    operations: "High: appraiser, fund administrator, publisher monitoring, and correction procedures.",
    recommendation: "use",
    method: "NAVLink candidate",
  },
  appraisal: {
    label: "Appraisal document",
    shortSource: "the signed appraisal document",
    question: "Is this the same signed appraisal that supported the approved value?",
    authority: "Signed report from the independent appraiser",
    cadence: "On each appraisal",
    maxAge: "Same window as the approved valuation",
    classification: "Confidential document; expose only its fingerprint, issuer, and effective date.",
    verification: "Hash the received file and compare it with the fingerprint attached to the approved value.",
    aggregation: "No aggregation; one fingerprint identifies one exact document version.",
    dispute: "Remove the match state, retain the prior fingerprint, and request a corrected signed file.",
    onchainConsumer: "An optional document registry; the valuation consumer only needs the approved value.",
    offchainConsumer: "Document room and valuation source details.",
    failure: "Hide the match state and request the signed source file.",
    placement: "Keep the PDF off-chain; an administrator can anchor its fingerprint directly.",
    chainlink: "No oracle network is needed unless an independent workflow must retrieve and anchor the file.",
    operations: "Low without an oracle; document access, versioning, and correction ownership still matter.",
    recommendation: "offchain",
    method: "Document fingerprint",
  },
  benchmark: {
    label: "SOFR benchmark",
    shortSource: "the New York Fed's daily publication",
    question: "Which published benchmark should a floating-rate loan or refinance model use?",
    authority: "Federal Reserve Bank of New York SOFR publication",
    cadence: "Each U.S. business day",
    maxAge: "3 business days",
    classification: "Public market data.",
    verification: "Confirm the exact benchmark, observation date, units, network, feed address, and heartbeat.",
    aggregation: "Use the official published observation; do not blend benchmarks or tenors.",
    dispute: "Follow an official correction and disable rate-sensitive calculations until the replacement is checked.",
    onchainConsumer: "None today; a future floating-rate debt contract could consume it.",
    offchainConsumer: "Refinance context and scenario analysis.",
    failure: "Disable rate-sensitive calculations and show the last observation as dated context.",
    placement: "Keep off-chain until a contract depends on the exact benchmark.",
    chainlink: "Confirm a supported feed before use; a dashboard alone does not justify on-chain delivery.",
    operations: "Low off-chain; higher on-chain because feed addresses, heartbeats, and network changes need monitoring.",
    recommendation: "explore",
    method: "Official publication",
  },
  treasury: {
    label: "Treasury yield",
    shortSource: "the U.S. Treasury's daily publication",
    question: "Which Treasury tenor should provide the comparison rate for the selected property decision?",
    authority: "U.S. Department of the Treasury Daily Treasury Par Yield Curve Rates",
    cadence: "Each U.S. business day",
    maxAge: "3 business days",
    classification: "Public market data.",
    verification: "Record the official observation date, selected tenor, units, and retrieval time.",
    aggregation: "Use one disclosed tenor; any spread or interpolation is a separate calculated metric.",
    dispute: "Adopt official revisions and suspend comparisons when the selected observation is missing.",
    onchainConsumer: "None today; a future spread-based covenant could consume it.",
    offchainConsumer: "Debt benchmarking and refinance context.",
    failure: "Keep the last dated value visible and stop calculations after the freshness limit.",
    placement: "Use the Treasury publication off-chain unless contract logic requires the rate.",
    chainlink: "Explore only after confirming an exact network feed; direct official data is enough for this UI.",
    operations: "Low off-chain; on-chain delivery adds feed selection and staleness monitoring.",
    recommendation: "offchain",
    method: "Official publication",
  },
  occupancy: {
    label: "Occupancy",
    shortSource: "the property-management system",
    question: "Is the property operating at the reported occupancy level?",
    authority: "Property-management system and signed monthly operating report",
    cadence: "Monthly",
    maxAge: "45 days",
    classification: "Private rent-roll data; publish only the property-level percentage and period.",
    verification: "Reconcile occupied units or leased area to the signed monthly operating report.",
    aggregation: "Property-level weighted percentage; disclose whether the basis is units, rooms, or area.",
    dispute: "Show under review, retain both source references internally, and require asset-manager approval.",
    onchainConsumer: "None today; a future covenant or distribution rule might use the aggregate.",
    offchainConsumer: "Property dashboard, detail page, and operating review.",
    failure: "Show the last report with its date; flag disagreements for asset-manager review.",
    placement: "Keep the detailed rent roll off-chain; attest only the monthly aggregate if automation needs it.",
    chainlink: "A CRE workflow adds delivery assurance, but only when a contract consumes the aggregate.",
    operations: "Medium: private API access, monthly reconciliation, privacy controls, and dispute handling.",
    recommendation: "explore",
    method: "CRE workflow candidate",
  },
  collections: {
    label: "Rental collections",
    shortSource: "the fund accounting ledger",
    question: "Are the month's collected funds ready to support a distribution run?",
    authority: "Fund accounting ledger after bank reconciliation",
    cadence: "Monthly close",
    maxAge: "35 days",
    classification: "Confidential tenant and bank data; expose only the administrator-approved total.",
    verification: "Tie the accounting total to the completed bank reconciliation and close approval.",
    aggregation: "One approved property-period total; exclude tenant-level transactions.",
    dispute: "Block distribution automation, mark the period under review, and require accounting sign-off on a correction.",
    onchainConsumer: "A future distribution contract gated by an approved collected-cash total.",
    offchainConsumer: "Income reporting and the distribution approval workflow.",
    failure: "Do not trigger a distribution; route the period to fund accounting.",
    placement: "Attest the approved monthly total; individual tenant and bank records remain private.",
    chainlink: "A CRE workflow is useful only when an approved total should trigger on-chain distribution logic.",
    operations: "High: accounting close, bank reconciliation, credentialed workflow, monitoring, and exception ownership.",
    recommendation: "use",
    method: "CRE workflow candidate",
  },
  insurance: {
    label: "Insurance certificate",
    shortSource: "the carrier or broker",
    question: "Which certificate is on file, and is it still within its stated term?",
    authority: "Carrier or broker-issued certificate",
    cadence: "On issue and renewal",
    maxAge: "Policy expiry date",
    classification: "Confidential policy document; expose issuer, term, status, and fingerprint only.",
    verification: "Match the certificate fingerprint and term to the broker-maintained policy record.",
    aggregation: "No aggregation; each policy record stands on its own.",
    dispute: "Remove the current state and require broker confirmation or a replacement certificate.",
    onchainConsumer: "None in the current product.",
    offchainConsumer: "Compliance exceptions, document room, and renewal workflow.",
    failure: "Flag the record before expiry and require a replacement certificate.",
    placement: "Keep the certificate off-chain; optionally anchor its hash and validity window.",
    chainlink: "Not recommended until a reliable machine-readable carrier source exists.",
    operations: "Low for document tracking; a custom oracle would add cost without an authoritative API.",
    recommendation: "do-not-use",
    method: "Source document only",
  },
  debt: {
    label: "Debt terms",
    shortSource: "the loan servicer's statement",
    question: "Which approved loan terms should drive LTV, coverage, and maturity reporting?",
    authority: "Executed loan documents and the lender or servicer statement",
    cadence: "Monthly and whenever terms change",
    maxAge: "45 days for balances; until amendment for fixed terms",
    classification: "Confidential financing records; show only approved reporting fields.",
    verification: "Reconcile balances to the servicer statement and fixed terms to executed documents.",
    aggregation: "Loan-level records roll up only after currency, lien priority, and effective dates match.",
    dispute: "Freeze affected ratios, show the prior dated terms, and route differences to fund accounting.",
    onchainConsumer: "None today; a future covenant contract would need a separately approved data model.",
    offchainConsumer: "Property financials, covenant review, and refinance planning.",
    failure: "Stop derived LTV and coverage updates while keeping the last accepted terms visibly dated.",
    placement: "Keep loan documents and detailed terms off-chain; a document fingerprint is sufficient for integrity.",
    chainlink: "Do not add an oracle without an on-chain covenant and an authoritative machine-readable servicer source.",
    operations: "Medium off-chain; servicing changes and amendments require controlled review.",
    recommendation: "offchain",
    method: "Servicer reconciliation",
  },
  reserves: {
    label: "Cash and reserves",
    shortSource: "the custodian bank reconciliation",
    question: "Is the approved reserve balance sufficient before a distribution or capital release?",
    authority: "Fund administrator ledger after custodian-bank reconciliation",
    cadence: "Monthly close and before a release",
    maxAge: "35 days, or same-day for a release decision",
    classification: "Confidential bank data; expose only the approved aggregate and period.",
    verification: "Tie the reserve ledger to the reconciled custodian statement and approval record.",
    aggregation: "Aggregate only accounts assigned to the disclosed reserve policy; do not expose account details.",
    dispute: "Pause the release, mark the balance under review, and require administrator approval for a correction.",
    onchainConsumer: "A future distribution or reserve-release contract.",
    offchainConsumer: "Distribution review, liquidity reporting, and asset-management controls.",
    failure: "Pause any dependent release and retain the prior balance as dated context only.",
    placement: "Keep bank records off-chain; attest an approved aggregate only when it gates a contract action.",
    chainlink: "A CRE workflow is worth exploring only with an independent custodian source and an on-chain release rule.",
    operations: "High: bank access, reconciliation, approval separation, monitoring, and incident response.",
    recommendation: "explore",
    method: "CRE workflow candidate",
  },
};

// Feed state for one property/domain pair: normal | stale | disputed |
// unavailable. Non-normal cases align with existing dataset stories.
export const feedFor = (property, kind) => {
  const feed = ORACLE_FEEDS[kind];
  let status = "normal";
  let note = "";
  let effective = "Jun 30, 2026";
  let checked = "Jul 08, 2026";
  let source = feed.authority;
  if (kind === "valuation" || kind === "appraisal") {
    effective = property.valuation.date;
    checked = property.valuation.date === "Dec 31, 2025" ? "Jan 12, 2026" : "Jul 01, 2026";
    source = `${property.valuation.source} · accepted by fund administration`;
  } else if (kind === "collections") {
    effective = "Jun 30, 2026";
    checked = "Jul 12, 2026";
  } else if (kind === "benchmark") {
    effective = "Jul 29, 2026";
    checked = "Jul 29, 2026 · 8:05 AM";
  } else if (kind === "treasury") {
    effective = "Jul 29, 2026";
    checked = "Jul 29, 2026 · 4:15 PM";
  } else if (kind === "insurance") {
    effective = "Jun 05, 2026";
    checked = "Jul 29, 2026";
  } else if (kind === "debt") {
    effective = "Jun 30, 2026";
    checked = "Jul 10, 2026";
  } else if (kind === "reserves") {
    effective = "Jun 30, 2026";
    checked = "Jul 12, 2026";
  }
  if (kind === "valuation" && property.valuation.stale) {
    status = "stale";
    note = "The accepted valuation is outside its freshness window, so NAV publishing stays paused.";
  } else if (kind === "occupancy" && property.id === "presidio-exchange") {
    status = "disputed";
    note = "The leased figure is being reconciled during the anchor-tenant renewal.";
  } else if (kind === "collections" && property.id === "canyon-gate-suites") {
    status = "unavailable";
    note = "The source connection is pending; the operating report remains available without an attestation.";
  } else if (kind === "insurance" && property.id === "skyline-hotel-phoenix") {
    status = "stale";
    note = "The certificate reaches its review window in 12 days; renewal is due.";
  }
  return { ...feed, kind, status, note, effective, checked, source };
};

// The three key records for all ten properties — what the property dashboard
// counts, and what its exception chips link to.
export const keyRecords = () =>
  PROPERTIES.flatMap((property) => KEY_RECORD_KINDS.map((kind) => ({ property, ...feedFor(property, kind) })));

export const SMART_RECORD = {
  propertyId: "skyline-hotel-phoenix",
  recordId: "DCR-SHP-001",
  network: "Local simulation",
  contract: "PropertyDeed",
  version: "0.8.24",
  appraisalHash: "0xc471…84af",
  custodian: "Illustrative qualified custodian",
  events: [
    { date: "Jul 01, 2026 · 9:42 AM", title: "Valuation recorded", detail: "$38.4M appraisal · effective Jun 30, 2026", status: "Recorded" },
    { date: "Jul 01, 2026 · 9:41 AM", title: "Appraisal matched", detail: "Document fingerprint 0xc471…84af", status: "Matched" },
    { date: "Jun 05, 2026 · 2:18 PM", title: "Insurance certificate filed", detail: "Renewal review due in 12 days", status: "Review" },
  ],
  controls: [
    ["Record administrator", "Illustrative asset administrator"],
    ["Valuation publisher", "Approved data service"],
    ["Freshness limit", "180 days"],
    ["Transfers and funds", "Disabled in this example"],
  ],
};

export const vehicleById = Object.fromEntries(VEHICLES.map((v) => [v.id, v]));

export const vehicleOf = (property) => vehicleById[property.vehicleId];

export const propertiesOf = (vehicle) => PROPERTIES.filter((p) => p.vehicleId === vehicle.id);

// A property's share of its vehicle, by gross asset value. Used to attribute
// vehicle-level token supply and pro-rata distributions to a single asset.
export const shareOfVehicle = (property) => {
  const total = propertiesOf(vehicleOf(property)).reduce((sum, p) => sum + p.value, 0);
  return property.value / total;
};

// Twelve months of illustrative gross rental/operating income.
export const incomeSeries = (property) =>
  SEASONALITY[property.type].map((multiplier) => (property.grossIncome / 12) * multiplier);

// Distribution rows attributable to one property: pro-rata vehicle payments
// plus any event tied directly to it (e.g. a refinance).
export const distributionsFor = (property) => {
  const vehicle = vehicleOf(property);
  const share = shareOfVehicle(property);
  return vehicle.distributions
    .filter(([, , , meta]) => !meta?.propertyId || meta.propertyId === property.id)
    .map(([date, rate, status, meta]) => ({
      date,
      type: meta?.type ?? "Operating income",
      rate,
      amount: rate * vehicle.token.issued * (meta?.propertyId ? 1 : share),
      status,
    }))
    .reverse();
};

export const documentsFor = (property) => {
  const vehicle = vehicleOf(property);
  const operations = {
    Hospitality: "STR performance report · June 2026",
    Multifamily: "Rent roll summary · June 2026",
    Commercial: "Lease & tenancy schedule · Q2 2026",
  }[property.type];
  return [
    { title: "Q2 2026 operating statement", category: "Financial reporting", date: "Jul 21, 2026", size: "1.2 MB" },
    { title: operations, category: "Operations", date: "Jul 08, 2026", size: "0.8 MB" },
    { title: "Appraisal report", category: "Valuation", date: property.valuation.date, size: "4.6 MB", note: property.valuation.source, feed: "appraisal" },
    { title: "Insurance certificate 2026–27", category: "Risk & insurance", date: "Jun 05, 2026", size: "0.3 MB", feed: "insurance" },
    { title: `${vehicle.name} — offering memorandum`, category: "Offering", date: "Mar 03, 2025", size: "6.1 MB" },
  ];
};

export const portfolioTotals = () => {
  const value = PROPERTIES.reduce((sum, p) => sum + p.value, 0);
  const noi = PROPERTIES.reduce((sum, p) => sum + p.noi, 0);
  const occupancy = PROPERTIES.reduce((sum, p) => sum + p.occupancy * p.value, 0) / value;
  const markets = new Set(PROPERTIES.map((p) => p.market)).size;
  const types = new Set(PROPERTIES.map((p) => p.type)).size;
  return { value, noi, occupancy, markets, types, count: PROPERTIES.length };
};
