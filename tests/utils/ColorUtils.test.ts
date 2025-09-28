import { beforeEach, describe, expect, it } from "vitest";
import * as ColorUtils from "../../src/utils/ColorUtils";

describe("ColorUtils", () => {
    beforeEach(() => {
        // Simple test isolation - clear localStorage for consistent test state
        localStorage.clear();
    });

    describe("parseColor", () => {
        it("should parse hex colors correctly", () => {
            const result = ColorUtils.parseColor("#ff0000");
            expect(result).toEqual({ r: 255, g: 0, b: 0 });
        });

        it("should parse short hex colors correctly", () => {
            const result = ColorUtils.parseColor("#f00");
            expect(result).toEqual({ r: 255, g: 0, b: 0 });
        });

        it("should parse rgb colors correctly", () => {
            const result = ColorUtils.parseColor("rgb(255, 0, 0)");
            expect(result).toEqual({ r: 255, g: 0, b: 0 });
        });

        it("should parse rgba colors correctly", () => {
            const result = ColorUtils.parseColor("rgba(255, 0, 0, 0.5)");
            expect(result).toEqual({ r: 255, g: 0, b: 0 });
        });

        it("should return null for invalid colors", () => {
            const result = ColorUtils.parseColor("invalid");
            expect(result).toBeNull();
        });
    });

    describe("calculateLuminance", () => {
        it("should calculate luminance for white", () => {
            const result = ColorUtils.calculateLuminance({
                r: 255,
                g: 255,
                b: 255,
            });
            expect(result).toBeCloseTo(1, 2);
        });

        it("should calculate luminance for black", () => {
            const result = ColorUtils.calculateLuminance({ r: 0, g: 0, b: 0 });
            expect(result).toBeCloseTo(0, 2);
        });
    });

    describe("isColorDark", () => {
        it("should identify dark colors", () => {
            expect(ColorUtils.isColorDark({ r: 0, g: 0, b: 0 })).toBe(true);
            expect(ColorUtils.isColorDark({ r: 50, g: 50, b: 50 })).toBe(true);
        });

        it("should identify light colors", () => {
            expect(ColorUtils.isColorDark({ r: 255, g: 255, b: 255 })).toBe(
                false
            );
            expect(ColorUtils.isColorDark({ r: 200, g: 200, b: 200 })).toBe(
                false
            );
        });
    });

    describe("calculateOptimalTextColor", () => {
        it("should return white text for dark backgrounds", () => {
            const result = ColorUtils.calculateOptimalTextColor("rgb(0, 0, 0)");
            expect(result).toBe("#ffffff");
        });

        it("should return black text for light backgrounds", () => {
            const result =
                ColorUtils.calculateOptimalTextColor("rgb(255, 255, 255)");
            expect(result).toBe("#000000");
        });

        it("should handle invalid colors gracefully", () => {
            const result = ColorUtils.calculateOptimalTextColor("invalid");
            expect(result).toBe("#ffffff");
        });
    });

    describe("combineColorWithOpacity", () => {
        it("should combine color with opacity", () => {
            const result = ColorUtils.combineColorWithOpacity(
                "rgb(255, 0, 0)",
                0.5
            );
            expect(result).toBe("rgba(255, 0, 0, 0.5)");
        });

        it("should handle hex colors", () => {
            const result = ColorUtils.combineColorWithOpacity("#ff0000", 0.8);
            expect(result).toBe("rgba(255, 0, 0, 0.8)");
        });

        it("should preserve existing rgba opacity when not specified", () => {
            const result = ColorUtils.combineColorWithOpacity(
                "rgba(255, 0, 0, 0.3)"
            );
            expect(result).toBe("rgba(255, 0, 0, 0.3)");
        });
    });

    describe("generateTextShadow", () => {
        it("should generate light text shadow for dark backgrounds", () => {
            const result = ColorUtils.generateTextShadow("rgb(0, 0, 0)");
            expect(result).toContain("rgba(255, 255, 255");
        });

        it("should generate dark text shadow for light backgrounds", () => {
            const result = ColorUtils.generateTextShadow("rgb(255, 255, 255)");
            expect(result).toContain("rgba(0, 0, 0");
        });

        it("should handle invalid colors gracefully", () => {
            const result = ColorUtils.generateTextShadow("invalid");
            // Invalid colors default to dark, so should generate light shadows
            expect(result).toContain("rgba(255, 255, 255");
        });
    });

    describe("extractOpacityFromColor", () => {
        it("should extract opacity from rgba colors", () => {
            const result = ColorUtils.extractOpacityFromColor(
                "rgba(255, 0, 0, 0.5)"
            );
            expect(result).toBe(0.5);
        });

        it("should return 1 for rgb colors", () => {
            const result = ColorUtils.extractOpacityFromColor("rgb(255, 0, 0)");
            expect(result).toBe(1);
        });

        it("should return 1 for hex colors", () => {
            const result = ColorUtils.extractOpacityFromColor("#ff0000");
            expect(result).toBe(1);
        });
    });
});
