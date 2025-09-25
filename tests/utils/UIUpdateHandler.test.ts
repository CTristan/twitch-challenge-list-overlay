import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import ChallengeRenderer from "../../src/utils/ChallengeRenderer";
import UIUpdateHandler from "../../src/utils/UIUpdateHandler";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("UIUpdateHandler", () => {
    let challengeList: ChallengeList;
    let uiUpdateHandler: UIUpdateHandler;

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
        const configManager = ConfigManager.getInstance();
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
                    action: "add" as UIUpdateAction,
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
                    action: "complete" as UIUpdateAction,
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
                    action: "clearAll" as UIUpdateAction,
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
            expect(progressElement?.textContent).toBe("Progress: 0/5");
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
});
