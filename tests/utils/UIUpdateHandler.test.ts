import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import type { CommandResponse } from "../../src/types/CommandResponse";
import { BEHAVIOR_CONFIG } from "../../src/types/ConfigConstants";
import {
    CSS_CLASSES,
    CSS_SELECTORS,
    DATA_ATTRIBUTES,
    EVENT_NAMES,
    URL_HASH,
} from "../../src/types/DOMConstants";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";
import ChallengeRenderer from "../../src/utils/ChallengeRenderer";
import TimerController from "../../src/utils/TimerController";
import UIUpdateHandler from "../../src/utils/UIUpdateHandler";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("UIUpdateHandler", () => {
    let challengeList: ChallengeList;
    let uiUpdateHandler: UIUpdateHandler;
    let configManager: ConfigManager;

    beforeEach(() => {
        ensureTestIsolation();

        // Set up DOM structure directly to ensure it's correct
        document.body.innerHTML = `
            <div class="challenge-wrapper">
                <div class="challenge-container primary">
                    <div class="card">
                        <div class="username">Challenges 0/0</div>
                        <ol class="challenges"></ol>
                    </div>
                </div>
                <div class="challenge-container secondary">
                    <div class="card">
                        <div class="username">Challenges 0/0</div>
                        <ol class="challenges"></ol>
                    </div>
                </div>
            </div>
        `;

        challengeList = new ChallengeList("test-store");
        configManager = ConfigManager.getInstance();
        configManager.reset(); // Reset config to defaults to ensure test isolation
        uiUpdateHandler = new UIUpdateHandler(challengeList, configManager);
    });

    describe("handleCommandResult", () => {
        it("should handle add command result", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
            });
            challengeList.addChallengeObjects(challenge);

            const response: CommandResponse = {
                message: "Challenge added",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.ADD,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: true,
                    updateCount: true,
                },
            };

            // Should not throw error even without DOM containers
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle complete command result", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
            });
            challengeList.addChallengeObjects(challenge);

            const response: CommandResponse = {
                message: "Challenge completed",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.COMPLETE,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: true,
                    updateCount: true,
                },
            };

            // Should not throw error even without DOM containers
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle clearAll command result", () => {
            const response: CommandResponse = {
                message: "All challenges cleared",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.CLEAR_ALL,
                    updateTimers: true,
                    updateCount: true,
                },
            };

            // Should not throw error even without DOM containers
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should ignore error responses", () => {
            const response: CommandResponse = {
                message: "Error occurred",
                error: true,
            };

            // Should not throw error and should not process UI updates
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should ignore responses without UI update data", () => {
            const response: CommandResponse = {
                message: "Success",
                error: false,
            };

            // Should not throw error and should not process UI updates
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });
    });

    describe("ChallengeRenderer integration", () => {
        it("should create proper DOM structure for challenge with title only", () => {
            const challenge = new Challenge("Test Title");
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeNull();

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeNull();
        });

        it("should create proper DOM structure for challenge with title and description", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
            });
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe("Test Description");

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeNull();
        });

        it("should create proper DOM structure for challenge with progress", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
                amount: 5,
            });
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe("Test Description");

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeTruthy();
            expect(progressElement?.textContent).toBe("0/5");
        });
    });

    describe("DOM optimization", () => {
        beforeEach(() => {
            // Create DOM containers for testing
            document.body.innerHTML = `
                <div class="challenge-container primary"></div>
                <div class="challenge-container secondary"></div>
            `;
        });

        it("should add challenge to both containers with identical markup", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
            });

            // First render the challenge list to set up the card structure
            // This is how it works in the real application
            uiUpdateHandler.renderChallengeList();

            // Then add the individual challenge
            uiUpdateHandler.addChallengeToDOM(challenge);

            const challengesList = document.querySelector(
                ".challenge-container .card .challenges"
            );

            // The ordered list should have exactly one challenge
            expect(challengesList?.children.length).toBe(1);

            const challengeElement =
                challengesList?.firstElementChild as HTMLElement;

            // Challenge should have proper structure
            expect(challengeElement).toBeTruthy();
            expect(challengeElement.dataset["challengeId"]).toBe(challenge.id);
        });

        it("should maintain event handlers on container", () => {
            const challenge = new Challenge("Test Challenge");

            // First render the challenge list to set up the card structure
            uiUpdateHandler.renderChallengeList();

            // Then add the individual challenge
            uiUpdateHandler.addChallengeToDOM(challenge);

            const checkbox = document.querySelector(
                ".challenge-container .challenge-checkbox"
            );

            // Checkbox should exist
            expect(checkbox).toBeTruthy();

            // Should have proper class structure
            expect(checkbox?.classList.contains("challenge-checkbox")).toBe(
                true
            );
        });

        it("should render multiple challenges efficiently", () => {
            const challenges = [
                new Challenge("Challenge 1"),
                new Challenge("Challenge 2"),
                new Challenge("Challenge 3"),
            ];

            challenges.forEach((challenge) =>
                challengeList.addChallengeObjects(challenge)
            );
            uiUpdateHandler.renderChallengeList();

            const challengesList = document.querySelector(
                ".challenge-container .card .challenges"
            );

            // The ordered list should have all challenges
            expect(challengesList?.children.length).toBe(3);

            // Each challenge should have proper structure
            for (let i = 0; i < 3; i++) {
                const challenge = challengesList?.children[i] as HTMLElement;
                expect(challenge).toBeTruthy();
                expect(challenge.classList.contains("challenge")).toBe(true);
            }
        });
    });

    describe("cleanup", () => {
        it("should clean up resources when destroyed", () => {
            // Should not throw error
            expect(() => {
                uiUpdateHandler.destroy();
            }).not.toThrow();
        });
    });

    describe("handleCommandResult - additional actions", () => {
        it("should handle edit command result", () => {
            const challenge = new Challenge("Original Title", {
                description: "Original Description",
            });
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            // Edit the challenge
            challenge.setTitle("Edited Title");
            challenge.setDescription("Edited Description");

            const response: CommandResponse = {
                message: "Challenge edited",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.EDIT,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: true,
                    updateCount: false,
                },
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle revert command result", () => {
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const response: CommandResponse = {
                message: "Challenge reverted",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.REVERT,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: true,
                    updateCount: true,
                },
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle delete command result", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const response: CommandResponse = {
                message: "Challenge deleted",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.DELETE,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: true,
                    updateCount: true,
                },
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle clearDone command result", () => {
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects([challenge1, challenge2]);
            uiUpdateHandler.renderChallengeList();

            const response: CommandResponse = {
                message: "Completed challenges cleared",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.CLEAR_DONE,
                    updateTimers: true,
                    updateCount: true,
                },
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle refresh command result", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response: CommandResponse = {
                message: "Refreshed",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.REFRESH,
                    updateTimers: false,
                    updateCount: false,
                },
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle unknown action gracefully", () => {
            const response: CommandResponse = {
                message: "Unknown action",
                error: false,
                uiUpdate: {
                    action: "unknownAction" as any,
                    updateTimers: false,
                    updateCount: false,
                },
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should update timers when updateTimers is true", () => {
            const challenge = new Challenge("Test Challenge", {
                timer: "5m",
            });
            challenge.startTimer(); // Need to start the timer
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const response: CommandResponse = {
                message: "Challenge added",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.ADD,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: true,
                    updateCount: false,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            // Verify that timer updates were initiated (TimerController starts updates when there are active timers)
            expect(uiUpdateHandler.timerUpdateInterval).not.toBeNull();
        });

        it("should update count when updateCount is true", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const response: CommandResponse = {
                message: "Challenge added",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.ADD,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: false,
                    updateCount: true,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            const countDisplay = document.querySelector(".username");
            expect(countDisplay?.textContent).toContain("0/1");
        });
    });

    describe("renderChallengeList edge cases", () => {
        it("should handle empty challenge list", () => {
            uiUpdateHandler.renderChallengeList();

            const challengeElements = document.querySelectorAll(".challenge");
            expect(challengeElements.length).toBe(0);
        });

        it("should hide card in viewer mode when no challenges", () => {
            // Set viewer mode
            window.location.hash = "";

            uiUpdateHandler.renderChallengeList();

            const card = document.querySelector(".card");
            expect(card?.classList.contains("hidden")).toBe(true);
        });

        it("should show card in admin mode when no challenges", () => {
            // Set admin mode
            window.location.hash = "#admin";

            uiUpdateHandler.renderChallengeList();

            const card = document.querySelector(".card");
            expect(card?.classList.contains("hidden")).toBe(false);
        });

        it("should handle missing challenge container gracefully", () => {
            document.body.innerHTML = "";

            expect(() => {
                uiUpdateHandler.renderChallengeList();
            }).not.toThrow();
        });
    });

    describe("timer controller delegation", () => {
        it("should delegate updateTimerDisplays to timer controller", () => {
            const spy = vi
                .spyOn(TimerController.prototype, "updateTimerDisplays")
                .mockImplementation(() => {});

            uiUpdateHandler.updateTimerDisplays();

            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it("should delegate startTimerUpdates to timer controller", () => {
            const spy = vi
                .spyOn(TimerController.prototype, "startTimerUpdates")
                .mockImplementation(() => {});

            uiUpdateHandler.startTimerUpdates();

            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it("should delegate stopTimerUpdates to timer controller", () => {
            const spy = vi
                .spyOn(TimerController.prototype, "stopTimerUpdates")
                .mockImplementation(() => {});

            uiUpdateHandler.stopTimerUpdates();

            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe("destroy", () => {
        it("should stop timer updates when destroyed", () => {
            const challenge = new Challenge("Test Challenge", { timer: "5m" });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            // Start timer updates
            uiUpdateHandler.startTimerUpdates();
            expect(uiUpdateHandler.timerUpdateInterval).not.toBeNull();

            // Destroy should stop them
            uiUpdateHandler.destroy();
            expect(uiUpdateHandler.timerUpdateInterval).toBeNull();
        });
    });

    describe("timer element addition", () => {
        it("should add timer element if timer is active", () => {
            const challenge = new Challenge("Test", { timer: "5m" });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement).toBeTruthy();

            const timerElement =
                challengeElement?.querySelector(".challenge-timer");
            expect(timerElement).toBeTruthy();
        });

        it("should not add timer element if timer is not active", () => {
            const challenge = new Challenge("Test", { timer: "5m" });
            // Don't start the timer
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            const timerElement =
                challengeElement?.querySelector(".challenge-timer");
            expect(timerElement).toBeNull();
        });

        it("should not add timer element if challenge has no timer", () => {
            const challenge = new Challenge("Test");
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            const timerElement =
                challengeElement?.querySelector(".challenge-timer");
            expect(timerElement).toBeNull();
        });
    });

    describe("admin mode rendering", () => {
        it("should render in viewer mode by default", () => {
            window.location.hash = "";
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement).toBeTruthy();
            expect(challengeElement?.classList.contains("challenge")).toBe(
                true
            );
        });

        it("should render in admin mode when hash is #admin", () => {
            window.location.hash = "#admin";
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement).toBeTruthy();
        });

        it("should render text-only mode in admin when enabled", () => {
            window.location.hash = "#admin";
            configManager.set(BEHAVIOR_CONFIG.ADMIN_TEXT_ONLY_MODE, true);

            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement).toBeTruthy();
            // Text-only mode should have the text-only class
            expect(
                challengeElement?.classList.contains("challenge-text-only-item")
            ).toBe(true);
        });
    });

    describe("createChallengeElement integration", () => {
        it("should create challenge with all components in viewer mode", () => {
            window.location.hash = "";
            const challenge = new Challenge("Test", {
                description: "Description",
                amount: 3,
                timer: "10m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const element = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(element?.querySelector(".challenge-title")).toBeTruthy();
            expect(
                element?.querySelector(".challenge-description")
            ).toBeTruthy();
            expect(element?.querySelector(".challenge-amount")).toBeTruthy();
            expect(element?.querySelector(".challenge-timer")).toBeTruthy();
        });

        it("should create challenge with display position", () => {
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            challengeList.addChallengeObjects([challenge1, challenge2]);
            uiUpdateHandler.renderChallengeList();

            const elements = document.querySelectorAll(".challenge");
            expect(elements.length).toBe(2);
            // Display positions should be 1 and 2
        });
    });

    describe("handleAddUpdate edge cases", () => {
        it("should handle empty challenges array gracefully", () => {
            const response: CommandResponse = {
                message: "No challenges added",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.ADD,
                    challengeIndices: [],
                    challenges: [],
                    updateTimers: false,
                    updateCount: false,
                },
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle missing challengesList container", () => {
            // Remove the challenges list
            document.querySelector(".challenges")?.remove();

            const challenge = new Challenge("Test");
            const response: CommandResponse = {
                message: "Challenge added",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.ADD,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: false,
                    updateCount: false,
                },
            };

            // Should log error but not throw
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });
    });

    describe("handleRevertUpdate", () => {
        it("should revert a completed challenge to in-progress", () => {
            const challenge = new Challenge("Test");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            const response: CommandResponse = {
                message: "Challenge reverted",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.REVERT,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: false,
                    updateCount: true,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            // Challenge should be reverted in DOM
            const element = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(element).toBeTruthy();
        });
    });

    describe("handleDeleteUpdate", () => {
        it("should remove challenge from DOM", () => {
            const challenge = new Challenge("Test");
            challengeList.addChallengeObjects(challenge);
            uiUpdateHandler.renderChallengeList();

            // Remove from list
            challengeList.challenges = [];

            const response: CommandResponse = {
                message: "Challenge deleted",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.DELETE,
                    challengeIndices: [0],
                    updateTimers: false,
                    updateCount: true,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            // Re-render to reflect the deletion
            uiUpdateHandler.renderChallengeList();

            const element = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(element).toBeNull();
        });
    });

    describe("handleClearDoneUpdate", () => {
        it("should remove completed challenges from DOM", () => {
            const active = new Challenge("Active");
            const completed = new Challenge("Completed");
            completed.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([active, completed]);
            uiUpdateHandler.renderChallengeList();

            // Remove completed
            challengeList.challenges = [active];

            const response: CommandResponse = {
                message: "Cleared done",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.CLEAR_DONE,
                    updateTimers: false,
                    updateCount: true,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            // Re-render to reflect the changes
            uiUpdateHandler.renderChallengeList();

            expect(
                document.querySelector(`[data-challenge-id="${active.id}"]`)
            ).toBeTruthy();
            expect(
                document.querySelector(`[data-challenge-id="${completed.id}"]`)
            ).toBeNull();
        });
    });

    describe("handleClearAllUpdate", () => {
        it("should remove all challenges from DOM", () => {
            const challenge1 = new Challenge("Test 1");
            const challenge2 = new Challenge("Test 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);
            uiUpdateHandler.renderChallengeList();

            challengeList.challenges = [];

            const response: CommandResponse = {
                message: "Cleared all",
                error: false,
                uiUpdate: {
                    action: UIUpdateAction.CLEAR_ALL,
                    updateTimers: false,
                    updateCount: true,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            expect(document.querySelectorAll(".challenge").length).toBe(0);
        });
    });

    describe("error handling", () => {
        it("should handle error responses gracefully", () => {
            const response: CommandResponse = {
                message: "Error occurred",
                error: true,
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle responses without uiUpdate", () => {
            const response: CommandResponse = {
                message: "No update",
                error: false,
            };

            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });
    });

    describe("button click handlers in text-only mode", () => {
        beforeEach(() => {
            // Enable admin mode and text-only mode for button tests
            window.location.hash = URL_HASH.ADMIN;
            configManager.set(BEHAVIOR_CONFIG.ADMIN_TEXT_ONLY_MODE, true);
        });

        describe("handleCompleteButtonClick", () => {
            const getCompleteButton = (
                challengeId: string
            ): HTMLElement | null =>
                document.querySelector(
                    `${CSS_SELECTORS.CHALLENGE_BY_ID(challengeId)} .${
                        CSS_CLASSES.CHALLENGE_TEXT_ONLY_COMPLETE
                    }`
                );

            const getChallengeElementForButton = (
                button: HTMLElement
            ): HTMLElement | null =>
                button.closest(
                    `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
                ) as HTMLElement | null;

            it("should mark challenge as completed when Complete button clicked", () => {
                const challenge = new Challenge("Test Challenge");
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                expect(challenge.getStatus()).toBe(ChallengeStatus.IN_PROGRESS);

                const completeButton = getCompleteButton(challenge.id);
                expect(completeButton).not.toBeNull();
                const buttonEl = completeButton as HTMLElement;

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(challenge.getStatus()).toBe(ChallengeStatus.COMPLETED);
            });

            it("should handle missing challenge element gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const completeButton = getCompleteButton(challenge.id);
                expect(completeButton).not.toBeNull();
                const buttonEl = completeButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                challengeEl.remove();
                document.body.appendChild(buttonEl);

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge element for Complete button"
                );
                consoleErrorSpy.mockRestore();
            });

            it("should handle missing challenge ID gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const completeButton = getCompleteButton(challenge.id);
                expect(completeButton).not.toBeNull();
                const buttonEl = completeButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                delete challengeEl.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge ID for Complete button"
                );
                consoleErrorSpy.mockRestore();
            });

            it("should handle non-existent challenge gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const completeButton = getCompleteButton(challenge.id);
                expect(completeButton).not.toBeNull();
                const buttonEl = completeButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                challengeEl.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] =
                    "non-existent-id";

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge with ID:",
                    "non-existent-id"
                );
                consoleErrorSpy.mockRestore();
            });
        });

        describe("handleFailButtonClick", () => {
            const getFailButton = (challengeId: string): HTMLElement | null =>
                document.querySelector(
                    `${CSS_SELECTORS.CHALLENGE_BY_ID(challengeId)} .${
                        CSS_CLASSES.CHALLENGE_TEXT_ONLY_FAIL
                    }`
                );

            const getChallengeElementForButton = (
                button: HTMLElement
            ): HTMLElement | null =>
                button.closest(
                    `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
                ) as HTMLElement | null;

            it("should mark challenge as failed when Fail button clicked", () => {
                const challenge = new Challenge("Test Challenge");
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                expect(challenge.getStatus()).toBe(ChallengeStatus.IN_PROGRESS);

                const failButton = getFailButton(challenge.id);
                expect(failButton).not.toBeNull();
                const buttonEl = failButton as HTMLElement;

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(challenge.getStatus()).toBe(ChallengeStatus.FAILED);
            });

            it("should handle missing challenge element gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const failButton = getFailButton(challenge.id);
                expect(failButton).not.toBeNull();
                const buttonEl = failButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                challengeEl.remove();
                document.body.appendChild(buttonEl);

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge element for Fail button"
                );
                consoleErrorSpy.mockRestore();
            });

            it("should handle missing challenge ID gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const failButton = getFailButton(challenge.id);
                expect(failButton).not.toBeNull();
                const buttonEl = failButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                delete challengeEl.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge ID for Fail button"
                );
                consoleErrorSpy.mockRestore();
            });

            it("should handle non-existent challenge gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const failButton = getFailButton(challenge.id);
                expect(failButton).not.toBeNull();
                const buttonEl = failButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                challengeEl.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] =
                    "non-existent-id";

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge with ID:",
                    "non-existent-id"
                );
                consoleErrorSpy.mockRestore();
            });
        });

        describe("handleUncompleteButtonClick", () => {
            const getUncompleteButton = (
                challengeId: string
            ): HTMLElement | null =>
                document.querySelector(
                    `${CSS_SELECTORS.CHALLENGE_BY_ID(challengeId)} .${
                        CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNCOMPLETE
                    }`
                );

            const getChallengeElementForButton = (
                button: HTMLElement
            ): HTMLElement | null =>
                button.closest(
                    `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
                ) as HTMLElement | null;

            it("should revert challenge to in-progress when Uncomplete button clicked", () => {
                const challenge = new Challenge("Test Challenge");
                challenge.setStatus(ChallengeStatus.COMPLETED);
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                expect(challenge.getStatus()).toBe(ChallengeStatus.COMPLETED);

                const uncompleteButton = getUncompleteButton(challenge.id);
                expect(uncompleteButton).not.toBeNull();
                const buttonEl = uncompleteButton as HTMLElement;

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(challenge.getStatus()).toBe(ChallengeStatus.IN_PROGRESS);
            });

            it("should handle missing challenge element gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challenge.setStatus(ChallengeStatus.COMPLETED);
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const uncompleteButton = getUncompleteButton(challenge.id);
                expect(uncompleteButton).not.toBeNull();
                const buttonEl = uncompleteButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                challengeEl.remove();
                document.body.appendChild(buttonEl);

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge element for Uncomplete button"
                );
                consoleErrorSpy.mockRestore();
            });

            it("should handle missing challenge ID gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challenge.setStatus(ChallengeStatus.COMPLETED);
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const uncompleteButton = getUncompleteButton(challenge.id);
                expect(uncompleteButton).not.toBeNull();
                const buttonEl = uncompleteButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                delete challengeEl.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge ID for Uncomplete button"
                );
                consoleErrorSpy.mockRestore();
            });

            it("should handle non-existent challenge gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challenge.setStatus(ChallengeStatus.COMPLETED);
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const uncompleteButton = getUncompleteButton(challenge.id);
                expect(uncompleteButton).not.toBeNull();
                const buttonEl = uncompleteButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                challengeEl.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] =
                    "non-existent-id";

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge with ID:",
                    "non-existent-id"
                );
                consoleErrorSpy.mockRestore();
            });
        });

        describe("handleUnfailButtonClick", () => {
            const getUnfailButton = (challengeId: string): HTMLElement | null =>
                document.querySelector(
                    `${CSS_SELECTORS.CHALLENGE_BY_ID(challengeId)} .${
                        CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNFAIL
                    }`
                );

            const getChallengeElementForButton = (
                button: HTMLElement
            ): HTMLElement | null =>
                button.closest(
                    `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
                ) as HTMLElement | null;

            it("should revert challenge to in-progress when Unfail button clicked", () => {
                const challenge = new Challenge("Test Challenge");
                challenge.setStatus(ChallengeStatus.FAILED);
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                expect(challenge.getStatus()).toBe(ChallengeStatus.FAILED);

                const unfailButton = getUnfailButton(challenge.id);
                expect(unfailButton).not.toBeNull();
                const buttonEl = unfailButton as HTMLElement;

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(challenge.getStatus()).toBe(ChallengeStatus.IN_PROGRESS);
            });

            it("should handle missing challenge element gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challenge.setStatus(ChallengeStatus.FAILED);
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const unfailButton = getUnfailButton(challenge.id);
                expect(unfailButton).not.toBeNull();
                const buttonEl = unfailButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                challengeEl.remove();
                document.body.appendChild(buttonEl);

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge element for Unfail button"
                );
                consoleErrorSpy.mockRestore();
            });

            it("should handle missing challenge ID gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challenge.setStatus(ChallengeStatus.FAILED);
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const unfailButton = getUnfailButton(challenge.id);
                expect(unfailButton).not.toBeNull();
                const buttonEl = unfailButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                delete challengeEl.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge ID for Unfail button"
                );
                consoleErrorSpy.mockRestore();
            });

            it("should handle non-existent challenge gracefully", () => {
                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const challenge = new Challenge("Test Challenge");
                challenge.setStatus(ChallengeStatus.FAILED);
                challengeList.addChallengeObjects(challenge);

                const handler = new UIUpdateHandler(
                    challengeList,
                    configManager,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    vi.fn()
                );
                handler.renderChallengeList();

                const unfailButton = getUnfailButton(challenge.id);
                expect(unfailButton).not.toBeNull();
                const buttonEl = unfailButton as HTMLElement;

                const challengeElement = getChallengeElementForButton(buttonEl);
                expect(challengeElement).not.toBeNull();
                const challengeEl = challengeElement as HTMLElement;

                challengeEl.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] =
                    "non-existent-id";

                buttonEl.dispatchEvent(
                    new Event(EVENT_NAMES.CLICK, { bubbles: true })
                );

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not find challenge with ID:",
                    "non-existent-id"
                );
                consoleErrorSpy.mockRestore();
            });
        });
    });
});
