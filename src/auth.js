import { API_BASE_URL, API_SIGNIN_ENDPOINT } from "./config.js";

export async function signIn(identifier, password) {
    const credentials = `${identifier}:${password}`;
    const encodedCredentials = btoa(credentials);

    const response = await fetch(`${API_BASE_URL}${API_SIGNIN_ENDPOINT}`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${encodedCredentials}`,
        },
    });

    if (!response.ok) {
        throw new Error("Invalid username/email or password");
    }

    const token = await response.json();
    return token;
};