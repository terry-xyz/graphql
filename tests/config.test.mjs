import assert from "node:assert/strict";
import {
  CURRENT_SECTION,
  PREVIOUS_SECTION,
  UpdateSectionState,
  basicQuery,
  maxIdentityDataQuery,
} from "../src/config.js";

assert.match(basicQuery, /user\s*{\s*id\s*login\s*}/s);
assert.match(maxIdentityDataQuery, /query\s+MaxProfileData\(\$userId:\s*Int!\)/);
assert.match(maxIdentityDataQuery, /user:\s*user_by_pk\(id:\s*\$userId\)/);
assert.match(maxIdentityDataQuery, /xpTotal:\s*transaction_aggregate/);
assert.match(maxIdentityDataQuery, /levelTransactions:\s*transaction/);

assert.equal(CURRENT_SECTION, "identity");
assert.equal(PREVIOUS_SECTION, "");

UpdateSectionState("xpLevel");

assert.equal(PREVIOUS_SECTION, "identity");
assert.equal(CURRENT_SECTION, "xpLevel");
