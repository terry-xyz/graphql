import assert from "node:assert/strict";
import { UpdateSectionState } from "../src/config.js";

// createElement provides the small subset of DOM and SVG behaviour that renderer.js needs during tests.
function createElement(id, hidden = true, tagName = "") {
  let textContent = "";

  return {
    id,
    tagName,
    hidden,
    className: "",
    get textContent() {
      return textContent;
    },
    set textContent(value) {
      textContent = String(value);
    },
    value: "",
    attributes: {},
    children: [],
    eventListeners: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    append(...children) {
      this.children.push(...children);
    },
    addEventListener(eventName, listener) {
      this.eventListeners[eventName] = listener;
    },
    replaceChildren(...children) {
      this.children = [...children];
    },
    getBBox() {
      return { width: this.textContent.length * 9 };
    },
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
    ["xp-chart", createElement("xp-chart", false, "svg")],
    ["audits-section", createElement("audits-section", true)],
    ["audits-ratio", createElement("audits-ratio", false)],
    ["audits-xpGiven", createElement("audits-xpGiven", false)],
    ["audits-xpReceived", createElement("audits-xpReceived", false)],
    ["audits-bonusXp", createElement("audits-bonusXp", false)],
    ["audits-warning", createElement("audits-warning", false)],
    ["audits-chart", createElement("audits-chart", false, "svg")],
    ["logout-button", createElement("logout-button", false)],
  ],
);

const originalDocument = globalThis.document;

try {
  // The fake document keeps renderer tests independent from a browser while preserving selector failures.
  globalThis.document = {
    querySelector(selector) {
      assert.match(selector, /^#/);
      const element = elements.get(selector.slice(1));
      assert.ok(element, `Missing test element for ${selector}`);
      return element;
    },
    createElementNS(_namespace, elementName) {
      return createElement("", false, elementName);
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
    // One large gain between small gains creates a predictable bottom and top corner for marker tests.
    xpTransactions: [
      { amount: 10, createdAt: "2026-01-01T00:00:00Z" },
      { amount: 10, createdAt: "2026-01-02T00:00:00Z" },
      { amount: 100, createdAt: "2026-01-03T00:00:00Z" },
      { amount: 10, createdAt: "2026-01-04T00:00:00Z" },
      { amount: 10, createdAt: "2026-01-05T00:00:00Z" },
    ],
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

  // Inspect generated SVG children because marker selection is the chart behaviour under test.
  const xpMarkers = elements.get("xp-chart").children.filter(
    (element) => element.attributes.class === "xp-chart-marker",
  );
  const xpMarkerHitAreas = elements.get("xp-chart").children.filter(
    (element) => element.attributes.class === "xp-chart-marker-hit-area",
  );
  assert.equal(
    xpMarkers.length,
    2,
    "A single sharp rise should mark only its bottom and top corners",
  );
  assert.equal(xpMarkerHitAreas.length, xpMarkers.length);
  assert.ok(
    xpMarkerHitAreas.every((hitArea) => hitArea.attributes.r === "5.4"),
    "Each marker should respond across its full 1.8x hover size",
  );

  const xpTooltip = elements.get("xp-chart").children.find(
    (element) => element.attributes.class === "xp-chart-tooltip",
  );
  assert.ok(xpTooltip, "The XP chart should include a custom SVG tooltip");
  assert.equal(xpTooltip.attributes.visibility, "hidden");
  // Native SVG title elements have delayed browser tooltips, so the chart must use its custom tooltip instead.
  assert.equal(
    xpMarkers.some((marker) =>
      marker.children.some((child) => child.tagName === "title")
    ),
    false,
    "Markers should not use delayed native title tooltips",
  );
  assert.equal(
    xpMarkers.some((marker) =>
      "tabindex" in marker.attributes ||
      "focus" in marker.eventListeners ||
      "blur" in marker.eventListeners
    ),
    false,
    "Chart markers should use mouse interaction only",
  );

  // Entering and leaving the larger invisible hit area should show and hide the tooltip immediately.
  xpMarkerHitAreas[0].eventListeners.mouseenter();
  assert.equal(xpTooltip.attributes.visibility, "visible");
  xpMarkerHitAreas[0].eventListeners.mouseleave();
  assert.equal(xpTooltip.attributes.visibility, "hidden");

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
