import { API_BASE_URL, API_GRAPHQL_ENDPOINT } from "./config.js";

export async function graphqlRequest(query, variables) {
    const token = localStorage.getItem("jwt");

    const response = await fetch(`${API_BASE_URL}${API_GRAPHQL_ENDPOINT}`, {
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

    const result = await response.json();
    return result.data;
};