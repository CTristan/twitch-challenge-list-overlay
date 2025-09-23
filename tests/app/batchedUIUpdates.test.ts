import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/app";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import UIUpdateHandler from "../../src/utils/UIUpdateHandler";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("Batched UI Updates Performance", () => {
    let app: App;
    let challengeList: ChallengeList;
    let uiUpdateHandler: UIUpdateHandler;

    beforeEach(() => {
        ensureTestIsolation();

        // Create DOM structure
        document.body.innerHTML = `
            <div class="challenge-container"></div>
        `;

        app = new App("testBatchedUIUpdates");
        challengeList = app.challengeList;
        uiUpdateHandler = new UIUpdateHandler(challengeList);
    });

    describe("Batched Challenge Addition", () => {
        it("should add multiple challenges in a single DOM operation", () => {
            // First render the challenge list to set up the card structure
            uiUpdateHandler.renderChallengeList();

            // Create multiple challenges
            const challenges = [
                new Challenge("Challenge 1", {
                    description: "First challenge",
                }),
                new Challenge("Challenge 2", {
                    description: "Second challenge",
                }),
                new Challenge("Challenge 3", {
                    description: "Third challenge",
                }),
            ];

            // Add challenges to the list
            challenges.forEach((challenge) =>
                challengeList.addChallengeObjects(challenge)
            );

            // Simulate batched UI update
            const response: CommandResponse = {
                message: "Challenges added",
                error: false,
                uiUpdate: {
                    action: "add" as UIUpdateAction,
                    challengeIndices: [0, 1, 2],
                    challenges: challenges,
                    updateTimers: true,
                    updateCount: true,
                },
            };

            // Process the batched update
            uiUpdateHandler.handleCommandResult(response);

            // Verify all challenges were added
            const challengesList = document.querySelector(
                ".challenge-container .card .challenges"
            );
            expect(challengesList?.children.length).toBe(3);

            // Verify each challenge has correct content
            const challengeElements = Array.from(
                challengesList?.children || []
            );
            expect(challengeElements[0]?.textContent).toContain("Challenge 1");
            expect(challengeElements[1]?.textContent).toContain("Challenge 2");
            expect(challengeElements[2]?.textContent).toContain("Challenge 3");
        });

        it("should handle single challenge addition efficiently", () => {
            // First render the challenge list to set up the card structure
            uiUpdateHandler.renderChallengeList();

            const challenge = new Challenge("Single Challenge", {
                description: "Test challenge",
            });
            challengeList.addChallengeObjects(challenge);

            // Simulate single challenge UI update
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

            uiUpdateHandler.handleCommandResult(response);

            const challengesList = document.querySelector(
                ".challenge-container .card .challenges"
            );
            expect(challengesList?.children.length).toBe(1);
            expect(challengesList?.firstElementChild?.textContent).toContain(
                "Single Challenge"
            );
        });

        it("should handle empty challenge array gracefully", () => {
            uiUpdateHandler.renderChallengeList();

            const response: CommandResponse = {
                message: "No challenges",
                error: false,
                uiUpdate: {
                    action: "add" as UIUpdateAction,
                    challengeIndices: [],
                    challenges: [],
                    updateTimers: false,
                    updateCount: false,
                },
            };

            // Should not throw error
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();

            const challengesList = document.querySelector(
                ".challenge-container .card .challenges"
            );
            expect(challengesList?.children.length).toBe(0);
        });
    });

    describe("DOM Element Caching", () => {
        it("should cache DOM elements for performance", () => {
            // Spy on querySelector to count calls
            const querySelectorSpy = vi.spyOn(document, "querySelector");

            // First render to set up structure
            uiUpdateHandler.renderChallengeList();

            // Reset spy count after initial setup
            querySelectorSpy.mockClear();

            // Create multiple challenges
            const challenges = [
                new Challenge("Challenge 1"),
                new Challenge("Challenge 2"),
                new Challenge("Challenge 3"),
            ];

            challenges.forEach((challenge) =>
                challengeList.addChallengeObjects(challenge)
            );

            // Process batched update
            const response: CommandResponse = {
                message: "Challenges added",
                error: false,
                uiUpdate: {
                    action: "add" as UIUpdateAction,
                    challengeIndices: [0, 1, 2],
                    challenges: challenges,
                    updateTimers: true,
                    updateCount: true,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            // Should have minimal querySelector calls due to caching
            // Expect at most 3 calls due to cache initialization and usage
            expect(querySelectorSpy).toHaveBeenCalledTimes(3);

            querySelectorSpy.mockRestore();
        });

        it("should invalidate cache when card is re-rendered", () => {
            const querySelectorSpy = vi.spyOn(document, "querySelector");

            // First render
            uiUpdateHandler.renderChallengeList();
            const firstCallCount = querySelectorSpy.mock.calls.length;

            // Second render should invalidate cache and query again
            uiUpdateHandler.renderChallengeList();
            const secondCallCount = querySelectorSpy.mock.calls.length;

            // Should have made additional queries due to cache invalidation
            expect(secondCallCount).toBeGreaterThan(firstCallCount);

            querySelectorSpy.mockRestore();
        });
    });

    describe("Visual Styling and Behavior", () => {
        it("should maintain proper styling for batched challenges", () => {
            uiUpdateHandler.renderChallengeList();

            const challenges = [
                new Challenge("Challenge 1", { description: "First" }),
                new Challenge("Challenge 2", { description: "Second" }),
            ];

            // Mark one as complete
            challenges[0].setCompletionStatus(true);

            challenges.forEach((challenge) =>
                challengeList.addChallengeObjects(challenge)
            );

            const response: CommandResponse = {
                message: "Challenges added",
                error: false,
                uiUpdate: {
                    action: "add" as UIUpdateAction,
                    challengeIndices: [0, 1],
                    challenges: challenges,
                    updateTimers: true,
                    updateCount: true,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            const challengeElements = document.querySelectorAll(".challenge");

            // First challenge should have "done" class
            expect(challengeElements[0]?.classList.contains("done")).toBe(true);

            // Second challenge should not have "done" class
            expect(challengeElements[1]?.classList.contains("done")).toBe(
                false
            );

            // Both should have proper challenge structure
            challengeElements.forEach((element) => {
                expect(
                    element.querySelector(".challenge-checkbox")
                ).toBeTruthy();
                expect(element.querySelector(".challenge-text")).toBeTruthy();
            });
        });

        it("should include timer displays for challenges with timers", () => {
            uiUpdateHandler.renderChallengeList();

            const challengeWithTimer = new Challenge("Timed Challenge", {
                description: "Has timer",
                timer: "5m",
            });
            challengeWithTimer.startTimer();

            const challengeWithoutTimer = new Challenge("Regular Challenge", {
                description: "No timer",
            });

            const challenges = [challengeWithTimer, challengeWithoutTimer];
            challenges.forEach((challenge) =>
                challengeList.addChallengeObjects(challenge)
            );

            const response: CommandResponse = {
                message: "Challenges added",
                error: false,
                uiUpdate: {
                    action: "add" as UIUpdateAction,
                    challengeIndices: [0, 1],
                    challenges: challenges,
                    updateTimers: true,
                    updateCount: true,
                },
            };

            uiUpdateHandler.handleCommandResult(response);

            const challengeElements = document.querySelectorAll(".challenge");

            // First challenge should have timer display
            expect(
                challengeElements[0]?.querySelector(".challenge-timer")
            ).toBeTruthy();

            // Second challenge should not have timer display
            expect(
                challengeElements[1]?.querySelector(".challenge-timer")
            ).toBeFalsy();
        });
    });

    describe("Error Handling", () => {
        it("should handle missing DOM structure gracefully", () => {
            // Don't render challenge list first - missing DOM structure
            const challenge = new Challenge("Test Challenge");
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

            // Should not throw error
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });
    });
});
