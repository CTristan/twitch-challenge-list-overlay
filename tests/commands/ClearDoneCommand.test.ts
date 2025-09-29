import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { ClearDoneCommand } from "../../src/commands/ClearDoneCommand";
import { ERROR_MESSAGES } from "../../src/types/MessageConstants";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";

describe("ClearDoneCommand", () => {
    let clearDoneCommand: ClearDoneCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        clearDoneCommand = new ClearDoneCommand(challengeList, configManager);
    });

    describe("execute", () => {
        it("should clear only completed challenges and return success response", () => {
            // Add multiple challenges with different statuses
            const activeChallenge = new Challenge("Active Challenge");
            const completedChallenge1 = new Challenge("Completed Challenge 1");
            const completedChallenge2 = new Challenge("Completed Challenge 2");
            const failedChallenge = new Challenge("Failed Challenge");

            completedChallenge1.setCompletionStatus(true);
            completedChallenge2.setCompletionStatus(true);
            failedChallenge.setFailureStatus(true);

            challengeList.addChallengeObjects([
                activeChallenge,
                completedChallenge1,
                completedChallenge2,
                failedChallenge,
            ]);

            // Verify challenges were added
            expect(challengeList.challenges.length).toBe(4);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain(
                "All 2 completed challenges have been cleared"
            );

            // Verify only completed challenges were cleared
            expect(challengeList.challenges.length).toBe(2);
            expect(challengeList.challenges).toContain(activeChallenge);
            expect(challengeList.challenges).toContain(failedChallenge);
            expect(challengeList.challenges).not.toContain(completedChallenge1);
            expect(challengeList.challenges).not.toContain(completedChallenge2);
        });

        it("should include UI update data with CLEAR_DONE action", () => {
            // Add challenges with completed status
            const activeChallenge = new Challenge("Active Challenge");
            const completedChallenge = new Challenge("Completed Challenge");
            completedChallenge.setCompletionStatus(true);

            challengeList.addChallengeObjects([
                activeChallenge,
                completedChallenge,
            ]);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify UI update data
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.CLEAR_DONE);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should return success message when no completed challenges exist", () => {
            // Add only active challenges
            const activeChallenge1 = new Challenge("Active Challenge 1");
            const activeChallenge2 = new Challenge("Active Challenge 2");
            challengeList.addChallengeObjects([
                activeChallenge1,
                activeChallenge2,
            ]);

            // Verify no completed challenges exist
            const completedCount = challengeList.challenges.filter((c) =>
                c.isComplete()
            ).length;
            expect(completedCount).toBe(0);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response uses centralized error message constant
            expect(response.error).toBe(false);
            expect(response.message).toBe(
                ERROR_MESSAGES.NO_COMPLETED_CHALLENGES_TO_CLEAR
            );

            // Verify no UI update data is included
            expect(response.uiUpdate).toBeUndefined();

            // Verify active challenges were not removed
            expect(challengeList.challenges.length).toBe(2);
        });

        it("should return success message when challenge list is empty", () => {
            // Verify no challenges exist
            expect(challengeList.challenges.length).toBe(0);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response uses centralized error message constant
            expect(response.error).toBe(false);
            expect(response.message).toBe(
                ERROR_MESSAGES.NO_COMPLETED_CHALLENGES_TO_CLEAR
            );

            // Verify no UI update data is included
            expect(response.uiUpdate).toBeUndefined();
        });

        it("should clear completed challenges with timers", () => {
            // Add completed challenges with timers
            const activeTimedChallenge = new Challenge("Active Timed", {
                timer: "5m",
            });
            const completedTimedChallenge1 = new Challenge(
                "Completed Timed 1",
                {
                    timer: "10m",
                }
            );
            const completedTimedChallenge2 = new Challenge(
                "Completed Timed 2",
                {
                    timer: "15m",
                }
            );

            activeTimedChallenge.startTimer();
            completedTimedChallenge1.startTimer();
            completedTimedChallenge2.startTimer();
            completedTimedChallenge1.setCompletionStatus(true);
            completedTimedChallenge2.setCompletionStatus(true);

            challengeList.addChallengeObjects([
                activeTimedChallenge,
                completedTimedChallenge1,
                completedTimedChallenge2,
            ]);

            // Verify challenges were added
            expect(challengeList.challenges.length).toBe(3);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain(
                "All 2 completed challenges have been cleared"
            );

            // Verify only completed challenges were cleared
            expect(challengeList.challenges.length).toBe(1);
            expect(challengeList.challenges).toContain(activeTimedChallenge);
        });

        it("should clear completed challenges with progress tracking", () => {
            // Add challenges with progress
            const activeProgressChallenge = new Challenge("Active Progress", {
                amount: 5,
            });
            const completedProgressChallenge1 = new Challenge(
                "Completed Progress 1",
                { amount: 10 }
            );
            const completedProgressChallenge2 = new Challenge(
                "Completed Progress 2",
                { amount: 3 }
            );

            activeProgressChallenge.incrementProgress();
            activeProgressChallenge.incrementProgress();

            // Complete the progress challenges
            for (let i = 0; i < 10; i++) {
                completedProgressChallenge1.incrementProgress();
            }
            for (let i = 0; i < 3; i++) {
                completedProgressChallenge2.incrementProgress();
            }

            challengeList.addChallengeObjects([
                activeProgressChallenge,
                completedProgressChallenge1,
                completedProgressChallenge2,
            ]);

            // Verify challenges were added and completion status
            expect(challengeList.challenges.length).toBe(3);
            expect(completedProgressChallenge1.isComplete()).toBe(true);
            expect(completedProgressChallenge2.isComplete()).toBe(true);
            expect(activeProgressChallenge.isComplete()).toBe(false);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain(
                "All 2 completed challenges have been cleared"
            );

            // Verify only completed challenges were cleared
            expect(challengeList.challenges.length).toBe(1);
            expect(challengeList.challenges).toContain(activeProgressChallenge);
        });

        it("should persist cleared state to localStorage", () => {
            // Add challenges with different statuses
            const activeChallenge = new Challenge("Active Challenge");
            const completedChallenge = new Challenge("Completed Challenge");
            completedChallenge.setCompletionStatus(true);

            challengeList.addChallengeObjects([
                activeChallenge,
                completedChallenge,
            ]);

            // Execute clear done command
            clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Create a new ChallengeList instance to verify persistence
            const newChallengeList = new ChallengeList();

            // Verify the cleared state was persisted
            expect(newChallengeList.challenges.length).toBe(1);
            expect(newChallengeList.challenges[0]?.title).toBe(
                "Active Challenge"
            );
        });

        it("should handle single completed challenge clear", () => {
            // Add single completed challenge
            const completedChallenge = new Challenge(
                "Single Completed Challenge"
            );
            completedChallenge.setCompletionStatus(true);
            challengeList.addChallengeObjects(completedChallenge);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain(
                "All 1 completed challenges have been cleared"
            );

            // Verify challenge was cleared
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should handle error during clear operation", () => {
            // Add completed challenge
            const completedChallenge = new Challenge("Completed Challenge");
            completedChallenge.setCompletionStatus(true);
            challengeList.addChallengeObjects(completedChallenge);

            // Mock clearDoneChallenges to throw an error
            const originalClearMethod = challengeList.clearDoneChallenges;
            challengeList.clearDoneChallenges = () => {
                throw new Error("Clear done operation failed");
            };

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify error response
            expect(response.error).toBe(true);
            expect(response.message).toContain(
                "Error clearing completed challenges"
            );
            expect(response.message).toContain("Clear done operation failed");

            // Restore original method
            challengeList.clearDoneChallenges = originalClearMethod;
        });

        it("should not include UI update data when no completed challenges to clear", () => {
            // Add only active challenges
            const activeChallenge = new Challenge("Active Challenge");
            challengeList.addChallengeObjects(activeChallenge);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify no UI update data
            expect(response.uiUpdate).toBeUndefined();
        });

        it("should clear all completed challenges when all challenges are completed", () => {
            // Add multiple completed challenges
            const completedChallenge1 = new Challenge("Completed Challenge 1");
            const completedChallenge2 = new Challenge("Completed Challenge 2");
            const completedChallenge3 = new Challenge("Completed Challenge 3");

            completedChallenge1.setCompletionStatus(true);
            completedChallenge2.setCompletionStatus(true);
            completedChallenge3.setCompletionStatus(true);

            challengeList.addChallengeObjects([
                completedChallenge1,
                completedChallenge2,
                completedChallenge3,
            ]);

            // Verify all challenges are completed
            expect(challengeList.challenges.length).toBe(3);
            expect(challengeList.challenges.every((c) => c.isComplete())).toBe(
                true
            );

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain(
                "All 3 completed challenges have been cleared"
            );

            // Verify all challenges were cleared
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should not clear failed challenges", () => {
            // Add failed and completed challenges
            const failedChallenge1 = new Challenge("Failed Challenge 1");
            const failedChallenge2 = new Challenge("Failed Challenge 2");
            const completedChallenge = new Challenge("Completed Challenge");

            failedChallenge1.setFailureStatus(true);
            failedChallenge2.setFailureStatus(true);
            completedChallenge.setCompletionStatus(true);

            challengeList.addChallengeObjects([
                failedChallenge1,
                failedChallenge2,
                completedChallenge,
            ]);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain(
                "All 1 completed challenges have been cleared"
            );

            // Verify only completed challenge was cleared, failed challenges remain
            expect(challengeList.challenges.length).toBe(2);
            expect(challengeList.challenges).toContain(failedChallenge1);
            expect(challengeList.challenges).toContain(failedChallenge2);
            expect(challengeList.challenges).not.toContain(completedChallenge);
        });

        it("should handle mixed challenge types (active, completed, failed, with timers and progress)", () => {
            // Create a complex mix of challenges
            const activeChallenge = new Challenge("Active");
            const completedChallenge = new Challenge("Completed");
            const failedChallenge = new Challenge("Failed");
            const timedActiveChallenge = new Challenge("Timed Active", {
                timer: "5m",
            });
            const timedCompletedChallenge = new Challenge("Timed Completed", {
                timer: "10m",
            });
            const progressActiveChallenge = new Challenge("Progress Active", {
                amount: 5,
            });
            const progressCompletedChallenge = new Challenge(
                "Progress Completed",
                { amount: 3 }
            );

            // Set statuses
            completedChallenge.setCompletionStatus(true);
            failedChallenge.setFailureStatus(true);
            timedActiveChallenge.startTimer();
            timedCompletedChallenge.startTimer();
            timedCompletedChallenge.setCompletionStatus(true);
            progressActiveChallenge.incrementProgress();
            for (let i = 0; i < 3; i++) {
                progressCompletedChallenge.incrementProgress();
            }

            challengeList.addChallengeObjects([
                activeChallenge,
                completedChallenge,
                failedChallenge,
                timedActiveChallenge,
                timedCompletedChallenge,
                progressActiveChallenge,
                progressCompletedChallenge,
            ]);

            // Verify initial state
            expect(challengeList.challenges.length).toBe(7);

            // Execute clear done command
            const response = clearDoneCommand.execute(
                {
                    command: "cleardone",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain(
                "All 3 completed challenges have been cleared"
            );

            // Verify only completed challenges were cleared
            expect(challengeList.challenges.length).toBe(4);
            expect(challengeList.challenges).toContain(activeChallenge);
            expect(challengeList.challenges).toContain(failedChallenge);
            expect(challengeList.challenges).toContain(timedActiveChallenge);
            expect(challengeList.challenges).toContain(progressActiveChallenge);
            expect(challengeList.challenges).not.toContain(completedChallenge);
            expect(challengeList.challenges).not.toContain(
                timedCompletedChallenge
            );
            expect(challengeList.challenges).not.toContain(
                progressCompletedChallenge
            );
        });
    });
});
