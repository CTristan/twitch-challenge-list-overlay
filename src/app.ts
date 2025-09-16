import { animateScroll } from "./animations/animateScroll";
import Challenge from "./classes/Challenge";
import ChallengeList from "./classes/ChallengeList";
import ConfigManager from "./classes/ConfigManager";
import { loadStyles } from "./styleLoader";
import CommandHandler from "./utils/CommandHandler";

// Commands and responses are loaded from ConfigManager

/**
 * Get a value from an array by cycling through it based on an index
 * @param index - The index to use for cycling (0-based)
 * @param values - Array of values to cycle through
 * @returns The value at the cycled index or null if no values configured
 */
function getCyclicArrayValue<T>(index: number, values: T[]): T | null {
    if (!values || values.length === 0) return null;
    const value = values[index % values.length];
    return value !== undefined ? value : null;
}

/**
 * Get the background color for a challenge row based on its index and configured colors
 * @param rowIndex - The index of the row (0-based)
 * @param colors - Array of color values to cycle through
 * @returns The background color string or null if no colors configured
 */
function getRowBackgroundColor(
    rowIndex: number,
    colors: string[]
): string | null {
    return getCyclicArrayValue(rowIndex, colors);
}

/**
 * Get the text color for a challenge row based on its index and configured colors
 * @param rowIndex - The index of the row (0-based)
 * @param colors - Array of color values to cycle through
 * @returns The text color string or null if no colors configured
 */
function getRowTextColor(rowIndex: number, colors: string[]): string | null {
    return getCyclicArrayValue(rowIndex, colors);
}

/**
 * Create DOM structure for challenge text with title and description on separate lines
 * @param challenge - The challenge object
 * @returns DOM element containing the formatted challenge text
 */
function createChallengeTextElement(challenge: Challenge): HTMLElement {
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

    return textContainer;
}

/**
 * @class App
 * @property {ChallengeList} challengeList - The challenge list
 * @method render - Render the challenge list to the DOM
 * @method chatHandler - Handles chat commands and responses
 */
export default class App {
    #configManager: ConfigManager;
    challengeList: ChallengeList;
    #commandHandler: CommandHandler;

    /**
     * @constructor
     * @param {string} storeName - The store name
     */
    constructor(storeName: string) {
        this.#configManager = ConfigManager.getInstance();
        this.challengeList = new ChallengeList(storeName);
        this.#commandHandler = new CommandHandler(
            this.challengeList,
            this.#configManager
        );
        loadStyles(this.#configManager.getAll());
    }

    /**
     * Get the ConfigManager instance for testing purposes
     * @returns {ConfigManager} The ConfigManager instance
     */
    getConfigManager(): ConfigManager {
        return this.#configManager;
    }

    /**
     * Initial render the components to the DOM. Should only be called once.
     * @returns {void}
     */
    render(): void {
        this.renderChallengeList();
    }

    /**
     * Update the challenge count in existing card headers
     * @returns {void}
     */
    updateChallengeCount(): void {
        const completedCount = this.challengeList.challengesCompleted;
        const totalCount = this.challengeList.totalChallenges;

        // Update all card headers with the current count
        const cardHeaders = document.querySelectorAll(".card .username");
        cardHeaders.forEach((header) => {
            if (header instanceof HTMLElement) {
                header.innerText = `Challenges ${completedCount}/${totalCount}`;
            }
        });
    }

    /**
     * Render the challenge list to the DOM
     * @returns {void}
     */
    renderChallengeList(): void {
        if (this.challengeList.challenges.length === 0) {
            return;
        }

        const cardEl = createChallengeCard(
            this.challengeList.challengesCompleted,
            this.challengeList.totalChallenges
        );
        const list = cardEl.querySelector("ol");

        if (!list) {
            console.error("Challenge list element not found in card");
            return;
        }

        // Create DocumentFragment for batch DOM operations to reduce reflows
        const fragment = document.createDocumentFragment();

        this.challengeList.getAllChallenges().forEach((challenge, index) => {
            const listItem = document.createElement("li");
            listItem.classList.add("challenge");
            listItem.dataset["challengeId"] = `${challenge.id}`;

            // Apply row background color if configured
            const backgroundColor = getRowBackgroundColor(
                index,
                this.#configManager.get("challengeRowColors") || []
            );
            if (backgroundColor) {
                listItem.style.backgroundColor = backgroundColor;
            }

            // Apply row text color if configured
            const textColor = getRowTextColor(
                index,
                this.#configManager.get("challengeRowTextColors") || []
            );

            // Create checkbox element
            const checkbox = createChallengeCheckbox(challenge.isComplete());

            // Apply checkbox colors to match text color if configured
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

            listItem.appendChild(checkbox);

            // Create text element for challenge title and description
            const textElement = createChallengeTextElement(challenge);

            // Apply text color to the text element if configured
            if (textColor) {
                textElement.style.color = textColor;
                // Also apply to child elements
                const titleElement = textElement.querySelector(
                    ".challenge-title"
                ) as HTMLElement;
                const descriptionElement = textElement.querySelector(
                    ".challenge-description"
                ) as HTMLElement;
                if (titleElement) titleElement.style.color = textColor;
                if (descriptionElement)
                    descriptionElement.style.color = textColor;
            }

            listItem.appendChild(textElement);

            if (challenge.isComplete()) {
                listItem.classList.add("done");
            }
            // Append to fragment instead of directly to DOM
            fragment.appendChild(listItem);
        });

        // Single DOM append operation to reduce reflows
        list.appendChild(fragment);

        const primaryContainer = document.querySelector(
            ".challenge-container.primary"
        );
        if (!primaryContainer) {
            console.error("Primary challenge container not found");
            return;
        }
        primaryContainer.innerHTML = "";
        primaryContainer.appendChild(cardEl);

        const secondaryClone = cardEl.cloneNode(true);
        const secondaryContainer = document.querySelector(
            ".challenge-container.secondary"
        );
        if (!secondaryContainer) {
            console.error("Secondary challenge container not found");
            return;
        }
        secondaryContainer.innerHTML = "";
        secondaryContainer.appendChild(secondaryClone);

        animateScroll();
    }



    /**
     * Render custom text to the DOM
     * @param {string} text - The custom text to display
     * @returns {void}
     */
    renderCustomText(text: string): void {
        const customHeaderEl = document.querySelector(".custom-header");
        const customTextEl = document.querySelector(".custom-text");
        if (customHeaderEl) {
            customHeaderEl.classList.remove("hidden");
        }
        if (customTextEl) {
            customTextEl.textContent = text;
        }
    }

    /**
     * Handles chat commands and responses
     * @param {string} username
     * @param {string} command
     * @param {string} message
     * @param {{broadcaster: boolean, mod: boolean}} flags
     * @param {{userColor: string, messageId?: string}} _extra
     * @returns {{error: boolean, message: string}} - Response message
     */
    chatHandler(
        username: string,
        command: string,
        message: string,
        flags: { broadcaster: boolean; mod: boolean },
        _extra: { userColor: string; messageId?: string }
    ): { error: boolean; message: string } {
        command = `!${command.toLowerCase()}`;

        try {
            // All commands now use the unified "!ch" prefix system
            if (command === "!ch" || command.startsWith("!ch ")) {
                const response = this.#commandHandler.handleCommand(
                    username,
                    command.slice(1), // Remove ! prefix
                    message,
                    flags
                );

                // Handle DOM updates for commands
                if (!response.error) {
                    if (response.challengeId) {
                        const challenge = this.challengeList.challenges.find(
                            (c) => c.shortId === response.challengeId
                        );
                        if (challenge) {
                            if (response.action === "add") {
                                this.addChallengeToDOM(challenge);
                            } else if (response.action === "edit") {
                                this.editChallengeFromDOM(challenge);
                            } else if (response.action === "complete") {
                                this.completeChallengeFromDOM(challenge.id);
                            } else if (response.action === "delete") {
                                this.deleteChallengeFromDOM(challenge.id);
                            }
                        }
                    } else if (response.action === "clearAll") {
                        this.clearListFromDOM();
                    } else if (response.action === "clearDone") {
                        // Clear done challenges from DOM - need to get the cleared challenge IDs
                        const doneChallenges =
                            this.challengeList.challenges.filter((c) =>
                                c.isComplete()
                            );
                        doneChallenges.forEach((challenge) => {
                            this.deleteChallengeFromDOM(challenge.id);
                        });
                    }
                }

                return {
                    error: response.error,
                    message: response.message,
                };
            }

            // If we get here, it's not a !ch command, which means it's an invalid command
            throw new Error("command not found");
        } catch (error) {
            return respondMessage(
                this.#configManager.get("responses.invalidCommand"),
                username,
                error instanceof Error ? error.message : String(error),
                true
            );
        }
    }

    clearListFromDOM() {
        const primaryContainer = document.querySelector(
            ".challenge-container.primary"
        );
        const secondaryContainer = document.querySelector(
            ".challenge-container.secondary"
        );
        if (primaryContainer) {
            primaryContainer.innerHTML = "";
        }
        if (secondaryContainer) {
            secondaryContainer.innerHTML = "";
        }
    }

    /**
     * Add the challenge to the DOM
     * @param {Challenge} challenge
     * @returns {void}
     */
    addChallengeToDOM(challenge: Challenge): void {
        const primaryContainer = document.querySelector(
            ".challenge-container.primary"
        );
        const secondaryContainer = document.querySelector(
            ".challenge-container.secondary"
        );

        if (!primaryContainer || !secondaryContainer) return;

        const challengeCardEls = document.querySelectorAll(".card");

        if (challengeCardEls.length === 0) {
            const challengeCard = createChallengeCard(
                this.challengeList.challengesCompleted,
                this.challengeList.totalChallenges
            );
            const clonedChallengeCard = challengeCard.cloneNode(true);
            primaryContainer.appendChild(challengeCard);
            secondaryContainer.appendChild(clonedChallengeCard);
        }

        const challengeElement = document.createElement("li");
        challengeElement.classList.add("challenge");
        challengeElement.dataset["challengeId"] = `${challenge.id}`;

        // Apply row background color if configured
        // Calculate the row index based on current challenge count (newly added challenge is at the end)
        const rowIndex = this.challengeList.challenges.length - 1;
        const backgroundColor = getRowBackgroundColor(
            rowIndex,
            this.#configManager.get("challengeRowColors") || []
        );
        if (backgroundColor) {
            challengeElement.style.backgroundColor = backgroundColor;
        }

        // Apply row text color if configured
        const textColor = getRowTextColor(
            rowIndex,
            this.#configManager.get("challengeRowTextColors") || []
        );

        // Create checkbox element (new challenges are not completed by default)
        const checkbox = createChallengeCheckbox(false);

        // Apply checkbox colors to match text color if configured
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

        challengeElement.appendChild(checkbox);

        // Create text element for challenge title and description
        const textElement = createChallengeTextElement(challenge);

        // Apply text color to the text element if configured
        if (textColor) {
            textElement.style.color = textColor;
            // Also apply to child elements
            const titleElement = textElement.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            ) as HTMLElement;
            if (titleElement) titleElement.style.color = textColor;
            if (descriptionElement) descriptionElement.style.color = textColor;
        }

        challengeElement.appendChild(textElement);

        const cloneChallengeElement = challengeElement.cloneNode(
            true
        ) as HTMLElement;
        // Ensure the cloned element also has the background color, text color, and checkbox colors
        if (backgroundColor) {
            cloneChallengeElement.style.backgroundColor = backgroundColor;
        }
        if (textColor) {
            const clonedTextElement = cloneChallengeElement.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            if (clonedTextElement) {
                clonedTextElement.style.color = textColor;
            }

            // Apply checkbox colors to the cloned checkbox as well
            const clonedCheckbox = cloneChallengeElement.querySelector(
                ".challenge-checkbox"
            ) as HTMLElement;
            if (clonedCheckbox) {
                clonedCheckbox.style.setProperty(
                    "--challenge-checkbox-border-color",
                    textColor
                );
                clonedCheckbox.style.setProperty(
                    "--challenge-checkbox-checked-border-color",
                    textColor
                );
                clonedCheckbox.style.setProperty(
                    "--challenge-checkbox-checkmark-color",
                    textColor
                );
            }
        }

        const primaryChallengesList =
            primaryContainer.querySelector(".card .challenges");
        const secondaryChallengesList =
            secondaryContainer.querySelector(".card .challenges");

        if (primaryChallengesList) {
            primaryChallengesList.appendChild(challengeElement);
        }
        if (secondaryChallengesList) {
            secondaryChallengesList.appendChild(cloneChallengeElement);
        }

        this.updateChallengeCount();
        animateScroll();
    }

    /**
     * Edit the challenge in the DOM
     * @param {Challenge} challenge
     * @returns {void}
     */
    editChallengeFromDOM(challenge: Challenge): void {
        /** @type {NodeListOf<HTMLElement>} */
        const challengeElements: NodeListOf<HTMLElement> =
            document.querySelectorAll(`[data-challenge-id="${challenge.id}"]`);
        for (const challengeElement of challengeElements) {
            const textElement = challengeElement.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            if (textElement) {
                // Replace the entire text element with new structure
                const newTextElement = createChallengeTextElement(challenge);

                // Preserve any existing color styling
                const existingColor = textElement.style.color;
                if (existingColor) {
                    newTextElement.style.color = existingColor;
                    const titleElement = newTextElement.querySelector(
                        ".challenge-title"
                    ) as HTMLElement;
                    const descriptionElement = newTextElement.querySelector(
                        ".challenge-description"
                    ) as HTMLElement;
                    if (titleElement) titleElement.style.color = existingColor;
                    if (descriptionElement)
                        descriptionElement.style.color = existingColor;
                }

                textElement.parentNode?.replaceChild(
                    newTextElement,
                    textElement
                );
            }
        }
    }

    /**
     * Complete the challenge in the DOM
     * @param {string} challengeId
     * @returns {void}
     */
    completeChallengeFromDOM(challengeId: string): void {
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
        this.updateChallengeCount();
    }

    /**
     * Delete the challenge in the DOM
     * @param {string} challengeId
     * @returns {void}
     */
    deleteChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );
        for (const challengeElement of challengeElements) {
            const parent = challengeElement.parentElement;
            if (parent && parent.children.length === 1) {
                // remove the challenge card if there is only one challenge
                const grandParent = parent.parentElement;
                if (grandParent) {
                    grandParent.remove();
                }
            } else {
                challengeElement.remove();
            }
        }
        this.updateChallengeCount();
    }
}

/**
 * Responds with a formatted message
 * @param {string} template - The response template
 * @param {string} username - The username of the user
 * @param {string} message - The message to replace in the template
 * @param {boolean} error - If the response is an error
 * @returns {{message: string, error: boolean}}
 */
function respondMessage(
    template: string,
    username: string,
    message: string,
    error: boolean = false
): { message: string; error: boolean } {
    return {
        message: template
            .replaceAll("{user}", username)
            .replaceAll("{message}", message),
        error,
    };
}

/**
 * Create a challenge card element for the single challenge list
 * @param {number} completedCount - Number of completed challenges
 * @param {number} totalCount - Total number of challenges
 * @returns {HTMLDivElement}
 */
function createChallengeCard(completedCount: number = 0, totalCount: number = 0): HTMLDivElement {
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
 * Create a checkbox element for a challenge
 * @param {boolean} isChecked - Whether the checkbox should be checked
 * @returns {HTMLDivElement} The checkbox element
 */
function createChallengeCheckbox(isChecked: boolean = false): HTMLDivElement {
    const checkbox = document.createElement("div");
    checkbox.classList.add("challenge-checkbox");
    if (isChecked) {
        checkbox.classList.add("checked");
    }
    return checkbox;
}
