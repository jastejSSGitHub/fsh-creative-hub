#!/usr/bin/env node
/**
 * Guard against Framer Motion runtime errors:
 * spring/inertia transitions do not support 3+ keyframe arrays.
 *
 * Run: node scripts/check-motion-keyframes.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "src");
const ANIMATED_PROP_ARRAY =
  /(?:scale|opacity|x|y|rotate|boxShadow):\s*[^\n]*\[[^\]]*,[^\]]*,[^\]]*\]/;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry !== "node_modules") walk(path, files);
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry)) files.push(path);
  }
  return files;
}

function hasSafeScaleTransition(chunk) {
  return (
    /scale:\s*loopTransition\(/.test(chunk) ||
    /scale:\s*\{[^}]*duration:/.test(chunk) ||
    /transitionForValue\(/.test(chunk) ||
    /mixedScaleTransition\(/.test(chunk)
  );
}

const violations = [];

for (const file of walk(ROOT)) {
  const content = readFileSync(file, "utf8");
  if (!content.includes("framer-motion")) continue;

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!ANIMATED_PROP_ARRAY.test(line)) continue;

    const chunk = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 10)).join("\n");
    if (!/type:\s*["']spring["']|default:\s*\{[^}]*type:\s*["']spring["']/.test(chunk)) {
      continue;
    }
    if (hasSafeScaleTransition(chunk)) continue;

    violations.push(`${file.replace(/\\/g, "/")}:${i + 1}`);
  }
}

if (violations.length) {
  console.error("Potential spring + multi-keyframe conflicts:");
  for (const hit of violations) {
    console.error(`  - ${hit}`);
  }
  console.error(
    "\nUse loopTransition() or a tween for 3+ keyframes. See src/lib/motion/transitions.ts",
  );
  process.exit(1);
}

console.log("Motion keyframe check passed.");
