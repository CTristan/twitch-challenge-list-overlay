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

        it("should return null for null input", () => {
            const result = ColorUtils.parseColor(null as any);
            expect(result).toBeNull();
        });

        it("should return null for undefined input", () => {
            const result = ColorUtils.parseColor(undefined as any);
            expect(result).toBeNull();
        });

        it("should return null for non-string input", () => {
            const result = ColorUtils.parseColor(123 as any);
            expect(result).toBeNull();
        });

        it("should parse named colors correctly", () => {
            const result = ColorUtils.parseColor("red");
            expect(result).toEqual({ r: 255, g: 0, b: 0 });
        });

        it("should handle invalid hex colors", () => {
            const result = ColorUtils.parseColor("#gggggg");
            // Invalid hex colors return an object with NaN values
            expect(result).toEqual({ r: NaN, g: NaN, b: NaN });
        });

        it("should handle malformed rgb colors", () => {
            const result = ColorUtils.parseColor("rgb(invalid)");
            expect(result).toBeNull();
        });

        it("should clamp rgb values to valid range", () => {
            const result = ColorUtils.parseColor("rgb(300, -50, 128)");
            expect(result).toEqual({ r: 255, g: 0, b: 128 });
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

        it("should handle string input", () => {
            expect(ColorUtils.isColorDark("#000000")).toBe(true);
            expect(ColorUtils.isColorDark("#ffffff")).toBe(false);
        });

        it("should default to dark for invalid string input", () => {
            expect(ColorUtils.isColorDark("invalid-color")).toBe(true);
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

        it("should return original color for invalid input", () => {
            const result = ColorUtils.combineColorWithOpacity(
                "invalid-color",
                0.5
            );
            expect(result).toBe("invalid-color");
        });

        it("should clamp opacity to valid range", () => {
            const result = ColorUtils.combineColorWithOpacity(
                "rgb(255, 0, 0)",
                1.5
            );
            expect(result).toBe("rgba(255, 0, 0, 1)");
        });

        it("should handle negative opacity", () => {
            const result = ColorUtils.combineColorWithOpacity(
                "rgb(255, 0, 0)",
                -0.5
            );
            expect(result).toBe("rgba(255, 0, 0, 0)");
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

        it("should use default background color when not provided", () => {
            const result = ColorUtils.generateTextShadow();
            expect(result).toContain("rgba(255, 255, 255");
        });

        it("should respect custom intensity values", () => {
            const result = ColorUtils.generateTextShadow("rgb(0, 0, 0)", 0.5);
            expect(result).toContain("0.5)");
        });

        it("should clamp intensity to valid range", () => {
            const result1 = ColorUtils.generateTextShadow("rgb(0, 0, 0)", -0.5);
            expect(result1).toContain("0)");

            const result2 = ColorUtils.generateTextShadow("rgb(0, 0, 0)", 1.5);
            expect(result2).toContain("1)");
        });

        it("should generate multiple shadow values", () => {
            const result = ColorUtils.generateTextShadow("rgb(0, 0, 0)");
            const shadowCount = (result.match(/px/g) || []).length;
            expect(shadowCount).toBeGreaterThan(1);
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

        it("should return 1 for null input", () => {
            const result = ColorUtils.extractOpacityFromColor(null as any);
            expect(result).toBe(1);
        });

        it("should return 1 for undefined input", () => {
            const result = ColorUtils.extractOpacityFromColor(undefined as any);
            expect(result).toBe(1);
        });

        it("should return 1 for non-string input", () => {
            const result = ColorUtils.extractOpacityFromColor(123 as any);
            expect(result).toBe(1);
        });

        it("should handle malformed rgba strings", () => {
            const result =
                ColorUtils.extractOpacityFromColor("rgba(255, 0, 0)");
            expect(result).toBe(1);
        });

        it("should clamp extracted opacity to valid range", () => {
            const result = ColorUtils.extractOpacityFromColor(
                "rgba(255, 0, 0, 1.5)"
            );
            expect(result).toBe(1);
        });
    });

    describe("normalizeOpacity", () => {
        it("should return decimal values as-is when in valid range", () => {
            expect(ColorUtils.normalizeOpacity(0.5)).toBe(0.5);
            expect(ColorUtils.normalizeOpacity(0)).toBe(0);
            expect(ColorUtils.normalizeOpacity(1)).toBe(1);
        });

        it("should clamp decimal values to valid range", () => {
            expect(ColorUtils.normalizeOpacity(-0.5)).toBe(0);
            expect(ColorUtils.normalizeOpacity(1.5)).toBe(1);
        });

        it("should convert percentage values correctly", () => {
            expect(ColorUtils.normalizeOpacity(50, true)).toBe(0.5);
            expect(ColorUtils.normalizeOpacity(0, true)).toBe(0);
            expect(ColorUtils.normalizeOpacity(100, true)).toBe(1);
        });

        it("should clamp percentage values to valid range", () => {
            expect(ColorUtils.normalizeOpacity(-50, true)).toBe(0);
            expect(ColorUtils.normalizeOpacity(150, true)).toBe(1);
        });

        it("should return default opacity for invalid inputs", () => {
            expect(ColorUtils.normalizeOpacity(NaN)).toBe(0.7);
            expect(ColorUtils.normalizeOpacity("invalid" as any)).toBe(0.7);
            expect(ColorUtils.normalizeOpacity(null as any)).toBe(0.7);
            expect(ColorUtils.normalizeOpacity(undefined as any)).toBe(0.7);
        });
    });
});
