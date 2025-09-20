/** @type {Animation} */
let primaryAnimation: Animation;
/** @type {Animation} */
let secondaryAnimation: Animation;
let isScrolling = false;

/**
 * Animates the scroll of the challenge list
 * @returns {void}
 */
export function animateScroll(): void {
    // Collect all required DOM elements upfront
    const wrapper = document.querySelector(".challenge-wrapper");
    const containerPrimary = document.querySelector(".challenge-container.primary");
    const containerSecondary = document.querySelector(".challenge-container.secondary") as HTMLElement;

    // Handle missing elements case once
    if (!wrapper || !containerPrimary || !containerSecondary) {
        const missingElements = [];
        if (!wrapper) missingElements.push("challenge wrapper");
        if (!containerPrimary) missingElements.push("primary challenge container");
        if (!containerSecondary) missingElements.push("secondary challenge container");

        console.warn(`Required elements not found: ${missingElements.join(", ")}`);
        return;
    }

    // Now we can safely use the elements
    const wrapperHeight = wrapper.clientHeight;
    const containerHeight = containerPrimary.scrollHeight;

    if (containerHeight > wrapperHeight && !isScrolling) {
        containerSecondary.style.display = "block";
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

        let primaryKeyFrames = [
            { transform: "translateY(0)" },
            { transform: `translateY(-${adjustedHight}px)` },
        ];
        let secondaryKeyFrames = [
            { transform: "translateY(0)" },
            { transform: `translateY(-${adjustedHight}px)` },
        ];
        // store and apply animations
        primaryAnimation = containerPrimary.animate(
            primaryKeyFrames,
            animationOptions
        );
        secondaryAnimation = containerSecondary.animate(
            secondaryKeyFrames,
            animationOptions
        );

        isScrolling = true;
        addAnimationListeners();
    } else if (containerHeight <= wrapperHeight) {
        containerSecondary.style.display = "none";
        cancelAnimation();
    }
}

function cancelAnimation() {
    if (primaryAnimation) {
        primaryAnimation.cancel();
    }
    if (secondaryAnimation) {
        secondaryAnimation.cancel();
    }
    isScrolling = false;
}

function addAnimationListeners() {
    if (primaryAnimation) {
        primaryAnimation.addEventListener("finish", animationFinished);
        primaryAnimation.addEventListener("cancel", animationFinished);
    }
}

function animationFinished() {
    isScrolling = false;
    animateScroll();
}
