#!/usr/bin/env node
/**
 * API compatibility gate (CDS-032): fails when the current component contract
 * has breaking changes against the committed baseline.
 *
 *   node tools/check-api-compat.mjs
 */

import { checkApiCompat } from "./lib/api-compat.mjs";

process.exit(checkApiCompat());
