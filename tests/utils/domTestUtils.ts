import { expect } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";
import { resetIDManager } from "./chatHandlerTestUtils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Test data structure for challenge scenarios
 */
export interface ChallengeTestData {
    title: string;
    description: string;
    command: string;
}

/**
 * DOM assertion options for challenge validation
 */
export interface DOMAssertionOptions {
    expectDescription?: boolean;
    validateSeparateElements?: boolean;
    validateCSSClasses?: boolean;
}

// ============================================================================
// TEST DATA CONSTANTS
// ============================================================================

/**
 * Standard test challenge data for consistent testing
 */
export const TEST_CHALLENGE_DATA: Record<string, ChallengeTestData> = {
    TITLE_AND_DESC: {
        title: "Testing Descriptions",
        description: "Should see a description for this challenge!",
        command: 'add t="Testing Descriptions" d="Should see a description for this challenge!"',
    },
    TITLE_ONLY: {
        title: "Title Only Challenge",
        description: "",
        command: 'add title="Title Only Challenge"',
    },
    SIMPLE_CHALLENGE: {
        title: "Simple Challenge",
        description: "Simple Challenge", // Same as title for legacy behavior
        command: "add Simple Challenge",
    },
} as const;

// ============================================================================
// DOM SETUP HELPERS
// ============================================================================

/**
 * Sets up standard DOM structure required for challenge rendering tests
 */
export const setupChallengeTestDOM = (): void => {
    document.body.innerHTML = `
        <div class="challenge-container primary"></div>
        <div class="challenge-container secondary"></div>
    `;
};

/**
 * Creates a fresh app instance with proper test isolation
 * @param storeName - Optional store name for localStorage isolation
 * @returns Object containing app and challengeList instances
 */
export const createTestApp = (storeName: string = "TestStore"): {
    app: App;
    challengeList: ChallengeList;
} => {
    // Clear localStorage to avoid conflicts with existing data
    localStorage.clear();
    
    // Set up DOM structure
    setupChallengeTestDOM();
    
    // Reset IDManager singleton for test isolation
    resetIDManager();
    
    // Create fresh app instance
    const app = new App(storeName);
    const challengeList = app.challengeList;
    challengeList.clearChallengeList();
    
    return { app, challengeList };
};

// ============================================================================
// DOM ASSERTION HELPERS
// ============================================================================

/**
 * Asserts that DOM contains proper challenge structure with title and description elements
 * @param expectedTitle - Expected title text content
 * @param expectedDescription - Expected description text content (empty string for no description)
 * @param options - Additional assertion options
 */
export const assertChallengeDOMStructure = (
    expectedTitle: string,
    expectedDescription: string,
    options: DOMAssertionOptions = {}
): void => {
    const {
        expectDescription = expectedDescription.length > 0 && expectedDescription !== expectedTitle,
        validateSeparateElements = true,
        validateCSSClasses = true,
    } = options;

    const textElements = document.querySelectorAll(".challenge-text");
    expect(textElements.length).toBeGreaterThan(0);

    textElements.forEach((textElement) => {
        // Validate title element
        const titleElement = textElement.querySelector(".challenge-title");
        expect(titleElement).toBeTruthy();
        expect(titleElement?.textContent).toBe(expectedTitle);

        // Validate description element based on expectations
        const descriptionElement = textElement.querySelector(".challenge-description");
        
        if (expectDescription) {
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe(expectedDescription);
            
            if (validateSeparateElements) {
                // Ensure title and description are different when both exist
                expect(expectedTitle).not.toBe(expectedDescription);
            }
        } else {
            // No description element should exist for title-only or legacy challenges
            expect(descriptionElement).toBeNull();
        }

        // Validate CSS classes if requested
        if (validateCSSClasses) {
            expect(titleElement?.classList.contains("challenge-title")).toBe(true);
            if (expectDescription && descriptionElement) {
                expect(descriptionElement.classList.contains("challenge-description")).toBe(true);
            }
        }
    });
};

/**
 * Asserts that a challenge was created with expected properties in the challenge list
 * @param challengeList - ChallengeList instance to validate
 * @param expectedTitle - Expected challenge title
 * @param expectedDescription - Expected challenge description
 * @param expectedCount - Expected total number of challenges (default: 1)
 */
export const assertChallengeCreated = (
    challengeList: ChallengeList,
    expectedTitle: string,
    expectedDescription: string,
    expectedCount: number = 1
): void => {
    expect(challengeList.challenges.length).toBe(expectedCount);

    const challenge = challengeList.challenges[expectedCount - 1]; // Get the last added challenge
    expect(challenge.title).toBe(expectedTitle);
    expect(challenge.description).toBe(expectedDescription);
};

/**
 * Validates the complete challenge creation flow including command execution, 
 * challenge list updates, and DOM rendering
 * @param app - App instance
 * @param challengeList - ChallengeList instance
 * @param testData - Test data containing title, description, and command
 * @param response - Command execution response to validate
 */
export const validateCompleteChallengFlow = (
    app: App,
    challengeList: ChallengeList,
    testData: ChallengeTestData,
    response: { error: boolean; message: string }
): void => {
    // Validate command response
    expect(response.error).toBe(false);
    expect(response.message).toContain(testData.title);

    // Validate challenge was added to list
    assertChallengeCreated(challengeList, testData.title, testData.description);

    // Validate DOM structure
    assertChallengeDOMStructure(testData.title, testData.description);
};

/**
 * Asserts that challenge elements have proper styling and layout structure
 * @param expectTwoLineLayout - Whether to expect two-line layout (title + description)
 */
export const assertChallengeLayoutStructure = (expectTwoLineLayout: boolean = true): void => {
    const textElements = document.querySelectorAll(".challenge-text");
    expect(textElements.length).toBeGreaterThan(0);

    textElements.forEach((textElement) => {
        // Validate container structure
        expect(textElement.tagName).toBe("DIV");
        expect(textElement.classList.contains("challenge-text")).toBe(true);

        // Validate title element structure
        const titleElement = textElement.querySelector(".challenge-title") as HTMLElement;
        expect(titleElement).toBeTruthy();
        expect(titleElement.tagName).toBe("DIV");
        expect(titleElement.classList.contains("challenge-title")).toBe(true);

        // Validate description element structure based on layout expectation
        const descriptionElement = textElement.querySelector(".challenge-description") as HTMLElement;
        
        if (expectTwoLineLayout) {
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement.tagName).toBe("DIV");
            expect(descriptionElement.classList.contains("challenge-description")).toBe(true);
        } else {
            expect(descriptionElement).toBeNull();
        }
    });
};

/**
 * Validates that challenge row structure is properly aligned with checkboxes
 */
export const assertChallengeRowAlignment = (): void => {
    const challengeRow = document.querySelector(".challenge") as HTMLElement;
    const checkbox = challengeRow?.querySelector(".challenge-checkbox") as HTMLElement;
    const textElement = challengeRow?.querySelector(".challenge-text") as HTMLElement;

    expect(challengeRow).toBeTruthy();
    expect(checkbox).toBeTruthy();
    expect(textElement).toBeTruthy();

    // Verify proper CSS class structure for alignment
    expect(challengeRow.classList.contains("challenge")).toBe(true);
    expect(checkbox.classList.contains("challenge-checkbox")).toBe(true);
    expect(textElement.classList.contains("challenge-text")).toBe(true);
};
