import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { ShowCommand } from "../../src/commands/ShowCommand";

describe("ShowCommand", () => {
    let showCommand: ShowCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();
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
            expect(testChallenge.id).toMatch(/^\d{15}$/); // DDHHMMSSMS + 4 digit salt (15 digits total)

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
    });
});
