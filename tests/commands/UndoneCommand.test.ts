import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { UndoneCommand } from "../../src/commands/UndoneCommand";

describe("UndoneCommand", () => {
    let challengeList: ChallengeList;
    let configManager: ConfigManager;
    let undoneCommand: UndoneCommand;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();

        // Create test instances
        challengeList = new ChallengeList("testChallengeList");
        configManager = ConfigManager.getInstance();
        undoneCommand = new UndoneCommand(challengeList, configManager);
    });

    describe("execute", () => {
        it("should revert a completed challenge to active status", () => {
            // Create and complete a challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setCompletionStatus(true);
            challengeList.addChallengeObjects(challenge);

            // Execute undone command (challenge is at index 0)
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    targetId: "1", // Position 1 = index 0
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain("reverted to active status");
            expect(response.message).toContain("🔄");

            // Verify challenge state
            expect(challenge.isComplete()).toBe(false);
        });

        it("should handle multiple challenges", () => {
            // Create and complete multiple challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challenge1.setCompletionStatus(true);
            challenge2.setCompletionStatus(true);
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Execute undone command with multiple IDs (challenges at indices 0 and 1)
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    targetId: "1,2", // Positions 1,2 = indices 0,1
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);
            expect(response.message).toContain("reverted to active status");

            // Verify both challenges are reverted
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(false);
        });

        it("should return error for already active challenges", () => {
            // Create an active challenge (not completed)
            const challenge = new Challenge("Active Challenge");
            challengeList.addChallengeObjects(challenge);

            // Execute undone command (challenge is at index 0)
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    targetId: "1", // Position 1 = index 0
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify error response
            expect(response.error).toBe(true);
            expect(response.message).toContain("already active");
        });

        it("should restart timer when reverting completed challenge", () => {
            // Create a challenge with timer
            const challenge = new Challenge("Timed Challenge", {
                timer: "60s",
            });
            challenge.startTimer();

            // Complete the challenge (this stops the timer)
            challenge.setCompletionStatus(true);
            expect(challenge.timer?.isActive).toBe(false);

            challengeList.addChallengeObjects(challenge);

            // Execute undone command (challenge is at index 0)
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    targetId: "1", // Position 1 = index 0
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify response
            expect(response.error).toBe(false);

            // Verify challenge is reverted and timer is restarted
            expect(challenge.isComplete()).toBe(false);
            expect(challenge.timer?.isActive).toBe(true);
        });

        it("should return error for non-existent challenge", () => {
            // Execute undone command with non-existent ID
            const response = undoneCommand.execute(
                {
                    command: "undone",
                    targetId: "999",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Verify error response
            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
        });
    });
});
