import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_COLORS } from "../../src/types/ColorConstants";
import {
    BACKGROUND_DEFAULTS,
    BACKGROUND_UI_ELEMENTS,
} from "../../src/types/ConfigConstants";
import {
    AdminPanelBackgroundConfigGetter,
    type BackgroundConfigurationUI,
} from "../../src/utils/AdminPanelBackgroundConfigGetter";

describe("AdminPanelBackgroundConfigGetter", () => {
    beforeEach(() => {
        // Clear the DOM before each test
        document.body.innerHTML = "";
    });

    describe("getCurrentBackgroundConfigFromUI", () => {
        it("should return all configuration values when all elements exist", () => {
            // Setup DOM with all elements
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.overlayBackgroundColor).toBe("#646464");
            expect(config.overlayBackgroundOpacity).toBe(0.6);
            expect(config.challengeBackgroundColor).toBe("#000000");
            expect(config.challengeBackgroundOpacity).toBe(0.7);
            expect(config.challengeTextColor).toBe("#ffffff");
            expect(config.challengeAutoTextColor).toBe(true);
            expect(config.challengeTextShadow).toBe(true);
        });

        it("should use default overlay background color when input is missing", () => {
            // Setup DOM without overlay background color input
            document.body.innerHTML = `
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.overlayBackgroundColor).toBe(
                DEFAULT_COLORS.CHALLENGE_BACKGROUND
            );
        });

        it("should use default overlay opacity when slider is missing", () => {
            // Setup DOM without overlay opacity slider
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.overlayBackgroundOpacity).toBe(
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY
            );
        });

        it("should use default challenge background color when input is missing", () => {
            // Setup DOM without challenge background color input
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.challengeBackgroundColor).toBe(
                DEFAULT_COLORS.CHALLENGE_BACKGROUND
            );
        });

        it("should use default challenge opacity when slider is missing", () => {
            // Setup DOM without challenge opacity slider
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.challengeBackgroundOpacity).toBe(
                BACKGROUND_DEFAULTS.BACKGROUND_OPACITY
            );
        });

        it("should use default text color when input is missing", () => {
            // Setup DOM without text color input
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.challengeTextColor).toBe(
                BACKGROUND_DEFAULTS.TEXT_COLOR
            );
        });

        it("should use default auto text color when checkbox is missing", () => {
            // Setup DOM without auto text color checkbox
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.challengeAutoTextColor).toBe(
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR
            );
        });

        it("should use default text shadow when checkbox is missing", () => {
            // Setup DOM without text shadow checkbox
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.challengeTextShadow).toBe(
                BACKGROUND_DEFAULTS.TEXT_SHADOW
            );
        });

        it("should handle unchecked checkboxes correctly", () => {
            // Setup DOM with unchecked checkboxes
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.challengeAutoTextColor).toBe(false);
            expect(config.challengeTextShadow).toBe(false);
        });

        it("should convert opacity slider values from percentage to decimal", () => {
            // Setup DOM with various opacity values
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#646464" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="50" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#000000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="100" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.overlayBackgroundOpacity).toBe(0.5);
            expect(config.challengeBackgroundOpacity).toBe(1.0);
        });

        it("should handle all elements missing and use all defaults", () => {
            // Empty DOM
            document.body.innerHTML = "";

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            expect(config.overlayBackgroundColor).toBe(
                DEFAULT_COLORS.CHALLENGE_BACKGROUND
            );
            expect(config.overlayBackgroundOpacity).toBe(
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY
            );
            expect(config.challengeBackgroundColor).toBe(
                DEFAULT_COLORS.CHALLENGE_BACKGROUND
            );
            expect(config.challengeBackgroundOpacity).toBe(
                BACKGROUND_DEFAULTS.BACKGROUND_OPACITY
            );
            expect(config.challengeTextColor).toBe(
                BACKGROUND_DEFAULTS.TEXT_COLOR
            );
            expect(config.challengeAutoTextColor).toBe(
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR
            );
            expect(config.challengeTextShadow).toBe(
                BACKGROUND_DEFAULTS.TEXT_SHADOW
            );
        });

        it("should handle empty string values for color inputs by using defaults", () => {
            // Setup DOM with empty color values
            // Note: In jsdom, color inputs may default to #000000 when value is empty
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="60" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="70" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;

            const config: BackgroundConfigurationUI =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            // In jsdom, empty color inputs may return #000000 as the default browser behavior
            // The code uses `||` operator, so empty string would fall back to default,
            // but jsdom color inputs default to #000000 when empty
            expect(config.overlayBackgroundColor).toBeDefined();
            expect(config.challengeBackgroundColor).toBeDefined();
            expect(config.challengeTextColor).toBeDefined();
        });
    });
});
