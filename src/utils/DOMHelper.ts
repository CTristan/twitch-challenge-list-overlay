import { CSS_CLASSES, CSS_SELECTORS } from "../types/DOMConstants";

/**
 * @class DOMHelper
 * Shared DOM manipulation routines to provide consistent DOM operations for challenge management.
 */
export default class DOMHelper {
    /**
     * Complete a challenge in the DOM by adding visual completion state
     * @param challengeId - ID of challenge to complete
     */
    static completeChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );

        for (const challengeElement of challengeElements) {
            challengeElement.classList.add(CSS_CLASSES.DONE);

            // Update checkbox to checked state
            const checkbox = challengeElement.querySelector(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            if (checkbox) {
                checkbox.classList.add(CSS_CLASSES.CHECKED);
            }
        }
    }

    /**
     * Delete a challenge from the DOM by removing its elements
     * @param challengeId - ID of challenge to delete
     */
    static deleteChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );

        for (const challengeElement of challengeElements) {
            challengeElement.remove();
        }
    }

    /**
     * Mark a challenge as failed in the DOM
     * @param challengeId - ID of challenge to mark as failed
     */
    static failChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );

        for (const challengeElement of challengeElements) {
            // Remove done state and add failed state
            challengeElement.classList.remove(CSS_CLASSES.DONE);
            challengeElement.classList.add(CSS_CLASSES.FAILED);

            // Update checkbox to show failed indicator (X)
            const checkbox = challengeElement.querySelector(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            if (checkbox) {
                checkbox.classList.remove(CSS_CLASSES.CHECKED);
                // The CSS will handle showing the X via ::after pseudo-element
            }
        }
    }

    /**
     * Revert a challenge back to active (in-progress) status in the DOM
     * @param challengeId - ID of challenge to revert
     */
    static revertChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );

        for (const challengeElement of challengeElements) {
            // Remove both done and failed states
            challengeElement.classList.remove(CSS_CLASSES.DONE);
            challengeElement.classList.remove(CSS_CLASSES.FAILED);

            // Update checkbox to unchecked state
            const checkbox = challengeElement.querySelector(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            if (checkbox) {
                checkbox.classList.remove(CSS_CLASSES.CHECKED);
            }
        }
    }

    /**
     * Create a challenge card element with header and ordered list
     * @param completedCount - Number of completed challenges
     * @param totalCount - Total number of challenges
     * @returns HTMLDivElement representing the challenge card
     */
    static createChallengeCard(
        completedCount: number = 0,
        totalCount: number = 0
    ): HTMLDivElement {
        const cardEl = document.createElement("div");
        cardEl.classList.add(CSS_CLASSES.CARD);

        const headerDiv = document.createElement("div");
        headerDiv.classList.add(CSS_CLASSES.USERNAME);
        headerDiv.innerText = `Challenges ${completedCount}/${totalCount}`;
        cardEl.appendChild(headerDiv);

        const list = document.createElement("ol");
        list.classList.add(CSS_CLASSES.CHALLENGES);
        cardEl.appendChild(list);

        return cardEl;
    }

    /**
     * Update challenge count display in all card headers
     * @param completedCount - Number of completed challenges
     * @param totalCount - Total number of challenges
     */
    static updateChallengeCount(
        completedCount: number,
        totalCount: number
    ): void {
        const cardHeaders = document.querySelectorAll(
            CSS_SELECTORS.CARD_HEADER
        );
        cardHeaders.forEach((header) => {
            if (header instanceof HTMLElement) {
                header.textContent = `Challenges ${completedCount}/${totalCount}`;
            }
        });
    }
}
