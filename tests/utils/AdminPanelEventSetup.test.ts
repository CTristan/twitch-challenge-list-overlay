import { beforeEach, describe, expect, it, vi } from "vitest";
import { BACKGROUND_UI_ELEMENTS } from "../../src/types/ConfigConstants";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";
import { AdminPanelEventSetup } from "../../src/utils/AdminPanelEventSetup";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("AdminPanelEventSetup", () => {
    beforeEach(() => {
        ensureTestIsolation();
        document.body.innerHTML = "";
    });

    describe("setupAuthenticationAutoSave", () => {
        it("should setup event listeners for authentication fields", () => {
            // Create mock authentication fields
            const oauthInput = document.createElement("input");
            oauthInput.id = ELEMENT_IDS.TWITCH_OAUTH;
            const usernameInput = document.createElement("input");
            usernameInput.id = ELEMENT_IDS.TWITCH_USERNAME;
            const channelInput = document.createElement("input");
            channelInput.id = ELEMENT_IDS.TWITCH_CHANNEL;

            document.body.appendChild(oauthInput);
            document.body.appendChild(usernameInput);
            document.body.appendChild(channelInput);

            const callback = vi.fn();
            AdminPanelEventSetup.setupAuthenticationAutoSave(callback);

            // Trigger input events
            oauthInput.dispatchEvent(new Event("input"));
            usernameInput.dispatchEvent(new Event("input"));
            channelInput.dispatchEvent(new Event("input"));

            expect(callback).toHaveBeenCalledTimes(3);
        });

        it("should handle missing authentication fields gracefully", () => {
            const callback = vi.fn();
            expect(() => {
                AdminPanelEventSetup.setupAuthenticationAutoSave(callback);
            }).not.toThrow();
        });
    });

    describe("setupBehaviorAutoSave", () => {
        it("should setup event listener for max challenges input", () => {
            const maxChallengesInput = document.createElement("input");
            maxChallengesInput.id = ELEMENT_IDS.MAX_CHALLENGES;
            maxChallengesInput.type = "number";
            maxChallengesInput.value = "10";
            document.body.appendChild(maxChallengesInput);

            const callback = vi.fn();
            AdminPanelEventSetup.setupBehaviorAutoSave(callback);

            // Trigger change event
            maxChallengesInput.value = "15";
            maxChallengesInput.dispatchEvent(new Event("change"));

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it("should handle missing max challenges input gracefully", () => {
            const callback = vi.fn();

            // Don't create the input element
            expect(() => {
                AdminPanelEventSetup.setupBehaviorAutoSave(callback);
            }).not.toThrow();

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe("setupColorTierEventListeners", () => {
        it("should setup event listeners for color tier checkboxes", () => {
            // Create mock color tier elements for primary tier
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = ELEMENT_IDS.PRIMARY_COLOR_ENABLED;
            const bgColorInput = document.createElement("input");
            bgColorInput.type = "color";
            bgColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            const textColorInput = document.createElement("input");
            textColorInput.type = "color";
            textColorInput.id = ELEMENT_IDS.PRIMARY_TEXT_COLOR;

            document.body.appendChild(checkbox);
            document.body.appendChild(bgColorInput);
            document.body.appendChild(textColorInput);

            const onTierChange = vi.fn();
            const autoSaveCallback = vi.fn();

            AdminPanelEventSetup.setupColorTierEventListeners(
                onTierChange,
                autoSaveCallback
            );

            // Trigger checkbox change
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event("change"));

            expect(onTierChange).toHaveBeenCalled();
            expect(autoSaveCallback).toHaveBeenCalled();
        });

        it("should setup event listeners for color pickers", () => {
            // Create mock color tier elements
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = ELEMENT_IDS.PRIMARY_COLOR_ENABLED;
            const bgColorInput = document.createElement("input");
            bgColorInput.type = "color";
            bgColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            const textColorInput = document.createElement("input");
            textColorInput.type = "color";
            textColorInput.id = ELEMENT_IDS.PRIMARY_TEXT_COLOR;

            document.body.appendChild(checkbox);
            document.body.appendChild(bgColorInput);
            document.body.appendChild(textColorInput);

            const onTierChange = vi.fn();
            const autoSaveCallback = vi.fn();

            AdminPanelEventSetup.setupColorTierEventListeners(
                onTierChange,
                autoSaveCallback
            );

            // Trigger color picker input
            bgColorInput.dispatchEvent(new Event("input"));
            textColorInput.dispatchEvent(new Event("input"));

            expect(autoSaveCallback).toHaveBeenCalledTimes(2);
        });
    });

    describe("setupRowColorsOpacityEventListener", () => {
        it("should setup event listener for opacity slider", () => {
            const opacitySlider = document.createElement("input");
            opacitySlider.type = "range";
            opacitySlider.id = ELEMENT_IDS.ROW_COLORS_OPACITY;
            opacitySlider.value = "100";
            const opacityDisplay = document.createElement("span");
            opacityDisplay.id = ELEMENT_IDS.ROW_COLORS_OPACITY_DISPLAY;

            document.body.appendChild(opacitySlider);
            document.body.appendChild(opacityDisplay);

            const callback = vi.fn();
            AdminPanelEventSetup.setupRowColorsOpacityEventListener(callback);

            // Trigger input event
            opacitySlider.value = "50";
            opacitySlider.dispatchEvent(new Event("input"));

            expect(opacityDisplay.textContent).toBe("50%");
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("setupBackgroundEventListeners", () => {
        it("should setup event listeners for background color inputs", () => {
            // Create minimal required elements
            const overlayColorInput = document.createElement("input");
            overlayColorInput.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT;
            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.id = BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT;

            document.body.appendChild(overlayColorInput);
            document.body.appendChild(backgroundColorInput);

            const autoSaveCallback = vi.fn();
            const updatePreviewCallback = vi.fn();

            AdminPanelEventSetup.setupBackgroundEventListeners(
                autoSaveCallback,
                updatePreviewCallback
            );

            // Trigger input events
            overlayColorInput.dispatchEvent(new Event("input"));
            backgroundColorInput.dispatchEvent(new Event("input"));

            expect(autoSaveCallback).toHaveBeenCalled();
            expect(updatePreviewCallback).toHaveBeenCalled();
        });

        it("should setup event listeners for opacity sliders", () => {
            const overlayOpacitySlider = document.createElement("input");
            overlayOpacitySlider.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER;
            overlayOpacitySlider.value = "60";
            const overlayOpacityDisplay = document.createElement("span");
            overlayOpacityDisplay.id = BACKGROUND_UI_ELEMENTS.OVERLAY_OPACITY_DISPLAY;

            const opacitySlider = document.createElement("input");
            opacitySlider.id = BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER;
            opacitySlider.value = "70";
            const opacityDisplay = document.createElement("span");
            opacityDisplay.id = BACKGROUND_UI_ELEMENTS.OPACITY_DISPLAY;

            document.body.appendChild(overlayOpacitySlider);
            document.body.appendChild(overlayOpacityDisplay);
            document.body.appendChild(opacitySlider);
            document.body.appendChild(opacityDisplay);

            const autoSaveCallback = vi.fn();
            const updatePreviewCallback = vi.fn();

            AdminPanelEventSetup.setupBackgroundEventListeners(
                autoSaveCallback,
                updatePreviewCallback
            );

            // Trigger input events
            overlayOpacitySlider.dispatchEvent(new Event("input"));
            opacitySlider.dispatchEvent(new Event("input"));

            expect(overlayOpacityDisplay.textContent).toBe("60%");
            expect(opacityDisplay.textContent).toBe("70%");
            expect(updatePreviewCallback).toHaveBeenCalled();
        });

        it("should setup event listeners for text color controls", () => {
            const textColorInput = document.createElement("input");
            textColorInput.id = BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT;
            const autoTextColorCheckbox = document.createElement("input");
            autoTextColorCheckbox.type = "checkbox";
            autoTextColorCheckbox.id =
                BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX;
            const textShadowCheckbox = document.createElement("input");
            textShadowCheckbox.type = "checkbox";
            textShadowCheckbox.id = BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX;

            document.body.appendChild(textColorInput);
            document.body.appendChild(autoTextColorCheckbox);
            document.body.appendChild(textShadowCheckbox);

            const autoSaveCallback = vi.fn();
            const updatePreviewCallback = vi.fn();

            AdminPanelEventSetup.setupBackgroundEventListeners(
                autoSaveCallback,
                updatePreviewCallback
            );

            // Trigger events
            textColorInput.dispatchEvent(new Event("input"));
            autoTextColorCheckbox.dispatchEvent(new Event("change"));
            textShadowCheckbox.dispatchEvent(new Event("change"));

            expect(updatePreviewCallback).toHaveBeenCalled();
            expect(autoSaveCallback).toHaveBeenCalled();
        });

        it("should disable text color input when auto text color is checked", () => {
            const textColorInput = document.createElement("input");
            textColorInput.id = BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT;
            const autoTextColorCheckbox = document.createElement("input");
            autoTextColorCheckbox.type = "checkbox";
            autoTextColorCheckbox.id =
                BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX;

            document.body.appendChild(textColorInput);
            document.body.appendChild(autoTextColorCheckbox);

            const autoSaveCallback = vi.fn();
            const updatePreviewCallback = vi.fn();

            AdminPanelEventSetup.setupBackgroundEventListeners(
                autoSaveCallback,
                updatePreviewCallback
            );

            // Check the auto text color checkbox
            autoTextColorCheckbox.checked = true;
            autoTextColorCheckbox.dispatchEvent(new Event("change"));

            expect(textColorInput.disabled).toBe(true);
        });
    });
});

