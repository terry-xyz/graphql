import { signIn } from "./auth.js";
import { initializeSpotlightBackground } from "./background.js";
import { basicQuery, maxIdentityDataQuery, UpdateSectionState } from "./config.js";
import { graphqlRequest } from "./graphql.js";
import { renderDataSection } from "./renderer.js";
import { saveToken, getToken, clearToken } from "./session.js";

const NavbarResults = document.querySelector("#navbar-results");
const NavbarIdentity = document.querySelector("#navbar-identity");
const NavbarXpLevel = document.querySelector("#navbar-xpLevel");
const NavbarAudits = document.querySelector("#navbar-audits");

const LogInForm = document.querySelector("#login-form");
const LogInIdentifier = document.querySelector("#login-identifier");
const LogInPassword = document.querySelector("#login-password");
const LogInFeedback = document.querySelector("#login-feedback");
const LogoutButton = document.querySelector("#logout-button");

let maxIdentityData = null;

initializeSpotlightBackground();

// Profile navigation and logout depend on loaded profile data, so keep them together for the loading gate.
const profileControls = [
    NavbarIdentity,
    NavbarXpLevel,
    NavbarAudits,
    NavbarResults,
    LogoutButton,
];

// setProfileControlsDisabled prevents actions from reading incomplete profile data during API requests.
function setProfileControlsDisabled(disabled) {
    for (const control of profileControls) {
        control.disabled = disabled;
    }
}

// setProfileControlsVisible hides authenticated navigation until the profile request has supplied data for it.
function setProfileControlsVisible(visible) {
    for (const control of profileControls) {
        control.hidden = !visible;
    }
}

// The profile starts empty, so controls must wait until loadProfile has populated maxIdentityData.
setProfileControlsDisabled(true);
setProfileControlsVisible(false);

// loadProfile fetches the basic identity and extended profile data, then enables controls after rendering it.
async function loadProfile() {
    const basicData = await graphqlRequest(basicQuery);
    const user = basicData.user[0];

    maxIdentityData = await graphqlRequest(maxIdentityDataQuery, {
        userId: user.id,
    });

    renderDataSection(maxIdentityData);

    // Rendering comes first so an enabled control always has the data it needs.
    setProfileControlsDisabled(false);
    setProfileControlsVisible(true);
}

// handleLoginSubmit authenticates the form and loads profile data so the UI never treats a token alone as a complete session.
async function handleLoginSubmit(e) {
    e.preventDefault();

    const identifier = LogInIdentifier.value.trim();
    const password = LogInPassword.value;

    if (identifier === "" || password === "") {
        LogInFeedback.textContent = "None of the two fields should be empty!";
        return;
    }
    if (password.length < 8) {
        LogInFeedback.textContent = "Password should not be shorter than 8 characters!";
        return;
    }

    try {
        LogInFeedback.textContent = "Logging In..."

        const token = await signIn(identifier, password);

        saveToken(token);

        LogInForm.hidden = true;
        LogInFeedback.textContent = "Logged in successfully!";

        await loadProfile();
    } catch (error) {
        handleProfileLoadFailure(error);
    }
}

LogInForm.addEventListener("submit", handleLoginSubmit);

// handleProfileLoadFailure removes an unusable session and restores the login form when profile loading fails.
function handleProfileLoadFailure(error) {
    clearToken();
    LogInForm.hidden = false;
    LogInFeedback.textContent = error.message;
}

// handleLogout clears both the stored session and rendered profile state so a logged-out user cannot reuse stale data.
function handleLogout() {
    clearToken();
    maxIdentityData = null;
    setProfileControlsDisabled(true);
    setProfileControlsVisible(false);

    renderDataSection();

    LogInIdentifier.value = "";
    LogInPassword.value = "";
    LogInFeedback.textContent = "";
    LogInForm.hidden = false;
}

LogoutButton.addEventListener("click", handleLogout);

// handleIdentityNavigation selects the identity view while reusing the profile fetched during login.
function handleIdentityNavigation() {
    UpdateSectionState("identity");

    renderDataSection(maxIdentityData);
}

NavbarIdentity.addEventListener("click", handleIdentityNavigation);

// handleXpLevelNavigation selects the XP view while reusing the profile fetched during login.
function handleXpLevelNavigation() {
    UpdateSectionState("xpLevel");

    renderDataSection(maxIdentityData);
}

NavbarXpLevel.addEventListener("click", handleXpLevelNavigation);

// handleAuditsNavigation selects the audits view while reusing the profile fetched during login.
function handleAuditsNavigation() {
    UpdateSectionState("audits");

    renderDataSection(maxIdentityData);
}

NavbarAudits.addEventListener("click", handleAuditsNavigation);

// handleResultsNavigation selects the Results view while reusing the profile fetched during login.
function handleResultsNavigation() {
    UpdateSectionState("results");
    renderDataSection(maxIdentityData);
}

NavbarResults.addEventListener("click", handleResultsNavigation);

if (getToken()) {
    LogInForm.hidden = true;

    loadProfile().catch(handleProfileLoadFailure);
}
