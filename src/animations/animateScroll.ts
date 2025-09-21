/** @type {Animation} */
let scrollAnimation: Animation;
let isScrolling = false;

/**
 * Animates the scroll of the challenge list
 * @returns {void}
 */
export function animateScroll(): void {
    // Collect all required DOM elements upfront
    const wrapper = document.querySelector(".challenge-wrapper");
    const challengeContainer = document.querySelector(
        ".challenge-container"
    ) as HTMLElement;

    // Handle missing elements case once
    if (!wrapper || !challengeContainer) {
        const missingElements = [];
        if (!wrapper) missingElements.push("challenge wrapper");
        if (!challengeContainer) missingElements.push("challenge container");

        console.warn(
            `Required elements not found: ${missingElements.join(", ")}`
        );
        return;
    }

    // Now we can safely use the elements
    const wrapperHeight = wrapper.clientHeight;
    const containerHeight = challengeContainer.scrollHeight;

    if (containerHeight > wrapperHeight && !isScrolling) {
        const scrollSpeed = 20; // Hardcoded default scroll speed
        let parsedSpeed = scrollSpeed;

        // Calculate gap size dynamically to pick up runtime CSS custom property changes
        const gapSize = getComputedStyle(document.documentElement)
            .getPropertyValue("--card-gap-between")
            .slice(0, -2);

        let adjustedHight = containerHeight + parseInt(gapSize, 10) * 2;
        let duration = (adjustedHight / parsedSpeed) * 1000;
        let animationOptions = {
            duration: duration,
            iterations: 1,
            easing: "linear",
        };

        let keyFrames = [
            { transform: "translateY(0)" },
            { transform: `translateY(-${adjustedHight}px)` },
        ];
        // store and apply animation
        scrollAnimation = challengeContainer.animate(
            keyFrames,
            animationOptions
        );

        isScrolling = true;
        addAnimationListeners();
    } else if (containerHeight <= wrapperHeight) {
        cancelAnimation();
    }
}

function cancelAnimation() {
    if (scrollAnimation) {
        scrollAnimation.cancel();
    }
    isScrolling = false;
}

function addAnimationListeners() {
    if (scrollAnimation) {
        scrollAnimation.addEventListener("finish", animationFinished);
        scrollAnimation.addEventListener("cancel", animationFinished);
    }
}

function animationFinished() {
    isScrolling = false;
    animateScroll();
}
