/** @type {Animation} */
let primaryAnimation: Animation;
/** @type {Animation} */
let secondaryAnimation: Animation;
let isScrolling = false;

const gapSize = getComputedStyle(document.documentElement)
  .getPropertyValue("--card-gap-between")
  .slice(0, -2);

/**
 * Animates the scroll of the challenge list
 * @returns {void}
 */
export function animateScroll(): void {
  const wrapper = document.querySelector(".challenge-wrapper");
  if (!wrapper) {
    console.warn("Challenge wrapper element not found");
    return;
  }
  const wrapperHeight = wrapper.clientHeight;

  const containerPrimary = document.querySelector(
    ".challenge-container.primary"
  );
  if (!containerPrimary) {
    console.warn("Primary challenge container element not found");
    return;
  }
  const containerHeight = containerPrimary.scrollHeight;

  const containerSecondary = document.querySelector(
    ".challenge-container.secondary"
  ) as HTMLElement;
  if (!containerSecondary) {
    console.warn("Secondary challenge container element not found");
    return;
  }

  if (containerHeight > wrapperHeight && !isScrolling) {
    containerSecondary.style.display = "block";
    const scrollSpeed = 20; // Hardcoded default scroll speed
    let parsedSpeed = scrollSpeed;
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
