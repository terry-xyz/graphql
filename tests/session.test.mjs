import assert from "node:assert/strict";

const originalDocument = globalThis.document;
const originalLocation = globalThis.location;

let cookieValue = "";
const cookieWrites = [];

try {
  globalThis.document = {
    get cookie() {
      return cookieValue;
    },
    set cookie(value) {
      cookieWrites.push(value);
      // document.cookie exposes only the name/value pair after the browser applies attributes.
      cookieValue = value.split("; ")[0];
    },
  };

  globalThis.location = { protocol: "http:" };
  const httpSession = await import(`../src/session.js?http=${Date.now()}`);

  httpSession.saveToken("token with spaces; punctuation");

  assert.equal(
    cookieWrites.at(-1),
    "jwt=token%20with%20spaces%3B%20punctuation; Max-Age=86400; Path=/; SameSite=Strict",
    "saveToken should encode the JWT and apply the HTTP cookie policy",
  );
  assert.doesNotMatch(cookieWrites.at(-1), /Secure/);
  assert.doesNotMatch(cookieWrites.at(-1), /Expires|HttpOnly/);

  cookieValue = "theme=dark; jwt=encoded%20token; jwt-extra=wrong-token";
  assert.equal(
    httpSession.getToken(),
    "encoded token",
    "getToken should decode the jwt cookie without matching a similarly named cookie",
  );

  cookieValue = "theme=dark";
  assert.equal(httpSession.getToken(), null, "getToken should return null when jwt is absent");

  httpSession.clearToken();

  assert.equal(
    cookieWrites.at(-1),
    "jwt=; Max-Age=0; Path=/; SameSite=Strict",
    "clearToken should expire the JWT at the same path",
  );

  globalThis.location = { protocol: "https:" };
  const httpsSession = await import(`../src/session.js?https=${Date.now()}`);

  httpsSession.saveToken("secure-token");

  assert.equal(
    cookieWrites.at(-1),
    "jwt=secure-token; Secure; Max-Age=86400; Path=/; SameSite=Strict",
    "saveToken should add Secure when the page uses HTTPS",
  );
} finally {
  globalThis.document = originalDocument;

  if (originalLocation === undefined) {
    delete globalThis.location;
  } else {
    globalThis.location = originalLocation;
  }
}
