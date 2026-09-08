import { signIn } from "./auth.js";
import { basicQuery, maxIdentityDataQuery, UpdateSectionState } from "./config.js";
import { graphqlRequest } from "./graphql.js";
import { renderDataSection } from "./renderer.js";
import { saveToken, getToken, clearToken } from "./session.js";

const NavbarIdentity = document.querySelector("#navbar-identity");
const NavbarXpLevel = document.querySelector("#navbar-xpLevel");
const NavbarAudits = document.querySelector("#navbar-audits");

const LogInForm = document.querySelector("#login-form");
const LogInIdentifier = document.querySelector("#login-identifier");
const LogInPassword = document.querySelector("#login-password");
const LogInFeedback = document.querySelector("#login-feedback");
const LogoutButton = document.querySelector("#logout-button");

let maxIdentityData = null;

// Profile navigation and logout depend on loaded profile data, so keep them together for the loading gate.
const profileControls = [
    NavbarIdentity,
    NavbarXpLevel,
    NavbarAudits,
    LogoutButton,
];

// setProfileControlsDisabled prevents actions from reading incomplete profile data during API requests.
function setProfileControlsDisabled(disabled) {
    for (const control of profileControls) {
        control.disabled = disabled;
    }
}

// The profile starts empty, so controls must wait until loadProfile has populated maxIdentityData.
setProfileControlsDisabled(true);

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
}

// log-in process
LogInForm.addEventListener("submit", async e => {
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
        LogInFeedback.textContent = error.message;
    }
});

// log-out process
LogoutButton.addEventListener("click", e => {
    clearToken();

    renderDataSection();

    LogInIdentifier.value = "";
    LogInPassword.value = "";
    LogInFeedback.textContent = "";
    LogInForm.hidden = false;
});

NavbarIdentity.addEventListener("click", e => {
    UpdateSectionState("identity");

    renderDataSection(maxIdentityData);
});

NavbarXpLevel.addEventListener("click", e => {
    UpdateSectionState("xpLevel");

    renderDataSection(maxIdentityData);
});

NavbarAudits.addEventListener("click", () => {
    UpdateSectionState("audits");

    renderDataSection(maxIdentityData);
});

if (getToken()) {
    LogInForm.hidden = true;

    loadProfile().catch((error) => {
        clearToken();
        LogInForm.hidden = false;
        LogInFeedback.textContent = error.message;
    });
}
