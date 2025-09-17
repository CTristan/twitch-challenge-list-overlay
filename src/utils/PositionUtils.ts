/**
 * Simple utility functions for position-based challenge references
 * Replaces the PositionManager class with lightweight direct array indexing
 */

/**
 * Parse user position input to array index
 * @param input - User input (e.g., "1", "3", "5")
 * @returns Array index (0-based) or null if invalid
 */
export function parseUserPosition(input: string): number | null {
    if (typeof input !== "string" || input.trim() === "") {
        return null;
    }

    const parsed = parseInt(input.trim(), 10);
    if (
        isNaN(parsed) ||
        parsed <= 0 ||
        !Number.isInteger(parsed) ||
        parsed.toString() !== input.trim()
    ) {
        return null;
    }

    return parsed - 1; // Convert from 1-based to 0-based
}

/**
 * Validate user position input
 * @param input - User input to validate
 * @returns Whether the input is a valid position
 */
export function isValidUserPosition(input: string): boolean {
    return parseUserPosition(input) !== null;
}

/**
 * Get challenge by user position
 * @param challenges - Array of challenges
 * @param position - User position (e.g., "1", "3")
 * @returns Challenge if found, null otherwise
 */
export function getChallengeByPosition<T>(
    challenges: T[],
    position: string
): T | null {
    const index = parseUserPosition(position);
    if (index === null || index >= challenges.length) {
        return null;
    }
    const challenge = challenges[index];
    return challenge !== undefined ? challenge : null;
}

/**
 * Get challenge and index by user position
 * @param challenges - Array of challenges
 * @param position - User position (e.g., "1", "3")
 * @returns Object with challenge and index if found, null otherwise
 */
export function getChallengeWithIndex<T>(
    challenges: T[],
    position: string
): { challenge: T; index: number } | null {
    const index = parseUserPosition(position);
    if (index === null || index >= challenges.length) {
        return null;
    }
    const challenge = challenges[index];
    if (challenge === undefined) {
        return null;
    }
    return { challenge, index };
}

/**
 * Format array index as display position
 * @param index - Array index (0-based)
 * @returns Display position (1-based)
 */
export function formatDisplayPosition(index: number): string {
    if (typeof index !== "number" || index < 0 || !Number.isInteger(index)) {
        throw new Error("Index must be a non-negative integer");
    }
    return (index + 1).toString();
}

/**
 * Parse comma-separated position list
 * @param input - Comma-separated positions (e.g., "1,3,5")
 * @returns Array of valid array indices
 */
export function parsePositionList(input: string): number[] {
    if (!input) return [];

    return input
        .split(",")
        .map((pos) => parseUserPosition(pos.trim()))
        .filter((index): index is number => index !== null);
}

/**
 * Get challenges by position list
 * @param challenges - Array of challenges
 * @param positions - Comma-separated positions
 * @returns Array of found challenges
 */
export function getChallengesByPositions<T>(
    challenges: T[],
    positions: string
): T[] {
    const indices = parsePositionList(positions);
    return indices
        .filter((index) => index < challenges.length)
        .map((index) => {
            const challenge = challenges[index];
            if (challenge === undefined) {
                throw new Error(`Challenge at index ${index} is undefined`);
            }
            return challenge;
        });
}
