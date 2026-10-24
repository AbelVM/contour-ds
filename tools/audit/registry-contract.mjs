#!/usr/bin/env node
/**
 * The registry's conformance gate (C-46): does `dist/registry/` actually validate
 * against the live shadcn schemas, as reported by an independent implementation?
 *
 *     node tools/audit/registry-contract.mjs
 *
 * This is the claim `tools/check-registry.mjs` deliberately refuses to make. That
 * guard owns structure — pointers resolve, no content inlined, no homepage, counts
 * agree with the inventory. Whether the bytes conform to a JSON Schema is a question
 * for a schema engine, not for a hand-written loop, and answering it with my own
 * checks would be exactly the failure this repository keeps paying for: a second
 * implementation of one rule, agreeing only by luck.
 *
 * So ajv validates the shipped artifacts against the PINNED copies of the two live
 * schemas in `tools/audit/schema/`, whose bytes are fixed by `sources.json`. The
 * root schema refers to the item schema by URL, and ajv resolves that reference from
 * the vendored copy added under that exact key — which is what keeps this gate
 * runnable with no network, in CI, on a private repository.
 *
 * What it asserts, and what it does not:
 *   - every document in dist/registry/ is validated, and the count is printed. A run
 *     that validated nothing would otherwise report a clean registry forever.
 *   - the vendored schema bytes still match the recorded hash — because a silent edit
 *     to the pinned schema would make every future conformance claim meaningless.
 *   - ajv's own count of items equals the artifact's. A root document whose `items`
 *     array ajv never reached is not a pass.
 *   - it does NOT claim the registry is installable. The project is private until v1.0
 *     and the deployment answers 404; this gate answers "is the shape conformant", and
 *     `check-registry.mjs` keeps `homepage` and `url` out so this artifact cannot
 *     imply otherwise.
 *
 * Like the dembrandt gate, this one EXITS rather than skips when its dependency is
 * absent — a gate that silently does not run is a gate that silently passes.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const DIST = join(ROOT, "dist");
const SCHEMA = join(here, "schema");
const REG = join(DIST, "registry");

// Resolution comes from this directory's own manifest, so npm's export map picks the
// file — the pattern dtcg-contract.mjs already uses for dembrandt.
const req = createRequire(join(here, "package.json"));

function loadModule(name, hint) {
  try {
    return req(name);
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND" && e.code !== "MODULE_NOT_FOUND") throw e;
    console.error(`registry-contract: cannot load ${name} (${e.code}).`);
    console.error(`  ${hint}`);
    process.exit(1);
  }
}

const { default: Ajv } = loadModule("ajv", "install the audit dev dependencies:  npm --prefix tools/audit install");

// ajv's own version, for the report: a gate that cannot say which engine ran is a
// gate whose "conformant" cannot be reproduced by anyone else. ajv ships no exports
// map, so package.json resolves directly; the fallback only names the failure.
let ajvVersion = "unresolved";
try {
  ajvVersion = req("ajv/package.json").version;
} catch {
  /* reported as unresolved below — a version this gate cannot read is worth seeing */
}

const errors = [];
const ledgerPath = join(SCHEMA, "sources.json");
for (const f of ["registry.schema.json", "registry-item.schema.json", "sources.json"]) {
  if (!existsSync(join(SCHEMA, f))) errors.push(`vendored schema ${f} is missing from tools/audit/schema/`);
}
if (!existsSync(join(REG, "registry.json"))) errors.push("dist/registry/registry.json is missing — run `node tools/build.mjs`");
if (errors.length) {
  for (const e of errors) console.error("registry-contract: " + e);
  process.exit(1);
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));

// The pinned bytes must still be the bytes the ledger recorded. Without this, editing
// a vendored schema would quietly redefine what "conformant" means for every artifact
// checked against it — and the ledger is the only place the fetch is dated.
const hashChecks = [];
for (const [doc, meta] of Object.entries(ledger.documents)) {
  const buf = readFileSync(join(SCHEMA, meta.file));
  const got = sha256(buf);
  hashChecks.push({ doc, file: meta.file, expected: meta.sha256, got, ok: got === meta.sha256, bytes: buf.length });
  if (got !== meta.sha256) errors.push(`tools/audit/schema/${meta.file} no longer matches sources.json (${got.slice(0, 12)}… != ${String(meta.sha256).slice(0, 12)}…) — re-fetch deliberately, do not repair silently`);
  if (meta.bytes && buf.length !== meta.bytes) errors.push(`tools/audit/schema/${meta.file} is ${buf.length} bytes but sources.json records ${meta.bytes}`);
}

const rootSchema = JSON.parse(readFileSync(join(SCHEMA, "registry.schema.json"), "utf8"));
const itemSchema = JSON.parse(readFileSync(join(SCHEMA, "registry-item.schema.json"), "utf8"));

// Two configuration facts, both found by measurement rather than by reading ajv's docs
// and nodding along. (1) The vendored schemas declare `$schema` as
// `https://json-schema.org/draft-07/schema#` while ajv registers the draft-07 meta-schema
// under its canonical `http://…` URI, so the meta-schema must be added under the https
// form too — otherwise ajv throws before it can report anything about our artifacts.
// (2) `strictRequired` rejects the VENDORED schema itself: the root document expresses a
// conditional requirement as `anyOf: [{required:[items]}, {required:[include]}]`, and
// strict mode refuses a `required` whose keys are not restated in that branch's own
// `properties`. Turning that one check off weakens nothing about our artifacts, because
// the `anyOf` is still evaluated — a root with neither items nor include still fails.
// That is asserted below rather than trusted, because a relaxation that is not proven to
// still bite is just a disabled gate with a comment on it.
const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
const itemRef = itemSchemaSourceUrl(ledger);
ajv.addMetaSchema(req("ajv/dist/refs/json-schema-draft-07.json"), "https://json-schema.org/draft-07/schema#");
// The root schema's items[] is a $ref to the item schema BY URL. Registering the
// vendored copy under that exact key is what makes the reference resolve offline.
ajv.addSchema(itemSchema, itemRef);
const validateRoot = ajv.compile(rootSchema);
const validateItem = ajv.getSchema(itemRef);

function itemSchemaSourceUrl(l) {
  const hit = Object.entries(l.documents).find(([k]) => k.includes("item"));
  if (!hit) throw new Error("sources.json does not name the registry-item document");
  return hit[1].sourceUrl;
}

// -- does this validator still bite? -----------------------------------------
// `strictRequired: false` is a deliberate relaxation, and a relaxation that is never
// tested is indistinguishable from a disabled gate. So before this file reports that the
// shipped artifacts conform, it conforms nothing: it feeds ajv three documents that MUST
// be rejected and fails the run if any of them is accepted. Without this, "all shipped
// documents conform" could mean "the engine was configured to say yes".
const controls = [
  {
    name: "a root with neither items nor include (the anyOf the relaxation touches)",
    doc: { $schema: "https://ui.shadcn.com/schema/registry.json", name: "contour" },
    validate: validateRoot,
  },
  {
    name: "an item with no name",
    doc: { $schema: itemRef, type: "registry:style" },
    validate: validateItem,
  },
  {
    name: "an item whose type is not in the live enum",
    doc: { $schema: itemRef, name: "contour-css", type: "registry:css" },
    validate: validateItem,
  },
  {
    // The second conditional the schema carries and a `required`-only reading of it
    // would never find: `style`, `iconLibrary`, `baseColor` and `theme` are FORBIDDEN on
    // any item that is not registry:base. Emitting one would not be a warning.
    name: "a style key on an item that is not registry:base",
    doc: { $schema: itemRef, name: "contour-x", type: "registry:style", style: "default" },
    validate: validateItem,
  },
];
let controlsRejected = 0;
for (const c of controls) {
  const accepted = c.validate(c.doc);
  if (accepted) errors.push(`self-test failed: ajv ACCEPTED ${c.name} — the engine is not checking what this gate claims to check`);
  else controlsRejected += 1;
}
if (controlsRejected !== controls.length) errors.push(`only ${controlsRejected}/${controls.length} negative controls were rejected`);

// -- the artifacts a host would actually serve --------------------------------
const index = JSON.parse(readFileSync(join(REG, "registry.json"), "utf8"));
const docs = [["registry.json", index, validateRoot]];
for (const f of readdirSync(join(REG, "items")).filter((x) => x.endsWith(".json")).sort()) {
  docs.push([`registry/items/${f}`, JSON.parse(readFileSync(join(REG, "items", f), "utf8")), validateItem]);
}

let validated = 0;
let passed = 0;
for (const [label, doc, fn] of docs) {
  validated += 1;
  const ok = fn(doc);
  if (ok) passed += 1;
  else {
    const list = (fn.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}${e.params && Object.keys(e.params).length ? ` ${JSON.stringify(e.params)}` : ""}`);
    errors.push(`${label} does not conform to the schema it claims: ${list.slice(0, 6).join("; ")}${list.length > 6 ? ` (+${list.length - 6})` : ""}`);
  }
}

// Population, not a vacuous sweep.
if (validated === 0) errors.push("no registry document was validated — the gate ran zero times");
if (validated !== 1 + readdirSync(join(REG, "items")).filter((x) => x.endsWith(".json")).length) {
  errors.push(`validated ${validated} documents, which is not the index plus every item file`);
}
if (Array.isArray(index.items) && index.items.length !== validated - 1) {
  errors.push(`registry.json lists ${index.items.length} items but ${validated - 1} item files were validated — a listed item with no file, or a file with no listing`);
}

// The schema itself must say what the ledger claims it says: same draft, same type
// vocabulary. Measured from the bytes, so a re-fetch that changed the enum is visible.
const itemTypes = itemSchema.properties?.type?.enum ?? [];
const fileTypes = itemSchema.properties?.files?.items?.properties?.type?.enum ?? [];
if (!itemTypes.length || !fileTypes.length) errors.push("the vendored item schema exposes no type enum, so nothing here is checking the type the registry uses");
const usedTypes = new Set([index.items?.[0]?.type, ...(index.items ?? []).flatMap((i) => (i.files ?? []).map((f) => f.type))].filter(Boolean));
for (const t of usedTypes) {
  if (!itemTypes.includes(t) && !fileTypes.includes(t)) errors.push(`the registry uses type "${t}", which is in neither the item nor the file enum of the live schema`);
}

if (errors.length) {
  console.error(`registry-contract: ${errors.length} problem(s)`);
  for (const e of errors.slice(0, 20)) console.error("  - " + e);
  process.exit(1);
}
console.log(
  `registry-contract: ajv ${req("ajv/package.json").version} validated ${validated}/${validated} shipped documents ` +
    `(registry.json + ${validated - 1} item files) against the vendored draft-07 schemas, all conformant; ` +
    `schema bytes match sources.json (${hashChecks.map((h) => `${h.file.slice(0, -12)}@${h.expected.slice(0, 8)}`).join(", ")}), fetched ${ledger.fetchedAt}; ` +
    `every type the registry uses (${[...usedTypes].join(", ")}) is in the live enum; ajv's item count agrees with the index. ` +
    `Claims conformance of the shape only — not that a host can reach it. OK`,
);
