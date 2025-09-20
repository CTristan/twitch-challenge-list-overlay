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
            challengeElement.classList.add("done");

            // Update checkbox to checked state
            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            );
            if (checkbox) {
                checkbox.classList.add("checked");
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
     * Revert a completed challenge back to active status in the DOM
     * @param challengeId - ID of challenge to revert
     */
    static revertChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );

        for (const challengeElement of challengeElements) {
            challengeElement.classList.remove("done");

            // Update checkbox to unchecked state
            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            );
            if (checkbox) {
                checkbox.classList.remove("checked");
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
        cardEl.classList.add("card");

        const headerDiv = document.createElement("div");
        headerDiv.classList.add("username");
        headerDiv.innerText = `Challenges ${completedCount}/${totalCount}`;
        cardEl.appendChild(headerDiv);

        const list = document.createElement("ol");
        list.classList.add("challenges");
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
        const cardHeaders = document.querySelectorAll(".card .username");
        cardHeaders.forEach((header) => {
            if (header instanceof HTMLElement) {
                header.textContent = `Challenges ${completedCount}/${totalCount}`;
            }
        });
    }
}
