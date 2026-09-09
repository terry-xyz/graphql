const EASING = 0.1;

// initializeSpotlightBackground makes the second fixed image follow the pointer
// through the CSS mask without taking clicks away from the dashboard.
export function initializeSpotlightBackground() {
    // main.js is also imported by lightweight Node tests that do not provide a browser window.
    if (typeof window === "undefined") {
        return () => {};
    }

    const background = document.querySelector("#spotlight-background");

    if (!background) {
        return () => {};
    }

    const target = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
    };
    const current = { ...target };
    let animationFrame = 0;

    function updateTarget(event) {
        target.x = event.clientX;
        target.y = event.clientY;
        background.classList.add("spotlight-background-active");
    }

    function renderSpotlight() {
        current.x += (target.x - current.x) * EASING;
        current.y += (target.y - current.y) * EASING;

        background.style.setProperty("--spotlight-x", `${current.x}px`);
        background.style.setProperty("--spotlight-y", `${current.y}px`);
        animationFrame = window.requestAnimationFrame(renderSpotlight);
    }

    window.addEventListener("pointermove", updateTarget, { passive: true });
    animationFrame = window.requestAnimationFrame(renderSpotlight);

    return function destroySpotlightBackground() {
        window.removeEventListener("pointermove", updateTarget);
        window.cancelAnimationFrame(animationFrame);
    };
}
