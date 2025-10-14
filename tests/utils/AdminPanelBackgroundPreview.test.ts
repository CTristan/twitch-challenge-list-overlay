import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_COLORS, SHADOW_COLORS } from "../../src/types/ColorConstants";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";
import { AdminPanelBackgroundPreview } from "../../src/utils/AdminPanelBackgroundPreview";

describe("AdminPanelBackgroundPreview", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    describe("updateBackgroundPreview", () => {
        it("should return early if preview element is missing", () => {
            // No preview element in DOM
            expect(() => {
                AdminPanelBackgroundPreview.updateBackgroundPreview();
            }).not.toThrow();
        });

        it("should return early if previewChallenge is missing", () => {
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            document.body.appendChild(preview);

            expect(() => {
                AdminPanelBackgroundPreview.updateBackgroundPreview();
            }).not.toThrow();
        });

        it("should return early if previewText is missing", () => {
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            preview.appendChild(previewChallenge);
            document.body.appendChild(preview);

            expect(() => {
                AdminPanelBackgroundPreview.updateBackgroundPreview();
            }).not.toThrow();
        });

        it("should return early if backgroundColorInput is missing", () => {
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            const previewText = document.createElement("div");
            previewText.className = "preview-text";
            preview.appendChild(previewChallenge);
            preview.appendChild(previewText);
            document.body.appendChild(preview);

            expect(() => {
                AdminPanelBackgroundPreview.updateBackgroundPreview();
            }).not.toThrow();
        });

        it("should use default opacity when rowColorsOpacitySlider is missing", () => {
            // Setup DOM without opacity slider
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            const previewText = document.createElement("div");
            previewText.className = "preview-text";
            preview.appendChild(previewChallenge);
            preview.appendChild(previewText);

            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            backgroundColorInput.type = "color";
            backgroundColorInput.value = "#646464";

            document.body.appendChild(preview);
            document.body.appendChild(backgroundColorInput);

            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // Should apply background color (with default opacity)
            expect(previewChallenge.style.backgroundColor).toBeTruthy();
        });

        it("should apply background color with custom opacity from slider", () => {
            // Setup DOM with opacity slider
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            const previewText = document.createElement("div");
            previewText.className = "preview-text";
            preview.appendChild(previewChallenge);
            preview.appendChild(previewText);

            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            backgroundColorInput.type = "color";
            backgroundColorInput.value = "#646464";

            const opacitySlider = document.createElement("input");
            opacitySlider.id = ELEMENT_IDS.ROW_COLORS_OPACITY;
            opacitySlider.type = "range";
            opacitySlider.value = "50"; // 50%

            document.body.appendChild(preview);
            document.body.appendChild(backgroundColorInput);
            document.body.appendChild(opacitySlider);

            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // Should apply background color with 50% opacity
            expect(previewChallenge.style.backgroundColor).toContain("rgba");
            expect(previewChallenge.style.backgroundColor).toContain("0.5");
        });

        it("should use automatic text color when autoTextColorCheckbox is checked", () => {
            // Setup DOM
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            const previewText = document.createElement("div");
            previewText.className = "preview-text";
            preview.appendChild(previewChallenge);
            preview.appendChild(previewText);

            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            backgroundColorInput.type = "color";
            backgroundColorInput.value = "#ffffff"; // Light background

            const autoTextColorCheckbox = document.createElement("input");
            autoTextColorCheckbox.id = "challenge-auto-text-color";
            autoTextColorCheckbox.type = "checkbox";
            autoTextColorCheckbox.checked = true;

            document.body.appendChild(preview);
            document.body.appendChild(backgroundColorInput);
            document.body.appendChild(autoTextColorCheckbox);

            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // Should use black text for light background (browser converts to rgb)
            expect(previewText.style.color).toBe("rgb(0, 0, 0)");
        });

        it("should use manual text color when autoTextColorCheckbox is unchecked and textColorInput exists", () => {
            // Setup DOM
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            const previewText = document.createElement("div");
            previewText.className = "preview-text";
            preview.appendChild(previewChallenge);
            preview.appendChild(previewText);

            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            backgroundColorInput.type = "color";
            backgroundColorInput.value = "#646464";

            const autoTextColorCheckbox = document.createElement("input");
            autoTextColorCheckbox.id = "challenge-auto-text-color";
            autoTextColorCheckbox.type = "checkbox";
            autoTextColorCheckbox.checked = false;

            const textColorInput = document.createElement("input");
            textColorInput.id = "challenge-text-color";
            textColorInput.type = "color";
            textColorInput.value = "#ff0000"; // Red

            document.body.appendChild(preview);
            document.body.appendChild(backgroundColorInput);
            document.body.appendChild(autoTextColorCheckbox);
            document.body.appendChild(textColorInput);

            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // Should use manual red text color (browser converts to rgb)
            expect(previewText.style.color).toBe("rgb(255, 0, 0)");
        });

        it("should use default white text when autoTextColorCheckbox is unchecked and textColorInput is missing", () => {
            // Setup DOM without textColorInput
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            const previewText = document.createElement("div");
            previewText.className = "preview-text";
            preview.appendChild(previewChallenge);
            preview.appendChild(previewText);

            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            backgroundColorInput.type = "color";
            backgroundColorInput.value = "#646464";

            const autoTextColorCheckbox = document.createElement("input");
            autoTextColorCheckbox.id = "challenge-auto-text-color";
            autoTextColorCheckbox.type = "checkbox";
            autoTextColorCheckbox.checked = false;

            document.body.appendChild(preview);
            document.body.appendChild(backgroundColorInput);
            document.body.appendChild(autoTextColorCheckbox);

            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // Should use default white text (browser converts to rgb)
            expect(previewText.style.color).toBe("rgb(255, 255, 255)");
        });

        it("should apply text shadow when textShadowCheckbox is checked", () => {
            // Setup DOM
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            const previewText = document.createElement("div");
            previewText.className = "preview-text";
            preview.appendChild(previewChallenge);
            preview.appendChild(previewText);

            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            backgroundColorInput.type = "color";
            backgroundColorInput.value = "#646464";

            const textShadowCheckbox = document.createElement("input");
            textShadowCheckbox.id = "challenge-text-shadow";
            textShadowCheckbox.type = "checkbox";
            textShadowCheckbox.checked = true;

            document.body.appendChild(preview);
            document.body.appendChild(backgroundColorInput);
            document.body.appendChild(textShadowCheckbox);

            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // Should apply text shadow
            expect(previewText.style.textShadow).not.toBe("none");
            expect(previewText.style.textShadow).toContain("px");
        });

        it("should remove text shadow when textShadowCheckbox is unchecked", () => {
            // Setup DOM
            const preview = document.createElement("div");
            preview.id = ELEMENT_IDS.BACKGROUND_PREVIEW;
            const previewChallenge = document.createElement("div");
            previewChallenge.className = "preview-challenge";
            const previewText = document.createElement("div");
            previewText.className = "preview-text";
            preview.appendChild(previewChallenge);
            preview.appendChild(previewText);

            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.id = ELEMENT_IDS.PRIMARY_BG_COLOR;
            backgroundColorInput.type = "color";
            backgroundColorInput.value = "#646464";

            const textShadowCheckbox = document.createElement("input");
            textShadowCheckbox.id = "challenge-text-shadow";
            textShadowCheckbox.type = "checkbox";
            textShadowCheckbox.checked = false;

            document.body.appendChild(preview);
            document.body.appendChild(backgroundColorInput);
            document.body.appendChild(textShadowCheckbox);

            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // Should set text shadow to "none"
            expect(previewText.style.textShadow).toBe("none");
        });
    });

    describe("calculateOptimalTextColor", () => {
        it("should return black text for light backgrounds", () => {
            const result =
                AdminPanelBackgroundPreview.calculateOptimalTextColor(
                    "#ffffff"
                );
            expect(result).toBe(DEFAULT_COLORS.BLACK_TEXT);
        });

        it("should return white text for dark backgrounds", () => {
            const result =
                AdminPanelBackgroundPreview.calculateOptimalTextColor(
                    "#000000"
                );
            expect(result).toBe(DEFAULT_COLORS.WHITE_TEXT);
        });

        it("should handle medium brightness backgrounds", () => {
            const result =
                AdminPanelBackgroundPreview.calculateOptimalTextColor(
                    "#808080"
                );
            expect([
                DEFAULT_COLORS.BLACK_TEXT,
                DEFAULT_COLORS.WHITE_TEXT,
            ]).toContain(result);
        });
    });

    describe("generateTextShadow", () => {
        it("should generate white shadow for dark text", () => {
            const result =
                AdminPanelBackgroundPreview.generateTextShadow("#000000");
            expect(result).toContain(SHADOW_COLORS.WHITE_SHADOW);
        });

        it("should generate black shadow for light text", () => {
            const result =
                AdminPanelBackgroundPreview.generateTextShadow("#ffffff");
            expect(result).toContain(SHADOW_COLORS.BLACK_SHADOW);
        });

        it("should include multiple shadow directions", () => {
            const result =
                AdminPanelBackgroundPreview.generateTextShadow("#ffffff");
            // Should have 4 shadow directions with different offsets
            expect(result).toContain("1px 1px 2px");
            expect(result).toContain("-1px -1px 2px");
            expect(result).toContain("1px -1px 2px");
            expect(result).toContain("-1px 1px 2px");
        });
    });
});
