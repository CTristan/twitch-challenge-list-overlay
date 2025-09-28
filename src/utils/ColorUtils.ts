/**
 * @file ColorUtils.ts
 * Utility functions for color manipulation, brightness detection, and readability optimization
 * Used for background customization features in the challenge overlay
 */

/**
 * RGB color representation
 */
interface RGBColor {
    r: number;
    g: number;
    b: number;
}

/**
 * RGBA color representation with alpha channel
 */
export interface RGBAColor extends RGBColor {
    a: number;
}

/**
 * Parse a color string into RGB values
 * Supports hex (#ffffff, #fff), rgb(r,g,b), rgba(r,g,b,a), and named colors
 * @param color - Color string to parse
 * @returns RGB color object or null if parsing fails
 */
export function parseColor(color: string): RGBColor | null {
    if (!color || typeof color !== "string") {
        return null;
    }

    const trimmedColor = color.trim().toLowerCase();

    // Handle hex colors (#ffffff or #fff)
    if (trimmedColor.startsWith("#")) {
        const hex = trimmedColor.slice(1);

        if (hex.length === 3) {
            // Short hex format (#fff)
            const r = parseInt((hex[0] || "0") + (hex[0] || "0"), 16);
            const g = parseInt((hex[1] || "0") + (hex[1] || "0"), 16);
            const b = parseInt((hex[2] || "0") + (hex[2] || "0"), 16);
            return { r, g, b };
        } else if (hex.length === 6) {
            // Full hex format (#ffffff)
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return { r, g, b };
        }
    }

    // Handle rgb() and rgba() formats
    const rgbMatch = trimmedColor.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch && rgbMatch[1]) {
        const values = rgbMatch[1].split(",").map((v) => parseFloat(v.trim()));
        if (
            values.length >= 3 &&
            values[0] !== undefined &&
            values[1] !== undefined &&
            values[2] !== undefined
        ) {
            return {
                r: Math.round(Math.max(0, Math.min(255, values[0]))),
                g: Math.round(Math.max(0, Math.min(255, values[1]))),
                b: Math.round(Math.max(0, Math.min(255, values[2]))),
            };
        }
    }

    // Handle named colors by creating a temporary element
    try {
        const tempElement = document.createElement("div");
        tempElement.style.color = trimmedColor;
        document.body.appendChild(tempElement);

        const computedColor = window.getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);

        // Parse the computed rgb() value
        const computedMatch = computedColor.match(/rgb\(([^)]+)\)/);
        if (computedMatch && computedMatch[1]) {
            const values = computedMatch[1]
                .split(",")
                .map((v) => parseInt(v.trim(), 10));
            if (
                values.length === 3 &&
                values[0] !== undefined &&
                values[1] !== undefined &&
                values[2] !== undefined
            ) {
                return { r: values[0], g: values[1], b: values[2] };
            }
        }
    } catch (error) {
        console.warn("Failed to parse named color:", color, error);
    }

    return null;
}

/**
 * Calculate the relative luminance of a color according to WCAG guidelines
 * @param color - RGB color object
 * @returns Relative luminance value between 0 and 1
 */
export function calculateLuminance(color: RGBColor): number {
    // Convert RGB values to sRGB
    const rsRGB = color.r / 255;
    const gsRGB = color.g / 255;
    const bsRGB = color.b / 255;

    // Apply gamma correction
    const rLinear =
        rsRGB <= 0.03928
            ? rsRGB / 12.92
            : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear =
        gsRGB <= 0.03928
            ? gsRGB / 12.92
            : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear =
        bsRGB <= 0.03928
            ? bsRGB / 12.92
            : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determine if a color is considered dark based on its luminance
 * @param color - Color string or RGB object
 * @returns True if the color is dark, false if light
 */
export function isColorDark(color: string | RGBColor): boolean {
    const rgbColor = typeof color === "string" ? parseColor(color) : color;

    if (!rgbColor) {
        // Default to dark if we can't parse the color
        return true;
    }

    const luminance = calculateLuminance(rgbColor);
    // Threshold of 0.5 provides good contrast detection
    return luminance < 0.5;
}

/**
 * Calculate the optimal text color (white or black) for maximum readability on a given background
 * @param backgroundColor - Background color string or RGB object
 * @returns "#ffffff" for white text or "#000000" for black text
 */
export function calculateOptimalTextColor(
    backgroundColor: string | RGBColor
): string {
    return isColorDark(backgroundColor) ? "#ffffff" : "#000000";
}

/**
 * Convert a color and opacity into an RGBA string
 * @param color - Base color string
 * @param opacity - Opacity value between 0 and 1 (optional, preserves existing opacity if not provided)
 * @returns RGBA color string or original color if parsing fails
 */
export function combineColorWithOpacity(
    color: string,
    opacity?: number
): string {
    const rgbColor = parseColor(color);

    if (!rgbColor) {
        return color; // Return original if parsing fails
    }

    // If no opacity provided, try to extract existing opacity or default to 1
    const finalOpacity =
        opacity !== undefined ? opacity : extractOpacityFromColor(color);

    // Clamp opacity to valid range
    const clampedOpacity = Math.max(0, Math.min(1, finalOpacity));

    return `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${clampedOpacity})`;
}

/**
 * Validate and normalize an opacity value
 * @param opacity - Opacity value (can be 0-1 or 0-100)
 * @param isPercentage - Whether the input is a percentage (0-100) or decimal (0-1)
 * @returns Normalized opacity value between 0 and 1
 */
export function normalizeOpacity(
    opacity: number,
    isPercentage: boolean = false
): number {
    if (typeof opacity !== "number" || isNaN(opacity)) {
        return 0.7; // Default opacity
    }

    if (isPercentage) {
        // Convert percentage (0-100) to decimal (0-1)
        return Math.max(0, Math.min(1, opacity / 100));
    } else {
        // Clamp decimal value to valid range
        return Math.max(0, Math.min(1, opacity));
    }
}

/**
 * Extract opacity from an RGBA color string
 * @param color - Color string (rgba format)
 * @returns Opacity value between 0 and 1, or 1 if not found
 */
export function extractOpacityFromColor(color: string): number {
    if (!color || typeof color !== "string") {
        return 1;
    }

    const rgbaMatch = color
        .trim()
        .match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
    if (rgbaMatch && rgbaMatch[1]) {
        const opacity = parseFloat(rgbaMatch[1]);
        return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
    }

    return 1; // Default to fully opaque if no alpha channel found
}

/**
 * Generate CSS text shadow for enhanced readability
 * @param backgroundColor - Background color to determine shadow color
 * @param intensity - Shadow intensity (0-1, default 0.8)
 * @returns CSS text-shadow property value
 */
export function generateTextShadow(
    backgroundColor: string = "#000000",
    intensity: number = 0.8
): string {
    const isDarkBackground = isColorDark(backgroundColor);
    const shadowColor = isDarkBackground
        ? "rgba(255, 255, 255, "
        : "rgba(0, 0, 0, ";
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    // Create multiple shadows for better readability
    return [
        `1px 1px 2px ${shadowColor}${clampedIntensity})`,
        `-1px -1px 2px ${shadowColor}${clampedIntensity})`,
        `1px -1px 2px ${shadowColor}${clampedIntensity})`,
        `-1px 1px 2px ${shadowColor}${clampedIntensity})`,
    ].join(", ");
}
