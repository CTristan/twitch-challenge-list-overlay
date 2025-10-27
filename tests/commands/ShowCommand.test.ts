import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { ShowCommand } from "../../src/commands/ShowCommand";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import { STATUS_MESSAGES } from "../../src/types/MessageConstants";
import Timer from "../../src/utils/Timer";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("ShowCommand", () => {
    let showCommand: ShowCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        showCommand = new ShowCommand(challengeList, configManager);
    });

    describe("execute", () => {
        it("should show challenge details with proper creation timestamp", () => {
            // Add a challenge with known creation time
            const testChallenge = new Challenge("Test Challenge", {
                description: "Test description",
                amount: 5,
            });

            // Store the actual creation timestamp
            const expectedCreatedAt = testChallenge.createdAt;
            challengeList.addChallengeObjects(testChallenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Test Challenge");
            expect(result.message).toContain("Description: Test description");
            expect(result.message).toContain("Progress: 0/5");
            expect(result.message).toContain("Status: In Progress");

            // Verify that the creation time uses createdAt, not parsed ID
            const expectedDate = new Date(expectedCreatedAt).toLocaleString();
            expect(result.message).toContain(`Created: ${expectedDate}`);
        });

        it("should handle missing createdAt gracefully", () => {
            // Create a challenge and manually remove createdAt to test edge case
            const testChallenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(testChallenge);

            // Simulate missing createdAt by setting it to undefined
            (testChallenge as any).createdAt = undefined;

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Test Challenge");
            expect(result.message).toContain("Created: Unknown");
        });

        it("should handle null createdAt gracefully", () => {
            // Create a challenge and manually set createdAt to null
            const testChallenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(testChallenge);

            // Simulate null createdAt
            (testChallenge as any).createdAt = null;

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Test Challenge");
            expect(result.message).toContain("Created: Unknown");
        });

        it("should handle zero createdAt gracefully", () => {
            // Create a challenge and manually set createdAt to 0
            const testChallenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(testChallenge);

            // Simulate zero createdAt (falsy but valid timestamp)
            (testChallenge as any).createdAt = 0;

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Test Challenge");
            // 0 timestamp should show as January 1, 1970
            const expectedDate = new Date(0).toLocaleString();
            expect(result.message).toContain(`Created: ${expectedDate}`);
        });

        it("should not use challenge.id for timestamp parsing", () => {
            // Create a challenge with a known ID format
            const testChallenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(testChallenge);

            // Verify the ID is in the expected salted format (not a timestamp)
            // Format: DDHHMMSSMS + 4 digit salt (15 digits total)
            expect(testChallenge.id).toMatch(/^\d{15}$/); // DDHHMMSSMS + 4 digit salt

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);

            // Verify that the creation time is NOT based on parsing the ID
            const idAsTimestamp = new Date(
                parseInt(testChallenge.id)
            ).toLocaleString();
            const actualCreatedTime = new Date(
                testChallenge.createdAt
            ).toLocaleString();

            expect(result.message).toContain(`Created: ${actualCreatedTime}`);
            expect(result.message).not.toContain(`Created: ${idAsTimestamp}`);
        });

        it("should show complete challenge details including timer", () => {
            // Add a challenge with timer
            const testChallenge = new Challenge("Timer Challenge", {
                description: "Challenge with timer",
                amount: 3,
                timer: "5m",
            });
            challengeList.addChallengeObjects(testChallenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Timer Challenge");
            expect(result.message).toContain(
                "Description: Challenge with timer"
            );
            expect(result.message).toContain("Progress: 0/3");
            expect(result.message).toContain("Status: In Progress");
            expect(result.message).toContain("Timer:");

            // Verify creation time is included
            const expectedDate = new Date(
                testChallenge.createdAt
            ).toLocaleString();
            expect(result.message).toContain(`Created: ${expectedDate}`);
        });

        it("should return error for non-existent challenge", () => {
            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "999",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain("not found");
        });

        it("should return error for invalid target ID", () => {
            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "invalid",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain("not found");
        });

        it("should return error when target ID is missing", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain("Target ID required");
        });

        it("should return error when target ID is undefined", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain("Target ID required");
        });
    });

    describe("Constructor and Initialization", () => {
        it("should create ShowCommand instance with required dependencies", () => {
            expect(showCommand).toBeDefined();
            expect(showCommand).toBeInstanceOf(ShowCommand);
        });

        it("should have access to challengeList", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = showCommand.execute(
                {
                    command: "show",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Test Challenge");
        });

        it("should have access to configManager", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = showCommand.execute(
                {
                    command: "show",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response).toBeDefined();
            expect(response).toHaveProperty("error");
            expect(response).toHaveProperty("message");
        });
    });

    describe("Challenge Status Display", () => {
        it("should show in-progress status for incomplete challenge", () => {
            const challenge = new Challenge("In Progress Challenge");
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(STATUS_MESSAGES.IN_PROGRESS);
            expect(result.message).toContain("📝");
        });

        it("should show completed status for completed challenge", () => {
            const challenge = new Challenge("Completed Challenge");
            challengeList.addChallengeObjects(challenge);
            challengeList.completeChallenges([0]);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(STATUS_MESSAGES.COMPLETED);
            expect(result.message).toContain("✅");
        });

        it("should show failed status for failed challenge", () => {
            const challenge = new Challenge("Failed Challenge");
            challengeList.addChallengeObjects(challenge);
            challenge.setStatus(ChallengeStatus.FAILED);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(STATUS_MESSAGES.FAILED);
            expect(result.message).toContain("❌");
        });
    });

    describe("Timer Display", () => {
        it("should show active timer information", () => {
            const challenge = new Challenge("Timed Challenge");
            const timer = new Timer(300); // 5 minutes
            timer.start();
            challenge.timer = timer;
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(STATUS_MESSAGES.TIMER_LABEL);
            expect(result.message).toContain(STATUS_MESSAGES.TIMER_ACTIVE);
        });

        it("should show stopped timer information", () => {
            const challenge = new Challenge("Timed Challenge");
            const timer = new Timer(300);
            timer.start();
            timer.stop();
            challenge.timer = timer;
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(STATUS_MESSAGES.TIMER_LABEL);
            expect(result.message).toContain(STATUS_MESSAGES.TIMER_STOPPED);
            expect(result.message).toContain("Timer stopped");
        });

        it("should not show timer information when challenge has no timer", () => {
            const challenge = new Challenge("No Timer Challenge");
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).not.toContain(STATUS_MESSAGES.TIMER_LABEL);
        });
    });

    describe("Description Display", () => {
        it("should show description when present", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "This is a test description",
            });
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(STATUS_MESSAGES.DESCRIPTION_LABEL);
            expect(result.message).toContain("This is a test description");
        });

        it("should not show description label when description is empty", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "",
            });
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).not.toContain(
                STATUS_MESSAGES.DESCRIPTION_LABEL
            );
        });

        it("should not show description label when description is whitespace only", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "   ",
            });
            challengeList.addChallengeObjects(challenge);

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).not.toContain(
                STATUS_MESSAGES.DESCRIPTION_LABEL
            );
        });
    });

    describe("Error Handling", () => {
        it("should handle exceptions gracefully", () => {
            // Create a challenge and add it
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock handleSingleTarget to throw an error
            const originalHandleSingleTarget = (showCommand as any)
                .handleSingleTarget;
            (showCommand as any).handleSingleTarget = () => {
                throw new Error("Test error");
            };

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain("Error");

            // Restore original method
            (showCommand as any).handleSingleTarget =
                originalHandleSingleTarget;
        });

        it("should handle non-Error exceptions", () => {
            // Create a challenge and add it
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock handleSingleTarget to throw a non-Error object
            const originalHandleSingleTarget = (showCommand as any)
                .handleSingleTarget;
            (showCommand as any).handleSingleTarget = () => {
                throw "String error";
            };

            const result = showCommand.execute(
                {
                    command: "show",
                    targetId: "1",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(true);
            expect(result.message).toBeDefined();

            // Restore original method
            (showCommand as any).handleSingleTarget =
                originalHandleSingleTarget;
        });
    });
});
