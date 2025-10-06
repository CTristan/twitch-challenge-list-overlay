import { beforeEach, describe, expect, it } from "vitest";
import {
    BACKGROUND_DEFAULTS,
    BACKGROUND_UI_ELEMENTS,
} from "../../src/types/ConfigConstants";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";
import { AdminPanelBackgroundManager } from "../../src/utils/AdminPanelBackgroundManager";

function ensureTestIsolation() {
    localStorage.clear();
    document.body.innerHTML = "";
}

describe("AdminPanelBackgroundManager", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    describe("convertColorToRGBA", () => {
        it("should convert hex color to rgba with opacity", () => {
            const result = AdminPanelBackgroundManager.convertColorToRGBA(
                "#ff0000",
                0.5
            );

            expect(result).toBe("rgba(255, 0, 0, 0.5)");
        });

        it("should handle full opacity", () => {
            const result = AdminPanelBackgroundManager.convertColorToRGBA(
                "#00ff00",
                1.0
            );

            expect(result).toBe("rgba(0, 255, 0, 1)");
        });

        it("should handle zero opacity", () => {
            const result = AdminPanelBackgroundManager.convertColorToRGBA(
                "#0000ff",
                0
            );

            expect(result).toBe("rgba(0, 0, 255, 0)");
        });
    });

    describe("calculateOptimalTextColor", () => {
        it("should return black for light backgrounds", () => {
            const result =
                AdminPanelBackgroundManager.calculateOptimalTextColor(
                    "#ffffff"
                );

            expect(result).toBe("#000000");
        });

        it("should return white for dark backgrounds", () => {
            const result =
                AdminPanelBackgroundManager.calculateOptimalTextColor(
                    "#000000"
                );

            expect(result).toBe("#ffffff");
        });

        it("should handle medium brightness colors", () => {
            const result =
                AdminPanelBackgroundManager.calculateOptimalTextColor(
                    "#808080"
                );

            expect(["#000000", "#ffffff"]).toContain(result);
        });
    });

    describe("generateTextShadow", () => {
        it("should generate light shadow for dark text", () => {
            const result =
                AdminPanelBackgroundManager.generateTextShadow("#000000");

            expect(result).toContain("rgba(255, 255, 255");
        });

        it("should generate dark shadow for light text", () => {
            const result =
                AdminPanelBackgroundManager.generateTextShadow("#ffffff");

            expect(result).toContain("rgba(0, 0, 0");
        });

        it("should handle black color", () => {
            const result =
                AdminPanelBackgroundManager.generateTextShadow("#000000");

            expect(result).toContain("rgba(255, 255, 255");
        });

        it("should handle white color", () => {
            const result =
                AdminPanelBackgroundManager.generateTextShadow("#ffffff");

            expect(result).toContain("rgba(0, 0, 0");
        });
    });

    describe("getCurrentBackgroundConfigFromUI", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#ff0000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="50" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#00ff00" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="80" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" checked />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;
        });

        it("should get current background config from UI elements", () => {
            const result =
                AdminPanelBackgroundManager.getCurrentBackgroundConfigFromUI();

            expect(result.overlayBackgroundColor).toBe("rgba(255, 0, 0, 0.5)");
            expect(result.overlayBackgroundOpacity).toBe(0.5);
            expect(result.challengeBackgroundColor).toBe(
                "rgba(0, 255, 0, 0.8)"
            );
            expect(result.challengeBackgroundOpacity).toBe(0.8);
            expect(result.challengeTextColor).toBe("#ffffff");
            expect(result.challengeAutoTextColor).toBe(true);
            expect(result.challengeTextShadow).toBe(true);
        });

        it("should use defaults when elements are missing", () => {
            document.body.innerHTML = "";

            const result =
                AdminPanelBackgroundManager.getCurrentBackgroundConfigFromUI();

            // Check that defaults are used (values may vary due to missing elements)
            expect(result.overlayBackgroundOpacity).toBe(
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY
            );
            expect(result.challengeBackgroundOpacity).toBe(
                BACKGROUND_DEFAULTS.BACKGROUND_OPACITY
            );
        });
    });

    describe("updateBackgroundPreview", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="${ELEMENT_IDS.BACKGROUND_PREVIEW}">Preview</div>
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT}" value="#ff0000" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER}" value="50" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT}" value="#00ff00" />
                <input type="range" id="${BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER}" value="100" />
                <input type="color" id="${BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT}" value="#ffffff" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX}" />
                <input type="checkbox" id="${BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX}" checked />
            `;
        });

        it("should update preview element with background color", () => {
            AdminPanelBackgroundManager.updateBackgroundPreview();

            const preview = document.getElementById(
                ELEMENT_IDS.BACKGROUND_PREVIEW
            );

            // Browser normalizes rgba to rgb when opacity is 1
            expect(preview?.style.backgroundColor).toMatch(
                /rgba?\(0,\s*255,\s*0/
            );
        });

        it("should update preview element with text color", () => {
            AdminPanelBackgroundManager.updateBackgroundPreview();

            const preview = document.getElementById(
                ELEMENT_IDS.BACKGROUND_PREVIEW
            );

            // Browser may normalize hex to rgb
            expect(preview?.style.color).toMatch(
                /rgb\(255,\s*255,\s*255\)|#ffffff/
            );
        });

        it("should apply text shadow when enabled", () => {
            AdminPanelBackgroundManager.updateBackgroundPreview();

            const preview = document.getElementById(
                ELEMENT_IDS.BACKGROUND_PREVIEW
            );

            expect(preview?.style.textShadow).not.toBe("none");
            expect(preview?.style.textShadow).toBeTruthy();
        });

        it("should not apply text shadow when disabled", () => {
            const checkbox = document.getElementById(
                BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX
            ) as HTMLInputElement;
            checkbox.checked = false;

            AdminPanelBackgroundManager.updateBackgroundPreview();

            const preview = document.getElementById(
                ELEMENT_IDS.BACKGROUND_PREVIEW
            );

            expect(preview?.style.textShadow).toBe("none");
        });

        it("should handle missing preview element gracefully", () => {
            document.body.innerHTML = "";

            expect(() => {
                AdminPanelBackgroundManager.updateBackgroundPreview();
            }).not.toThrow();
        });
    });
});
