import Challenge from "../classes/Challenge";
import {
    BACKGROUND_NUMERIC_CONSTANTS,
    CSS_CUSTOM_PROPERTIES,
} from "../types/ConfigConstants";
import {
    CHALLENGE_STATES,
    CSS_CLASSES,
    CSS_SELECTORS,
    DATA_ATTRIBUTES,
    EVENT_NAMES,
    HTML_ATTRIBUTE_NAMES,
    HTML_ATTRIBUTES,
    HTML_ELEMENTS,
} from "../types/DOMConstants";
import { ARIA_LABELS, UI_ELEMENTS } from "../types/MessageConstants";
import {
    calculateOptimalTextColor,
    combineColorWithOpacity,
    generateTextShadow,
    isColorDark,
} from "./ColorUtils";

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
     * @param displayPosition - Optional 1-based position number to display as prefix (e.g., "1. ", "2. ")
     * @returns DOM element containing the formatted challenge text (without timer)
     */
    static createChallengeTextElement(
        challenge: Challenge,
        displayPosition?: number
    ): HTMLElement {
        const textContainer = document.createElement(HTML_ELEMENTS.DIV);
        textContainer.classList.add(CSS_CLASSES.CHALLENGE_TEXT);

        // Create title element with optional position prefix
        const titleElement = document.createElement(HTML_ELEMENTS.DIV);
        titleElement.classList.add(CSS_CLASSES.CHALLENGE_TITLE);
        const titlePrefix =
            displayPosition !== undefined ? `${displayPosition}. ` : "";
        titleElement.textContent = `${titlePrefix}${challenge.title}`;
        textContainer.appendChild(titleElement);

        // Add description if it's different from title and not empty
        if (
            challenge.title !== challenge.description &&
            challenge.description &&
            challenge.description.trim() !== ""
        ) {
            const descriptionElement = document.createElement(
                HTML_ELEMENTS.DIV
            );
            descriptionElement.classList.add(CSS_CLASSES.CHALLENGE_DESCRIPTION);
            descriptionElement.textContent = challenge.description;
            textContainer.appendChild(descriptionElement);
        }

        // Create metadata row for amount and timer (if either exists)
        const hasAmount = challenge.amount > 1;
        const hasTimer = challenge.timer && challenge.timer.isActive;

        if (hasAmount || hasTimer) {
            const metadataRow = document.createElement(HTML_ELEMENTS.DIV);
            metadataRow.classList.add(CSS_CLASSES.CHALLENGE_METADATA);

            // Add progress display only when amount > 1
            if (hasAmount) {
                const progressElement = document.createElement(
                    HTML_ELEMENTS.DIV
                );
                progressElement.classList.add(CSS_CLASSES.CHALLENGE_AMOUNT);
                progressElement.textContent = `${challenge.progress}/${challenge.amount}`;
                metadataRow.appendChild(progressElement);
            }

            textContainer.appendChild(metadataRow);
        }

        return textContainer;
    }

    /**
     * Create a checkbox element for a challenge
     * @param isChecked - Whether the checkbox should be checked
     * @returns The checkbox element
     */
    static createChallengeCheckbox(isChecked: boolean = false): HTMLDivElement {
        const checkbox = document.createElement(HTML_ELEMENTS.DIV);
        checkbox.classList.add(CSS_CLASSES.CHALLENGE_CHECKBOX);
        if (isChecked) {
            checkbox.classList.add(CSS_CLASSES.CHECKED);
        }
        return checkbox;
    }

    /**
     * Create an edit icon element for a challenge
     * @returns The edit icon element
     */
    static createChallengeEditIcon(): HTMLDivElement {
        const editIcon = document.createElement(HTML_ELEMENTS.DIV);
        editIcon.classList.add(CSS_CLASSES.CHALLENGE_EDIT_ICON);
        editIcon.textContent = UI_ELEMENTS.EDIT_ICON;
        editIcon.setAttribute(
            HTML_ATTRIBUTE_NAMES.ROLE,
            HTML_ATTRIBUTES.ROLE_BUTTON
        );
        editIcon.setAttribute(
            HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
            ARIA_LABELS.EDIT_CHALLENGE
        );
        editIcon.setAttribute(
            HTML_ATTRIBUTE_NAMES.TABINDEX,
            HTML_ATTRIBUTES.TABINDEX_ZERO
        );
        return editIcon;
    }

    /**
     * Create an increment button element for a challenge
     * @returns The increment button element
     */
    static createChallengeIncrementButton(): HTMLDivElement {
        const incrementButton = document.createElement(HTML_ELEMENTS.DIV);
        incrementButton.classList.add(CSS_CLASSES.CHALLENGE_INCREMENT_BUTTON);
        incrementButton.textContent = UI_ELEMENTS.INCREMENT_BUTTON;
        incrementButton.setAttribute(
            HTML_ATTRIBUTE_NAMES.ROLE,
            HTML_ATTRIBUTES.ROLE_BUTTON
        );
        incrementButton.setAttribute(
            HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
            ARIA_LABELS.INCREMENT_PROGRESS
        );
        incrementButton.setAttribute(
            HTML_ATTRIBUTE_NAMES.TABINDEX,
            HTML_ATTRIBUTES.TABINDEX_ZERO
        );
        return incrementButton;
    }

    /**
     * Create a decrement button element for a challenge
     * @returns The decrement button element
     */
    static createChallengeDecrementButton(): HTMLDivElement {
        const decrementButton = document.createElement(HTML_ELEMENTS.DIV);
        decrementButton.classList.add(CSS_CLASSES.CHALLENGE_DECREMENT_BUTTON);
        decrementButton.textContent = UI_ELEMENTS.DECREMENT_BUTTON;
        decrementButton.setAttribute(
            HTML_ATTRIBUTE_NAMES.ROLE,
            HTML_ATTRIBUTES.ROLE_BUTTON
        );
        decrementButton.setAttribute(
            HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
            ARIA_LABELS.DECREMENT_PROGRESS
        );
        decrementButton.setAttribute(
            HTML_ATTRIBUTE_NAMES.TABINDEX,
            HTML_ATTRIBUTES.TABINDEX_ZERO
        );
        return decrementButton;
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
            editHandler?: (event: Event) => void;
            incrementHandler?: (event: Event) => void;
            decrementHandler?: (event: Event) => void;
            displayPosition?: number;
        } = {}
    ): HTMLElement {
        const challengeElement = document.createElement(HTML_ELEMENTS.LI);

        // Apply appropriate state class based on challenge state
        const state = challenge.getState();
        let stateClass = "";
        if (state === CHALLENGE_STATES.DONE) {
            stateClass = CSS_CLASSES.DONE;
        } else if (state === CHALLENGE_STATES.FAILED) {
            stateClass = CSS_CLASSES.FAILED;
        }

        challengeElement.className = `${CSS_CLASSES.CHALLENGE} ${stateClass}`;
        challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] = challenge.id;

        // Create checkbox
        const checkbox = this.createChallengeCheckbox(challenge.isComplete());

        // Add event listener if requested
        if (options.includeEventListeners && options.eventHandler) {
            checkbox.addEventListener(EVENT_NAMES.CLICK, options.eventHandler);
        }

        // Create challenge text with optional display position
        const textElement = this.createChallengeTextElement(
            challenge,
            options.displayPosition
        );

        // Assemble the challenge element
        challengeElement.appendChild(checkbox);

        // Create and add edit icon only if edit handler is provided (admin mode only)
        if (options.editHandler) {
            const editIcon = this.createChallengeEditIcon();
            editIcon.addEventListener(EVENT_NAMES.CLICK, options.editHandler);
            challengeElement.appendChild(editIcon);
        }

        // Create and add increment/decrement buttons only if handlers are provided (admin mode only)
        // and challenge has progress tracking (amount > 1)
        if (challenge.amount > 1) {
            if (options.incrementHandler) {
                const incrementButton = this.createChallengeIncrementButton();
                incrementButton.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.incrementHandler
                );
                challengeElement.appendChild(incrementButton);
            }

            if (options.decrementHandler) {
                const decrementButton = this.createChallengeDecrementButton();
                decrementButton.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.decrementHandler
                );
                challengeElement.appendChild(decrementButton);
            }
        }

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
                CSS_CUSTOM_PROPERTIES.CHALLENGE_CHECKBOX_BORDER_COLOR,
                textColor
            );
            checkbox.style.setProperty(
                CSS_CUSTOM_PROPERTIES.CHALLENGE_CHECKBOX_CHECKED_BORDER_COLOR,
                textColor
            );
            checkbox.style.setProperty(
                CSS_CUSTOM_PROPERTIES.CHALLENGE_CHECKBOX_CHECKMARK_COLOR,
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
                CSS_SELECTORS.CHALLENGE_TITLE
            ) as HTMLElement;
            const descriptionElement = textElement.querySelector(
                CSS_SELECTORS.CHALLENGE_DESCRIPTION
            ) as HTMLElement;
            const progressElement = textElement.querySelector(
                CSS_SELECTORS.CHALLENGE_AMOUNT
            ) as HTMLElement;
            if (titleElement) titleElement.style.color = textColor;
            if (descriptionElement) descriptionElement.style.color = textColor;
            if (progressElement) progressElement.style.color = textColor;
        }
    }

    /**
     * Apply background customization to a challenge element
     * @param challengeElement - The challenge element to style
     * @param config - Configuration object with background settings
     * @param rowIndex - Optional row index for row-specific colors (overrides global settings)
     * @param rowColors - Optional array of row-specific background colors
     * @param rowTextColors - Optional array of row-specific text colors
     * @param rowColorsOpacity - Optional opacity for row colors (0-1, default: 1.0)
     */
    static applyBackgroundCustomization(
        challengeElement: HTMLElement,
        config: {
            challengeBackgroundColor?: string;
            challengeBackgroundOpacity?: number;
            challengeTextColor?: string;
            challengeAutoTextColor?: boolean;
            challengeTextShadow?: boolean;
        },
        rowIndex?: number,
        rowColors?: string[],
        rowTextColors?: string[],
        rowColorsOpacity?: number
    ): void {
        // Check if row-specific colors should override global settings
        const hasRowColors = rowColors && rowColors.length > 0;
        const hasRowTextColors = rowTextColors && rowTextColors.length > 0;

        let finalBackgroundColor: string | null = null;
        let finalTextColor: string | null = null;

        if (hasRowColors && rowIndex !== undefined) {
            // Use row-specific background color with opacity
            const baseColor = getRotatingArrayValue(rowIndex, rowColors);
            if (baseColor) {
                const opacity = rowColorsOpacity ?? 1.0;
                finalBackgroundColor = combineColorWithOpacity(
                    baseColor,
                    opacity
                );
            }
        } else if (config.challengeBackgroundColor) {
            // Use global background color with opacity
            const opacity =
                config.challengeBackgroundOpacity ??
                BACKGROUND_NUMERIC_CONSTANTS.DEFAULT_OPACITY;
            finalBackgroundColor = combineColorWithOpacity(
                config.challengeBackgroundColor,
                opacity
            );
        }

        if (hasRowTextColors && rowIndex !== undefined) {
            // Use row-specific text color
            finalTextColor = getRotatingArrayValue(rowIndex, rowTextColors);
        } else if (config.challengeAutoTextColor && finalBackgroundColor) {
            // Calculate optimal text color based on background
            finalTextColor = calculateOptimalTextColor(finalBackgroundColor);
        } else if (config.challengeTextColor) {
            // Use manual text color override
            finalTextColor = config.challengeTextColor;
        }

        // Apply background color
        if (finalBackgroundColor) {
            challengeElement.style.backgroundColor = finalBackgroundColor;
            challengeElement.classList.add(CSS_CLASSES.CUSTOM_BACKGROUND);
        }

        // Apply text color and styling
        const textElement = challengeElement.querySelector(
            CSS_SELECTORS.CHALLENGE_TEXT
        ) as HTMLElement;
        if (textElement && finalTextColor) {
            ChallengeRenderer.applyChallengeTextColors(
                textElement,
                finalTextColor
            );

            // Apply text shadow for enhanced readability if enabled
            if (config.challengeTextShadow) {
                const shadowStyle = generateTextShadow(finalTextColor);
                textElement.style.textShadow = shadowStyle;
                textElement.classList.add(CSS_CLASSES.ENHANCED_READABILITY);

                // Add appropriate shadow class based on text color
                if (isColorDark(finalTextColor)) {
                    textElement.classList.add(CSS_CLASSES.TEXT_SHADOW_LIGHT);
                    textElement.classList.remove(CSS_CLASSES.TEXT_SHADOW_DARK);
                } else {
                    textElement.classList.add(CSS_CLASSES.TEXT_SHADOW_DARK);
                    textElement.classList.remove(CSS_CLASSES.TEXT_SHADOW_LIGHT);
                }
            }
        }

        // Apply styling to checkbox
        const checkbox = challengeElement.querySelector(
            CSS_SELECTORS.CHALLENGE_CHECKBOX
        ) as HTMLElement;
        if (checkbox && finalTextColor) {
            ChallengeRenderer.decorateChallengeCheckbox(
                checkbox,
                finalTextColor
            );
        }
    }
}

export default ChallengeRenderer;
