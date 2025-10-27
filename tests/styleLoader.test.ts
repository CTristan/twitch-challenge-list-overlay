import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStyles } from "../src/styleLoader";
import { createFallbackConfig } from "../src/utils/ConfigDefaults";
import { ensureTestIsolation } from "./utils/chatHandlerTestUtils";

describe("styleLoader", () => {
    beforeEach(() => {
        ensureTestIsolation();
        document.body.innerHTML = "";
        document.documentElement.removeAttribute("style");
        window.location.hash = "";
        Object.assign(window, {
            WebFont: {
                load: vi.fn(),
            },
        });
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            writable: true,
            value: 1024,
        });
        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            writable: true,
            value: 768,
        });
    });

    it("applies default font styles when configuration value is missing", () => {
        const config = createFallbackConfig();
        delete config.challengeFontSize;

        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(2rem, 3rem, 4rem)"
        );
        expect(
            rootStyles.getPropertyValue("--challenge-description-font-size")
        ).toBe("2.34rem");
        expect(rootStyles.getPropertyValue("--challenge-timer-font-size")).toBe(
            "2.16rem"
        );
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "2rem"
        );
    });

    it("uses fallback viewport dimensions when window metrics are unavailable", () => {
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            writable: true,
            value: undefined,
        });
        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            writable: true,
            value: undefined,
        });

        const config = createFallbackConfig();
        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(2rem, 3rem, 4rem)"
        );
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "2rem"
        );
    });

    it("applies viewer font size overrides from configuration", () => {
        const config = createFallbackConfig();
        config.challengeFontSize = 150;

        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(2rem, 3.5rem, 4rem)"
        );
        expect(
            rootStyles.getPropertyValue("--challenge-description-font-size")
        ).toBe("2.73rem");
        expect(rootStyles.getPropertyValue("--challenge-timer-font-size")).toBe(
            "2.52rem"
        );
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "2rem"
        );
    });

    it("clamps viewer font percent to minimum when value is below range", () => {
        const config = createFallbackConfig();
        config.challengeFontSize = -120;

        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(2rem, 2rem, 4rem)"
        );
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "1.6rem"
        );
    });

    it("clamps viewer font percent to maximum when value exceeds range", () => {
        const config = createFallbackConfig();
        config.challengeFontSize = 500;

        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(2rem, 4rem, 4rem)"
        );
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "2rem"
        );
    });

    it("scales styles for compact viewports", () => {
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            writable: true,
            value: 360,
        });
        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            writable: true,
            value: 320,
        });

        const config = createFallbackConfig();
        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(1.7rem, 2.55rem, 3.4rem)"
        );
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "2rem"
        );
    });

    it("clamps admin control height for OBS dock viewports", () => {
        window.location.hash = "#admin";
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            writable: true,
            value: 337,
        });
        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            writable: true,
            value: 600,
        });

        const config = createFallbackConfig();
        config.challengeFontSize = 200;

        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "1.3rem"
        );
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(1.7rem, 1.625rem, 3.4rem)"
        );
        expect(
            rootStyles.getPropertyValue("--challenge-description-font-size")
        ).toBe("1.268rem");
        expect(rootStyles.getPropertyValue("--challenge-timer-font-size")).toBe(
            "1.17rem"
        );
    });

    it("preserves admin sizing tokens for spacious admin viewports", () => {
        window.location.hash = "#admin";
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            writable: true,
            value: 800,
        });
        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            writable: true,
            value: 600,
        });

        const config = createFallbackConfig();
        config.challengeFontSize = 200;

        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "2rem"
        );
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(2rem, 4rem, 4rem)"
        );
        expect(
            rootStyles.getPropertyValue("--challenge-description-font-size")
        ).toBe("3.12rem");
        expect(rootStyles.getPropertyValue("--challenge-timer-font-size")).toBe(
            "2.88rem"
        );
    });

    it("clamps admin control height to extreme cap for ultra-small viewports", () => {
        window.location.hash = "#admin";
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            writable: true,
            value: 300,
        });
        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            writable: true,
            value: 240,
        });

        const config = createFallbackConfig();
        config.challengeFontSize = 200;

        loadStyles(config);

        const rootStyles = getRootStyles();
        expect(rootStyles.getPropertyValue("--admin-control-height")).toBe(
            "1.2rem"
        );
        expect(rootStyles.getPropertyValue("--challenge-font-size")).toBe(
            "clamp(1.5rem, 1.5rem, 3rem)"
        );
        expect(
            rootStyles.getPropertyValue("--challenge-description-font-size")
        ).toBe("1.17rem");
        expect(rootStyles.getPropertyValue("--challenge-timer-font-size")).toBe(
            "1.08rem"
        );
    });
});

function getRootStyles(): CSSStyleDeclaration {
    return window.getComputedStyle(document.documentElement);
}
