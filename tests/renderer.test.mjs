import assert from "node:assert/strict";
import { UpdateSectionState } from "../src/config.js";

function createElement(id, hidden = true) {
  return {
    id,
    hidden,
    className: "",
    textContent: "",
    value: "",
  };
}

const elements = new Map(
  [
    ["login-form", createElement("login-form", false)],
    ["login-identifier", createElement("login-identifier", false)],
    ["login-password", createElement("login-password", false)],
    ["login-feedback", createElement("login-feedback", false)],
    ["identity-section", createElement("identity-section", true)],
    ["identity-firstName", createElement("identity-firstName", false)],
    ["identity-lastName", createElement("identity-lastName", false)],
    ["identity-login", createElement("identity-login", false)],
    ["identity-email", createElement("identity-email", false)],
    ["identity-campus", createElement("identity-campus", false)],
    ["xpLevel-section", createElement("xpLevel-section", true)],
    ["xpLevel-totalXp", createElement("xpLevel-totalXp", false)],
    ["xpLevel-currentMaxLevel", createElement("xpLevel-currentMaxLevel", false)],
    ["xpLevel-biggestXpGain", createElement("xpLevel-biggestXpGain", false)],
    ["audits-section", createElement("audits-section", true)],
    ["audits-ratio", createElement("audits-ratio", false)],
    ["audits-xpGiven", createElement("audits-xpGiven", false)],
    ["audits-xpReceived", createElement("audits-xpReceived", false)],
    ["audits-bonusXp", createElement("audits-bonusXp", false)],
    ["audits-warning", createElement("audits-warning", false)],
    ["logout-button", createElement("logout-button", false)],
  ],
);

const originalDocument = globalThis.document;

try {
  globalThis.document = {
    querySelector(selector) {
      assert.match(selector, /^#/);
      const element = elements.get(selector.slice(1));
      assert.ok(element, `Missing test element for ${selector}`);
      return element;
    },
  };

  const { renderDataSection } = await import(`../src/renderer.js?test=${Date.now()}`);

  const data = {
    user: {
      login: "ckotsalas",
      campus: "athens",
      auditRatio: 0.7,
      totalUp: 266000,
      totalDown: 360000,
      totalUpBonus: 4100,
      attrs: {
        firstName: "Christophoros",
        lastName: "Kotsalas",
        email: "student@example.com",
      },
    },
    xpTotal: {
      aggregate: {
        sum: { amount: 1815857 },
        max: { amount: 76250 },
      },
    },
    levelTransactions: [{ amount: 32 }],
  };

  renderDataSection(data);

  assert.equal(elements.get("identity-section").hidden, false);
  assert.equal(elements.get("identity-firstName").textContent, "Christophoros");
  assert.equal(elements.get("identity-lastName").textContent, "Kotsalas");
  assert.equal(elements.get("identity-login").textContent, "ckotsalas");
  assert.equal(elements.get("identity-email").textContent, "student@example.com");
  assert.equal(elements.get("identity-campus").textContent, "athens");

  UpdateSectionState("xpLevel");
  renderDataSection(data);

  assert.equal(elements.get("identity-section").hidden, true);
  assert.equal(elements.get("xpLevel-section").hidden, false);
  assert.equal(elements.get("xpLevel-totalXp").textContent, "1815857");
  assert.equal(elements.get("xpLevel-currentMaxLevel").textContent, "32");
  assert.equal(elements.get("xpLevel-biggestXpGain").textContent, "76250");

  UpdateSectionState("audits");
  renderDataSection(data);

  assert.equal(elements.get("xpLevel-section").hidden, true);
  assert.equal(elements.get("audits-section").hidden, false);
  assert.equal(elements.get("audits-ratio").textContent, "0.7");
  assert.equal(elements.get("audits-xpGiven").textContent, "266.00 kB");
  assert.equal(elements.get("audits-xpReceived").textContent, "360.00 kB");
  assert.equal(elements.get("audits-bonusXp").textContent, "4.10 kB");
  assert.equal(
    elements.get("audits-warning").textContent,
    "Warning: your audit ratio is below 1. Complete more audits to improve it.",
  );
  assert.equal(elements.get("audits-warning").className, "audit-warning");
} finally {
  globalThis.document = originalDocument;
}
