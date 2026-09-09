import assert from "node:assert/strict";
import { API_BASE_URL, API_GRAPHQL_ENDPOINT, API_SIGNIN_ENDPOINT } from "../src/config.js";

// createElement provides the DOM state and event hooks main.js observes, so this test can exercise page behavior without a browser.
function createElement(id, hidden = true) {
  let textContent = "";

  return {
    id,
    hidden,
    disabled: false,
    value: "",
    className: "",
    attributes: {},
    children: [],
    eventListeners: {},
    get textContent() {
      return textContent;
    },
    set textContent(value) {
      textContent = String(value);
    },
    addEventListener(eventName, listener) {
      this.eventListeners[eventName] = listener;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    append(...children) {
      this.children.push(...children);
    },
    replaceChildren(...children) {
      this.children = [...children];
    },
    getBBox() {
      return { width: this.textContent.length * 9 };
    },
  };
}

const elementIds = [
  "navbar-identity",
  "navbar-xpLevel",
  "navbar-audits",
  "login-form",
  "login-identifier",
  "login-password",
  "login-feedback",
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
  "xp-chart",
  "audits-section",
  "audits-ratio",
  "audits-xpGiven",
  "audits-xpReceived",
  "audits-bonusXp",
  "audits-warning",
  "audits-chart",
  "logout-button",
];

const elements = new Map(
  // Login fields remain available while profile controls start hidden in the logged-out state.
  elementIds.map((id) => [id, createElement(id, !id.startsWith("login-"))]),
);

const originalDocument = globalThis.document;
const originalFetch = globalThis.fetch;
const originalBtoa = globalThis.btoa;

let cookieValue = "";
let profileRequestsFail = true;
let graphqlRequestCount = 0;

try {
  globalThis.document = {
    get cookie() {
      return cookieValue;
    },
    set cookie(value) {
      const [cookiePair, ...attributes] = value.split("; ");
      const [name, cookieData = ""] = cookiePair.split("=");

      // clearToken uses Max-Age=0, so emulate browser deletion while keeping the test independent of real cookie storage.
      if (attributes.includes("Max-Age=0")) {
        cookieValue = "";
        return;
      }

      cookieValue = `${name}=${cookieData}`;
    },
    querySelector(selector) {
      assert.match(selector, /^#/);
      const element = elements.get(selector.slice(1));
      assert.ok(element, `Missing test element for ${selector}`);
      return element;
    },
    createElementNS(_namespace, elementName) {
      return createElement(elementName, false);
    },
  };

  globalThis.btoa = (value) => Buffer.from(value, "binary").toString("base64");
  // The first cycle simulates blocked profile loading; the second switches to successful GraphQL responses for the happy path.
  globalThis.fetch = async (url) => {
    if (url === `${API_BASE_URL}${API_SIGNIN_ENDPOINT}`) {
      return {
        ok: true,
        async json() {
          return "test-token";
        },
      };
    }

    if (url !== `${API_BASE_URL}${API_GRAPHQL_ENDPOINT}`) {
      throw new Error(`Unexpected request: ${url}`);
    }

    // A token may already exist when the profile request fails, so this branch reproduces the rollback path.
    if (profileRequestsFail) {
      throw new Error("blocked by test");
    }

    graphqlRequestCount += 1;

    if (graphqlRequestCount === 1) {
      return {
        ok: true,
        async json() {
          return { data: { user: [{ id: 42, login: "student" }] } };
        },
      };
    }

    return {
      ok: true,
      async json() {
        return {
          data: {
            user: {
              login: "student",
              campus: "athens",
              attrs: {
                firstName: "Test",
                lastName: "Student",
                email: "student@example.com",
              },
            },
          },
        };
      },
    };
  };

  // Install the fakes before importing main.js because module initialization immediately reads the DOM and cookie.
  await import(`../src/main.js?test=${Date.now()}`);

  const loginForm = elements.get("login-form");
  elements.get("login-identifier").value = "student";
  elements.get("login-password").value = "valid-password";

  // This first submit proves a failed profile load returns the UI to a clean logged-out state.
  await loginForm.eventListeners.submit({ preventDefault() {} });

  assert.equal(loginForm.hidden, false, "A failed profile load should show the login form");
  assert.equal(cookieValue, "", "A failed profile load should clear the JWT");
  assert.equal(elements.get("navbar-identity").hidden, true);
  assert.equal(elements.get("navbar-xpLevel").hidden, true);
  assert.equal(elements.get("navbar-audits").hidden, true);
  assert.equal(elements.get("logout-button").hidden, true);

  profileRequestsFail = false;
  graphqlRequestCount = 0;

  // Reusing the form after recovery verifies that a later successful login can establish a fresh session.
  await loginForm.eventListeners.submit({ preventDefault() {} });

  assert.equal(elements.get("navbar-identity").hidden, false);
  assert.equal(elements.get("navbar-identity").disabled, false);
  assert.equal(elements.get("logout-button").hidden, false);
  assert.equal(cookieValue, "jwt=test-token");

  // The logout action must reverse the authenticated UI state and remove the cookie.
  elements.get("logout-button").eventListeners.click({});

  assert.equal(loginForm.hidden, false, "Logout should show the login form");
  assert.equal(cookieValue, "", "Logout should clear the JWT");
  assert.equal(elements.get("navbar-identity").hidden, true);
  assert.equal(elements.get("navbar-xpLevel").hidden, true);
  assert.equal(elements.get("navbar-audits").hidden, true);
  assert.equal(elements.get("logout-button").hidden, true);
  assert.equal(elements.get("identity-section").hidden, true);
  assert.equal(elements.get("xpLevel-section").hidden, true);
  assert.equal(elements.get("audits-section").hidden, true);
} finally {
  globalThis.document = originalDocument;
  globalThis.fetch = originalFetch;
  globalThis.btoa = originalBtoa;
}
