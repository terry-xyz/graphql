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
    ["statistics-section", createElement("statistics-section", true)],
    ["audits-ratio", createElement("audits-ratio", false)],
    ["audits-xpGiven", createElement("audits-xpGiven", false)],
    ["audits-xpReceived", createElement("audits-xpReceived", false)],
    ["audits-bonusXp", createElement("audits-bonusXp", false)],
    ["audits-warning", createElement("audits-warning", false)],
    ["audits-chart", createElement("audits-chart", false, "svg")],
    ["results-section", createElement("results-section", true)],
    ["results-date-toggle", createElement("results-date-toggle", false)],
    ["results-list", createElement("results-list", false)],
    ["results-page-size", createElement("results-page-size", false)],
    ["results-page-indicator", createElement("results-page-indicator", false)],
    ["results-previous", createElement("results-previous", false)],
    ["results-next", createElement("results-next", false)],
    ["results-range", createElement("results-range", false)],
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
    // createElement lets renderer tests inspect the HTML result cards without requiring a browser DOM.
    createElement(elementName) {
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
  assert.equal(elements.get("audits-ratio").textContent, "0.7");
  assert.equal(elements.get("audits-xpGiven").textContent, "266.00 kB");
  assert.equal(elements.get("audits-xpReceived").textContent, "360.00 kB");
  assert.equal(elements.get("audits-bonusXp").textContent, "4.10 kB");

  UpdateSectionState("statistics");
  renderDataSection(data);
  assert.equal(elements.get("xpLevel-section").hidden, true);
  assert.equal(elements.get("statistics-section").hidden, false);
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

  UpdateSectionState("xpLevel");
  renderDataSection(data);
  assert.equal(elements.get("statistics-section").hidden, true);
  assert.equal(elements.get("xpLevel-section").hidden, false);
  assert.equal(elements.get("audits-ratio").textContent, "0.7");
  assert.equal(elements.get("audits-xpGiven").textContent, "266.00 kB");
  assert.equal(elements.get("audits-xpReceived").textContent, "360.00 kB");
  assert.equal(elements.get("audits-bonusXp").textContent, "4.10 kB");
  assert.equal(
    elements.get("audits-warning").textContent,
    "Warning: your audit ratio is below 1. Complete more audits to improve it.",
  );
  assert.equal(elements.get("audits-warning").className, "audit-warning");

  // New users may have no level transactions yet, so the XP / Level view must render without indexing an empty array.
  const newUserData = {
    user: {
      login: "new-student",
      campus: "athens",
      attrs: {},
      auditRatio: null,
      totalUp: null,
      totalDown: null,
      totalUpBonus: null,
    },
    xpTotal: {
      aggregate: {
        sum: { amount: null },
        max: { amount: null },
      },
    },
    levelTransactions: [],
    xpTransactions: [],
  };

  UpdateSectionState("xpLevel");
  assert.doesNotThrow(
    () => renderDataSection(newUserData),
    "The XP / Level view should tolerate a user with no level transactions",
  );

  // A user with no XP yet may have null aggregate objects, so rendering must fall back instead of dereferencing null.
  const noXpAggregateData = {
    ...newUserData,
    xpTotal: {
      aggregate: {
        sum: null,
        max: null,
      },
    },
    levelTransactions: [{ amount: 1 }],
  };

  UpdateSectionState("statistics");
  renderDataSection(data);
  UpdateSectionState("xpLevel");
  assert.doesNotThrow(
    () => renderDataSection(noXpAggregateData),
    "The XP / Level view should tolerate missing XP aggregates",
  );

  // Some profiles may not include attrs, so the Identity view must preserve its fallback behavior without dereferencing null.
  const missingAttributesData = {
    ...data,
    user: {
      ...data.user,
      attrs: null,
    },
  };

  UpdateSectionState("xpLevel");
  renderDataSection(data);
  UpdateSectionState("identity");
  assert.doesNotThrow(
    () => renderDataSection(missingAttributesData),
    "The Identity view should tolerate missing user attributes",
  );

  // A missing audit ratio should use the dashboard fallback instead of exposing the calculation's NaN result to the user.
  const missingRatioData = {
    ...data,
    user: {
      ...data.user,
      auditRatio: null,
    },
  };

  UpdateSectionState("xpLevel");
  renderDataSection(missingRatioData);
  assert.equal(
    elements.get("audits-ratio").textContent,
    "Not available",
    "The Audits view should show a fallback when the audit ratio is missing",
  );

  // Missing audit totals should remain readable instead of passing a fallback string into numeric formatting.
  const missingAuditTotalsData = {
    ...data,
    user: {
      ...data.user,
      totalUp: null,
      totalDown: null,
      totalUpBonus: null,
    },
  };

  UpdateSectionState("statistics");
  renderDataSection(data);
  UpdateSectionState("xpLevel");
  renderDataSection(missingAuditTotalsData);
  assert.equal(elements.get("audits-xpGiven").textContent, "Not available");
  assert.equal(elements.get("audits-xpReceived").textContent, "Not available");
  assert.equal(elements.get("audits-bonusXp").textContent, "Not available");

  // Result cards should show the project, derived status, type, and date in that order.
  const resultsData = {
    ...data,
    results: [
      {
        path: "newest/project",
        grade: 0,
        type: "assessment",
        createdAt: "2026-07-30T12:00:00Z",
      },
      {
        path: "older/project",
        grade: 1,
        type: "assessment",
        createdAt: "2026-07-29T12:00:00Z",
      },
    ],
  };

  UpdateSectionState("results");
  renderDataSection(resultsData);

  assert.equal(elements.get("results-section").hidden, false);
  assert.equal(elements.get("results-page-size").value, "1");
  assert.equal(
    elements.get("results-page-indicator").textContent,
    "Page 1 of 2",
  );
  assert.equal(
    elements.get("results-range").textContent,
    "Showing 1 of 2",
  );
  assert.equal(elements.get("results-previous").disabled, true);
  assert.equal(elements.get("results-next").disabled, false);

  const firstItem = elements.get("results-list").children[0];
  assert.equal(firstItem.children[0].textContent, "30th July 2026");
  assert.equal(firstItem.children[0].attributes.datetime, "2026-07-30T12:00:00Z");
  assert.equal(firstItem.children[1].textContent, "Project: newest/project");
  assert.equal(firstItem.children[2].textContent, "Failed");
  assert.equal(firstItem.children[3].textContent, "Type: assessment");
  assert.equal(elements.get("results-date-toggle").textContent, "Show timestamps");

  elements.get("results-date-toggle").eventListeners.click();

  const timestampItem = elements.get("results-list").children[0];
  assert.equal(timestampItem.children[0].textContent, "2026-07-30T12:00:00Z");
  assert.equal(elements.get("results-date-toggle").textContent, "Show dates");

  elements.get("results-date-toggle").eventListeners.click();
  elements.get("results-next").eventListeners.click();

  const secondItem = elements.get("results-list").children[0];
  assert.equal(secondItem.children[0].textContent, "29th July 2026");
  assert.equal(secondItem.children[1].textContent, "Project: older/project");
  assert.equal(secondItem.children[2].textContent, "Passed");
  assert.equal(
    elements.get("results-page-indicator").textContent,
    "Page 2 of 2",
  );
  assert.equal(
    elements.get("results-range").textContent,
    "Showing 2 of 2",
  );
  assert.equal(elements.get("results-previous").disabled, false);
  assert.equal(elements.get("results-next").disabled, true);

  elements.get("results-page-size").value = "5";
  elements.get("results-page-size").eventListeners.change();

  assert.equal(elements.get("results-list").children.length, 2);
  assert.equal(
    elements.get("results-page-indicator").textContent,
    "Page 1 of 1",
  );
  assert.equal(
    elements.get("results-range").textContent,
    "Showing 2 of 2",
  );
  assert.equal(elements.get("results-previous").disabled, true);
  assert.equal(elements.get("results-next").disabled, true);

  const emptyResultsData = { ...resultsData, results: [] };
  renderDataSection(emptyResultsData);

  assert.equal(elements.get("results-list").children.length, 0);
  assert.equal(
    elements.get("results-page-indicator").textContent,
    "Page 1 of 1",
  );
  assert.equal(
    elements.get("results-range").textContent,
    "Showing 0 of 0",
  );
  assert.equal(elements.get("results-date-toggle").textContent, "Show timestamps");
  assert.equal(elements.get("results-previous").disabled, true);
  assert.equal(elements.get("results-next").disabled, true);
} finally {
  globalThis.document = originalDocument;
}
