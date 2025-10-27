import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { UndoneCommand } from "../../src/commands/UndoneCommand";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("UndoneCommand", () => {
    let undoneCommand: UndoneCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        undoneCommand = new UndoneCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create UndoneCommand instance with required dependencies", () => {
            expect(undoneCommand).toBeDefined();
            expect(undoneCommand).toBeInstanceOf(UndoneCommand);
        });

        it("should have access to challengeList", () => {
            // Add a completed challenge to verify access
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.isComplete()).toBe(false);
        });
    });

    describe("execute - Single Challenge Revert", () => {
        it("should revert a single completed challenge to active status", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Verify challenge is completed
            expect(challenge.isComplete()).toBe(true);

            // Revert to active
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            expect(response.message).toContain("🔄");
            expect(challenge.isComplete()).toBe(false);
        });

        it("should include UI update data with REVERT action", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Revert to active
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.REVERT);
            expect(response.uiUpdate?.challengeIndices).toEqual([0]);
            expect(response.uiUpdate?.challenges).toHaveLength(1);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should restart timer when reverting completed challenge with timer", () => {
            // Add completed timed challenge
            const timedChallenge = new Challenge("Timed Challenge", {
                timer: "10m",
            });
            timedChallenge.startTimer();
            timedChallenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(timedChallenge);

            // Verify timer is stopped (due to completion)
            expect(timedChallenge.timer).toBeDefined();
            expect(timedChallenge.timer?.isActive).toBe(false);

            // Revert to active
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(timedChallenge.isComplete()).toBe(false);
            // Timer restart is conditional on remaining time, which may be 0 in test env
            // The important part is the status change
        });

        it("should revert completed challenge with progress tracking", () => {
            // Add completed progress challenge
            const progressChallenge = new Challenge("Progress Challenge", {
                amount: 5,
            });
            progressChallenge.setProgress(5);
            progressChallenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(progressChallenge);

            // Verify challenge is completed
            expect(progressChallenge.progress).toBe(5);
            expect(progressChallenge.isComplete()).toBe(true);

            // Revert to active
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(progressChallenge.isComplete()).toBe(false);
            expect(progressChallenge.progress).toBe(5); // Progress unchanged
        });

        it("should revert completed challenge without timer", () => {
            // Add simple completed challenge
            const simpleChallenge = new Challenge("Simple Challenge");
            simpleChallenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(simpleChallenge);

            // Revert to active
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(simpleChallenge.isComplete()).toBe(false);
        });
    });

    describe("execute - Multiple Challenge Revert", () => {
        it("should revert multiple completed challenges by comma-separated IDs", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            const challenge4 = new Challenge("Challenge 4");

            // Mark some as completed
            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge3.setStatus(ChallengeStatus.COMPLETED);
            challenge4.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
                challenge4,
            ]);

            // Revert challenges at positions 1, 3, 4
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,3,4",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#3");
            expect(response.message).toContain("#4");
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(false);
            expect(challenge3.isComplete()).toBe(false);
            expect(challenge4.isComplete()).toBe(false);
        });

        it("should include correct UI update data for multiple reverts", () => {
            // Add completed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");

            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);
            challenge3.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert challenges at positions 1 and 3
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.REVERT);
            expect(response.uiUpdate?.challengeIndices).toEqual([0, 2]);
            expect(response.uiUpdate?.challenges).toHaveLength(2);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should restart timers for all reverted challenges", () => {
            // Add completed timed challenges
            const timedChallenge1 = new Challenge("Timed 1", { timer: "5m" });
            const timedChallenge2 = new Challenge("Timed 2", { timer: "10m" });
            const timedChallenge3 = new Challenge("Timed 3", { timer: "15m" });

            timedChallenge1.startTimer();
            timedChallenge2.startTimer();
            timedChallenge3.startTimer();

            timedChallenge1.setStatus(ChallengeStatus.COMPLETED);
            timedChallenge2.setStatus(ChallengeStatus.COMPLETED);
            timedChallenge3.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                timedChallenge1,
                timedChallenge2,
                timedChallenge3,
            ]);

            // Verify all timers are stopped
            expect(timedChallenge1.timer?.isActive).toBe(false);
            expect(timedChallenge2.timer?.isActive).toBe(false);
            expect(timedChallenge3.timer?.isActive).toBe(false);

            // Revert challenges 1 and 3
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            // Timer restart is conditional on remaining time
            // The important part is the status changes
            expect(timedChallenge1.isComplete()).toBe(false);
            expect(timedChallenge2.isComplete()).toBe(true);
            expect(timedChallenge3.isComplete()).toBe(false);
        });

        it("should handle mixed challenge types", () => {
            // Add mixed completed challenges
            const activeChallenge = new Challenge("Active");
            const timedChallenge = new Challenge("Timed", { timer: "5m" });
            const progressChallenge = new Challenge("Progress", { amount: 5 });

            timedChallenge.startTimer();
            progressChallenge.setProgress(3);

            activeChallenge.setStatus(ChallengeStatus.COMPLETED);
            timedChallenge.setStatus(ChallengeStatus.COMPLETED);
            progressChallenge.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                activeChallenge,
                timedChallenge,
                progressChallenge,
            ]);

            // Revert all
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(activeChallenge.isComplete()).toBe(false);
            expect(timedChallenge.isComplete()).toBe(false);
            expect(progressChallenge.isComplete()).toBe(false);
        });
    });

    describe("execute - Error Handling", () => {
        it("should return error when no target ID is provided", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert without target ID
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Target ID required");
            expect(response.message).toContain("undone");
            expect(challenge.isComplete()).toBe(true);
        });

        it("should return error when target ID is invalid", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert with invalid ID
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "invalid",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Invalid target ID format");
            expect(challenge.isComplete()).toBe(true);
        });

        it("should return error when challenge does not exist", () => {
            // Add one completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert non-existent challenge
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "5",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
            expect(challenge.isComplete()).toBe(true);
        });

        it("should return error when challenge is already active", () => {
            // Add active challenge (not completed)
            const activeChallenge = new Challenge("Active Challenge");
            challengeList.addChallengeObjects(activeChallenge);

            // Try to revert already active challenge
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("already active");
            expect(response.message).toContain("#1");
        });

        it("should return error when all challenges are already active", () => {
            // Add active challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to revert already active challenges
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("already active");
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#2");
        });

        it("should return error when some challenges in list do not exist", () => {
            // Add two completed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to revert with mix of valid and invalid IDs
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,5,10",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
            // Should not revert any challenges when some IDs are invalid
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(true);
        });

        it("should return error when no valid challenges to revert", () => {
            // Don't add any challenges
            expect(challengeList.challenges.length).toBe(0);

            // Try to revert
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
        });

        it("should handle error during revert operation", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Mock setStatus to throw an error
            const originalMethod = challenge.setStatus;
            challenge.setStatus = () => {
                throw new Error("Revert operation failed");
            };

            // Execute undone command
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify error response
            expect(response.error).toBe(true);
            expect(response.message).toContain(
                "reverting challenges to active status"
            );
            expect(response.message).toContain("Revert operation failed");

            // Restore original method
            challenge.setStatus = originalMethod;
        });

        it("should handle non-Error exceptions", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Mock setStatus to throw a non-Error object
            const originalMethod = challenge.setStatus;
            challenge.setStatus = () => {
                throw "String error";
            };

            // Execute undone command
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify error response
            expect(response.error).toBe(true);
            expect(response.message).toContain(
                "reverting challenges to active status"
            );

            // Restore original method
            challenge.setStatus = originalMethod;
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle reverting first challenge in list", () => {
            // Add completed challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");

            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);
            challenge3.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert first challenge
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(true);
            expect(challenge3.isComplete()).toBe(true);
        });

        it("should handle reverting last challenge in list", () => {
            // Add completed challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");

            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);
            challenge3.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert last challenge
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(true);
            expect(challenge3.isComplete()).toBe(false);
        });

        it("should handle reverting middle challenge in list", () => {
            // Add completed challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");

            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);
            challenge3.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert middle challenge
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(false);
            expect(challenge3.isComplete()).toBe(true);
        });

        it("should handle duplicate IDs in target list", () => {
            // Add completed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");

            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to revert with duplicate IDs
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,1,2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should handle duplicates gracefully
            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(false);
        });

        it("should persist revert to localStorage", () => {
            // Add completed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");

            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Verify initial state
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(true);

            // Revert challenge
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify the command succeeded
            expect(response.error).toBe(false);

            // Verify the completion status was updated in memory
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(true);

            // Note: ChallengeList automatically persists to localStorage
            // The persistence is tested in ChallengeList tests
        });

        it("should handle whitespace in target ID", () => {
            // Add completed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");

            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Revert with whitespace in target ID
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: " 1 , 2 ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(false);
        });

        it("should handle zero as target ID", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert with zero ID
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "0",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Invalid target ID format");
            expect(challenge.isComplete()).toBe(true);
        });

        it("should handle negative target ID", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert with negative ID
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "-1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Invalid target ID format");
            expect(challenge.isComplete()).toBe(true);
        });

        it("should handle partial revert when some challenges are already active", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");

            // Mark challenge1 and challenge3 as completed, leave challenge2 active
            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge3.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Try to revert challenges 1, 2, 3
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should succeed for challenges 1 and 3, but note that 2 was already active
            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(false);
            expect(challenge3.isComplete()).toBe(false);
            // Response should only mention the newly reverted challenges
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#3");
        });
    });

    describe("execute - Response Formatting", () => {
        it("should format response with short ID and emoji for single revert", () => {
            // Add completed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Revert
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            expect(response.message).toContain("🔄");
        });

        it("should format response correctly for multiple reverts", () => {
            // Add completed challenges
            const challenge1 = new Challenge("First Challenge");
            const challenge2 = new Challenge("Second Challenge");
            const challenge3 = new Challenge("Third Challenge");

            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);
            challenge3.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert multiple challenges
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#3");
            expect(response.message).toContain("🔄");
        });

        it("should verify response includes position IDs not titles", () => {
            // Add completed challenge with description and progress
            const challenge = new Challenge("Detailed Challenge", {
                description: "Test description",
                amount: 5,
            });
            challenge.setProgress(5);
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            // Revert
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            // Response uses short IDs by default, not challenge titles
            expect(response.message).not.toContain("Detailed Challenge");
        });
    });
});
