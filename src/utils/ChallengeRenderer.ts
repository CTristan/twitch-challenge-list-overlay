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
    KEYBOARD_KEYS,
} from "../types/DOMConstants";
import { ARIA_LABELS, UI_ELEMENTS } from "../types/MessageConstants";
import {
    calculateOptimalTextColor,
    combineColorWithOpacity,
    generateTextShadow,
    isColorDark,
} from "./ColorUtils";
import TimerDisplayUtils from "./TimerDisplayUtils";

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
        // Show timer if it's active OR if it's expired (to show expired state)
        const hasTimer =
            challenge.timer &&
            (challenge.timer.isActive || challenge.timer.isExpired());

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
     * @param textOnly - If true, creates a text button instead of an icon
     * @returns The edit icon or button element
     */
    static createChallengeEditIcon(textOnly: boolean = false): HTMLDivElement {
        const editIcon = document.createElement(HTML_ELEMENTS.DIV);

        if (textOnly) {
            editIcon.classList.add(CSS_CLASSES.CHALLENGE_TEXT_ONLY_EDIT);
            editIcon.textContent = UI_ELEMENTS.TEXT_ONLY_EDIT_BUTTON;
        } else {
            editIcon.classList.add(CSS_CLASSES.CHALLENGE_EDIT_ICON);
            editIcon.textContent = UI_ELEMENTS.EDIT_ICON;
        }

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
     * @param textOnly - If true, creates a text button instead of a symbol
     * @returns The increment button element
     */
    static createChallengeIncrementButton(
        textOnly: boolean = false
    ): HTMLDivElement {
        const incrementButton = document.createElement(HTML_ELEMENTS.DIV);

        if (textOnly) {
            incrementButton.classList.add(
                CSS_CLASSES.CHALLENGE_TEXT_ONLY_INCREMENT
            );
            incrementButton.textContent =
                UI_ELEMENTS.TEXT_ONLY_INCREMENT_BUTTON;
        } else {
            incrementButton.classList.add(
                CSS_CLASSES.CHALLENGE_INCREMENT_BUTTON
            );
            incrementButton.textContent = UI_ELEMENTS.INCREMENT_BUTTON;
        }

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
     * @param textOnly - If true, creates a text button instead of a symbol
     * @returns The decrement button element
     */
    static createChallengeDecrementButton(
        textOnly: boolean = false
    ): HTMLDivElement {
        const decrementButton = document.createElement(HTML_ELEMENTS.DIV);

        if (textOnly) {
            decrementButton.classList.add(
                CSS_CLASSES.CHALLENGE_TEXT_ONLY_DECREMENT
            );
            decrementButton.textContent =
                UI_ELEMENTS.TEXT_ONLY_DECREMENT_BUTTON;
        } else {
            decrementButton.classList.add(
                CSS_CLASSES.CHALLENGE_DECREMENT_BUTTON
            );
            decrementButton.textContent = UI_ELEMENTS.DECREMENT_BUTTON;
        }

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
     * Create a text-only challenge list item for admin view
     * Renders as plain text with text buttons instead of styled challenge rows
     * @param challenge - Challenge to create element for
     * @param options - Optional configuration for element creation
     * @returns HTMLElement representing the text-only challenge
     */
    static createTextOnlyChallengeElement(
        challenge: Challenge,
        options: {
            editHandler?: (event: Event) => void;
            incrementHandler?: (event: Event) => void;
            decrementHandler?: (event: Event) => void;
            completeHandler?: (event: Event) => void;
            uncompleteHandler?: (event: Event) => void;
            failHandler?: (event: Event) => void;
            unfailHandler?: (event: Event) => void;
            deleteHandler?: (event: Event) => void;
            displayPosition?: number;
        } = {}
    ): HTMLElement {
        const challengeElement = document.createElement(HTML_ELEMENTS.LI);
        challengeElement.classList.add(CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM);
        challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] = challenge.id;

        // Create content container for text
        const contentContainer = document.createElement(HTML_ELEMENTS.DIV);
        contentContainer.classList.add(CSS_CLASSES.CHALLENGE_TEXT_ONLY_CONTENT);

        const textElement = this.createChallengeTextElement(
            challenge,
            options.displayPosition
        );
        contentContainer.appendChild(textElement);

        if (
            challenge.timer &&
            (challenge.timer.isActive || challenge.timer.isExpired())
        ) {
            let metadataRow = textElement.querySelector(
                CSS_SELECTORS.CHALLENGE_METADATA
            ) as HTMLElement | null;

            if (!metadataRow) {
                metadataRow = document.createElement(HTML_ELEMENTS.DIV);
                metadataRow.classList.add(CSS_CLASSES.CHALLENGE_METADATA);
                textElement.appendChild(metadataRow);
            }

            const timerElement = TimerDisplayUtils.createTimerElement(
                challenge.timer,
                challenge.id
            );
            metadataRow.appendChild(timerElement);
        }

        // Apply state styling based on challenge state
        const state = challenge.getState();
        if (state === CHALLENGE_STATES.DONE) {
            challengeElement.classList.add(CSS_CLASSES.DONE);
        } else if (state === CHALLENGE_STATES.FAILED) {
            challengeElement.classList.add(CSS_CLASSES.FAILED);
        }

        challengeElement.appendChild(contentContainer);

        // Create buttons container
        const buttonsContainer = document.createElement(HTML_ELEMENTS.DIV);
        buttonsContainer.classList.add(CSS_CLASSES.CHALLENGE_TEXT_ONLY_BUTTONS);

        // Edit action (rendered as plain text, accessible as a button)
        if (options.editHandler) {
            const editAction = document.createElement(HTML_ELEMENTS.DIV);
            editAction.classList.add(CSS_CLASSES.CHALLENGE_TEXT_ONLY_EDIT);
            editAction.textContent = UI_ELEMENTS.TEXT_ONLY_EDIT_BUTTON;
            editAction.setAttribute(
                HTML_ATTRIBUTE_NAMES.ROLE,
                HTML_ATTRIBUTES.ROLE_BUTTON
            );
            editAction.setAttribute(
                HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                ARIA_LABELS.EDIT_CHALLENGE
            );
            editAction.setAttribute(
                HTML_ATTRIBUTE_NAMES.TABINDEX,
                HTML_ATTRIBUTES.TABINDEX_ZERO
            );
            editAction.addEventListener(EVENT_NAMES.CLICK, options.editHandler);
            // Keyboard accessibility (Enter/Space)
            editAction.addEventListener(
                EVENT_NAMES.KEYDOWN,
                (e: KeyboardEvent) => {
                    if (
                        e.key === KEYBOARD_KEYS.ENTER ||
                        e.key === KEYBOARD_KEYS.SPACE
                    ) {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).click();
                    }
                }
            );
            buttonsContainer.appendChild(editAction);
        }

        // Complete/Uncomplete action
        if (challenge.isComplete()) {
            // Show "Uncomplete" button if challenge is completed
            if (options.uncompleteHandler) {
                const uncompleteAction = document.createElement(
                    HTML_ELEMENTS.DIV
                );
                uncompleteAction.classList.add(
                    CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNCOMPLETE
                );
                uncompleteAction.textContent =
                    UI_ELEMENTS.TEXT_ONLY_UNCOMPLETE_BUTTON;
                uncompleteAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ROLE,
                    HTML_ATTRIBUTES.ROLE_BUTTON
                );
                uncompleteAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.TABINDEX,
                    HTML_ATTRIBUTES.TABINDEX_ZERO
                );
                uncompleteAction.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.uncompleteHandler
                );
                uncompleteAction.addEventListener(
                    EVENT_NAMES.KEYDOWN,
                    (e: KeyboardEvent) => {
                        if (
                            e.key === KEYBOARD_KEYS.ENTER ||
                            e.key === KEYBOARD_KEYS.SPACE
                        ) {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                        }
                    }
                );
                buttonsContainer.appendChild(uncompleteAction);
            }
        } else {
            // Show "Complete" button if challenge is not completed
            if (options.completeHandler) {
                const completeAction = document.createElement(
                    HTML_ELEMENTS.DIV
                );
                completeAction.classList.add(
                    CSS_CLASSES.CHALLENGE_TEXT_ONLY_COMPLETE
                );
                completeAction.textContent =
                    UI_ELEMENTS.TEXT_ONLY_COMPLETE_BUTTON;
                completeAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ROLE,
                    HTML_ATTRIBUTES.ROLE_BUTTON
                );
                completeAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.TABINDEX,
                    HTML_ATTRIBUTES.TABINDEX_ZERO
                );
                completeAction.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.completeHandler
                );
                completeAction.addEventListener(
                    EVENT_NAMES.KEYDOWN,
                    (e: KeyboardEvent) => {
                        if (
                            e.key === KEYBOARD_KEYS.ENTER ||
                            e.key === KEYBOARD_KEYS.SPACE
                        ) {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                        }
                    }
                );
                buttonsContainer.appendChild(completeAction);
            }
        }

        // Fail/Unfail action
        if (state === CHALLENGE_STATES.FAILED) {
            // Show "Unfail" button if challenge is failed
            if (options.unfailHandler) {
                const unfailAction = document.createElement(HTML_ELEMENTS.DIV);
                unfailAction.classList.add(
                    CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNFAIL
                );
                unfailAction.textContent = UI_ELEMENTS.TEXT_ONLY_UNFAIL_BUTTON;
                unfailAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ROLE,
                    HTML_ATTRIBUTES.ROLE_BUTTON
                );
                unfailAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.TABINDEX,
                    HTML_ATTRIBUTES.TABINDEX_ZERO
                );
                unfailAction.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.unfailHandler
                );
                unfailAction.addEventListener(
                    EVENT_NAMES.KEYDOWN,
                    (e: KeyboardEvent) => {
                        if (
                            e.key === KEYBOARD_KEYS.ENTER ||
                            e.key === KEYBOARD_KEYS.SPACE
                        ) {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                        }
                    }
                );
                buttonsContainer.appendChild(unfailAction);
            }
        } else {
            // Show "Fail" button if challenge is not failed
            if (options.failHandler) {
                const failAction = document.createElement(HTML_ELEMENTS.DIV);
                failAction.classList.add(CSS_CLASSES.CHALLENGE_TEXT_ONLY_FAIL);
                failAction.textContent = UI_ELEMENTS.TEXT_ONLY_FAIL_BUTTON;
                failAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ROLE,
                    HTML_ATTRIBUTES.ROLE_BUTTON
                );
                failAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.TABINDEX,
                    HTML_ATTRIBUTES.TABINDEX_ZERO
                );
                failAction.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.failHandler
                );
                failAction.addEventListener(
                    EVENT_NAMES.KEYDOWN,
                    (e: KeyboardEvent) => {
                        if (
                            e.key === KEYBOARD_KEYS.ENTER ||
                            e.key === KEYBOARD_KEYS.SPACE
                        ) {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                        }
                    }
                );
                buttonsContainer.appendChild(failAction);
            }
        }

        if (options.deleteHandler) {
            const deleteAction = document.createElement(HTML_ELEMENTS.DIV);
            deleteAction.classList.add(CSS_CLASSES.CHALLENGE_TEXT_ONLY_DELETE);
            deleteAction.textContent = UI_ELEMENTS.TEXT_ONLY_DELETE_BUTTON;
            deleteAction.setAttribute(
                HTML_ATTRIBUTE_NAMES.ROLE,
                HTML_ATTRIBUTES.ROLE_BUTTON
            );
            deleteAction.setAttribute(
                HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                ARIA_LABELS.DELETE_CHALLENGE
            );
            deleteAction.setAttribute(
                HTML_ATTRIBUTE_NAMES.TABINDEX,
                HTML_ATTRIBUTES.TABINDEX_ZERO
            );
            deleteAction.addEventListener(
                EVENT_NAMES.CLICK,
                options.deleteHandler
            );
            deleteAction.addEventListener(
                EVENT_NAMES.KEYDOWN,
                (e: KeyboardEvent) => {
                    if (
                        e.key === KEYBOARD_KEYS.ENTER ||
                        e.key === KEYBOARD_KEYS.SPACE
                    ) {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).click();
                    }
                }
            );
            buttonsContainer.appendChild(deleteAction);
        }

        // Increment/Decrement buttons for multi-step challenges (rendered as plain text)
        if (challenge.amount > 1) {
            if (options.incrementHandler) {
                const incrementAction = document.createElement(
                    HTML_ELEMENTS.DIV
                );
                incrementAction.classList.add(
                    CSS_CLASSES.CHALLENGE_TEXT_ONLY_INCREMENT
                );
                incrementAction.textContent =
                    UI_ELEMENTS.TEXT_ONLY_INCREMENT_BUTTON;
                incrementAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ROLE,
                    HTML_ATTRIBUTES.ROLE_BUTTON
                );
                incrementAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                    ARIA_LABELS.INCREMENT_PROGRESS
                );
                incrementAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.TABINDEX,
                    HTML_ATTRIBUTES.TABINDEX_ZERO
                );
                incrementAction.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.incrementHandler
                );
                incrementAction.addEventListener(
                    EVENT_NAMES.KEYDOWN,
                    (e: KeyboardEvent) => {
                        if (
                            e.key === KEYBOARD_KEYS.ENTER ||
                            e.key === KEYBOARD_KEYS.SPACE
                        ) {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                        }
                    }
                );
                buttonsContainer.appendChild(incrementAction);
            }

            if (options.decrementHandler) {
                const decrementAction = document.createElement(
                    HTML_ELEMENTS.DIV
                );
                decrementAction.classList.add(
                    CSS_CLASSES.CHALLENGE_TEXT_ONLY_DECREMENT
                );
                decrementAction.textContent =
                    UI_ELEMENTS.TEXT_ONLY_DECREMENT_BUTTON;
                decrementAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ROLE,
                    HTML_ATTRIBUTES.ROLE_BUTTON
                );
                decrementAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                    ARIA_LABELS.DECREMENT_PROGRESS
                );
                decrementAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.TABINDEX,
                    HTML_ATTRIBUTES.TABINDEX_ZERO
                );
                decrementAction.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.decrementHandler
                );
                decrementAction.addEventListener(
                    EVENT_NAMES.KEYDOWN,
                    (e: KeyboardEvent) => {
                        if (
                            e.key === KEYBOARD_KEYS.ENTER ||
                            e.key === KEYBOARD_KEYS.SPACE
                        ) {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                        }
                    }
                );
                buttonsContainer.appendChild(decrementAction);
            }
        }

        challengeElement.appendChild(buttonsContainer);
        return challengeElement;
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
            failHandler?: (event: Event) => void;
            unfailHandler?: (event: Event) => void;
            deleteHandler?: (event: Event) => void;
            displayPosition?: number;
            textOnlyMode?: boolean;
            includeCheckbox?: boolean;
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

        // Determine if checkbox should be rendered (admin-only)
        const includeCheckbox = options.includeCheckbox ?? true;
        let checkbox: HTMLElement | null = null;
        if (includeCheckbox) {
            checkbox = this.createChallengeCheckbox(challenge.isComplete());

            // Add event listener if requested
            if (options.includeEventListeners && options.eventHandler) {
                checkbox.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.eventHandler
                );
            }
        }

        // Create challenge text with optional display position
        const textElement = this.createChallengeTextElement(
            challenge,
            options.displayPosition
        );

        // Create wrapper for text and actions
        const contentWrapper = document.createElement(HTML_ELEMENTS.DIV);
        contentWrapper.classList.add(CSS_CLASSES.CHALLENGE_CONTENT_WRAPPER);
        contentWrapper.appendChild(textElement);

        const actionsContainer = document.createElement(HTML_ELEMENTS.DIV);
        actionsContainer.classList.add(CSS_CLASSES.CHALLENGE_ACTIONS);
        let hasActions = false;

        // Determine if text-only mode should be used
        const useTextOnlyMode = options.textOnlyMode ?? false;

        // Create and add edit icon/button only if edit handler is provided (admin mode only)
        if (options.editHandler) {
            const editIcon = this.createChallengeEditIcon(useTextOnlyMode);
            editIcon.addEventListener(EVENT_NAMES.CLICK, options.editHandler);
            actionsContainer.appendChild(editIcon);
            hasActions = true;
        }

        // Create and add increment/decrement buttons only if handlers are provided (admin mode only)
        // and challenge has progress tracking (amount > 1)
        if (challenge.amount > 1) {
            if (options.incrementHandler) {
                const incrementButton =
                    this.createChallengeIncrementButton(useTextOnlyMode);
                incrementButton.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.incrementHandler
                );
                actionsContainer.appendChild(incrementButton);
                hasActions = true;
            }

            if (options.decrementHandler) {
                const decrementButton =
                    this.createChallengeDecrementButton(useTextOnlyMode);
                decrementButton.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.decrementHandler
                );
                actionsContainer.appendChild(decrementButton);
                hasActions = true;
            }
        }

        // Add Fail/Unfail button in admin view (non text-only and text-only styles reused for consistency)
        if (state === CHALLENGE_STATES.FAILED) {
            if (options.unfailHandler) {
                const unfailButton = document.createElement(
                    HTML_ELEMENTS.BUTTON
                );
                unfailButton.classList.add(
                    CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNFAIL
                );
                unfailButton.textContent = UI_ELEMENTS.TEXT_ONLY_UNFAIL_BUTTON;
                unfailButton.type = HTML_ATTRIBUTES.BUTTON_TYPE;
                unfailButton.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                    ARIA_LABELS.UNFAIL_CHALLENGE
                );
                unfailButton.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.unfailHandler
                );
                actionsContainer.appendChild(unfailButton);
                hasActions = true;
            }
        } else if (options.failHandler) {
            const failButton = document.createElement(HTML_ELEMENTS.BUTTON);
            failButton.classList.add(CSS_CLASSES.CHALLENGE_TEXT_ONLY_FAIL);
            failButton.textContent = UI_ELEMENTS.TEXT_ONLY_FAIL_BUTTON;
            failButton.type = HTML_ATTRIBUTES.BUTTON_TYPE;
            failButton.setAttribute(
                HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                ARIA_LABELS.FAIL_CHALLENGE
            );
            failButton.addEventListener(EVENT_NAMES.CLICK, options.failHandler);
            actionsContainer.appendChild(failButton);
            hasActions = true;
        }

        if (options.deleteHandler) {
            if (useTextOnlyMode) {
                const deleteAction = document.createElement(HTML_ELEMENTS.DIV);
                deleteAction.classList.add(
                    CSS_CLASSES.CHALLENGE_TEXT_ONLY_DELETE
                );
                deleteAction.textContent = UI_ELEMENTS.TEXT_ONLY_DELETE_BUTTON;
                deleteAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ROLE,
                    HTML_ATTRIBUTES.ROLE_BUTTON
                );
                deleteAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.TABINDEX,
                    HTML_ATTRIBUTES.TABINDEX_ZERO
                );
                deleteAction.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                    ARIA_LABELS.DELETE_CHALLENGE
                );
                deleteAction.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.deleteHandler
                );
                deleteAction.addEventListener(
                    EVENT_NAMES.KEYDOWN,
                    (e: KeyboardEvent) => {
                        if (
                            e.key === KEYBOARD_KEYS.ENTER ||
                            e.key === KEYBOARD_KEYS.SPACE
                        ) {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                        }
                    }
                );
                actionsContainer.appendChild(deleteAction);
                hasActions = true;
            } else {
                const deleteButton = document.createElement(
                    HTML_ELEMENTS.BUTTON
                );
                deleteButton.classList.add(
                    CSS_CLASSES.CHALLENGE_TEXT_ONLY_DELETE
                );
                deleteButton.textContent = UI_ELEMENTS.TEXT_ONLY_DELETE_BUTTON;
                deleteButton.setAttribute(
                    HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                    ARIA_LABELS.DELETE_CHALLENGE
                );
                deleteButton.addEventListener(
                    EVENT_NAMES.CLICK,
                    options.deleteHandler
                );
                actionsContainer.appendChild(deleteButton);
                hasActions = true;
            }
        }

        if (hasActions) {
            contentWrapper.appendChild(actionsContainer);
        }

        // Assemble the challenge element
        if (checkbox) {
            challengeElement.appendChild(checkbox);
        }
        challengeElement.appendChild(contentWrapper);

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
