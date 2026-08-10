import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

const htmlClasses = new Set(
  [...html.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/)),
);
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));

const queriedSelectors = [...script.matchAll(/querySelector\("([.#])([^"]+)"\)/g)].map(
  (match) => ({
    type: match[1],
    name: match[2],
  }),
);

const missingSelectors = queriedSelectors
  .filter((selector) => {
    if (selector.type === ".") return !htmlClasses.has(selector.name);
    return !htmlIds.has(selector.name);
  })
  .map((selector) => `${selector.type}${selector.name}`);

assert.deepEqual(
  missingSelectors,
  [],
  "Every selector queried by main.js should exist in index.html",
);

assert.ok(!/\.len\b/.test(script), "String length checks should use .length");
