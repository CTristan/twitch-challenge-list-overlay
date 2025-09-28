import Challenge from "../classes/Challenge";

/**
 * Get a value from an array by rotating through it based on an index
 * @param index - The index to use for rotating (0-based)
 * @param values - Array of values to rotate through
 * @returns The value at the rotated index or null if no values configured
 */
function getRotatingArrayValue<T>(index: number, values: T[]): T | null {
    if (!values || values.length === 0) return null;
    const value = values[index % values.length];
    return value !== undefined ? value : null;
}

/**
 * @class ChallengeRenderer
 * Shared utilities for challenge DOM creation and styling to eliminate duplication
 * between App.ts and UIUpdateHandler.ts rendering logic.
 *
 * This class provides a single source of truth for challenge DOM structure and styling,
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

        // Add progress display only when amount > 1
        if (challenge.amount > 1) {
            const progressElement = document.createElement("div");
            progressElement.classList.add("challenge-amount");
            progressElement.textContent = `${challenge.progress}/${challenge.amount}`;
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

    /**
     * Apply row colors (background and text) to a challenge list item
     * @param listItem - The challenge list item element
     * @param rowIndex - The index of the row (0-based)
     * @param rowColors - Array of background color values to rotate through
     * @param rowTextColors - Array of text color values to rotate through
     * @returns The text color string or null if no text colors configured
     */
    static applyChallengeRowColors(
        listItem: HTMLElement,
        rowIndex: number,
        rowColors: string[],
        rowTextColors: string[]
    ): string | null {
        // Apply row background color if configured
        const backgroundColor = getRotatingArrayValue(rowIndex, rowColors);
        if (backgroundColor) {
            listItem.style.backgroundColor = backgroundColor;
        }

        // Get row text color if configured
        const textColor = getRotatingArrayValue(rowIndex, rowTextColors);
        return textColor;
    }

    /**
     * Apply color styling to a challenge checkbox element
     * @param checkbox - The checkbox element to style
     * @param textColor - The text color to apply, or null if no color configured
     */
    static decorateChallengeCheckbox(
        checkbox: HTMLElement,
        textColor: string | null
    ): void {
        if (textColor) {
            checkbox.style.setProperty(
                "--challenge-checkbox-border-color",
                textColor
            );
            checkbox.style.setProperty(
                "--challenge-checkbox-checked-border-color",
                textColor
            );
            checkbox.style.setProperty(
                "--challenge-checkbox-checkmark-color",
                textColor
            );
        }
    }

    /**
     * Apply text color styling to a challenge text element and its children
     * @param textElement - The text element containing challenge content
     * @param textColor - The text color to apply, or null if no color configured
     */
    static applyChallengeTextColors(
        textElement: HTMLElement,
        textColor: string | null
    ): void {
        if (textColor) {
            textElement.style.color = textColor;
            // Also apply to child elements
            const titleElement = textElement.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            ) as HTMLElement;
            const progressElement = textElement.querySelector(
                ".challenge-amount"
            ) as HTMLElement;
            if (titleElement) titleElement.style.color = textColor;
            if (descriptionElement) descriptionElement.style.color = textColor;
            if (progressElement) progressElement.style.color = textColor;
        }
    }
}

export default ChallengeRenderer;
