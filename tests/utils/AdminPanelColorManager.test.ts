import { beforeEach, describe, expect, it } from "vitest";
import {
    AdminPanelColorManager,
    type ColorConfigurationUI,
} from "../../src/utils/AdminPanelColorManager";
import { DEFAULT_COLORS } from "../../src/types/ColorConstants";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";

function ensureTestIsolation() {
    localStorage.clear();
    document.body.innerHTML = "";
}

describe("AdminPanelColorManager", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    describe("convertColorsToUI", () => {
        it("should convert arrays to UI format with all tiers enabled", () => {
            const backgroundColors = ["#ff0000", "#00ff00", "#0000ff"];
            const textColors = ["#ffffff", "#000000", "#ffffff"];

            const result = AdminPanelColorManager.convertColorsToUI(
                backgroundColors,
                textColors
            );

            expect(result.primary.enabled).toBe(true);
            expect(result.primary.backgroundColor).toBe("#ff0000");
            expect(result.primary.textColor).toBe("#ffffff");
            expect(result.secondary.enabled).toBe(true);
            expect(result.secondary.backgroundColor).toBe("#00ff00");
            expect(result.secondary.textColor).toBe("#000000");
            expect(result.tertiary.enabled).toBe(true);
            expect(result.tertiary.backgroundColor).toBe("#0000ff");
            expect(result.tertiary.textColor).toBe("#ffffff");
        });

        it("should handle empty arrays with default values", () => {
            const result = AdminPanelColorManager.convertColorsToUI([], []);

            expect(result.primary.enabled).toBe(false);
            expect(result.primary.backgroundColor).toBe(
                DEFAULT_COLORS.PRIMARY_BACKGROUND
            );
            expect(result.secondary.enabled).toBe(false);
            expect(result.tertiary.enabled).toBe(false);
        });

        it("should handle partial color arrays", () => {
            const backgroundColors = ["#ff0000"];
            const textColors = ["#ffffff"];

            const result = AdminPanelColorManager.convertColorsToUI(
                backgroundColors,
                textColors
            );

            expect(result.primary.enabled).toBe(true);
            expect(result.secondary.enabled).toBe(false);
            expect(result.tertiary.enabled).toBe(false);
        });
    });

    describe("convertUIToColors", () => {
        it("should convert UI format to background colors array", () => {
            const colorConfig: ColorConfigurationUI = {
                primary: {
                    enabled: true,
                    backgroundColor: "#ff0000",
                    textColor: "#ffffff",
                },
                secondary: {
                    enabled: true,
                    backgroundColor: "#00ff00",
                    textColor: "#000000",
                },
                tertiary: {
                    enabled: false,
                    backgroundColor: "#0000ff",
                    textColor: "#ffffff",
                },
            };

            const result = AdminPanelColorManager.convertUIToColors(colorConfig);

            expect(result).toEqual(["#ff0000", "#00ff00"]);
        });

        it("should return empty array when no tiers enabled", () => {
            const colorConfig: ColorConfigurationUI = {
                primary: {
                    enabled: false,
                    backgroundColor: "#ff0000",
                    textColor: "#ffffff",
                },
                secondary: {
                    enabled: false,
                    backgroundColor: "#00ff00",
                    textColor: "#000000",
                },
                tertiary: {
                    enabled: false,
                    backgroundColor: "#0000ff",
                    textColor: "#ffffff",
                },
            };

            const result = AdminPanelColorManager.convertUIToColors(colorConfig);

            expect(result).toEqual([]);
        });
    });

    describe("convertUIToTextColors", () => {
        it("should convert UI format to text colors array", () => {
            const colorConfig: ColorConfigurationUI = {
                primary: {
                    enabled: true,
                    backgroundColor: "#ff0000",
                    textColor: "#ffffff",
                },
                secondary: {
                    enabled: true,
                    backgroundColor: "#00ff00",
                    textColor: "#000000",
                },
                tertiary: {
                    enabled: true,
                    backgroundColor: "#0000ff",
                    textColor: "#ffff00",
                },
            };

            const result =
                AdminPanelColorManager.convertUIToTextColors(colorConfig);

            expect(result).toEqual(["#ffffff", "#000000", "#ffff00"]);
        });
    });

    describe("getCurrentColorConfigFromUI", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <input type="checkbox" id="${ELEMENT_IDS.PRIMARY_COLOR_ENABLED}" checked />
                <input type="color" id="${ELEMENT_IDS.PRIMARY_BG_COLOR}" value="#ff0000" />
                <input type="color" id="${ELEMENT_IDS.PRIMARY_TEXT_COLOR}" value="#ffffff" />
                <input type="checkbox" id="${ELEMENT_IDS.SECONDARY_COLOR_ENABLED}" />
                <input type="color" id="${ELEMENT_IDS.SECONDARY_BG_COLOR}" value="#00ff00" />
                <input type="color" id="${ELEMENT_IDS.SECONDARY_TEXT_COLOR}" value="#000000" />
                <input type="checkbox" id="${ELEMENT_IDS.TERTIARY_COLOR_ENABLED}" />
                <input type="color" id="${ELEMENT_IDS.TERTIARY_BG_COLOR}" value="#0000ff" />
                <input type="color" id="${ELEMENT_IDS.TERTIARY_TEXT_COLOR}" value="#ffffff" />
            `;
        });

        it("should get current color config from UI elements", () => {
            const result =
                AdminPanelColorManager.getCurrentColorConfigFromUI();

            expect(result.primary.enabled).toBe(true);
            expect(result.primary.backgroundColor).toBe("#ff0000");
            expect(result.primary.textColor).toBe("#ffffff");
            expect(result.secondary.enabled).toBe(false);
            expect(result.tertiary.enabled).toBe(false);
        });
    });

    describe("getColorTierConstants", () => {
        it("should return constants for primary tier", () => {
            const result =
                AdminPanelColorManager.getColorTierConstants("primary");

            expect(result.enabled).toBe(ELEMENT_IDS.PRIMARY_COLOR_ENABLED);
            expect(result.bgColor).toBe(ELEMENT_IDS.PRIMARY_BG_COLOR);
            expect(result.textColor).toBe(ELEMENT_IDS.PRIMARY_TEXT_COLOR);
            expect(result.pickers).toBe(ELEMENT_IDS.PRIMARY_COLOR_PICKERS);
            expect(result.section).toBe(ELEMENT_IDS.PRIMARY_COLOR_SECTION);
        });

        it("should return constants for secondary tier", () => {
            const result =
                AdminPanelColorManager.getColorTierConstants("secondary");

            expect(result.enabled).toBe(ELEMENT_IDS.SECONDARY_COLOR_ENABLED);
            expect(result.bgColor).toBe(ELEMENT_IDS.SECONDARY_BG_COLOR);
        });

        it("should return constants for tertiary tier", () => {
            const result =
                AdminPanelColorManager.getColorTierConstants("tertiary");

            expect(result.enabled).toBe(ELEMENT_IDS.TERTIARY_COLOR_ENABLED);
            expect(result.bgColor).toBe(ELEMENT_IDS.TERTIARY_BG_COLOR);
        });
    });

    describe("updateColorTierState", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="${ELEMENT_IDS.PRIMARY_COLOR_PICKERS}"></div>
                <div id="${ELEMENT_IDS.PRIMARY_COLOR_SECTION}"></div>
            `;
        });

        it("should update tier state when enabled", () => {
            AdminPanelColorManager.updateColorTierState("primary", true);

            const pickers = document.getElementById(
                ELEMENT_IDS.PRIMARY_COLOR_PICKERS
            );
            const section = document.getElementById(
                ELEMENT_IDS.PRIMARY_COLOR_SECTION
            );

            expect(pickers?.style.display).toBe("flex");
            expect(section?.style.opacity).toBe("1");
        });

        it("should update tier state when disabled", () => {
            AdminPanelColorManager.updateColorTierState("primary", false);

            const pickers = document.getElementById(
                ELEMENT_IDS.PRIMARY_COLOR_PICKERS
            );
            const section = document.getElementById(
                ELEMENT_IDS.PRIMARY_COLOR_SECTION
            );

            expect(pickers?.style.display).toBe("none");
            expect(section?.style.opacity).toBe("0.6");
        });
    });

    describe("extractColorFromRGBA", () => {
        it("should return hex color unchanged", () => {
            const result =
                AdminPanelColorManager.extractColorFromRGBA("#ff0000");

            expect(result).toBe("#ff0000");
        });

        it("should convert rgba to hex", () => {
            const result =
                AdminPanelColorManager.extractColorFromRGBA("rgba(255, 0, 0, 0.5)");

            expect(result).toBe("#ff0000");
        });

        it("should convert rgb to hex", () => {
            const result =
                AdminPanelColorManager.extractColorFromRGBA("rgb(0, 255, 0)");

            expect(result).toBe("#00ff00");
        });

        it("should return default for invalid format", () => {
            const result =
                AdminPanelColorManager.extractColorFromRGBA("invalid");

            expect(result).toBe(DEFAULT_COLORS.PRIMARY_BACKGROUND);
        });
    });
});

