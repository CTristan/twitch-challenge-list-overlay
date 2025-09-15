import { animateScroll } from "./animations/animateScroll.js";
import Challenge from "./classes/Challenge.js";
import ChallengeList from "./classes/ChallengeList.js";
import ConfigManager from "./classes/ConfigManager.js";
import { loadStyles } from "./styleLoader.js";
import EnhancedCommandHandler from "./utils/EnhancedCommandHandler.js";

// Commands and responses are loaded from ConfigManager

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
  if (!colors || colors.length === 0) return null;
  return colors[rowIndex % colors.length];
}

/**
 * Get the text color for a challenge row based on its index and configured colors
 * @param rowIndex - The index of the row (0-based)
 * @param colors - Array of color values to cycle through
 * @returns The text color string or null if no colors configured
 */
function getRowTextColor(
  rowIndex: number,
  colors: string[]
): string | null {
  if (!colors || colors.length === 0) return null;
  return colors[rowIndex % colors.length];
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
  if (challenge.title !== challenge.description &&
      challenge.description &&
      challenge.description.trim() !== "") {
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
  #maxChallengesTotal: number;
  #configManager: ConfigManager;
  challengeList: ChallengeList;
  #enhancedCommandHandler: EnhancedCommandHandler;

  /**
   * @constructor
   * @param {string} storeName - The store name
   */
  constructor(storeName: string) {
    this.#configManager = ConfigManager.getInstance();
    this.challengeList = new ChallengeList(storeName);
    this.#enhancedCommandHandler = new EnhancedCommandHandler(this.challengeList, this.#configManager);
    loadStyles(this.#configManager.getAll());
    this.#maxChallengesTotal = this.#configManager.get("maxChallenges");
  }

  /**
   * Initial render the components to the DOM. Should only be called once.
   * @returns {void}
   */
  render(): void {
    this.renderChallengeList();
    this.renderChallengeHeader();
  }

  /**
   * Render the challenge list to the DOM
   * @returns {void}
   */
  renderChallengeList(): void {
    if (this.challengeList.challenges.length === 0) {
      return;
    }

    const cardEl = createChallengeCard();
    const list = cardEl.querySelector("ol");

    if (!list) {
      console.error("Challenge list element not found in card");
      return;
    }

    this.challengeList.getAllChallenges().forEach((challenge, index) => {
      const listItem = document.createElement("li");
      listItem.classList.add("challenge");
      listItem.dataset.challengeId = `${challenge.id}`;

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
        checkbox.style.setProperty('--challenge-checkbox-border-color', textColor);
        checkbox.style.setProperty('--challenge-checkbox-checked-border-color', textColor);
        checkbox.style.setProperty('--challenge-checkbox-checkmark-color', textColor);
      }

      listItem.appendChild(checkbox);

      // Create text element for challenge title and description
      const textElement = createChallengeTextElement(challenge);

      // Apply text color to the text element if configured
      if (textColor) {
        textElement.style.color = textColor;
        // Also apply to child elements
        const titleElement = textElement.querySelector(".challenge-title") as HTMLElement;
        const descriptionElement = textElement.querySelector(".challenge-description") as HTMLElement;
        if (titleElement) titleElement.style.color = textColor;
        if (descriptionElement) descriptionElement.style.color = textColor;
      }

      listItem.appendChild(textElement);

      if (challenge.isComplete()) {
        listItem.classList.add("done");
      }
      list.appendChild(listItem);
    });

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
   * Render the challenge header to the DOM
   * @returns {void}
   */
  renderChallengeHeader(): void {
    this.renderChallengeCount();
  }

  /**
   * Render the challenge count to the DOM
   * @returns {void}
   */
  renderChallengeCount(): void {
    let completedChallengesCount = this.challengeList.challengesCompleted;
    let totalChallengesCount = this.challengeList.totalChallenges;
    const totalChallengesElement: HTMLElement | null =
      document.querySelector(".challenge-count");
    if (totalChallengesElement) {
      totalChallengesElement.innerText = `${completedChallengesCount}/${totalChallengesCount}`;
    }
  }

  /**
   * Render command tips to the DOM
   * @returns {void}
   */
  renderCommandTips(): void {
    const tips = ["!challenge", "!edit", "!done", "!delete", "!check", "!help"];
    const commandTipEl = document.querySelector(".command-tips");
    if (!commandTipEl) return;

    commandTipEl.classList.remove("hidden");
    let tipIdx = 0;
    setInterval(() => {
      const commandCodeEl = commandTipEl.querySelector(
        ".command-code"
      ) as HTMLElement;
      if (commandCodeEl) {
        commandCodeEl.textContent = tips[tipIdx];
        tipIdx = (tipIdx + 1) % tips.length;
      }
    }, 6000);
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
    let template = "";
    let responseDetail = "";

    try {
      // Try enhanced command system first (for !ch commands)
      if (command === "!ch" || command.startsWith("!ch ")) {
        const enhancedResponse = this.#enhancedCommandHandler.handleCommand(
          username,
          command.slice(1), // Remove ! prefix
          message,
          flags
        );

        if (enhancedResponse.action !== "not_enhanced") {
          // Handle DOM updates for enhanced commands
          if (!enhancedResponse.error && enhancedResponse.challengeId) {
            const challenge = this.challengeList.challenges.find(c => c.shortId === enhancedResponse.challengeId);
            if (challenge) {
              if (enhancedResponse.action === "add") {
                this.addChallengeToDOM(challenge);
              } else if (enhancedResponse.action === "edit") {
                this.editChallengeFromDOM(challenge);
              } else if (enhancedResponse.action === "complete") {
                this.completeChallengeFromDOM(challenge.id);
              }
            }
          }

          return {
            error: enhancedResponse.error,
            message: enhancedResponse.message
          };
        }
      }
      // ADMIN COMMANDS
      if (isMod(flags)) {
        if (this.#configManager.get("commands.clearList").includes(command)) {
          this.challengeList.clearChallengeList();
          this.clearListFromDOM();
          template = this.#configManager.get("responses.clearList");
          return respondMessage(template, username, responseDetail);
        } else if (
          this.#configManager.get("commands.clearDone").includes(command)
        ) {
          const challenges = this.challengeList.clearDoneChallenges();
          challenges.forEach(({ id }) => {
            this.deleteChallengeFromDOM(id);
          });
          template = this.#configManager.get("responses.clearDone");
          return respondMessage(template, username, responseDetail);
        } else if (
          this.#configManager.get("commands.clearUser").includes(command)
        ) {
          // In single-streamer mode, clearUser becomes clearAll
          this.challengeList.clearChallengeList();
          this.clearListFromDOM();
          responseDetail = "all challenges";
          template = this.#configManager.get("responses.clearUser");
          return respondMessage(template, username, responseDetail);
        }
      }

      // USER COMMANDS (now restricted to mods/broadcaster only)
      if (this.#configManager.get("commands.addChallenge").includes(command)) {
        // ADD CHALLENGE - only mods/broadcaster can add challenges
        if (!isMod(flags)) {
          throw new Error(
            "Only moderators and the broadcaster can add challenges"
          );
        }
        if (message === "") {
          throw new Error("Challenge description is empty");
        }

        const challengeDescriptions = message.split(", ");
        if (
          this.challengeList.challenges.length + challengeDescriptions.length >
          parseInt(this.#maxChallengesTotal.toString(), 10)
        ) {
          template = this.#configManager.get("responses.maxChallengesAdded");
        } else {
          const challenges = this.challengeList.addChallenges(
            challengeDescriptions
          );
          challenges.forEach((challenge) => {
            this.addChallengeToDOM(challenge);
          });
          responseDetail = challengeDescriptions
            .map((challenge) => `📝 "${challenge}"`)
            .join(", ")
            .replace(/,([^,]*)$/, " &$1");
          template = this.#configManager.get("responses.addChallenge");
        }
      } else if (
        this.#configManager.get("commands.editChallenge").includes(command)
      ) {
        // EDIT CHALLENGE - only mods/broadcaster can edit challenges
        if (!isMod(flags)) {
          throw new Error(
            "Only moderators and the broadcaster can edit challenges"
          );
        }
        const whiteSpaceIdx = message.search(/(?<=\d)\s/); // number followed by space
        if (whiteSpaceIdx === -1) {
          throw new Error("Challenge number or description format is invalid");
        }
        const challengeNumber = message.slice(0, whiteSpaceIdx);
        const newDescription = message.slice(whiteSpaceIdx + 1);
        const challenge = this.challengeList.editChallenge(
          parseChallengeIndex(challengeNumber),
          newDescription
        );
        this.editChallengeFromDOM(challenge);
        responseDetail = challengeNumber;
        template = this.#configManager.get("responses.editChallenge");
      } else if (
        this.#configManager.get("commands.finishChallenge").includes(command)
      ) {
        // COMPLETE/DONE CHALLENGE - only mods/broadcaster can complete challenges
        if (!isMod(flags)) {
          throw new Error(
            "Only moderators and the broadcaster can complete challenges"
          );
        }
        const indices = message.split(",").reduce((acc: number[], i) => {
          if (parseChallengeIndex(i) >= 0) acc.push(parseChallengeIndex(i));
          return acc;
        }, []);
        const challenges = this.challengeList.completeChallenges(indices);
        challenges.forEach(({ id }) => {
          this.completeChallengeFromDOM(id);
        });
        if (challenges.length === 0) {
          template = this.#configManager.get("responses.noChallengeFound");
        } else {
          responseDetail = challenges
            .map((challenge) => `✅ "${challenge.description}"`)
            .join(", ")
            .replace(/,([^,]*)$/, " &$1");

          template = this.#configManager.get("responses.finishChallenge");
        }
      } else if (
        this.#configManager.get("commands.deleteChallenge").includes(command)
      ) {
        // DELETE/REMOVE CHALLENGE - only mods/broadcaster can delete challenges
        if (!isMod(flags)) {
          throw new Error(
            "Only moderators and the broadcaster can delete challenges"
          );
        }
        responseDetail = message;
        if (message.toLowerCase() === "all") {
          this.challengeList.clearChallengeList();
          this.clearListFromDOM();
          template = this.#configManager.get("responses.deleteAll");
        } else {
          const indices = message.split(",").reduce((acc: number[], i) => {
            if (parseChallengeIndex(i) >= 0) acc.push(parseChallengeIndex(i));
            return acc;
          }, []);
          const challenges = this.challengeList.deleteChallenges(indices);
          challenges.forEach(({ id }) => {
            this.deleteChallengeFromDOM(id);
          });
          if (challenges.length === 0) {
            template = this.#configManager.get("responses.noChallengeFound");
          } else {
            template = this.#configManager.get("responses.deleteChallenge");
          }
        }
      } else if (this.#configManager.get("commands.check").includes(command)) {
        // CHECK CHALLENGES - anyone can check challenges
        const challengeMap = this.challengeList.checkChallenges();
        const list = [];
        for (let [challengeNumber, challenge] of challengeMap) {
          list.push(`📝 ${challengeNumber + 1}. ${challenge.description}`);
        }
        responseDetail = list.join(" ");
        if (responseDetail === "") {
          template = this.#configManager.get("responses.noChallengeFound");
        } else {
          template = this.#configManager.get("responses.check");
        }
      } else if (this.#configManager.get("commands.help").includes(command)) {
        // HELP COMMAND
        template = this.#configManager.get("responses.help");
      } else {
        // INVALID COMMAND
        throw new Error("command not found");
      }

      return respondMessage(template, username, responseDetail);
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
    this.renderChallengeCount();
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
      const challengeCard = createChallengeCard();
      const clonedChallengeCard = challengeCard.cloneNode(true);
      primaryContainer.appendChild(challengeCard);
      secondaryContainer.appendChild(clonedChallengeCard);
    }

    const challengeElement = document.createElement("li");
    challengeElement.classList.add("challenge");
    challengeElement.dataset.challengeId = `${challenge.id}`;

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
      checkbox.style.setProperty('--challenge-checkbox-border-color', textColor);
      checkbox.style.setProperty('--challenge-checkbox-checked-border-color', textColor);
      checkbox.style.setProperty('--challenge-checkbox-checkmark-color', textColor);
    }

    challengeElement.appendChild(checkbox);

    // Create text element for challenge title and description
    const textElement = createChallengeTextElement(challenge);

    // Apply text color to the text element if configured
    if (textColor) {
      textElement.style.color = textColor;
      // Also apply to child elements
      const titleElement = textElement.querySelector(".challenge-title") as HTMLElement;
      const descriptionElement = textElement.querySelector(".challenge-description") as HTMLElement;
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
      const clonedTextElement = cloneChallengeElement.querySelector(".challenge-text") as HTMLElement;
      if (clonedTextElement) {
        clonedTextElement.style.color = textColor;
      }

      // Apply checkbox colors to the cloned checkbox as well
      const clonedCheckbox = cloneChallengeElement.querySelector(".challenge-checkbox") as HTMLElement;
      if (clonedCheckbox) {
        clonedCheckbox.style.setProperty('--challenge-checkbox-border-color', textColor);
        clonedCheckbox.style.setProperty('--challenge-checkbox-checked-border-color', textColor);
        clonedCheckbox.style.setProperty('--challenge-checkbox-checkmark-color', textColor);
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

    this.renderChallengeCount();
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
      const textElement = challengeElement.querySelector(".challenge-text") as HTMLElement;
      if (textElement) {
        // Replace the entire text element with new structure
        const newTextElement = createChallengeTextElement(challenge);

        // Preserve any existing color styling
        const existingColor = textElement.style.color;
        if (existingColor) {
          newTextElement.style.color = existingColor;
          const titleElement = newTextElement.querySelector(".challenge-title") as HTMLElement;
          const descriptionElement = newTextElement.querySelector(".challenge-description") as HTMLElement;
          if (titleElement) titleElement.style.color = existingColor;
          if (descriptionElement) descriptionElement.style.color = existingColor;
        }

        textElement.parentNode?.replaceChild(newTextElement, textElement);
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
      const checkbox = challengeElement.querySelector(".challenge-checkbox");
      if (checkbox) {
        checkbox.classList.add("checked");
      }
    }
    this.renderChallengeCount();
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
    this.renderChallengeCount();
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
    message:
      "🤖💬 " +
      template.replace("{user}", username).replace("{message}", message),
    error,
  };
}

/**
 * Check if the user is a mod or broadcaster
 * @param {{broadcaster: boolean, mod: boolean}} flags
 * @returns {boolean}
 */
function isMod(flags: { broadcaster: boolean; mod: boolean }): boolean {
  return flags.broadcaster || flags.mod;
}

/**
 * Parse the challenge index
 * @param {string} index
 * @returns {number}
 */
function parseChallengeIndex(index: string): number {
  return parseInt(index, 10) - 1;
}

/**
 * Create a challenge card element for the single challenge list
 * @returns {HTMLDivElement}
 */
function createChallengeCard(): HTMLDivElement {
  const cardEl = document.createElement("div");
  cardEl.classList.add("card");
  const headerDiv = document.createElement("div");
  headerDiv.classList.add("username");
  headerDiv.innerText = "Challenges"; // Static header for single challenge list
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
