import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(main, /graphqlRequest\(maxIdentityDataQuery,\s*{\s*userId:\s*user\.id,\s*}\)/s);
assert.match(main, /UpdateSectionState\("identity"\)/);
assert.match(main, /UpdateSectionState\("xpLevel"\)/);
assert.match(main, /UpdateSectionState\("audits"\)/);
assert.match(main, /renderDataSection\(maxIdentityData\)/);

for (const id of [
  "navbar-identity",
  "navbar-xpLevel",
  "navbar-audits",
  "identity-section",
  "identity-firstName",
  "identity-lastName",
  "identity-login",
  "identity-email",
  "identity-campus",
  "xpLevel-section",
  "xpLevel-totalXp",
  "xpLevel-currentMaxLevel",
  "xpLevel-biggestXpGain",
  "audits-section",
  "audits-ratio",
  "audits-xpGiven",
  "audits-xpReceived",
  "audits-bonusXp",
  "audits-warning",
  "logout-button",
]) {
  assert.match(html, new RegExp(`id="${id}"`), `index.html should include #${id}`);
}
