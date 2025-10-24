import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { ClearAllCommand } from "../../src/commands/ClearAllCommand";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import { ERROR_MESSAGES } from "../../src/types/MessageConstants";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";

describe("ClearAllCommand", () => {
    let clearAllCommand: ClearAllCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        clearAllCommand = new ClearAllCommand(challengeList, configManager);
    });

    describe("execute", () => {
        it("should clear all challenges and return success response", () => {
            // Add multiple challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Verify challenges were added
            expect(challengeList.challenges.length).toBe(3);

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
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
                "All 3 challenges have been cleared"
            );

            // Verify challenges were cleared
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should include UI update data with CLEAR_ALL action", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify UI update data
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.CLEAR_ALL);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should return success message when no challenges exist", () => {
            // Verify no challenges exist
            expect(challengeList.challenges.length).toBe(0);

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
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
                ERROR_MESSAGES.NO_CHALLENGES_TO_CLEAR
            );

            // Verify no UI update data is included
            expect(response.uiUpdate).toBeUndefined();
        });

        it("should clear challenges with different statuses (active and completed)", () => {
            // Add challenges with different statuses
            const activeChallenge = new Challenge("Active Challenge");
            const completedChallenge = new Challenge("Completed Challenge");
            completedChallenge.setStatus(ChallengeStatus.COMPLETED);
            const failedChallenge = new Challenge("Failed Challenge");
            failedChallenge.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                activeChallenge,
                completedChallenge,
                failedChallenge,
            ]);

            // Verify challenges were added
            expect(challengeList.challenges.length).toBe(3);

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
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
                "All 3 challenges have been cleared"
            );

            // Verify all challenges were cleared regardless of status
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should clear challenges with timers", () => {
            // Add challenges with timers
            const timedChallenge1 = new Challenge("Timed Challenge 1", {
                timer: "5m",
            });
            const timedChallenge2 = new Challenge("Timed Challenge 2", {
                timer: "10m",
            });
            timedChallenge1.startTimer();
            timedChallenge2.startTimer();

            challengeList.addChallengeObjects([
                timedChallenge1,
                timedChallenge2,
            ]);

            // Verify challenges were added
            expect(challengeList.challenges.length).toBe(2);

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
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
                "All 2 challenges have been cleared"
            );

            // Verify challenges were cleared
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should clear challenges with progress tracking", () => {
            // Add challenges with progress
            const progressChallenge1 = new Challenge("Progress Challenge 1", {
                amount: 5,
            });
            const progressChallenge2 = new Challenge("Progress Challenge 2", {
                amount: 10,
            });
            progressChallenge1.incrementProgress();
            progressChallenge1.incrementProgress();
            progressChallenge2.incrementProgress();

            challengeList.addChallengeObjects([
                progressChallenge1,
                progressChallenge2,
            ]);

            // Verify challenges were added
            expect(challengeList.challenges.length).toBe(2);

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
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
                "All 2 challenges have been cleared"
            );

            // Verify challenges were cleared
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should persist cleared state to localStorage", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Execute clear all command
            clearAllCommand.execute(
                {
                    command: "clearall",
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
            expect(newChallengeList.challenges.length).toBe(0);
        });

        it("should handle single challenge clear", () => {
            // Add single challenge
            const challenge = new Challenge("Single Challenge");
            challengeList.addChallengeObjects(challenge);

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
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
                "All 1 challenges have been cleared"
            );

            // Verify challenge was cleared
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should handle error during clear operation", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            challengeList.addChallengeObjects(challenge1);

            // Mock clearChallengeList to throw an error
            const originalClearMethod = challengeList.clearChallengeList;
            challengeList.clearChallengeList = () => {
                throw new Error("Clear operation failed");
            };

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify error response
            expect(response.error).toBe(true);
            expect(response.message).toContain("Error clearing all challenges");
            expect(response.message).toContain("Clear operation failed");

            // Restore original method
            challengeList.clearChallengeList = originalClearMethod;
        });

        it("should not include UI update data when no challenges to clear", () => {
            // Verify no challenges exist
            expect(challengeList.challenges.length).toBe(0);

            // Execute clear all command
            const response = clearAllCommand.execute(
                {
                    command: "clearall",
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
    });
});
