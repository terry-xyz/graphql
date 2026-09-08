const COOKIE_NAME = "jwt";

export function saveToken(token) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=86400; Path=/; SameSite=Strict`;
}

export function getToken() {
    const cookie = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.slice(`${COOKIE_NAME}=`.length),
    );
}

export function clearToken() {
    document.cookie =
        `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Strict`;
}
