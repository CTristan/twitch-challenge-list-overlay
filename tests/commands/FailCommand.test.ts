import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { FailCommand } from "../../src/commands/FailCommand";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("FailCommand", () => {
    let failCommand: FailCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        failCommand = new FailCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create FailCommand instance with required dependencies", () => {
            expect(failCommand).toBeDefined();
            expect(failCommand).toBeInstanceOf(FailCommand);
        });

        it("should have access to challengeList", () => {
            // Add a challenge to verify access
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.isFailed()).toBe(true);
        });
    });

    describe("execute - Single Challenge Failure", () => {
        it("should mark a single challenge as failed", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(response.message).toContain("❌");
            expect(challenge.isFailed()).toBe(true);
        });

        it("should return success response without UI update data", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
            // Note: FailCommand does not include UI update data
            expect(response.uiUpdate).toBeUndefined();
        });

        it("should stop timer when marking challenge as failed", () => {
            // Add timed challenge
            const timedChallenge = new Challenge("Timed Challenge", {
                timer: "10m",
            });
            timedChallenge.startTimer();
            challengeList.addChallengeObjects(timedChallenge);

            // Verify timer is active
            expect(timedChallenge.timer).toBeDefined();
            expect(timedChallenge.timer?.isActive).toBe(true);

            // Mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(timedChallenge.isFailed()).toBe(true);
            expect(timedChallenge.timer?.isActive).toBe(false);
        });

        it("should mark challenge with progress tracking as failed", () => {
            // Add progress challenge
            const progressChallenge = new Challenge("Progress Challenge", {
                amount: 5,
            });
            progressChallenge.incrementProgress();
            progressChallenge.incrementProgress();
            challengeList.addChallengeObjects(progressChallenge);

            // Verify challenge has progress
            expect(progressChallenge.progress).toBe(2);
            expect(progressChallenge.isFailed()).toBe(false);

            // Mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(progressChallenge.isFailed()).toBe(true);
        });

        it("should mark challenge without timer as failed", () => {
            // Add simple challenge
            const simpleChallenge = new Challenge("Simple Challenge");
            challengeList.addChallengeObjects(simpleChallenge);

            // Mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(simpleChallenge.isFailed()).toBe(true);
        });
    });

    describe("execute - Multiple Challenge Failure", () => {
        it("should mark multiple challenges as failed by comma-separated IDs", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            const challenge4 = new Challenge("Challenge 4");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
                challenge4,
            ]);

            // Mark challenges at positions 1, 3, 4 as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(false);
            expect(challenge3.isFailed()).toBe(true);
            expect(challenge4.isFailed()).toBe(true);
        });

        it("should return success response for multiple failures without UI update data", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark challenges at positions 1 and 3 as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
            // Note: FailCommand does not include UI update data
            expect(response.uiUpdate).toBeUndefined();
        });

        it("should stop timers for all failed challenges", () => {
            // Add timed challenges
            const timedChallenge1 = new Challenge("Timed 1", { timer: "5m" });
            const timedChallenge2 = new Challenge("Timed 2", { timer: "10m" });
            const timedChallenge3 = new Challenge("Timed 3", { timer: "15m" });

            timedChallenge1.startTimer();
            timedChallenge2.startTimer();
            timedChallenge3.startTimer();

            challengeList.addChallengeObjects([
                timedChallenge1,
                timedChallenge2,
                timedChallenge3,
            ]);

            // Verify all timers are active
            expect(timedChallenge1.timer?.isActive).toBe(true);
            expect(timedChallenge2.timer?.isActive).toBe(true);
            expect(timedChallenge3.timer?.isActive).toBe(true);

            // Mark challenges 1 and 3 as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(timedChallenge1.timer?.isActive).toBe(false);
            expect(timedChallenge2.timer?.isActive).toBe(true);
            expect(timedChallenge3.timer?.isActive).toBe(false);
        });

        it("should handle mixed challenge types", () => {
            // Add mixed challenges
            const activeChallenge = new Challenge("Active");
            const timedChallenge = new Challenge("Timed", { timer: "5m" });
            const progressChallenge = new Challenge("Progress", { amount: 5 });

            timedChallenge.startTimer();
            progressChallenge.incrementProgress();

            challengeList.addChallengeObjects([
                activeChallenge,
                timedChallenge,
                progressChallenge,
            ]);

            // Mark all as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(activeChallenge.isFailed()).toBe(true);
            expect(timedChallenge.isFailed()).toBe(true);
            expect(progressChallenge.isFailed()).toBe(true);
        });
    });

    describe("execute - Error Handling", () => {
        it("should return error when no target ID is provided", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark as failed without target ID
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(response.message).toContain("fail");
            expect(challenge.isFailed()).toBe(false);
        });

        it("should return error when target ID is invalid", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark as failed with invalid ID
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(challenge.isFailed()).toBe(false);
        });

        it("should return error when challenge does not exist", () => {
            // Add one challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark non-existent challenge as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(challenge.isFailed()).toBe(false);
        });

        it("should return error when challenge is already failed", () => {
            // Add failed challenge
            const failedChallenge = new Challenge("Failed Challenge");
            failedChallenge.setFailureStatus(true);
            challengeList.addChallengeObjects(failedChallenge);

            // Try to mark as failed again
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("already marked as failed");
            expect(response.message).toContain("#1");
        });

        it("should return error when all challenges are already failed", () => {
            // Add failed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challenge1.setFailureStatus(true);
            challenge2.setFailureStatus(true);
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("already marked as failed");
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#2");
        });

        it("should return error when some challenges in list do not exist", () => {
            // Add two challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to mark with mix of valid and invalid IDs
            const response = failCommand.execute(
                {
                    command: "fail",
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
            // Should not mark any challenges as failed when some IDs are invalid
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(false);
        });

        it("should return error when no valid challenges to mark as failed", () => {
            // Don't add any challenges
            expect(challengeList.challenges.length).toBe(0);

            // Try to mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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

        it("should handle error during failure operation", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setFailureStatus to throw an error
            const originalMethod = challenge.setFailureStatus;
            challenge.setFailureStatus = () => {
                throw new Error("Failure operation failed");
            };

            // Execute fail command
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(response.message).toContain("marking challenges as failed");
            expect(response.message).toContain("Failure operation failed");

            // Restore original method
            challenge.setFailureStatus = originalMethod;
        });

        it("should handle non-Error exceptions", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setFailureStatus to throw a non-Error object
            const originalMethod = challenge.setFailureStatus;
            challenge.setFailureStatus = () => {
                throw "String error";
            };

            // Execute fail command
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(response.message).toContain("marking challenges as failed");

            // Restore original method
            challenge.setFailureStatus = originalMethod;
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle failure of first challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark first challenge as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(false);
            expect(challenge3.isFailed()).toBe(false);
        });

        it("should handle failure of last challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark last challenge as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(false);
            expect(challenge3.isFailed()).toBe(true);
        });

        it("should handle failure of middle challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark middle challenge as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(true);
            expect(challenge3.isFailed()).toBe(false);
        });

        it("should handle duplicate IDs in target list", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to mark with duplicate IDs
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(true);
        });

        it("should persist failure to localStorage", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Verify initial state
            expect(challenge1.isFailed()).toBe(false);
            expect(challenge2.isFailed()).toBe(false);

            // Mark challenge as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(false);

            // Note: ChallengeList automatically persists to localStorage
            // The persistence is tested in ChallengeList tests
        });

        it("should handle whitespace in target ID", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Mark with whitespace in target ID
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: " 1 , 2 ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(true);
        });

        it("should handle zero as target ID", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark with zero ID
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(challenge.isFailed()).toBe(false);
        });

        it("should handle negative target ID", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark with negative ID
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(challenge.isFailed()).toBe(false);
        });

        it("should handle partial failure when some challenges are already failed", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");

            // Mark challenge2 as already failed
            challenge2.setFailureStatus(true);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Try to mark challenges 1, 2, 3 as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should succeed for challenges 1 and 3, but note that 2 was already failed
            expect(response.error).toBe(false);
            expect(challenge1.isFailed()).toBe(true);
            expect(challenge2.isFailed()).toBe(true);
            expect(challenge3.isFailed()).toBe(true);
            // Response should only mention the newly failed challenges
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#3");
        });

        it("should handle completed challenge being marked as failed", () => {
            // Add completed challenge
            const completedChallenge = new Challenge("Completed Challenge");
            completedChallenge.setCompletionStatus(true);
            challengeList.addChallengeObjects(completedChallenge);

            // Mark completed challenge as failed
            const response = failCommand.execute(
                {
                    command: "fail",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(completedChallenge.isFailed()).toBe(true);
            // Note: A challenge can be both completed and failed
        });
    });

    describe("execute - Response Formatting", () => {
        it("should format response with short ID and emoji for single failure", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(response.message).toContain("❌");
        });

        it("should format response correctly for multiple failures", () => {
            // Add challenges
            const challenge1 = new Challenge("First Challenge");
            const challenge2 = new Challenge("Second Challenge");
            const challenge3 = new Challenge("Third Challenge");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark multiple challenges as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
            expect(response.message).toContain("❌");
        });

        it("should verify response includes position IDs not titles", () => {
            // Add challenge with description and progress
            const challenge = new Challenge("Detailed Challenge", {
                description: "Test description",
                amount: 5,
            });
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            // Mark as failed
            const response = failCommand.execute(
                {
                    command: "fail",
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
