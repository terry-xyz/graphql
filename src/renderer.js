import { renderAuditsChart, renderXpChart } from "./charts.js";
import { CURRENT_SECTION, PREVIOUS_SECTION } from "./config.js";
import { formatXp } from "./helpers.js";

// get html elements
const IdentitySection = document.querySelector("#identity-section");
const IdentityFirstName = document.querySelector("#identity-firstName");
const IdentityLastName = document.querySelector("#identity-lastName");
const IdentityLogin = document.querySelector("#identity-login");
const IdentityEmail = document.querySelector("#identity-email");
const IdentityCampus = document.querySelector("#identity-campus");

const XpLevelSection = document.querySelector("#xpLevel-section");
const XpLevelTotalXp = document.querySelector("#xpLevel-totalXp");
const XpLevelCurrentMaxLevel = document.querySelector("#xpLevel-currentMaxLevel");
const XpLevelBiggestXpGain = document.querySelector("#xpLevel-biggestXpGain");
const XpChart = document.querySelector("#xp-chart");
const StatisticsSection = document.querySelector("#statistics-section");

const AuditsRatio = document.querySelector("#audits-ratio");
const AuditsXpGiven = document.querySelector("#audits-xpGiven");
const AuditsXpReceived = document.querySelector("#audits-xpReceived");
const AuditsBonusXp = document.querySelector("#audits-bonusXp");
const AuditsWarning = document.querySelector("#audits-warning");
const AuditsChart = document.querySelector("#audits-chart");

const ResultsSection = document.querySelector("#results-section");
const ResultsDateToggle = document.querySelector("#results-date-toggle");
const ResultsList = document.querySelector("#results-list");
const ResultsPageSize = document.querySelector("#results-page-size");
const ResultsPageIndicator = document.querySelector("#results-page-indicator");
const ResultsPrevious = document.querySelector("#results-previous");
const ResultsNext = document.querySelector("#results-next");
const ResultsRange = document.querySelector("#results-range");

// Result view state stays separate from fetched data so paging and date display can rerender without another API request.
let showingResultTimestamps = false;
let currentResults = [];
let currentResultsPage = 1;

// handleResultsDateToggle rerenders every visible result so the selected date representation stays consistent across the page.
function handleResultsDateToggle() {
    showingResultTimestamps = !showingResultTimestamps;
    renderResultsPage();
}

ResultsDateToggle.addEventListener("click", handleResultsDateToggle);

// handlePreviousResultsPage moves backward through the already-fetched result list without changing its order.
function handlePreviousResultsPage() {
    currentResultsPage -= 1;
    renderResultsPage();
}

ResultsPrevious.addEventListener("click", handlePreviousResultsPage);

// handleNextResultsPage moves forward through the already-fetched result list without changing its order.
function handleNextResultsPage() {
    currentResultsPage += 1;
    renderResultsPage();
}

ResultsNext.addEventListener("click", handleNextResultsPage);

// handleResultsPageSizeChange returns to page one because the old page may not exist after the page size changes.
function handleResultsPageSizeChange() {
    currentResultsPage = 1;
    renderResultsPage();
}

ResultsPageSize.addEventListener("change", handleResultsPageSizeChange);

// renderDataSection hides the previous page section and renders the section selected from the navbar.
export function renderDataSection(data, section = CURRENT_SECTION) {
    if (!data) {
        IdentitySection.hidden = true;
        XpLevelSection.hidden = true;
        StatisticsSection.hidden = true;
        ResultsSection.hidden = true;
        return;
    }

    if (PREVIOUS_SECTION !== "") {
        // Section IDs follow the "name-section" pattern, so the stored name can find the previous section.
        document.querySelector(`#${PREVIOUS_SECTION}-section`).hidden = true;
    }

    switch (section) {
        case "identity":
            renderIdentitySection(data);
            break;
        case "xpLevel":
            renderXpLevelSection(data);
            break;
        case "audits":
            renderXpLevelSection(data);
            break;
        case "statistics":
            renderStatisticsSection(data);
            break;
        case "results":
            renderResultsSection(data);
            break;
    };
};

// renderXpLevelSection displays XP and audit summaries together as the combined required data section.
function renderXpLevelSection(data) {
    if (XpLevelSection.hidden === false) {
        XpLevelSection.hidden = true;
        return;
    }

    XpLevelSection.hidden = false;
    // These paths match the aliases and nested fields requested by maxIdentityDataQuery in config.js.
    XpLevelTotalXp.textContent = data.xpTotal.aggregate.sum?.amount ?? "Not available";
    XpLevelCurrentMaxLevel.textContent = data.levelTransactions[0]?.amount ?? "Not available";
    XpLevelBiggestXpGain.textContent = data.xpTotal.aggregate.max?.amount ?? "Not available";

    renderAuditSummary(data);
}

// renderIdentitySection displays the logged-in student's profile fields returned by the GraphQL user query.
function renderIdentitySection(data) {
    if (IdentitySection.hidden === false) {
        IdentitySection.hidden = true;
        return;
    }

    IdentitySection.hidden = false;
    IdentityFirstName.textContent = data.user.attrs?.firstName ?? "Not available";
    IdentityLastName.textContent = data.user.attrs?.lastName ?? "Not available";
    IdentityLogin.textContent = data.user.login ?? "Not available";
    IdentityEmail.textContent = data.user.attrs?.email ?? "Not available";
    IdentityCampus.textContent = data.user.campus ?? "Not available";
};

// renderAuditSummary displays audit totals and warns when the returned ratio is below one.
function renderAuditSummary(data) {
    const ratio = Number(data.user.auditRatio);

    AuditsRatio.textContent =
        Number.isFinite(ratio) && data.user.auditRatio != null
            ? ratio.toFixed(1)
            : "Not available";
    AuditsXpGiven.textContent = formatXp(data.user.totalUp);
    AuditsXpReceived.textContent = formatXp(data.user.totalDown);
    AuditsBonusXp.textContent = formatXp(data.user.totalUpBonus);

    // A ratio below 1 means the student has received more audit value than they have given back.
    if (ratio < 1) {
        AuditsWarning.textContent =
            "Warning: your audit ratio is below 1. Complete more audits to improve it.";

        AuditsWarning.className = "audit-warning";
    } else {
        AuditsWarning.textContent =
            "Your audit ratio is in a healthy range.";

        AuditsWarning.className = "audit-success";
    }

}

// renderStatisticsSection places both SVG visualizations together in the dedicated fourth section.
function renderStatisticsSection(data) {
    StatisticsSection.hidden = false;
    renderXpChart(XpChart, data.xpTransactions);
    renderAuditsChart(AuditsChart, data.user.totalUp, data.user.totalDown);
}

// renderResultsSection resets view-only state so a newly selected profile always starts with its complete result list.
function renderResultsSection(data) {
    ResultsSection.hidden = false;

    currentResults = data.results ?? [];
    currentResultsPage = 1;
    showingResultTimestamps = false;
    renderResultsPage();
}

// ordinalSuffix returns the grammatical day ending while preserving the special 11th–13th cases.
function ordinalSuffix(day) {
    if (day % 100 >= 11 && day % 100 <= 13) {
        return "th";
    }

    return { 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th";
}

// formatResultDate converts an API timestamp into the UTC date format shown in each result card.
function formatResultDate(timestamp) {
    if (timestamp == null) {
        return "Not available";
    }

    const date = new Date(timestamp);
    const day = date.getUTCDate();
    const month = new Intl.DateTimeFormat("en-GB", {
        month: "long",
        timeZone: "UTC",
    }).format(date);
    const year = date.getUTCFullYear();

    return `${day}${ordinalSuffix(day)} ${month} ${year}`;
}

// renderResultsPage slices the fetched results and synchronizes the list, range, controls, and pagination state.
function renderResultsPage() {
    const pageSize = Number(ResultsPageSize.value) || 1;
    const totalPages = Math.max(
        1,
        Math.ceil(currentResults.length / pageSize),
    );

    currentResultsPage = Math.min(
        Math.max(currentResultsPage, 1),
        totalPages,
    );

    const startIndex = (currentResultsPage - 1) * pageSize;
    const visibleResults = currentResults.slice(
        startIndex,
        startIndex + pageSize,
    );

    ResultsPageSize.value = String(pageSize);
    ResultsList.replaceChildren(
        ...visibleResults.map((result) => renderResultItem(result)),
    );

    ResultsPageIndicator.textContent =
        `Page ${currentResultsPage} of ${totalPages}`;
    ResultsRange.textContent =
        `Showing ${startIndex + visibleResults.length} of ${currentResults.length}`;
    ResultsDateToggle.textContent = showingResultTimestamps
        ? "Show dates"
        : "Show timestamps";

    ResultsPrevious.disabled = currentResultsPage === 1;
    ResultsNext.disabled = currentResultsPage === totalPages;
}

// renderResultItem maps one GraphQL result into separate accessible DOM elements so CSS can lay out each field independently.
function renderResultItem(result) {
    const item = document.createElement("li");
    item.className = "results-item";

    const date = document.createElement("time");
    date.className = "results-item-date";
    if (result.createdAt != null) {
        date.setAttribute("datetime", result.createdAt);
    }
    date.textContent = showingResultTimestamps
        ? result.createdAt ?? "Date not available"
        : formatResultDate(result.createdAt);

    const project = document.createElement("strong");
    project.className = "results-item-project";
    project.textContent = `Project: ${result.path ?? "Project not available"}`;

    const status = document.createElement("span");
    status.className =
        result.grade >= 1
            ? "results-item-status results-item-status-passed"
            : "results-item-status results-item-status-failed";
    status.textContent = result.grade >= 1 ? "Passed" : "Failed";

    const type = document.createElement("span");
    type.className = "results-item-type";
    type.textContent = `Type: ${result.type ?? "Not available"}`;

    item.append(date, project, status, type);
    return item;
}
