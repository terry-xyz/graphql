import { API_BASE_URL, API_SIGNIN_ENDPOINT } from "./config.js";

export async function signIn(identifier, password) {
    const credentials = `${identifier}:${password}`;
    const encodedCredentials = btoa(credentials);

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${API_SIGNIN_ENDPOINT}`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${encodedCredentials}`,
            },
        });
    } catch {
        throw new Error("Unable to reach the Zone01 authentication service");
    }

    if (!response.ok) {
        throw new Error("Invalid username/email or password");
    }

    try {
        return await response.json();
    } catch {
        throw new Error("The authentication service returned an invalid response");
    }
};
