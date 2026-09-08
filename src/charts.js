import { createSvgElement } from "./helpers.js";

// renderXpChart turns chronological XP transactions into a cumulative, interactive SVG line chart.
export function renderXpChart(transactions) {
    // The section can be opened repeatedly, so remove the previous drawing before rebuilding it.
    XpChart.replaceChildren();

    if (!transactions || transactions.length === 0) {
        return;
    }

    let cumulativeXp = 0;

    // Each API amount is one gain; adding gains in date order produces the student's total XP over time.
    const points = transactions.map((transaction) => {
        const gain = Number(transaction.amount) || 0;
        cumulativeXp += gain;

        return {
            xp: cumulativeXp,
            gain,
            date: new Date(transaction.createdAt)
        };
    });

    // These dimensions match viewBox="0 0 600 300" in index.html, not the SVG's displayed pixel size.
    const chartWidth = 600;
    const chartHeight = 300;

    const padding = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 70
    };

    // Padding reserves room for the axes and their labels, leaving this smaller rectangle for the data line.
    const plotWidth =
        chartWidth - padding.left - padding.right;

    const plotHeight =
        chartHeight - padding.top - padding.bottom;

    // A minimum of 1 prevents division by zero when every transaction amount is zero.
    const maximumXp = Math.max(
        ...points.map((point) => point.xp),
        1
    );

    // Transaction indexes spread points left-to-right, while XP values scale bottom-to-top within the plot.
    const coordinates = points.map((point, index) => {
        const x =
            padding.left +
            (index / Math.max(points.length - 1, 1)) * plotWidth;

        // SVG y coordinates grow downward, so subtracting scaled XP makes larger totals appear higher.
        const y =
            padding.top +
            plotHeight -
            (point.xp / maximumXp) * plotHeight;

        return {
            ...point,
            x,
            y
        };
    });

    // A polyline expects one string such as "70,260 200,180 580,20" rather than JavaScript objects.
    const linePoints = coordinates
        .map((point) => `${point.x},${point.y}`)
        .join(" ");

    const progressionLine = createSvgElement("polyline");

    progressionLine.setAttribute("points", linePoints);
    progressionLine.setAttribute("class", "xp-chart-line");

    // Deriving both axis endpoints from padding keeps them aligned if the chart spacing changes later.
    const plotBottom = padding.top + plotHeight;
    const plotRight = padding.left + plotWidth;

    const xAxis = createSvgElement("line");

    xAxis.setAttribute("x1", padding.left);
    xAxis.setAttribute("y1", plotBottom);
    xAxis.setAttribute("x2", plotRight);
    xAxis.setAttribute("y2", plotBottom);
    xAxis.setAttribute("class", "xp-chart-axis");

    const yAxis = createSvgElement("line");

    yAxis.setAttribute("x1", padding.left);
    yAxis.setAttribute("y1", padding.top);
    yAxis.setAttribute("x2", padding.left);
    yAxis.setAttribute("y2", plotBottom);
    yAxis.setAttribute("class", "xp-chart-axis");

    const yGuideElements = [];
    const yLevels = [0, 0.5, 1];

    // Fractions 0, 0.5, and 1 create bottom, middle, and top guides using the same XP scale as the line.
    yLevels.forEach((level) => {
        const y = plotBottom - level * plotHeight;
        const xpValue = maximumXp * level;

        const guideLine = createSvgElement("line");

        guideLine.setAttribute("x1", padding.left);
        guideLine.setAttribute("y1", y);
        guideLine.setAttribute("x2", plotRight);
        guideLine.setAttribute("y2", y);
        guideLine.setAttribute("class", "xp-chart-guide");

        const label = createSvgElement("text");

        label.setAttribute("x", padding.left - 10);
        label.setAttribute("y", y);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("dominant-baseline", "middle");
        label.setAttribute("class", "xp-chart-label");
        label.textContent = formatXp(xpValue);

        yGuideElements.push(guideLine, label);
    });

    // Showing only the first and last dates keeps a timeline with hundreds of transactions readable.
    const datePositions = coordinates.length === 1
        ? [
            {
                point: coordinates[0],
                textAnchor: "start"
            }
        ]
        : [
            {
                point: coordinates[0],
                textAnchor: "start"
            },
            {
                point: coordinates[coordinates.length - 1],
                textAnchor: "end"
            }
        ];

    // Each date label uses its point's horizontal position so it lines up with the time range it describes.
    const dateLabels = datePositions.map(({ point, textAnchor }) => {
        const label = createSvgElement("text");

        label.setAttribute("x", point.x);
        label.setAttribute("y", plotBottom + 25);
        label.setAttribute("text-anchor", textAnchor);
        label.setAttribute("class", "xp-chart-date-label");

        label.textContent = point.date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        return label;
    });

    // A spike corner is where the incoming and outgoing line slopes differ sharply.
    const turningPoints = coordinates
        // Endpoints have only one neighbouring segment, so they cannot have a change in direction.
        .slice(1, -1)
        .map((point, index) => {
            // slice removed the first point, so index and index + 2 locate the original neighbours.
            const previousPoint = coordinates[index];
            const nextPoint = coordinates[index + 2];
            const incomingSlope =
                (point.y - previousPoint.y) /
                (point.x - previousPoint.x);
            const outgoingSlope =
                (nextPoint.y - point.y) /
                (nextPoint.x - point.x);

            return {
                ...point,
                turnScore: Math.abs(outgoingSlope - incomingSlope)
            };
        })
        // Straight sections have no meaningful turn, so they do not need markers.
        .filter((point) => point.turnScore > Number.EPSILON)
        // Rank by visual sharpness first so only the eight strongest corners receive markers.
        .sort((firstPoint, secondPoint) =>
            secondPoint.turnScore - firstPoint.turnScore
        )
        .slice(0, 8)
        // Restore timeline order after ranking so SVG elements follow the chart from left to right.
        .sort((firstPoint, secondPoint) =>
            firstPoint.x - secondPoint.x
        );

    const tooltipWidth = 190;
    const tooltipHeight = 30;
    const tooltipOffset = 10;
    const tooltipGroup = createSvgElement("g");
    const tooltipBox = createSvgElement("rect");
    const tooltipText = createSvgElement("text");

    // One reusable tooltip avoids creating a separate hidden box for every marker.
    tooltipGroup.setAttribute("class", "xp-chart-tooltip");
    tooltipGroup.setAttribute("visibility", "hidden");
    tooltipGroup.setAttribute("aria-hidden", "true");
    tooltipBox.setAttribute("width", tooltipWidth);
    tooltipBox.setAttribute("height", tooltipHeight);
    tooltipBox.setAttribute("rx", 4);
    tooltipBox.setAttribute("class", "xp-chart-tooltip-box");
    tooltipText.setAttribute("dominant-baseline", "middle");
    tooltipText.setAttribute("class", "xp-chart-tooltip-text");
    tooltipGroup.append(tooltipBox, tooltipText);

    // showTooltip fills and positions the shared tooltip immediately when a marker's hit area is entered.
    function showTooltip(point) {
        const formattedDate = point.date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
        const minimumX = padding.left;
        const maximumX = chartWidth - padding.right - tooltipWidth;
        // Clamp the horizontal position so the tooltip never extends beyond either chart edge.
        const tooltipX = Math.min(
            Math.max(point.x - tooltipWidth / 2, minimumX),
            maximumX
        );
        let tooltipY = point.y - tooltipHeight - tooltipOffset;

        // Markers near the top have no room above them, so place their tooltip below instead.
        if (tooltipY < padding.top) {
            tooltipY = point.y + tooltipOffset;
        }

        tooltipBox.setAttribute("x", tooltipX);
        tooltipBox.setAttribute("y", tooltipY);
        tooltipText.setAttribute("x", tooltipX + 10);
        tooltipText.setAttribute("y", tooltipY + tooltipHeight / 2);
        tooltipText.textContent =
            `${formattedDate} · ${formatXp(point.xp)} total`;
        tooltipGroup.setAttribute("visibility", "visible");
        tooltipGroup.setAttribute("aria-hidden", "false");
    }

    // hideTooltip resets the shared tooltip after the pointer leaves a marker's hit area.
    function hideTooltip() {
        tooltipGroup.setAttribute("visibility", "hidden");
        tooltipGroup.setAttribute("aria-hidden", "true");
    }

    // Each point uses an invisible hit circle for easier hovering and a separate visible circle for animation.
    const markerElements = turningPoints.flatMap((point) => {
        const hitArea = createSvgElement("circle");
        const marker = createSvgElement("circle");

        hitArea.setAttribute("cx", point.x);
        hitArea.setAttribute("cy", point.y);
        // Radius 5.4 equals the visible radius 3 at its 1.8x hover size.
        hitArea.setAttribute("r", 3 * 1.8);
        hitArea.setAttribute("class", "xp-chart-marker-hit-area");
        hitArea.setAttribute("aria-hidden", "true");

        marker.setAttribute("cx", point.x);
        marker.setAttribute("cy", point.y);
        marker.setAttribute("r", 3);
        marker.setAttribute("class", "xp-chart-marker");
        marker.setAttribute("role", "img");
        marker.setAttribute(
            "aria-label",
            `${formatXp(point.xp)} total XP`
        );

        hitArea.addEventListener("mouseenter", () => showTooltip(point));
        hitArea.addEventListener("mouseleave", hideTooltip);

        // flatMap inserts both circles into the final SVG array without leaving nested arrays.
        return [hitArea, marker];
    });

    // SVG paints later children above earlier ones, so markers and the tooltip sit above guides and the line.
    XpChart.append(
        ...yGuideElements,
        xAxis,
        yAxis,
        progressionLine,
        ...markerElements,
        ...dateLabels,
        tooltipGroup
    );
}

// renderAuditsChart compares XP given and received using two bars that share the same scale.
export function renderAuditsChart(totalUp, totalDown) {
    // Reopening the Audits section should replace the old bars instead of duplicating them.
    AuditsChart.replaceChildren();

    // GraphQL values may arrive as numbers or numeric strings, so normalize them before doing chart math.
    const xpGiven = Number(totalUp) || 0;
    const xpReceived = Number(totalDown) || 0;

    const chartWidth = 600;
    const leftPadding = 20;
    const rightPadding = 20;
    const labelGap = 8;
    const barHeight = 10;
    const givenY = 25;
    const receivedY = 65;

    const givenLabel = createSvgElement("text");

    givenLabel.setAttribute("x", leftPadding);
    givenLabel.setAttribute("y", givenY + barHeight / 2);
    givenLabel.setAttribute("dominant-baseline", "middle");
    givenLabel.setAttribute("class", "audit-chart-label");
    givenLabel.textContent = `Given: ${formatXp(xpGiven)}`;

    const receivedLabel = createSvgElement("text");

    receivedLabel.setAttribute("x", leftPadding);
    receivedLabel.setAttribute("y", receivedY + barHeight / 2);
    receivedLabel.setAttribute("dominant-baseline", "middle");
    receivedLabel.setAttribute("class", "audit-chart-label");
    receivedLabel.textContent = `Received: ${formatXp(xpReceived)}`;

    // Labels must be inside the visible SVG before getBBox can measure their rendered widths.
    AuditsChart.append(givenLabel, receivedLabel);

    // Both bars begin eight units after whichever label is wider, preventing text from overlapping a bar.
    const longestLabelWidth = Math.max(
        givenLabel.getBBox().width,
        receivedLabel.getBBox().width
    );

    const barStartX = leftPadding + longestLabelWidth + labelGap;
    const maximumBarWidth = chartWidth - barStartX - rightPadding;
    // Using one maximum for both values makes their relative bar lengths visually accurate.
    const maximumXp = Math.max(xpGiven, xpReceived, 1);
    const givenBarWidth = (xpGiven / maximumXp) * maximumBarWidth;
    const receivedBarWidth = (xpReceived / maximumXp) * maximumBarWidth;

    const givenBar = createSvgElement("rect");

    givenBar.setAttribute("x", barStartX);
    givenBar.setAttribute("y", givenY);
    givenBar.setAttribute("width", givenBarWidth);
    givenBar.setAttribute("height", barHeight);
    givenBar.setAttribute("rx", 8);
    givenBar.setAttribute("class", "audit-chart-given");

    const receivedBar = createSvgElement("rect");

    receivedBar.setAttribute("x", barStartX);
    receivedBar.setAttribute("y", receivedY);
    receivedBar.setAttribute("width", receivedBarWidth);
    receivedBar.setAttribute("height", barHeight);
    receivedBar.setAttribute("rx", 8);
    receivedBar.setAttribute("class", "audit-chart-received");

    AuditsChart.append(givenBar, receivedBar);
}
