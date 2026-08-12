import { CURRENT_SECTION, PREVIOUS_SECTION } from "./config.js";

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

const LogoutButton = document.querySelector("#logout-button");

export function renderDataSection(data, section = CURRENT_SECTION) {
    if (PREVIOUS_SECTION !== "") {
        document.querySelector(`#${PREVIOUS_SECTION}-section`).hidden = true;
    }

    switch (section) {
        case "identity":
            renderIdentitySection(data);
            break;
        case "xpLevel":
            renderXpLevelSection(data);
            break;
    };
};

function renderXpLevelSection(data) {
    if (XpLevelSection.hidden === false) {
        XpLevelSection.hidden = true;
        return;
    }

    XpLevelSection.hidden = false;
    XpLevelTotalXp.textContent = `${data.xpTotal.aggregate.sum.amount}`;
    XpLevelCurrentMaxLevel.textContent = `${data.levelTransactions[0].amount}`;
    XpLevelBiggestXpGain.textContent = `${data.xpTotal.aggregate.max.amount}`;
}

function renderIdentitySection(data) {
    if (IdentitySection.hidden === false) {
        IdentitySection.hidden = true;
        return;
    }

    IdentitySection.hidden = false;
    IdentityFirstName.textContent = `${data.user.attrs.firstName}`;
    IdentityLastName.textContent = `${data.user.attrs.lastName}`;
    IdentityLogin.textContent = `${data.user.login}`;
    IdentityEmail.textContent = `${data.user.attrs.email}`;
    IdentityCampus.textContent = `${data.user.campus}`;
};
