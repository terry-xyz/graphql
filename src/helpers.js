// formatXp converts raw XP amounts into shorter units that fit comfortably in text labels and charts.
export function formatXp(amount) {
    if (amount === null || amount === undefined) {
        return "Not available";
    }

    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(2)} MB`;
    }

    if (amount >= 1_000) {
        return `${(amount / 1_000).toFixed(2)} kB`;
    }

    return `${amount} B`;
}

// createSvgElement creates a real SVG node because document.createElement would create an HTML node instead.
export function createSvgElement(elementName) {
    return document.createElementNS(
        "http://www.w3.org/2000/svg",
        elementName
    );
}