const COOKIE_NAME = "jwt";

// HTTP localhost development cannot use Secure, so add it only when the page is served over HTTPS.
const secureAttribute =
    globalThis.location?.protocol === "https:" ? "; Secure" : "";

// saveToken stores the JWT for 24 hours and protects its transport whenever HTTPS is available.
export function saveToken(token) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}${secureAttribute}; Max-Age=86400; Path=/; SameSite=Strict`;
}

// getToken reads and decodes the JWT cookie, returning null when the browser has no matching cookie.
export function getToken() {
    const cookie = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.slice(`${COOKIE_NAME}=`.length));
}

// clearToken removes the JWT by replacing it with an immediately expired cookie at the same path.
export function clearToken() {
    document.cookie =
        `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Strict`;
}
