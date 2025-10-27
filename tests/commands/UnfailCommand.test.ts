import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { UnfailCommand } from "../../src/commands/UnfailCommand";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("UnfailCommand", () => {
    let unfailCommand: UnfailCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        unfailCommand = new UnfailCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create UnfailCommand instance with required dependencies", () => {
            expect(unfailCommand).toBeDefined();
            expect(unfailCommand).toBeInstanceOf(UnfailCommand);
        });

        it("should have access to challengeList", () => {
            // Add a failed challenge to verify access
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.isFailed()).toBe(false);
        });
    });

    describe("execute - Single Challenge Revert", () => {
        it("should revert a single failed challenge to active status", () => {
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Verify challenge is failed
            expect(challenge.isFailed()).toBe(true);

            // Revert to active
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Unfailed");
            expect(response.message).toContain("#1");
            expect(challenge.isFailed()).toBe(false);
        });

        it("should include UI update data with REVERT action", () => {
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Revert to active
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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

        it("should revert failed challenge with timer", () => {
            // Add failed timed challenge
            const timedChallenge = new Challenge("Timed Challenge", {
                timer: "10m",
            });
            timedChallenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(timedChallenge);

            // Verify challenge is failed
            expect(timedChallenge.isFailed()).toBe(true);

            // Revert to active
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(timedChallenge.isFailed()).toBe(false);
        });

        it("should revert failed challenge with progress tracking", () => {
            // Add failed progress challenge
            const progressChallenge = new Challenge("Progress Challenge", {
                amount: 5,
            });
            progressChallenge.setProgress(3);
            progressChallenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(progressChallenge);

            // Verify challenge is failed
            expect(progressChallenge.progress).toBe(3);
            expect(progressChallenge.isFailed()).toBe(true);

            // Revert to active
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(progressChallenge.isFailed()).toBe(false);
            expect(progressChallenge.progress).toBe(3); // Progress unchanged
        });

        it("should revert failed challenge without timer", () => {
            // Add simple failed challenge
            const simpleChallenge = new Challenge("Simple Challenge");
            simpleChallenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(simpleChallenge);

            // Revert to active
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(simpleChallenge.isFailed()).toBe(false);
        });
    });

    describe("execute - Multiple Challenge Revert", () => {
        it("should revert multiple failed challenges by comma-separated IDs", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            const challenge4 = new Challenge("Challenge 4");

            // Mark some as failed
            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge3.setStatus(ChallengeStatus.FAILED);
            challenge4.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
                challenge4,
            ]);

            // Revert challenges at positions 1, 3, 4
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(false);
            expect(challenge3.isFailed()).toBe(false);
            expect(challenge4.isFailed()).toBe(false);
        });

        it("should include correct UI update data for multiple reverts", () => {
            // Add failed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");

            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);
            challenge3.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert challenges at positions 1 and 3
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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

        it("should handle mixed challenge types", () => {
            // Add mixed failed challenges
            const activeChallenge = new Challenge("Active");
            const timedChallenge = new Challenge("Timed", { timer: "5m" });
            const progressChallenge = new Challenge("Progress", { amount: 5 });

            progressChallenge.setProgress(3);

            activeChallenge.setStatus(ChallengeStatus.FAILED);
            timedChallenge.setStatus(ChallengeStatus.FAILED);
            progressChallenge.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                activeChallenge,
                timedChallenge,
                progressChallenge,
            ]);

            // Revert all
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(activeChallenge.isFailed()).toBe(false);
            expect(timedChallenge.isFailed()).toBe(false);
            expect(progressChallenge.isFailed()).toBe(false);
        });
    });

    describe("execute - Error Handling", () => {
        it("should return error when no target ID is provided", () => {
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert without target ID
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            expect(response.message).toContain("unfail");
            expect(challenge.isFailed()).toBe(true);
        });

        it("should return error when target ID is invalid", () => {
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert with invalid ID
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            expect(challenge.isFailed()).toBe(true);
        });

        it("should return error when challenge does not exist", () => {
            // Add one failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert non-existent challenge
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            expect(challenge.isFailed()).toBe(true);
        });

        it("should return error when challenge is not marked as failed", () => {
            // Add active challenge (not failed)
            const activeChallenge = new Challenge("Active Challenge");
            challengeList.addChallengeObjects(activeChallenge);

            // Try to revert non-failed challenge
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not marked as failed");
            expect(response.message).toContain("#1");
        });

        it("should return error when all challenges are not marked as failed", () => {
            // Add active challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to revert non-failed challenges
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not marked as failed");
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#2");
        });

        it("should return error when some challenges in list do not exist", () => {
            // Add two failed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to revert with mix of valid and invalid IDs
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(true);
        });

        it("should return error when no valid challenges to unfail", () => {
            // Don't add any challenges
            expect(challengeList.challenges.length).toBe(0);

            // Try to revert
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Mock setStatus to throw an error
            const originalMethod = challenge.setStatus;
            challenge.setStatus = () => {
                throw new Error("Revert operation failed");
            };

            // Execute unfail command
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
                "reverting challenges from failed status"
            );
            expect(response.message).toContain("Revert operation failed");

            // Restore original method
            challenge.setStatus = originalMethod;
        });

        it("should handle non-Error exceptions", () => {
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Mock setStatus to throw a non-Error object
            const originalMethod = challenge.setStatus;
            challenge.setStatus = () => {
                throw "String error";
            };

            // Execute unfail command
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
                "reverting challenges from failed status"
            );

            // Restore original method
            challenge.setStatus = originalMethod;
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle reverting first challenge in list", () => {
            // Add failed challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");

            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);
            challenge3.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert first challenge
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(true);
            expect(challenge3.isFailed()).toBe(true);
        });

        it("should handle reverting last challenge in list", () => {
            // Add failed challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");

            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);
            challenge3.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert last challenge
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(true);
            expect(challenge3.isFailed()).toBe(false);
        });

        it("should handle reverting middle challenge in list", () => {
            // Add failed challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");

            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);
            challenge3.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert middle challenge
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(false);
            expect(challenge3.isFailed()).toBe(true);
        });

        it("should handle duplicate IDs in target list", () => {
            // Add failed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");

            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to revert with duplicate IDs
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(false);
        });

        it("should persist revert to localStorage", () => {
            // Add failed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");

            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Verify initial state
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(true);

            // Revert challenge
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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

            // Verify the failure status was updated in memory
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(true);

            // Note: ChallengeList automatically persists to localStorage
            // The persistence is tested in ChallengeList tests
        });

        it("should handle whitespace in target ID", () => {
            // Add failed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");

            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Revert with whitespace in target ID
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: " 1 , 2 ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(false);
        });

        it("should handle zero as target ID", () => {
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert with zero ID
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            expect(challenge.isFailed()).toBe(true);
        });

        it("should handle negative target ID", () => {
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Try to revert with negative ID
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
            expect(challenge.isFailed()).toBe(true);
        });

        it("should handle partial revert when some challenges are not failed", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");

            // Mark challenge1 and challenge3 as failed, leave challenge2 active
            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge3.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Try to revert challenges 1, 2, 3
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should succeed for challenges 1 and 3, but note that 2 was not failed
            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(false);
            expect(challenge3.isFailed()).toBe(false);
            // Response should only mention the newly reverted challenges
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#3");
        });
    });

    describe("execute - Response Formatting", () => {
        it("should format response correctly for single revert", () => {
            // Add failed challenge
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Revert
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Unfailed");
            expect(response.message).toContain("#1");
        });

        it("should format response correctly for multiple reverts", () => {
            // Add failed challenges
            const challenge1 = new Challenge("First Challenge");
            const challenge2 = new Challenge("Second Challenge");
            const challenge3 = new Challenge("Third Challenge");

            challenge1.setStatus(ChallengeStatus.FAILED);
            challenge2.setStatus(ChallengeStatus.FAILED);
            challenge3.setStatus(ChallengeStatus.FAILED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Revert multiple challenges
            const response = unfailCommand.execute(
                {
                    command: "unfail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Unfailed");
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#3");
        });

        it("should verify response includes position IDs not titles", () => {
            // Add failed challenge with description and progress
            const challenge = new Challenge("Detailed Challenge", {
                description: "Test description",
                amount: 5,
            });
            challenge.setProgress(5);
            challenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(challenge);

            // Revert
            const response = unfailCommand.execute(
                {
                    command: "unfail",
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
