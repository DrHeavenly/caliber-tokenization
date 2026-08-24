import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROPERTIES } from "../src/data.js";
import { ASSISTANT_FEATURES, ASSURANCE_FEATURES } from "../src/flags.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const out = join(root, "public");
const routes = ["overview", "offerings", "properties", "ownership", "distributions", "performance", "compliance", ...(ASSURANCE_FEATURES ? ["records"] : [])];
const escapeHtml = (value) => value.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);

await rm(out, { recursive: true, force: true });
await mkdir(join(out, "static"), { recursive: true });
await mkdir(join(out, "properties"), { recursive: true });

// Assurance markup (data assurance, /records asset record) lives between
// <!--assurance--> ... <!--/assurance--> markers and is stripped when the flag is off.
const source = await readFile(join(src, "index.html"), "utf8");
const contractSource = ASSURANCE_FEATURES ? await readFile(join(root, "contracts", "PropertyDeed.sol"), "utf8") : "";
const stripped = (html, on, marker) => (on ? html : html.replace(new RegExp(`<!--${marker}-->[\\s\\S]*?<!--/${marker}-->`, "g"), ""));
const template = stripped(stripped(source, ASSURANCE_FEATURES, "assurance"), ASSISTANT_FEATURES, "assistant")
  .replace("__CONTRACT_SOURCE__", escapeHtml(contractSource));
await writeFile(join(out, "index.html"), template.replace("__INITIAL_VIEW__", "overview"));
for (const route of routes) {
  await writeFile(join(out, `${route}.html`), template.replace("__INITIAL_VIEW__", route));
}
// One page per property so /properties/<id> deep links work on static hosting.
for (const property of PROPERTIES) {
  await writeFile(join(out, "properties", `${property.id}.html`), template.replace("__INITIAL_VIEW__", `properties/${property.id}`));
}
await cp(join(src, "site.css"), join(out, "static", "site.css"));
await cp(join(src, "app.js"), join(out, "static", "app.js"));
await cp(join(src, "data.js"), join(out, "static", "data.js"));
await cp(join(src, "flags.js"), join(out, "static", "flags.js"));
await cp(join(src, "assistant.js"), join(out, "static", "assistant.js"));

console.log(`build: ${routes.length} screens and ${PROPERTIES.length} property pages written to public/`);
