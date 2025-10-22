/**
 * @file StorageConstants.ts
 * Centralized localStorage key constants for the Twitch Challenge Overlay application.
 * All localStorage keys use a consistent prefix for easy identification and cleanup.
 */

/**
 * Application-wide localStorage key prefix
 * Used to namespace all application data and enable bulk operations
 */
export const LOCALSTORAGE_PREFIX = "twitch-overlay-" as const;

/**
 * Core application localStorage keys
 * All keys are prefixed with LOCALSTORAGE_PREFIX for consistency
 */
export const STORAGE_KEYS = {
    /**
     * Main configuration data (auth, behavior, colors, background)
     * Managed by ConfigManager
     */
    CONFIG: `${LOCALSTORAGE_PREFIX}config`,

    /**
     * Challenge list data (all challenges and their state)
     * Managed by ChallengeList
     */
    CHALLENGE_LIST: `${LOCALSTORAGE_PREFIX}challenge-list`,

    /**
     * Test mode challenge list data (isolated from production data)
     * Used when ?test=true URL parameter is present
     * Managed by ChallengeList
     */
    CHALLENGE_LIST_TEST: `${LOCALSTORAGE_PREFIX}test-challenge-list`,

    /**
     * Configuration Settings panel collapsed state
     * Managed by AdminPanel
     */
    CONFIG_SETTINGS_COLLAPSED: `${LOCALSTORAGE_PREFIX}config-settings-collapsed`,

    /**
     * General Settings section collapsed state
     * Managed by CollapsibleSection
     */
    BEHAVIOR_SECTION_COLLAPSED: `${LOCALSTORAGE_PREFIX}behavior-section`,

    /**
     * Challenge Row Styling section collapsed state
     * Managed by CollapsibleSection
     */
    CHALLENGE_ROW_STYLING_SECTION_COLLAPSED: `${LOCALSTORAGE_PREFIX}challenge-row-styling-section`,

    /**
     * Overlay Background section collapsed state
     * Managed by CollapsibleSection
     */
    OVERLAY_BACKGROUND_SECTION_COLLAPSED: `${LOCALSTORAGE_PREFIX}overlay-background-section`,

    /**
     * Authentication section collapsed state
     * Managed by CollapsibleSection
     */
    AUTHENTICATION_SECTION_COLLAPSED: `${LOCALSTORAGE_PREFIX}authentication-section`,
} as const;

/**
 * Type for storage key values
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Get all application localStorage keys
 * @returns Array of all localStorage keys used by the application
 */
export function getAllStorageKeys(): readonly StorageKey[] {
    return Object.values(STORAGE_KEYS);
}

/**
 * Check if a localStorage key belongs to this application
 * @param key - The localStorage key to check
 * @returns True if the key starts with the application prefix
 */
export function isApplicationKey(key: string): boolean {
    return key.startsWith(LOCALSTORAGE_PREFIX);
}

/**
 * Clear all application localStorage data
 * Removes all keys with the application prefix
 * @returns Number of keys removed
 */
export function clearAllApplicationData(): number {
    let removedCount = 0;

    try {
        const keysToRemove: string[] = [];

        // Collect all application keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && isApplicationKey(key)) {
                keysToRemove.push(key);
            }
        }

        // Remove all collected keys
        keysToRemove.forEach((key) => {
            localStorage.removeItem(key);
            removedCount++;
        });

        return removedCount;
    } catch (error) {
        console.error(
            "[StorageConstants] Error clearing application data:",
            error
        );
        return removedCount;
    }
}
