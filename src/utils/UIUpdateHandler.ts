import { animateScroll } from "../animations/animateScroll";
import Challenge from "../classes/Challenge";
import ChallengeList from "../classes/ChallengeList";
import ConfigManager from "../classes/ConfigManager";
import { ChallengeStatus } from "../types/ChallengeStatus";
import type { CommandResponse } from "../types/CommandResponse";
import {
    BACKGROUND_CONFIG,
    BACKGROUND_DEFAULTS,
    BEHAVIOR_CONFIG,
    COLOR_CONFIG,
} from "../types/ConfigConstants";
import {
    CSS_CLASSES,
    CSS_SELECTORS,
    DATA_ATTRIBUTES,
    URL_HASH,
} from "../types/DOMConstants";
import ChallengeRenderer from "./ChallengeRenderer";
import { combineColorWithOpacity } from "./ColorUtils";
import DOMHelper from "./DOMHelper";
import Timer from "./Timer";
import TimerController from "./TimerController";
import TimerDisplayUtils from "./TimerDisplayUtils";

// Unified options type for creating challenge elements across modes
type ChallengeElementOptions = {
    // Base
    includeEventListeners: boolean;
    eventHandler: (event: Event) => void;
    displayPosition?: number;
    // Admin (standard and text-only shared)
    editHandler?: (event: Event) => void;
    incrementHandler?: (event: Event) => void;
    decrementHandler?: (event: Event) => void;
    failHandler?: (event: Event) => void;
    // Rendering behavior flags
    textOnlyMode?: boolean;
    // Text-only specific handlers
    completeHandler?: (event: Event) => void;
    uncompleteHandler?: (event: Event) => void;
    unfailHandler?: (event: Event) => void;
};

/**
 * @class UIUpdateHandler
 * Handles all DOM manipulation operations based on command results.
 * Provides separation of concerns between command processing and UI updates.
 */
export default class UIUpdateHandler {
    private challengeList: ChallengeList;
    private configManager: ConfigManager;
    private timerController: TimerController;
    private editHandler?: (event: Event) => void;
    private incrementHandler?: (event: Event) => void;
    private decrementHandler?: (event: Event) => void;
    private completeHandler?: (event: Event) => void;
    private failHandler?: (event: Event) => void;
    private uncompleteHandler?: (event: Event) => void;
    private unfailHandler?: (event: Event) => void;

    // DOM element cache for performance optimization
    private challengeContainer: HTMLElement | null = null;
    private challengesList: HTMLElement | null = null;

    /**
     * Map of action strings to their corresponding handler functions
     * This replaces the switch statement for better maintainability
     */
    private readonly actionHandlers: Record<
        string,
        (challengeIndices?: number[], challenges?: Challenge[]) => void
    > = {
        add: (challengeIndices, challenges) =>
            this.handleAddUpdate(challengeIndices, challenges),
        edit: (challengeIndices, challenges) =>
            this.handleEditUpdate(challengeIndices, challenges),
        complete: (challengeIndices, challenges) =>
            this.handleCompleteUpdate(challengeIndices, challenges),
        revert: (challengeIndices, challenges) =>
            this.handleRevertUpdate(challengeIndices, challenges),
        delete: (challengeIndices, challenges) =>
            this.handleDeleteUpdate(challengeIndices, challenges),
        clearAll: () => this.handleClearAllUpdate(),
        clearDone: () => this.handleClearDoneUpdate(),
        refresh: () => this.handleRefreshUpdate(),
    };

    /**
     * @constructor
     * @param challengeList - The challenge list instance
     * @param configManager - The configuration manager instance
     * @param editHandler - Optional edit icon click handler
     * @param incrementHandler - Optional increment button click handler
     * @param decrementHandler - Optional decrement button click handler
     * @param completeHandler - Optional complete button click handler
     * @param failHandler - Optional fail button click handler
     * @param uncompleteHandler - Optional uncomplete button click handler
     * @param unfailHandler - Optional unfail button click handler
     */
    constructor(
        challengeList: ChallengeList,
        configManager: ConfigManager,
        editHandler?: (event: Event) => void,
        incrementHandler?: (event: Event) => void,
        decrementHandler?: (event: Event) => void,
        completeHandler?: (event: Event) => void,
        failHandler?: (event: Event) => void,
        uncompleteHandler?: (event: Event) => void,
        unfailHandler?: (event: Event) => void
    ) {
        this.challengeList = challengeList;
        this.configManager = configManager;
        this.timerController = new TimerController(challengeList);
        if (editHandler !== undefined) {
            this.editHandler = editHandler;
        }
        if (incrementHandler !== undefined) {
            this.incrementHandler = incrementHandler;
        }
        if (decrementHandler !== undefined) {
            this.decrementHandler = decrementHandler;
        }
        if (completeHandler !== undefined) {
            this.completeHandler = this.handleCompleteButtonClick;
        }
        if (failHandler !== undefined) {
            this.failHandler = this.handleFailButtonClick;
        }
        if (uncompleteHandler !== undefined) {
            this.uncompleteHandler = this.handleUncompleteButtonClick;
        }
        if (unfailHandler !== undefined) {
            this.unfailHandler = this.handleUnfailButtonClick;
        }
    }

    /**
     * Handle command result and perform appropriate UI updates
     * @param response - Command response containing UI update data
     * @returns void
     */
    handleCommandResult(response: CommandResponse): void {
        if (response.error || !response.uiUpdate) {
            return;
        }

        const {
            action,
            challengeIndices,
            challenges,
            updateTimers,
            updateCount,
        } = response.uiUpdate;

        // Use lookup map to find and execute the appropriate handler
        const handler = this.actionHandlers[action];
        if (handler) {
            handler(challengeIndices, challenges);
        } else {
            // Graceful fallback for undefined actions
            console.warn(
                `UIUpdateHandler: Unknown action "${action}" - ignoring update`
            );
        }

        // Handle optional updates
        if (updateTimers) {
            this.timerController.updateTimerDisplays();
        }
        if (updateCount) {
            this.updateChallengeCount();
        }
    }

    /**
     * Handle add challenge UI updates with batched DOM operations for performance
     * @param _challengeIndices - Array indices of added challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were added
     */
    private handleAddUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges || challenges.length === 0) return;

        const challengesList = this.getCachedChallengesList();
        if (!challengesList) {
            console.error(
                "Challenge list container not found - cannot add challenges"
            );
            return;
        }

        // Use DocumentFragment for efficient batch DOM operations
        const fragment = document.createDocumentFragment();

        challenges.forEach((challenge, index) => {
            const challengeElement = this.createChallengeElement(
                challenge,
                index
            );
            fragment.appendChild(challengeElement);
        });

        // Single DOM append operation to reduce reflows
        challengesList.appendChild(fragment);

        // Single scroll animation at the end
        animateScroll();

        this.updateChallengeCount();
        this.timerController.startTimerUpdates();
    }

    /**
     * Handle edit challenge UI updates
     * @param _challengeIndices - Array indices of edited challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were edited
     */
    private handleEditUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            this.editChallengeFromDOM(challenge);
        });
        this.timerController.startTimerUpdates();
    }

    /**
     * Handle complete challenge UI updates
     * @param _challengeIndices - Array indices of completed challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were completed
     */
    private handleCompleteUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            DOMHelper.completeChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Handle revert challenge UI updates
     * @param _challengeIndices - Array indices of reverted challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were reverted
     */
    private handleRevertUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            DOMHelper.revertChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Handle delete challenge UI updates
     * @param _challengeIndices - Array indices of deleted challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were deleted
     */
    private handleDeleteUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            DOMHelper.deleteChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Handle clear all challenges UI update
     */
    private handleClearAllUpdate(): void {
        this.clearListFromDOM();
    }

    /**
     * Handle clear done challenges UI update
     */
    private handleClearDoneUpdate(): void {
        const doneChallenges = this.challengeList.challenges.filter((c) =>
            c.isComplete()
        );
        doneChallenges.forEach((challenge) => {
            DOMHelper.deleteChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Handle refresh UI update
     */
    private handleRefreshUpdate(): void {
        this.renderChallengeList();
    }

    /**
     * Clear the entire challenge list from DOM
     */
    clearListFromDOM(): void {
        // Clear the entire container and then re-render to ensure proper header structure
        const challengeContainer = document.querySelector(
            CSS_SELECTORS.CHALLENGE_CONTAINER
        );

        if (challengeContainer) {
            challengeContainer.innerHTML = "";
        }

        this.renderChallengeList();
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Add the challenge to the DOM
     * @param challenge - Challenge to add
     */
    addChallengeToDOM(challenge: Challenge): void {
        const challengeContainer = this.getCachedChallengeContainer();

        if (!challengeContainer) {
            console.error("Challenge container not found");
            return;
        }

        // Create card if none exist (handles initial state)
        const challengeCardEls = document.querySelectorAll(CSS_SELECTORS.CARD);
        if (challengeCardEls.length === 0) {
            const challengeCard = DOMHelper.createChallengeCard(
                this.challengeList.challengesCompleted,
                this.challengeList.totalChallenges
            );

            // Apply overlay background styling to the new card
            const overlayBackgroundColor = this.configManager.get(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR
            );
            if (overlayBackgroundColor) {
                const overlayBackgroundOpacity =
                    this.configManager.get(
                        BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY
                    ) ?? BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY;

                // Combine color and opacity to create RGBA string
                const overlayBackgroundRGBA = combineColorWithOpacity(
                    overlayBackgroundColor,
                    overlayBackgroundOpacity
                );
                challengeCard.style.backgroundColor = overlayBackgroundRGBA;
                challengeCard.classList.add(
                    CSS_CLASSES.CUSTOM_OVERLAY_BACKGROUND
                );
            }

            challengeContainer.appendChild(challengeCard);

            // Invalidate cache after creating new card to ensure we query the fresh DOM
            this.invalidateCache();
        }

        const challengesList = this.getCachedChallengesList();
        if (!challengesList) {
            console.error(
                "Challenge ordered list not found - ensure card is properly initialized"
            );
            return;
        }

        // Calculate row index for newly added challenge (it's at the end of the list)
        const rowIndex = this.challengeList.challenges.length - 1;
        const challengeElement = this.createChallengeElement(
            challenge,
            rowIndex
        );

        // Add to the single challenge list
        challengesList.appendChild(challengeElement);

        // Update challenge count and timers
        this.updateChallengeCount();

        // Start timer updates if the new challenge has an active timer
        if (challenge.timer && challenge.timer.isActive) {
            this.timerController.startTimerUpdates();
        }

        // Animate scroll to new challenge
        animateScroll();
    }

    /**
     * Edit the challenge in the DOM
     * @param challenge - Challenge to edit
     */
    editChallengeFromDOM(challenge: Challenge): void {
        const challengeElements: NodeListOf<HTMLElement> =
            document.querySelectorAll(`[data-challenge-id="${challenge.id}"]`);

        for (const challengeElement of challengeElements) {
            const textElement = challengeElement.querySelector(
                CSS_SELECTORS.CHALLENGE_TEXT
            ) as HTMLElement;
            if (textElement) {
                // Replace the entire text element with new structure
                const newTextElement =
                    ChallengeRenderer.createChallengeTextElement(challenge);

                // Preserve any existing color styling
                const existingColor = textElement.style.color;
                if (existingColor) {
                    newTextElement.style.color = existingColor;
                    const titleElement = newTextElement.querySelector(
                        CSS_SELECTORS.CHALLENGE_TITLE
                    ) as HTMLElement;
                    const descriptionElement = newTextElement.querySelector(
                        CSS_SELECTORS.CHALLENGE_DESCRIPTION
                    ) as HTMLElement;
                    const progressElement = newTextElement.querySelector(
                        CSS_SELECTORS.CHALLENGE_AMOUNT
                    ) as HTMLElement;
                    if (titleElement) titleElement.style.color = existingColor;
                    if (descriptionElement)
                        descriptionElement.style.color = existingColor;
                    if (progressElement)
                        progressElement.style.color = existingColor;
                }

                textElement.parentNode?.replaceChild(
                    newTextElement,
                    textElement
                );

                // Handle timer display - remove existing timer and add new one if needed
                const existingTimer = challengeElement.querySelector(
                    CSS_SELECTORS.CHALLENGE_TIMER
                );
                if (existingTimer) {
                    existingTimer.remove();
                }

                // Add timer display if timer exists and is active (inside metadata row)
                if (challenge.timer && challenge.timer.isActive) {
                    const timerElement = TimerDisplayUtils.createTimerElement(
                        challenge.timer,
                        challenge.id
                    );
                    // Find the metadata row and append timer to it
                    const metadataRow = challengeElement.querySelector(
                        CSS_SELECTORS.CHALLENGE_METADATA
                    );
                    if (metadataRow) {
                        metadataRow.appendChild(timerElement);
                    }
                }
            }
        }

        // Restart timer updates to handle any timer changes
        this.timerController.startTimerUpdates();
    }

    /**
     * Get cached challenge container element, querying DOM if not cached
     * @returns Challenge container element or null if not found
     */
    private getCachedChallengeContainer(): HTMLElement | null {
        if (!this.challengeContainer) {
            this.challengeContainer = document.querySelector(
                CSS_SELECTORS.CHALLENGE_CONTAINER
            );
        }
        return this.challengeContainer;
    }

    /**
     * Get cached challenges list element, querying DOM if not cached
     * @returns Challenges list element or null if not found
     */
    private getCachedChallengesList(): HTMLElement | null {
        // If we have a cached element, verify it's still in the DOM
        // (it might have been detached by a render operation)
        if (this.challengesList && !document.contains(this.challengesList)) {
            this.challengesList = null;
        }

        if (!this.challengesList) {
            const container = this.getCachedChallengeContainer();
            if (container) {
                this.challengesList = container.querySelector(
                    CSS_SELECTORS.CHALLENGES_LIST
                );
            }
        }
        return this.challengesList;
    }

    /**
     * Invalidate DOM element cache (called when card structure is rebuilt)
     */
    private invalidateCache(): void {
        this.challengeContainer = null;
        this.challengesList = null;
    }

    /**
     * Render the complete challenge list to the DOM
     */
    renderChallengeList(): void {
        // Invalidate cache since we're rebuilding the card structure
        this.invalidateCache();

        const challengeContainer = this.getCachedChallengeContainer();

        if (!challengeContainer) {
            console.error("Challenge container not found");
            return;
        }

        // Clear existing content
        challengeContainer.innerHTML = "";

        // Create challenge card with proper header structure
        const challengeCard = DOMHelper.createChallengeCard(
            this.challengeList.challengesCompleted,
            this.challengeList.totalChallenges
        );

        // Apply overlay background styling if configured
        // This must be done before appending to ensure styles are applied
        const overlayBackgroundColor = this.configManager.get(
            BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR
        );
        if (overlayBackgroundColor) {
            const overlayBackgroundOpacity =
                this.configManager.get(
                    BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY
                ) ?? BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY;

            // Combine color and opacity to create RGBA string
            const overlayBackgroundRGBA = combineColorWithOpacity(
                overlayBackgroundColor,
                overlayBackgroundOpacity
            );
            challengeCard.style.backgroundColor = overlayBackgroundRGBA;
            challengeCard.classList.add(CSS_CLASSES.CUSTOM_OVERLAY_BACKGROUND);
        }

        // Hide card in viewer mode when there are no challenges
        const isAdminMode = window.location.hash === URL_HASH.ADMIN;
        if (!isAdminMode && this.challengeList.challenges.length === 0) {
            challengeCard.classList.add(CSS_CLASSES.HIDDEN);
        }

        // Append card to container
        challengeContainer.appendChild(challengeCard);

        // Invalidate cache again since DOM structure changed
        this.invalidateCache();

        // Get the ordered list from the card
        const challengeList = challengeCard.querySelector(
            CSS_SELECTORS.CHALLENGES_ORDERED_LIST
        );

        if (!challengeList) {
            console.error("Challenge ordered list not found in created card");
            return;
        }

        // Use DocumentFragment for efficient batch DOM operations
        const fragment = document.createDocumentFragment();

        // Render all challenges
        this.challengeList.challenges.forEach((challenge, index) => {
            const challengeElement = this.createChallengeElement(
                challenge,
                index
            );
            fragment.appendChild(challengeElement);
        });

        // Single DOM append operation to reduce reflows
        challengeList.appendChild(fragment);

        this.updateChallengeCount();
        this.timerController.startTimerUpdates();
    }

    /**
     * Determine if the current mode is admin mode
     * Protected for testability - can be overridden in tests
     */
    protected isAdminMode(): boolean {
        return window.location.hash === URL_HASH.ADMIN;
    }

    /**
     * Get text-only mode setting for admin
     * Protected for testability
     */
    protected getAdminTextOnlyMode(): boolean {
        return (
            this.configManager.get(BEHAVIOR_CONFIG.ADMIN_TEXT_ONLY_MODE) ??
            false
        );
    }

    /**
     * Build base options for challenge element creation
     * @private
     */
    private buildBaseOptions(
        displayPosition?: number
    ): ChallengeElementOptions {
        const isAdminMode = this.isAdminMode();
        return {
            includeEventListeners: !isAdminMode,
            eventHandler: this.handleCheckboxClick,
            ...(displayPosition !== undefined && { displayPosition }),
        };
    }

    /**
     * Add admin-specific handlers to options
     * @private
     */
    private addAdminHandlers(options: ChallengeElementOptions): void {
        if (this.editHandler) {
            options.editHandler = this.editHandler;
        }
        if (this.incrementHandler) {
            options.incrementHandler = this.incrementHandler;
        }
        if (this.decrementHandler) {
            options.decrementHandler = this.decrementHandler;
        }
    }

    /**
     * Add text-only mode handlers to options
     * @private
     */
    private addTextOnlyHandlers(options: ChallengeElementOptions): void {
        if (this.completeHandler) {
            options.completeHandler = this.completeHandler;
        }
        if (this.uncompleteHandler) {
            options.uncompleteHandler = this.uncompleteHandler;
        }
        if (this.failHandler) {
            options.failHandler = this.failHandler;
        }
        if (this.unfailHandler) {
            options.unfailHandler = this.unfailHandler;
        }
    }

    /**
     * Add timer element to challenge if timer is active
     * @private
     */
    private addTimerToChallengeElement(
        challengeElement: HTMLElement,
        challenge: Challenge
    ): void {
        if (challenge.timer && challenge.timer.isActive) {
            const timerElement = this.createTimerElement(
                challenge.timer,
                challenge.id
            );
            const metadataRow = challengeElement.querySelector(
                CSS_SELECTORS.CHALLENGE_METADATA
            );
            if (metadataRow) {
                metadataRow.appendChild(timerElement);
            }
        }
    }

    /**
     * Create a challenge DOM element using shared renderer
     * @param challenge - Challenge to create element for
     * @param rowIndex - Optional row index for styling (defaults to challenge position in list)
     * @returns HTMLElement representing the challenge
     */
    private createChallengeElement(
        challenge: Challenge,
        rowIndex?: number
    ): HTMLElement {
        // Calculate display position (1-based) from row index
        const displayPosition =
            rowIndex !== undefined ? rowIndex + 1 : undefined;

        const isAdminMode = this.isAdminMode();
        const options = this.buildBaseOptions(displayPosition);

        // Handle admin mode
        if (isAdminMode) {
            this.addAdminHandlers(options);

            const adminTextOnlyMode = this.getAdminTextOnlyMode();

            // Text-only mode uses completely different rendering
            if (adminTextOnlyMode) {
                this.addTextOnlyHandlers(options);
                return ChallengeRenderer.createTextOnlyChallengeElement(
                    challenge,
                    options
                );
            }

            // Non text-only admin mode: still provide fail handler
            if (this.failHandler) {
                options.failHandler = this.failHandler;
            }
            options.textOnlyMode = adminTextOnlyMode;
        }

        // Create standard challenge element
        const challengeElement = ChallengeRenderer.createChallengeElement(
            challenge,
            options
        );

        // Apply styling
        this.applyStylingToChallengeElement(challengeElement, rowIndex);

        // Add timer if present and active
        this.addTimerToChallengeElement(challengeElement, challenge);

        return challengeElement;
    }

    /**
     * Apply styling to a challenge element using centralized styling helpers
     * @param challengeElement - The challenge element to style
     * @param rowIndex - Optional row index for styling (defaults to challenge position in list)
     */
    private applyStylingToChallengeElement(
        challengeElement: HTMLElement,
        rowIndex?: number
    ): void {
        // Get color configuration
        const rowColors =
            this.configManager.get(COLOR_CONFIG.CHALLENGE_ROW_COLORS) || [];
        const rowTextColors =
            this.configManager.get(COLOR_CONFIG.CHALLENGE_ROW_TEXT_COLORS) ||
            [];
        const rowColorsOpacity =
            this.configManager.get(COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY) ??
            BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;

        // Get background customization configuration
        const backgroundConfig = {
            challengeBackgroundColor: this.configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR
            ),
            challengeBackgroundOpacity: this.configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_OPACITY
            ),
            challengeTextColor: this.configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_COLOR
            ),
            challengeAutoTextColor: this.configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_AUTO_TEXT_COLOR
            ),
            challengeTextShadow: this.configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_SHADOW
            ),
        };

        // Determine row index if not provided
        const actualRowIndex =
            rowIndex !== undefined
                ? rowIndex
                : this.challengeList.challenges.findIndex(
                      (c) =>
                          c.id ===
                          challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID]
                  );

        // Apply background customization (includes row colors if configured)
        ChallengeRenderer.applyBackgroundCustomization(
            challengeElement,
            backgroundConfig,
            actualRowIndex,
            rowColors,
            rowTextColors,
            rowColorsOpacity
        );
    }

    /**
     * Create a timer DOM element using shared utilities
     * @param timer - Timer instance
     * @param challengeId - Challenge ID for element identification
     * @returns HTMLElement representing the timer
     */
    private createTimerElement(timer: Timer, challengeId: string): HTMLElement {
        return TimerDisplayUtils.createTimerElement(timer, challengeId);
    }

    /**
     * Handle checkbox click events to toggle challenge completion status
     * @param event - The click event
     */
    /**
     * Handle Complete button click in text-only mode
     * @param event - Click event
     */
    private handleCompleteButtonClick = (event: Event): void => {
        const button = event.target as HTMLElement;
        const challengeElement = button.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement;

        if (!challengeElement) {
            console.error(
                "Could not find challenge element for Complete button"
            );
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            console.error("Could not find challenge ID for Complete button");
            return;
        }

        try {
            const challenge = this.challengeList.getChallengeById(challengeId);
            if (!challenge) {
                console.error("Could not find challenge with ID:", challengeId);
                return;
            }

            // Set challenge to done state
            challenge.setStatus(ChallengeStatus.COMPLETED);
            this.challengeList.saveToLocalStorage();

            // Update DOM to reflect the new state
            DOMHelper.completeChallengeFromDOM(challengeId);

            // Update count and timers
            this.updateChallengeCount();
            this.timerController.updateTimerDisplays();
        } catch (error) {
            console.error("Error completing challenge:", error);
        }
    };

    /**
     * Handle Fail button click in text-only mode
     * @param event - Click event
     */
    private handleFailButtonClick = (event: Event): void => {
        const button = event.target as HTMLElement;
        const challengeElement = button.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement;

        if (!challengeElement) {
            console.error("Could not find challenge element for Fail button");
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            console.error("Could not find challenge ID for Fail button");
            return;
        }

        try {
            const challenge = this.challengeList.getChallengeById(challengeId);
            if (!challenge) {
                console.error("Could not find challenge with ID:", challengeId);
                return;
            }

            // Set challenge to failed state
            challenge.setStatus(ChallengeStatus.FAILED);
            this.challengeList.saveToLocalStorage();

            // Update DOM to reflect the new state
            DOMHelper.failChallengeFromDOM(challengeId);

            // Update count and timers
            this.updateChallengeCount();
            this.timerController.updateTimerDisplays();
        } catch (error) {
            console.error("Error failing challenge:", error);
        }
    };

    /**
     * Handle Uncomplete button click in text-only mode
     * @param event - Click event
     */
    private handleUncompleteButtonClick = (event: Event): void => {
        const button = event.target as HTMLElement;
        const challengeElement = button.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement;

        if (!challengeElement) {
            console.error(
                "Could not find challenge element for Uncomplete button"
            );
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            console.error("Could not find challenge ID for Uncomplete button");
            return;
        }

        try {
            const challenge = this.challengeList.getChallengeById(challengeId);
            if (!challenge) {
                console.error("Could not find challenge with ID:", challengeId);
                return;
            }

            // Set challenge back to in-progress
            challenge.setStatus(ChallengeStatus.IN_PROGRESS);
            this.challengeList.saveToLocalStorage();

            // Update DOM to reflect the new state
            DOMHelper.revertChallengeFromDOM(challengeId);

            // Update count and timers
            this.updateChallengeCount();
            this.timerController.updateTimerDisplays();
        } catch (error) {
            console.error("Error uncompleting challenge:", error);
        }
    };

    /**
     * Handle Unfail button click in text-only mode
     * @param event - Click event
     */
    private handleUnfailButtonClick = (event: Event): void => {
        const button = event.target as HTMLElement;
        const challengeElement = button.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement;

        if (!challengeElement) {
            console.error("Could not find challenge element for Unfail button");
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            console.error("Could not find challenge ID for Unfail button");
            return;
        }

        try {
            const challenge = this.challengeList.getChallengeById(challengeId);
            if (!challenge) {
                console.error("Could not find challenge with ID:", challengeId);
                return;
            }

            // Set challenge back to in-progress
            challenge.setStatus(ChallengeStatus.IN_PROGRESS);
            this.challengeList.saveToLocalStorage();

            // Update DOM to reflect the new state
            DOMHelper.revertChallengeFromDOM(challengeId);

            // Update count and timers
            this.updateChallengeCount();
            this.timerController.updateTimerDisplays();
        } catch (error) {
            console.error("Error unfailing challenge:", error);
        }
    };

    private handleCheckboxClick = (event: Event): void => {
        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const checkbox = event.target as HTMLElement;
        const challengeElement = checkbox.closest(
            CSS_SELECTORS.CHALLENGE
        ) as HTMLElement;

        if (!challengeElement) {
            console.error("Could not find challenge element for checkbox");
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            console.error("Could not find challenge ID for checkbox");
            return;
        }

        try {
            // Toggle completion only: in-progress ↔ done (failure handled via explicit Fail button)
            const challenge =
                this.challengeList.toggleChallengeCompletion(challengeId);
            if (!challenge) {
                console.error("Could not find challenge with ID:", challengeId);
                return;
            }

            // Update DOM to reflect the new state
            if (challenge.isComplete()) {
                DOMHelper.completeChallengeFromDOM(challengeId);
            } else {
                // in-progress
                DOMHelper.revertChallengeFromDOM(challengeId);
            }

            // Update count and timers
            this.updateChallengeCount();
            this.timerController.updateTimerDisplays();
        } catch (error) {
            console.error("Error toggling challenge completion:", error);
        }
    };

    /**
     * Update the challenge count display
     */
    updateChallengeCount(): void {
        // Use shared helper with efficient getters from ChallengeList
        DOMHelper.updateChallengeCount(
            this.challengeList.challengesCompleted,
            this.challengeList.totalChallenges
        );
    }

    /**
     * Update timer displays - delegates to TimerController
     * @public method for testing and external access
     */
    updateTimerDisplays(): void {
        this.timerController.updateTimerDisplays();
    }

    /**
     * Start timer updates - delegates to TimerController
     * @public method for testing and external access
     */
    startTimerUpdates(): void {
        this.timerController.startTimerUpdates();
    }

    /**
     * Stop timer updates - delegates to TimerController
     * @public method for testing and external access
     */
    stopTimerUpdates(): void {
        this.timerController.stopTimerUpdates();
    }

    /**
     * Get timer update interval status - delegates to TimerController
     * @public method for testing access
     */
    get timerUpdateInterval(): number | null {
        return this.timerController.getTimerUpdateInterval();
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.timerController.destroy();
    }
}
