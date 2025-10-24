import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { DeleteCommand } from "../../src/commands/DeleteCommand";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("DeleteCommand", () => {
    let deleteCommand: DeleteCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        deleteCommand = new DeleteCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create DeleteCommand instance with required dependencies", () => {
            expect(deleteCommand).toBeDefined();
            expect(deleteCommand).toBeInstanceOf(DeleteCommand);
        });

        it("should have access to challengeList", () => {
            // Add a challenge to verify access
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges.length).toBe(0);
        });
    });

    describe("execute - Single Challenge Deletion", () => {
        it("should delete a single challenge by ID", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Delete challenge at index 1 (display position 2)
            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#2");
            expect(response.message).toContain("has been deleted");
            expect(challengeList.challenges.length).toBe(2);
            expect(challengeList.challenges).toContain(challenge1);
            expect(challengeList.challenges).toContain(challenge3);
            expect(challengeList.challenges).not.toContain(challenge2);
        });

        it("should include UI update data with DELETE action", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Delete challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.DELETE);
            expect(response.uiUpdate?.challengeIndices).toEqual([0]);
            expect(response.uiUpdate?.challenges).toHaveLength(1);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should delete challenge with timer", () => {
            // Add timed challenge
            const timedChallenge = new Challenge("Timed Challenge", {
                timer: "10m",
            });
            timedChallenge.startTimer();
            challengeList.addChallengeObjects(timedChallenge);

            // Verify challenge was added
            expect(challengeList.challenges.length).toBe(1);
            expect(challengeList.challenges[0]?.timer).toBeDefined();

            // Delete challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("has been deleted");
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should delete challenge with progress tracking", () => {
            // Add progress challenge
            const progressChallenge = new Challenge("Progress Challenge", {
                amount: 5,
            });
            progressChallenge.incrementProgress();
            progressChallenge.incrementProgress();
            challengeList.addChallengeObjects(progressChallenge);

            // Verify challenge was added with progress
            expect(challengeList.challenges.length).toBe(1);
            expect(challengeList.challenges[0]?.progress).toBe(2);

            // Delete challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("has been deleted");
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should delete completed challenge", () => {
            // Add completed challenge
            const completedChallenge = new Challenge("Completed Challenge");
            completedChallenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(completedChallenge);

            // Delete challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("has been deleted");
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should delete failed challenge", () => {
            // Add failed challenge
            const failedChallenge = new Challenge("Failed Challenge");
            failedChallenge.setStatus(ChallengeStatus.FAILED);
            challengeList.addChallengeObjects(failedChallenge);

            // Delete challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("has been deleted");
            expect(challengeList.challenges.length).toBe(0);
        });
    });

    describe("execute - Multiple Challenge Deletion", () => {
        it("should delete multiple challenges by comma-separated IDs", () => {
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

            // Delete challenges at positions 1, 3, 4
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("have been deleted");
            expect(challengeList.challenges.length).toBe(1);
            expect(challengeList.challenges).toContain(challenge2);
            expect(challengeList.challenges).not.toContain(challenge1);
            expect(challengeList.challenges).not.toContain(challenge3);
            expect(challengeList.challenges).not.toContain(challenge4);
        });

        it("should include correct UI update data for multiple deletions", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Delete challenges at positions 1 and 3
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.DELETE);
            expect(response.uiUpdate?.challengeIndices).toEqual([0, 2]);
            expect(response.uiUpdate?.challenges).toHaveLength(2);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should delete all challenges when all IDs are provided", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            const challenge3 = new Challenge("Challenge 3");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Delete all challenges
            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,2,3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            expect(response.message).toContain("#2");
            expect(response.message).toContain("#3");
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should handle deletion with mixed challenge types", () => {
            // Add mixed challenges
            const activeChallenge = new Challenge("Active");
            const completedChallenge = new Challenge("Completed");
            const timedChallenge = new Challenge("Timed", { timer: "5m" });
            const progressChallenge = new Challenge("Progress", { amount: 5 });

            completedChallenge.setStatus(ChallengeStatus.COMPLETED);
            timedChallenge.startTimer();
            progressChallenge.incrementProgress();

            challengeList.addChallengeObjects([
                activeChallenge,
                completedChallenge,
                timedChallenge,
                progressChallenge,
            ]);

            // Delete challenges at positions 2 and 4
            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "2,4",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#2");
            expect(response.message).toContain("#4");
            expect(response.message).toContain("have been deleted");
            expect(challengeList.challenges.length).toBe(2);
            expect(challengeList.challenges).toContain(activeChallenge);
            expect(challengeList.challenges).toContain(timedChallenge);
        });
    });

    describe("execute - Error Handling", () => {
        it("should return error when no target ID is provided", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to delete without target ID
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("delete");
            expect(challengeList.challenges.length).toBe(1);
        });

        it("should return error when target ID is invalid", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to delete with invalid ID
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(challengeList.challenges.length).toBe(1);
        });

        it("should return error when challenge does not exist", () => {
            // Add one challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to delete non-existent challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(challengeList.challenges.length).toBe(1);
        });

        it("should return error when some challenges in list do not exist", () => {
            // Add two challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to delete with mix of valid and invalid IDs
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            // Should not delete any challenges when some IDs are invalid
            expect(challengeList.challenges.length).toBe(2);
        });

        it("should return error when no valid challenges to delete", () => {
            // Don't add any challenges
            expect(challengeList.challenges.length).toBe(0);

            // Try to delete
            const response = deleteCommand.execute(
                {
                    command: "delete",
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

        it("should handle error during delete operation", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock deleteChallenges to throw an error
            const originalDeleteMethod = challengeList.deleteChallenges;
            challengeList.deleteChallenges = () => {
                throw new Error("Delete operation failed");
            };

            // Execute delete command
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("deleting challenges");
            expect(response.message).toContain("Delete operation failed");

            // Restore original method
            challengeList.deleteChallenges = originalDeleteMethod;
        });

        it("should handle non-Error exceptions", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock deleteChallenges to throw a non-Error object
            const originalDeleteMethod = challengeList.deleteChallenges;
            challengeList.deleteChallenges = () => {
                throw "String error";
            };

            // Execute delete command
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("deleting challenges");

            // Restore original method
            challengeList.deleteChallenges = originalDeleteMethod;
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle deletion of first challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Delete first challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges.length).toBe(2);
            expect(challengeList.challenges[0]?.title).toBe("Second");
            expect(challengeList.challenges[1]?.title).toBe("Third");
        });

        it("should handle deletion of last challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Delete last challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges.length).toBe(2);
            expect(challengeList.challenges[0]?.title).toBe("First");
            expect(challengeList.challenges[1]?.title).toBe("Second");
        });

        it("should handle deletion of middle challenge in list", () => {
            // Add challenges
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Delete middle challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges.length).toBe(2);
            expect(challengeList.challenges[0]?.title).toBe("First");
            expect(challengeList.challenges[1]?.title).toBe("Third");
        });

        it("should handle duplicate IDs in target list", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Try to delete with duplicate IDs
            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1,1,2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should handle duplicates gracefully (implementation may vary)
            expect(response.error).toBe(false);
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should persist deletion to localStorage", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Delete challenge
            deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Create a new ChallengeList instance to verify persistence
            const newChallengeList = new ChallengeList();

            // Verify the deletion was persisted
            expect(newChallengeList.challenges.length).toBe(1);
            expect(newChallengeList.challenges[0]?.title).toBe("Challenge 2");
        });

        it("should handle whitespace in target ID", () => {
            // Add challenges
            const challenge1 = new Challenge("Challenge 1");
            const challenge2 = new Challenge("Challenge 2");
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Delete with whitespace in target ID
            const response = deleteCommand.execute(
                {
                    command: "delete",
                    parameters: {},
                    rawParameters: "",
                    targetId: " 1 , 2 ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should handle zero as target ID", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to delete with zero ID
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(challengeList.challenges.length).toBe(1);
        });

        it("should handle negative target ID", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Try to delete with negative ID
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(challengeList.challenges.length).toBe(1);
        });
    });

    describe("execute - Response Formatting", () => {
        it("should format response with short ID for single deletion", () => {
            // Add challenge
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Delete challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("has been deleted");
        });

        it("should format response correctly for multiple deletions", () => {
            // Add challenges
            const challenge1 = new Challenge("First Challenge");
            const challenge2 = new Challenge("Second Challenge");
            const challenge3 = new Challenge("Third Challenge");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            // Delete multiple challenges
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("have been deleted");
        });

        it("should verify response includes position IDs not titles", () => {
            // Add challenge with description and progress
            const challenge = new Challenge("Detailed Challenge", {
                description: "Test description",
                amount: 5,
            });
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            // Delete challenge
            const response = deleteCommand.execute(
                {
                    command: "delete",
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
            expect(response.message).toContain("has been deleted");
            // Response uses short IDs by default, not challenge titles
            expect(response.message).not.toContain("Detailed Challenge");
        });
    });
});
