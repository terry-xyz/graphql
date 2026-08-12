import assert from "node:assert/strict";
import { graphqlRequest } from "../src/graphql.js";
import { API_BASE_URL, API_GRAPHQL_ENDPOINT } from "../src/config.js";

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

try {
  globalThis.localStorage = {
    getItem(key) {
      assert.equal(key, "jwt");
      return "jwt-token";
    },
  };

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      async json() {
        return {
          data: {
            user: [{ id: 42, login: "student" }],
          },
        };
      },
    };
  };

  const query = `
    {
      user {
        id
        login
      }
    }
  `;
  const variables = { userId: 42 };
  const data = await graphqlRequest(query, variables);

  assert.deepEqual(data, {
    user: [{ id: 42, login: "student" }],
  });
  assert.equal(request.url, `${API_BASE_URL}${API_GRAPHQL_ENDPOINT}`);
  assert.equal(request.options.method, "POST");
  assert.deepEqual(request.options.headers, {
    Authorization: "Bearer jwt-token",
    "Content-Type": "application/json",
  });
  assert.deepEqual(JSON.parse(request.options.body), {
    query,
    variables,
  });
} finally {
  globalThis.fetch = originalFetch;
  globalThis.localStorage = originalLocalStorage;
}
