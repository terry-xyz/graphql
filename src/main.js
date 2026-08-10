import { signIn } from "./auth.js";
import { graphqlRequest } from "./graphql.js";

const basicQuery = `
    {
        user {
            id
            login
        }
    }
`

const LogInForm = document.querySelector("#login-form");
const LogInIdentifier = document.querySelector(".login-identifier");
const LogInPassword = document.querySelector(".login-password");
const LogInFeedback = document.querySelector(".login-feedback");

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

        localStorage.setItem("jwt", token);

        LogInFeedback.textContent = "Logged in successfully!";

        const data = await graphqlRequest(basicQuery);
        console.log(data)
    } catch (error) {
        LogInFeedback.textContent = error.message;
    }
});
