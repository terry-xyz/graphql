import assert from "node:assert/strict";
import { graphqlRequest } from "../src/graphql.js";

const originalDocument = globalThis.document;
const originalFetch = globalThis.fetch;

let cookieValue = "jwt=expired-token";
const cookieWrites = [];

try {
  globalThis.document = {
    get cookie() {
      return cookieValue;
    },
    set cookie(value) {
      cookieWrites.push(value);
      cookieValue = value.split("; ")[0];
    },
  };

  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    async json() {
      return { errors: [{ message: "JWT expired" }] };
    },
  });

  await assert.rejects(
    () => graphqlRequest("{ user { id } }"),
    /session has expired/i,
    "A rejected JWT should surface a session-expired error",
  );

  assert.equal(
    cookieWrites[0],
    "jwt=; Max-Age=0; Path=/; SameSite=Strict",
    "A rejected JWT should be cleared at the session boundary",
  );
  assert.equal(cookieValue, "jwt=");

  // A forbidden response represents the same unusable session, so it must follow the 401 cleanup contract.
  cookieValue = "jwt=forbidden-token";
  cookieWrites.length = 0;
  globalThis.fetch = async () => ({
    ok: false,
    status: 403,
    async json() {
      return { errors: [{ message: "JWT forbidden" }] };
    },
  });

  await assert.rejects(
    () => graphqlRequest("{ user { id } }"),
    /session has expired/i,
    "A forbidden JWT should surface a session-expired error",
  );

  assert.equal(
    cookieWrites[0],
    "jwt=; Max-Age=0; Path=/; SameSite=Strict",
    "A forbidden JWT should also be cleared at the session boundary",
  );
  assert.equal(cookieValue, "jwt=");
} finally {
  globalThis.document = originalDocument;
  globalThis.fetch = originalFetch;
}
