import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { DoneCommand } from "../../src/commands/DoneCommand";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("DoneCommand", () => {
    let doneCommand: DoneCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        doneCommand = new DoneCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create DoneCommand instance with required dependencies", () => {
            expect(doneCommand).toBeDefined();
            expect(doneCommand).toBeInstanceOf(DoneCommand);
        });

        it("should have access to challengeList", () => {
            // Add a challenge to verify access
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.isComplete()).toBe(true);
        });
    });

    describe("execute - Single Challenge Completion", () => {
        it("should mark a single challenge as completed", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(response.message).toContain("✅");
            expect(challenge.isComplete()).toBe(true);
        });

        it("should include UI update data with COMPLETE action", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.COMPLETE);
            expect(response.uiUpdate?.challengeIndices).toEqual([0]);
            expect(response.uiUpdate?.challenges).toHaveLength(1);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should stop timer when marking challenge as done", () => {
            // Add timed challenge
            const timedChallenge = new Challenge("Timed Challenge", {
                timer: "10m",
            });
            timedChallenge.startTimer();
            challengeList.addChallengeObjects(timedChallenge);

            // Verify timer is active
            expect(timedChallenge.timer).toBeDefined();
            expect(timedChallenge.timer?.isActive).toBe(true);

            // Mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(timedChallenge.isComplete()).toBe(true);
            expect(timedChallenge.timer?.isActive).toBe(false);
        });

        it("should mark challenge with progress tracking as done", () => {
            // Add progress challenge
            const progressChallenge = new Challenge("Progress Challenge", {
                amount: 5,
            });
            progressChallenge.incrementProgress();
            progressChallenge.incrementProgress();
            challengeList.addChallengeObjects(progressChallenge);

            // Verify challenge has progress
            expect(progressChallenge.progress).toBe(2);
            expect(progressChallenge.isComplete()).toBe(false);

            // Mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(progressChallenge.isComplete()).toBe(true);
        });

        it("should mark challenge without timer as done", () => {
            // Add simple challenge
            const simpleChallenge = new Challenge("Simple Challenge");
            challengeList.addChallengeObjects(simpleChallenge);

            // Mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(simpleChallenge.isComplete()).toBe(true);
        });
    });

    describe("execute - Multiple Challenge Completion", () => {
        it("should mark multiple challenges as completed by comma-separated IDs", () => {
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

            // Mark challenges at positions 1, 3, 4 as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(false);
            expect(challenge3.isComplete()).toBe(true);
            expect(challenge4.isComplete()).toBe(true);
        });

        it("should include correct UI update data for multiple completions", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark challenges at positions 1 and 3 as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.COMPLETE);
            expect(response.uiUpdate?.challengeIndices).toEqual([0, 2]);
            expect(response.uiUpdate?.challenges).toHaveLength(2);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should stop timers for all completed challenges", () => {
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

            // Mark challenges 1 and 3 as done
            const response = doneCommand.execute(
                {
                    command: "done",
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

            // Mark all as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(activeChallenge.isComplete()).toBe(true);
            expect(timedChallenge.isComplete()).toBe(true);
            expect(progressChallenge.isComplete()).toBe(true);
        });
    });

    describe("execute - Error Handling", () => {
        it("should return error when no target ID is provided", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark as done without target ID
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(response.message).toContain("done");
            expect(challenge.isComplete()).toBe(false);
        });

        it("should return error when target ID is invalid", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark as done with invalid ID
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(challenge.isComplete()).toBe(false);
        });

        it("should return error when challenge does not exist", () => {
            // Add one challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark non-existent challenge as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(challenge.isComplete()).toBe(false);
        });

        it("should return error when challenge is already completed", () => {
            // Add completed challenge
            const completedChallenge = new Challenge("Completed Challenge");
            completedChallenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(completedChallenge);

            // Try to mark as done again
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("already completed");
            expect(response.message).toContain("#1");
        });

        it("should return error when all challenges are already completed", () => {
            // Add completed challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challenge1.setStatus(ChallengeStatus.COMPLETED);
            challenge2.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("already completed");
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#2");
        });

        it("should return error when some challenges in list do not exist", () => {
            // Add two challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to mark with mix of valid and invalid IDs
            const response = doneCommand.execute(
                {
                    command: "done",
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
            // Should not mark any challenges as done when some IDs are invalid
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(false);
        });

        it("should return error when no valid challenges to mark as done", () => {
            // Don't add any challenges
            expect(challengeList.challenges.length).toBe(0);

            // Try to mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
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

        it("should handle error during completion operation", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setStatus to throw an error
            const originalMethod = challenge.setStatus;
            challenge.setStatus = () => {
                throw new Error("Completion operation failed");
            };

            // Execute done command
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(response.message).toContain("marking challenges as done");
            expect(response.message).toContain("Completion operation failed");

            // Restore original method
            challenge.setStatus = originalMethod;
        });

        it("should handle non-Error exceptions", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setStatus to throw a non-Error object
            const originalMethod = challenge.setStatus;
            challenge.setStatus = () => {
                throw "String error";
            };

            // Execute done command
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(response.message).toContain("marking challenges as done");

            // Restore original method
            challenge.setStatus = originalMethod;
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle completion of first challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark first challenge as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(false);
            expect(challenge3.isComplete()).toBe(false);
        });

        it("should handle completion of last challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark last challenge as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(false);
            expect(challenge3.isComplete()).toBe(true);
        });

        it("should handle completion of middle challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark middle challenge as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(true);
            expect(challenge3.isComplete()).toBe(false);
        });

        it("should handle duplicate IDs in target list", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to mark with duplicate IDs
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(true);
        });

        it("should persist completion to localStorage", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Verify initial state
            expect(challenge1.isComplete()).toBe(false);
            expect(challenge2.isComplete()).toBe(false);

            // Mark challenge as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(false);

            // Note: ChallengeList automatically persists to localStorage
            // The persistence is tested in ChallengeList tests
        });

        it("should handle whitespace in target ID", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Mark with whitespace in target ID
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: " 1 , 2 ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(true);
        });

        it("should handle zero as target ID", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark with zero ID
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(challenge.isComplete()).toBe(false);
        });

        it("should handle negative target ID", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to mark with negative ID
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(challenge.isComplete()).toBe(false);
        });

        it("should handle partial completion when some challenges are already done", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");

            // Mark challenge2 as already completed
            challenge2.setStatus(ChallengeStatus.COMPLETED);

            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Try to mark challenges 1, 2, 3 as done
            const response = doneCommand.execute(
                {
                    command: "done",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should succeed for challenges 1 and 3, but note that 2 was already done
            expect(response.error).toBe(false);
            expect(challenge1.isComplete()).toBe(true);
            expect(challenge2.isComplete()).toBe(true);
            expect(challenge3.isComplete()).toBe(true);
            // Response should only mention the newly completed challenges
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#3");
        });
    });

    describe("execute - Response Formatting", () => {
        it("should format response with short ID and emoji for single completion", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(response.message).toContain("✅");
        });

        it("should format response correctly for multiple completions", () => {
            // Add challenges
            const challenge1 = new Challenge("First Challenge");
            const challenge2 = new Challenge("Second Challenge");
            const challenge3 = new Challenge("Third Challenge");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Mark multiple challenges as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
            expect(response.message).toContain("✅");
        });

        it("should verify response includes position IDs not titles", () => {
            // Add challenge with description and progress
            const challenge = new Challenge("Detailed Challenge", {
                description: "Test description",
                amount: 5,
            });
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            // Mark as done
            const response = doneCommand.execute(
                {
                    command: "done",
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
