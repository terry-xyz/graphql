import { renderAuditsChart, renderXpChart } from "./charts.js";
import { CURRENT_SECTION, PREVIOUS_SECTION } from "./config.js";
import { formatXp } from "./helpers.js";

// get html elements
const LogInForm = document.querySelector("#login-form");
const LogInIdentifier = document.querySelector("#login-identifier");
const LogInPassword = document.querySelector("#login-password");
const LogInFeedback = document.querySelector("#login-feedback");

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

const AuditsSection = document.querySelector("#audits-section");
const AuditsRatio = document.querySelector("#audits-ratio");
const AuditsXpGiven = document.querySelector("#audits-xpGiven");
const AuditsXpReceived = document.querySelector("#audits-xpReceived");
const AuditsBonusXp = document.querySelector("#audits-bonusXp");
const AuditsWarning = document.querySelector("#audits-warning");
const AuditsChart = document.querySelector("#audits-chart");

const LogoutButton = document.querySelector("#logout-button");

// renderDataSection hides the previous page section and renders the section selected from the navbar.
export function renderDataSection(data, section = CURRENT_SECTION) {
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
            renderAuditsSection(data);
            break;
    };
};

// renderXpLevelSection displays XP summary fields and passes the API transaction history to the line chart.
function renderXpLevelSection(data) {
    if (XpLevelSection.hidden === false) {
        XpLevelSection.hidden = true;
        return;
    }

    XpLevelSection.hidden = false;
    // These paths match the aliases and nested fields requested by maxIdentityDataQuery in config.js.
    XpLevelTotalXp.textContent = data.xpTotal.aggregate.sum.amount ?? "Not available";
    XpLevelCurrentMaxLevel.textContent = data.levelTransactions[0].amount ?? "Not available";
    XpLevelBiggestXpGain.textContent = data.xpTotal.aggregate.max.amount ?? "Not available";

    renderXpChart(XpChart, data.xpTransactions);
}

// renderIdentitySection displays the logged-in student's profile fields returned by the GraphQL user query.
function renderIdentitySection(data) {
    if (IdentitySection.hidden === false) {
        IdentitySection.hidden = true;
        return;
    }

    IdentitySection.hidden = false;
    IdentityFirstName.textContent = data.user.attrs.firstName ?? "Not available";
    IdentityLastName.textContent = data.user.attrs.lastName ?? "Not available";
    IdentityLogin.textContent = data.user.login ?? "Not available";
    IdentityEmail.textContent = data.user.attrs.email ?? "Not available";
    IdentityCampus.textContent = data.user.campus ?? "Not available";
};

// renderAuditsSection displays audit totals, warns about low ratios, and draws their comparison chart.
function renderAuditsSection(data) {
    AuditsSection.hidden = false;

    const ratio = Number(`${data.user.auditRatio}`)

    AuditsRatio.textContent = ratio.toFixed(1) ?? "Not available";
    AuditsXpGiven.textContent = formatXp(data.user.totalUp ?? "Not available");
    AuditsXpReceived.textContent = formatXp(data.user.totalDown ?? "Not available");
    AuditsBonusXp.textContent = formatXp(data.user.totalUpBonus ?? "Not available");

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

    renderAuditsChart(AuditsChart, data.user.totalUp, data.user.totalDown);
}
