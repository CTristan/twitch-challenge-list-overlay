import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    animateScroll,
    resetAnimationState,
} from "../src/animations/animateScroll";

// ============================================================================
// TEST CONSTANTS AND DATA
// ============================================================================

/**
 * Standard test dimensions for consistent testing
 */
const TEST_DIMENSIONS = {
    WRAPPER_HEIGHT: 500,
    CONTAINER_HEIGHT_SMALL: 400, // Smaller than wrapper (no scroll needed)
    CONTAINER_HEIGHT_LARGE: 1000, // Larger than wrapper (scroll needed)
    GAP_SIZE: 10,
} as const;

/**
 * CSS custom property values for testing
 */
const CSS_CUSTOM_PROPERTIES = {
    CARD_GAP_BETWEEN: "10px",
    CARD_GAP_BETWEEN_LARGE: "20px",
} as const;

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Creates a mock Animation object with event listener support
 */
const createMockAnimation = () => {
    const listeners: Record<string, Function[]> = {};

    return {
        cancel: vi.fn(),
        addEventListener: vi.fn((event: string, handler: Function) => {
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(handler);
        }),
        removeEventListener: vi.fn(),
        finish: vi.fn(),
        // Helper to trigger events in tests
        _triggerEvent: (event: string) => {
            if (listeners[event]) {
                listeners[event].forEach((handler) => handler());
            }
        },
        _listeners: listeners,
    };
};

/**
 * Sets up DOM structure required for animateScroll tests
 */
const setupScrollTestDOM = (
    wrapperHeight: number = TEST_DIMENSIONS.WRAPPER_HEIGHT,
    containerHeight: number = TEST_DIMENSIONS.CONTAINER_HEIGHT_LARGE
): {
    wrapper: HTMLElement;
    container: HTMLElement;
    mockAnimation: ReturnType<typeof createMockAnimation>;
} => {
    // Create wrapper element
    const wrapper = document.createElement("div");
    wrapper.className = "challenge-wrapper";
    Object.defineProperty(wrapper, "clientHeight", {
        configurable: true,
        value: wrapperHeight,
    });

    // Create container element
    const container = document.createElement("div");
    container.className = "challenge-container";
    Object.defineProperty(container, "scrollHeight", {
        configurable: true,
        value: containerHeight,
    });

    // Mock the animate method
    const mockAnimation = createMockAnimation();
    container.animate = vi.fn().mockReturnValue(mockAnimation);

    // Add elements to DOM
    wrapper.appendChild(container);
    document.body.appendChild(wrapper);

    // Mock getComputedStyle for CSS custom properties
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
        getPropertyValue: vi.fn((prop: string) => {
            if (prop === "--card-gap-between") {
                return CSS_CUSTOM_PROPERTIES.CARD_GAP_BETWEEN;
            }
            return "";
        }),
    } as any);

    return { wrapper, container, mockAnimation };
};

/**
 * Cleans up DOM after tests
 */
const cleanupDOM = (): void => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("animateScroll", () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Reset animation state before each test
        resetAnimationState();

        // Clear any existing DOM
        cleanupDOM();

        // Set up console spy to capture warning messages
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
        cleanupDOM();
        resetAnimationState();
    });

    // ========================================================================
    // MISSING ELEMENTS TESTS
    // ========================================================================

    describe("Missing Elements Handling", () => {
        it("should warn and return early when wrapper is missing", () => {
            // Create only container, no wrapper
            const container = document.createElement("div");
            container.className = "challenge-container";
            document.body.appendChild(container);

            animateScroll();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Required elements not found: challenge wrapper"
            );
        });

        it("should warn and return early when container is missing", () => {
            // Create only wrapper, no container
            const wrapper = document.createElement("div");
            wrapper.className = "challenge-wrapper";
            document.body.appendChild(wrapper);

            animateScroll();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Required elements not found: challenge container"
            );
        });

        it("should warn and return early when both elements are missing", () => {
            // No elements in DOM
            animateScroll();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Required elements not found: challenge wrapper, challenge container"
            );
        });
    });

    // ========================================================================
    // SCROLL ANIMATION TESTS
    // ========================================================================

    describe("Scroll Animation Behavior", () => {
        it("should start animation when container is larger than wrapper", () => {
            const { container, mockAnimation } = setupScrollTestDOM(
                TEST_DIMENSIONS.WRAPPER_HEIGHT,
                TEST_DIMENSIONS.CONTAINER_HEIGHT_LARGE
            );

            animateScroll();

            // Verify animate was called
            expect(container.animate).toHaveBeenCalled();

            // Verify animation parameters
            const animateCall = (container.animate as any).mock.calls[0];
            const keyframes = animateCall[0];
            const options = animateCall[1];

            expect(keyframes).toEqual([
                { transform: "translateY(0)" },
                { transform: expect.stringContaining("translateY(-") },
            ]);
            expect(options.easing).toBe("linear");
            expect(options.iterations).toBe(1);
            expect(options.duration).toBeGreaterThan(0);

            // Verify event listeners were added
            expect(mockAnimation.addEventListener).toHaveBeenCalledWith(
                "finish",
                expect.any(Function)
            );
            expect(mockAnimation.addEventListener).toHaveBeenCalledWith(
                "cancel",
                expect.any(Function)
            );
        });

        it("should not start animation when container is smaller than wrapper", () => {
            const { container } = setupScrollTestDOM(
                TEST_DIMENSIONS.WRAPPER_HEIGHT,
                TEST_DIMENSIONS.CONTAINER_HEIGHT_SMALL
            );

            animateScroll();

            // Verify animate was not called
            expect(container.animate).not.toHaveBeenCalled();
        });

        it("should not start animation when already scrolling", () => {
            const { container, mockAnimation } = setupScrollTestDOM();

            // First call - should start animation
            animateScroll();
            expect(container.animate).toHaveBeenCalledTimes(1);

            // Second call while still scrolling - should not start new animation
            animateScroll();
            expect(container.animate).toHaveBeenCalledTimes(1);
        });

        it("should cancel existing animation when container becomes smaller than wrapper", () => {
            const { container, wrapper, mockAnimation } = setupScrollTestDOM();

            // Start animation
            animateScroll();
            expect(container.animate).toHaveBeenCalled();

            // Change dimensions so container is now smaller
            Object.defineProperty(container, "scrollHeight", {
                configurable: true,
                value: TEST_DIMENSIONS.CONTAINER_HEIGHT_SMALL,
            });

            // Trigger animation finish to reset isScrolling flag
            mockAnimation._triggerEvent("finish");

            // Call animateScroll again - should cancel animation
            animateScroll();
            expect(mockAnimation.cancel).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // ANIMATION CALCULATION TESTS
    // ========================================================================

    describe("Animation Calculation", () => {
        it("should calculate duration based on container height and scroll speed", () => {
            const { container } = setupScrollTestDOM(
                TEST_DIMENSIONS.WRAPPER_HEIGHT,
                TEST_DIMENSIONS.CONTAINER_HEIGHT_LARGE
            );

            animateScroll();

            const animateCall = (container.animate as any).mock.calls[0];
            const options = animateCall[1];

            // Expected calculation:
            // adjustedHeight = containerHeight + (gapSize * 2)
            // adjustedHeight = 1000 + (10 * 2) = 1020
            // duration = (1020 / 20) * 1000 = 51000ms
            expect(options.duration).toBe(51000);
        });

        it("should include gap size in animation distance calculation", () => {
            const { container } = setupScrollTestDOM();

            animateScroll();

            const animateCall = (container.animate as any).mock.calls[0];
            const keyframes = animateCall[0];

            // Expected: translateY(-(1000 + 10*2)px) = translateY(-1020px)
            expect(keyframes[1].transform).toBe("translateY(-1020px)");
        });

        it("should handle different gap sizes from CSS custom properties", () => {
            const { container } = setupScrollTestDOM();

            // Mock different gap size
            vi.spyOn(window, "getComputedStyle").mockReturnValue({
                getPropertyValue: vi.fn((prop: string) => {
                    if (prop === "--card-gap-between") {
                        return CSS_CUSTOM_PROPERTIES.CARD_GAP_BETWEEN_LARGE;
                    }
                    return "";
                }),
            } as any);

            animateScroll();

            const animateCall = (container.animate as any).mock.calls[0];
            const keyframes = animateCall[0];

            // Expected: translateY(-(1000 + 20*2)px) = translateY(-1040px)
            expect(keyframes[1].transform).toBe("translateY(-1040px)");
        });
    });

    // ========================================================================
    // ANIMATION LIFECYCLE TESTS
    // ========================================================================

    describe("Animation Lifecycle", () => {
        it("should restart animation when finish event fires", () => {
            const { container, mockAnimation } = setupScrollTestDOM();

            animateScroll();
            expect(container.animate).toHaveBeenCalledTimes(1);

            // Trigger finish event
            mockAnimation._triggerEvent("finish");

            // Should call animateScroll again, starting new animation
            expect(container.animate).toHaveBeenCalledTimes(2);
        });

        it("should restart animation when cancel event fires", () => {
            const { container, mockAnimation } = setupScrollTestDOM();

            animateScroll();
            expect(container.animate).toHaveBeenCalledTimes(1);

            // Trigger cancel event
            mockAnimation._triggerEvent("cancel");

            // Should call animateScroll again, starting new animation
            expect(container.animate).toHaveBeenCalledTimes(2);
        });
    });
});
