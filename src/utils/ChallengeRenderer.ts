import Challenge from "../classes/Challenge";

/**
 * @class ChallengeRenderer
 * Shared utilities for challenge DOM creation to eliminate duplication
 * between App.ts and UIUpdateHandler.ts rendering logic.
 *
 * This class provides a single source of truth for challenge DOM structure,
 * ensuring consistent layout and styling across different rendering contexts.
 */
export class ChallengeRenderer {
    /**
     * Create DOM structure for challenge text with title and description on separate lines
     * @param challenge - The challenge object
     * @returns DOM element containing the formatted challenge text (without timer)
     */
    static createChallengeTextElement(challenge: Challenge): HTMLElement {
        const textContainer = document.createElement("div");
        textContainer.classList.add("challenge-text");

        // Create title element
        const titleElement = document.createElement("div");
        titleElement.classList.add("challenge-title");
        titleElement.textContent = challenge.title;
        textContainer.appendChild(titleElement);

        // Add description if it's different from title and not empty
        if (
            challenge.title !== challenge.description &&
            challenge.description &&
            challenge.description.trim() !== ""
        ) {
            const descriptionElement = document.createElement("div");
            descriptionElement.classList.add("challenge-description");
            descriptionElement.textContent = challenge.description;
            textContainer.appendChild(descriptionElement);
        }

        // Add progress if it's greater than 1
        if (challenge.amount > 1) {
            const progressElement = document.createElement("div");
            progressElement.classList.add("challenge-amount");
            progressElement.textContent = `Progress: ${challenge.progress}/${challenge.amount}`;
            textContainer.appendChild(progressElement);
        }

        return textContainer;
    }

    /**
     * Create a checkbox element for a challenge
     * @param isChecked - Whether the checkbox should be checked
     * @returns The checkbox element
     */
    static createChallengeCheckbox(isChecked: boolean = false): HTMLDivElement {
        const checkbox = document.createElement("div");
        checkbox.classList.add("challenge-checkbox");
        if (isChecked) {
            checkbox.classList.add("checked");
        }
        return checkbox;
    }

    /**
     * Create a complete challenge list item element with all components
     * @param challenge - Challenge to create element for
     * @param options - Optional configuration for element creation
     * @returns HTMLElement representing the complete challenge
     */
    static createChallengeElement(
        challenge: Challenge,
        options: {
            includeEventListeners?: boolean;
            eventHandler?: (event: Event) => void;
        } = {}
    ): HTMLElement {
        const challengeElement = document.createElement("li");
        challengeElement.className = `challenge ${
            challenge.isComplete() ? "done" : ""
        }`;
        challengeElement.dataset["challengeId"] = challenge.id;

        // Create checkbox
        const checkbox = this.createChallengeCheckbox(challenge.isComplete());

        // Add event listener if requested
        if (options.includeEventListeners && options.eventHandler) {
            checkbox.addEventListener("click", options.eventHandler);
        }

        // Create challenge text
        const textElement = this.createChallengeTextElement(challenge);

        // Assemble the challenge element
        challengeElement.appendChild(checkbox);
        challengeElement.appendChild(textElement);

        return challengeElement;
    }
}

export default ChallengeRenderer;
