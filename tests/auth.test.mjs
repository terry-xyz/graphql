import assert from "node:assert/strict";
import { signIn } from "../src/auth.js";
import { API_BASE_URL, API_SIGNIN_ENDPOINT } from "../src/config.js";

const originalFetch = globalThis.fetch;

try {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      async json() {
        return "jwt-token";
      },
    };
  };

  const token = await signIn("student@example.com", "secret-password");

  assert.equal(token, "jwt-token", "signIn should return the parsed JWT");
  assert.equal(request.url, `${API_BASE_URL}${API_SIGNIN_ENDPOINT}`);
  assert.equal(request.options.method, "POST");
  assert.deepEqual(request.options.headers, {
    Authorization: `Basic ${Buffer.from("student@example.com:secret-password").toString("base64")}`,
  });

  globalThis.fetch = async () => ({
    ok: false,
    async json() {
      return { error: "invalid credentials" };
    },
  });

  await assert.rejects(
    () => signIn("bad-user", "bad-password"),
    /Invalid username\/email or password/,
    "signIn should reject invalid credentials",
  );
} finally {
  globalThis.fetch = originalFetch;
}
