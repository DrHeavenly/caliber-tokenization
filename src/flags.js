// Feature flags for the prototype.
//
// ASSURANCE_FEATURES gates the source/freshness records and the /records
// asset-record screen. The code and markup stay in the tree; when the flag is
// off the build strips the `<!--assurance-->` regions from index.html, drops
// the /records route, and app.js renders no assurance layer.
export const ASSURANCE_FEATURES = true;

// ASSISTANT_FEATURES gates the Diameter Assistant panels (grounded answers,
// quarter explanations, comparisons, summaries, alerts, lease outlooks, and
// financing scenarios). Off, the screens render as they did without them.
export const ASSISTANT_FEATURES = true;
