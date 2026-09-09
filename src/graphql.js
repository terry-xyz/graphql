import { API_BASE_URL, API_GRAPHQL_ENDPOINT } from "./config.js";
import { getToken, clearToken } from "./session.js";

export async function graphqlRequest(query, variables) {
    const token = getToken();

    if (!token) {
        throw new Error("Your session has expired. Please log in again.");
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${API_GRAPHQL_ENDPOINT}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });
    } catch {
        throw new Error("Unable to reach the Zone01 GraphQL service");
    }

    let result;

    if (response.status === 401 || response.status === 403) {
        clearToken();
        throw new Error("Your session has expired. Please log in again.");
    }

    try {
        result = await response.json();
    } catch {
        throw new Error("The Zone01 GraphQL service returned an invalid response");
    }

    if (!response.ok) {
        throw new Error("The Zone01 GraphQL service rejected the request");
    }

    if (result.errors?.length) {
        throw new Error(result.errors[0].message || "The GraphQL request failed");
    }

    return result.data;
};
