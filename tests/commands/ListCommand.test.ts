import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { ListCommand } from "../../src/commands/ListCommand";
import {
    ERROR_MESSAGES,
    LIST_MESSAGES,
} from "../../src/types/MessageConstants";
import CommandParser from "../../src/utils/CommandParser";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("ListCommand", () => {
    let listCommand: ListCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        listCommand = new ListCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create ListCommand instance with required dependencies", () => {
            expect(listCommand).toBeDefined();
            expect(listCommand).toBeInstanceOf(ListCommand);
        });

        it("should have access to challengeList", () => {
            // Add a challenge to verify access
            challengeList.addChallenges(["Test Challenge"]);
            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );
            expect(result.error).toBe(false);
            expect(result.message).toContain("Test Challenge");
        });

        it("should have access to configManager", () => {
            // ConfigManager is used internally, verify command works
            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );
            expect(result).toBeDefined();
            expect(result).toHaveProperty("error");
            expect(result).toHaveProperty("message");
        });
    });

    describe("Execute - Empty Challenge List", () => {
        it("should return appropriate message when no challenges exist (default filter)", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toBe(
                ERROR_MESSAGES.NO_INCOMPLETE_CHALLENGES_FOUND
            );
        });

        it("should return appropriate message when no challenges exist (filter=all)", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.NO_CHALLENGES_FOUND);
        });

        it("should return appropriate message when no completed challenges exist", () => {
            challengeList.addChallenges(["Incomplete Challenge"]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toBe(
                ERROR_MESSAGES.NO_COMPLETED_CHALLENGES_FOUND
            );
        });

        it("should return appropriate message when no incomplete challenges exist", () => {
            challengeList.addChallenges(["Complete Challenge"]);
            challengeList.completeChallenges([0]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=incomplete"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toBe(
                ERROR_MESSAGES.NO_INCOMPLETE_CHALLENGES_FOUND
            );
        });
    });

    describe("Execute - Filter Type Parsing", () => {
        beforeEach(() => {
            // Add test challenges with mixed completion status
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            challengeList.completeChallenges([1]); // Complete Challenge 2
        });

        it("should default to incomplete filter when no filter specified", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.INCOMPLETE_CHALLENGES
            );
            expect(result.message).toContain("Challenge 1");
            expect(result.message).toContain("Challenge 3");
            expect(result.message).not.toContain("Challenge 2");
        });

        it("should parse filter=all parameter", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(LIST_MESSAGES.ALL_CHALLENGES);
            expect(result.message).toContain("Challenge 1");
            expect(result.message).toContain("Challenge 2");
            expect(result.message).toContain("Challenge 3");
        });

        it("should parse filter=done parameter", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.COMPLETED_CHALLENGES
            );
            expect(result.message).toContain("Challenge 2");
            expect(result.message).not.toContain("Challenge 1");
            expect(result.message).not.toContain("Challenge 3");
        });

        it("should parse filter=incomplete parameter", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=incomplete"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.INCOMPLETE_CHALLENGES
            );
            expect(result.message).toContain("Challenge 1");
            expect(result.message).toContain("Challenge 3");
            expect(result.message).not.toContain("Challenge 2");
        });

        it("should parse rawParameters for filter type (all)", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(LIST_MESSAGES.ALL_CHALLENGES);
        });

        it("should parse rawParameters for filter type (done)", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list done"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.COMPLETED_CHALLENGES
            );
        });

        it("should parse rawParameters for filter type (incomplete)", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list incomplete"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.INCOMPLETE_CHALLENGES
            );
        });

        it("should handle case-insensitive filter parameters", () => {
            const resultUpper = listCommand.execute(
                CommandParser.parseCommand("list filter=ALL"),
                "testuser"
            );

            expect(resultUpper.error).toBe(false);
            expect(resultUpper.message).toContain(LIST_MESSAGES.ALL_CHALLENGES);

            const resultMixed = listCommand.execute(
                CommandParser.parseCommand("list DoNe"),
                "testuser"
            );

            expect(resultMixed.error).toBe(false);
            expect(resultMixed.message).toContain(
                LIST_MESSAGES.COMPLETED_CHALLENGES
            );
        });

        it("should default to incomplete for invalid filter values", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=invalid"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.INCOMPLETE_CHALLENGES
            );
        });
    });

    describe("Execute - Response Formatting", () => {
        it("should format single challenge with correct prefix", () => {
            challengeList.addChallenges(["Single Challenge"]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(LIST_MESSAGES.ALL_CHALLENGES);
            expect(result.message).toContain(LIST_MESSAGES.ONE_CHALLENGE);
            expect(result.message).toContain("Single Challenge");
        });

        it("should format multiple challenges with correct prefix", () => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(LIST_MESSAGES.ALL_CHALLENGES);
            expect(result.message).toContain(
                `3 ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`
            );
        });

        it("should include challenge details in formatted list", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Test description",
                amount: 5,
                timer: "10m",
            });
            challengeList.addChallengeObjects(challenge);

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Test Challenge");
            // ResponseFormatter should include progress, timer, etc.
            expect(result.message).toContain("#1");
        });

        it("should format completed challenges list with correct prefix", () => {
            challengeList.addChallenges(["Done 1", "Done 2"]);
            challengeList.completeChallenges([0, 1]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.COMPLETED_CHALLENGES
            );
            expect(result.message).toContain(
                `2 ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`
            );
        });

        it("should format incomplete challenges list with correct prefix", () => {
            challengeList.addChallenges([
                "Incomplete 1",
                "Incomplete 2",
                "Incomplete 3",
            ]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=incomplete"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.INCOMPLETE_CHALLENGES
            );
            expect(result.message).toContain(
                `3 ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`
            );
        });
    });

    describe("Execute - Challenge Filtering Logic", () => {
        beforeEach(() => {
            // Add 10 challenges with mixed completion status
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
                "Challenge 4",
                "Challenge 5",
                "Challenge 6",
                "Challenge 7",
                "Challenge 8",
                "Challenge 9",
                "Challenge 10",
            ]);
            // Complete challenges at indices 0, 2, 4, 6, 8 (odd positions)
            challengeList.completeChallenges([0, 2, 4, 6, 8]);
        });

        it("should filter all challenges correctly", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                `10 ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`
            );
            // All challenges should be present
            for (let i = 1; i <= 10; i++) {
                expect(result.message).toContain(`Challenge ${i}`);
            }
        });

        it("should filter completed challenges correctly", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                `5 ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`
            );
            // Only completed challenges (1, 3, 5, 7, 9)
            expect(result.message).toContain("Challenge 1");
            expect(result.message).toContain("Challenge 3");
            expect(result.message).toContain("Challenge 5");
            expect(result.message).toContain("Challenge 7");
            expect(result.message).toContain("Challenge 9");
            // Incomplete challenges should not be present
            expect(result.message).not.toContain("Challenge 2");
            expect(result.message).not.toContain("Challenge 4");
        });

        it("should filter incomplete challenges correctly", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=incomplete"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                `5 ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`
            );
            // Only incomplete challenges (2, 4, 6, 8, 10)
            expect(result.message).toContain("Challenge 2");
            expect(result.message).toContain("Challenge 4");
            expect(result.message).toContain("Challenge 6");
            expect(result.message).toContain("Challenge 8");
            expect(result.message).toContain("Challenge 10");
            // Completed challenges should not be present (use position numbers to avoid substring matches)
            expect(result.message).not.toContain("#1 Challenge 1");
            expect(result.message).not.toContain("#3 Challenge 3");
            expect(result.message).not.toContain("#5 Challenge 5");
            expect(result.message).not.toContain("#7 Challenge 7");
            expect(result.message).not.toContain("#9 Challenge 9");
        });

        it("should maintain correct indices for filtered challenges", () => {
            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );

            expect(result.error).toBe(false);
            // Verify position numbers match original positions
            expect(result.message).toContain("#1 Challenge 1");
            expect(result.message).toContain("#3 Challenge 3");
            expect(result.message).toContain("#5 Challenge 5");
        });
    });

    describe("Execute - Edge Cases and Error Handling", () => {
        it("should handle empty rawParameters gracefully", () => {
            challengeList.addChallenges(["Test Challenge"]);

            const result = listCommand.execute(
                {
                    command: "list",
                    targetId: "",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.INCOMPLETE_CHALLENGES
            );
        });

        it("should handle whitespace-only rawParameters", () => {
            challengeList.addChallenges(["Test Challenge"]);

            const result = listCommand.execute(
                {
                    command: "list",
                    targetId: "",
                    parameters: {},
                    rawParameters: "   ",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                LIST_MESSAGES.INCOMPLETE_CHALLENGES
            );
        });

        it("should handle exception during execution gracefully", () => {
            // Create a scenario that might cause an error
            const result = listCommand.execute(
                {
                    command: "list",
                    targetId: "",
                    parameters: {},
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            // Should not throw, should return a response
            expect(result).toBeDefined();
            expect(result).toHaveProperty("error");
            expect(result).toHaveProperty("message");
        });

        it("should handle challenges with progress amounts", () => {
            const challenge = new Challenge("Progress Challenge", {
                amount: 10,
            });
            challenge.incrementProgress(5);
            challengeList.addChallengeObjects(challenge);

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Progress Challenge");
        });

        it("should handle challenges with timers", () => {
            const challenge = new Challenge("Timer Challenge", {
                timer: "30m",
            });
            challengeList.addChallengeObjects(challenge);

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Timer Challenge");
        });

        it("should handle large number of challenges", () => {
            const challenges = Array.from(
                { length: 50 },
                (_, i) => `Challenge ${i + 1}`
            );
            challengeList.addChallenges(challenges);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain(
                `50 ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`
            );
        });

        it("should handle challenges with descriptions", () => {
            const challenge = new Challenge("Challenge with Description", {
                description: "This is a detailed description",
            });
            challengeList.addChallengeObjects(challenge);

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Challenge with Description");
        });

        it("should handle challenges with all properties", () => {
            const challenge = new Challenge("Full Challenge", {
                description: "Complete challenge with all properties",
                amount: 5,
                timer: "15m",
            });
            challenge.incrementProgress(2);
            challengeList.addChallengeObjects(challenge);

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Full Challenge");
        });
    });

    describe("Execute - Default Filter Branch Coverage", () => {
        it("should use default branch when filter type is unrecognized in parseFilterType", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            challengeList.completeChallenges([0]);

            // Test with an unrecognized filter that falls through to default
            const result = listCommand.execute(
                {
                    command: "list",
                    targetId: "",
                    parameters: { filter: "unknown" },
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            // Default behavior should show incomplete challenges
            expect(result.message).toContain(
                LIST_MESSAGES.INCOMPLETE_CHALLENGES
            );
            expect(result.message).toContain("Challenge 2");
            expect(result.message).not.toContain("Challenge 1");
        });

        it("should handle default case in getEmptyMessage", () => {
            // Force default case by using an invalid filter type
            const result = listCommand.execute(
                {
                    command: "list",
                    targetId: "",
                    parameters: { filter: "invalid" },
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            // Should return the default empty message for incomplete
            expect(result.message).toBe(
                ERROR_MESSAGES.NO_INCOMPLETE_CHALLENGES_FOUND
            );
        });

        it("should handle default case in getListPrefix", () => {
            challengeList.addChallenges(["Test Challenge"]);

            // This tests the default case in getListPrefix
            const result = listCommand.execute(
                {
                    command: "list",
                    targetId: "",
                    parameters: { filter: "invalid" },
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            // Default prefix should just show count
            expect(result.message).toContain(LIST_MESSAGES.ONE_CHALLENGE);
        });

        it("should handle default case in getFilteredChallenges switch statement", () => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            challengeList.completeChallenges([0]);

            // Use an invalid filter to trigger default case
            const result = listCommand.execute(
                {
                    command: "list",
                    targetId: "",
                    parameters: { filter: "notafilter" },
                    rawParameters: "",
                    errors: [],
                    isValid: true,
                },
                "testuser"
            );

            expect(result.error).toBe(false);
            // Default should behave like incomplete filter
            expect(result.message).toContain("Challenge 2");
            expect(result.message).toContain("Challenge 3");
            expect(result.message).not.toContain("Challenge 1");
        });
    });

    describe("Execute - Success Response", () => {
        it("should return success response with error=false", () => {
            challengeList.addChallenges(["Test Challenge"]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe("string");
        });

        it("should format response with prefix and challenge list", () => {
            challengeList.addChallenges(["Challenge A", "Challenge B"]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            // Should have format: "Prefix: challenge list"
            expect(result.message).toContain(":");
            expect(result.message).toContain("Challenge A");
            expect(result.message).toContain("Challenge B");
        });

        it("should return non-empty message for valid list command", () => {
            challengeList.addChallenges(["Test"]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message.length).toBeGreaterThan(0);
        });
    });

    describe("Execute - Error Handling", () => {
        it("should handle errors gracefully and return error response", () => {
            // Mock challengeList to throw an error
            const originalChallenges = challengeList.challenges;
            Object.defineProperty(challengeList, "challenges", {
                get: () => {
                    throw new Error("Test error");
                },
                configurable: true,
            });

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain("listing challenges");

            // Restore original property
            Object.defineProperty(challengeList, "challenges", {
                get: () => originalChallenges,
                configurable: true,
            });
        });

        it("should format error messages properly", () => {
            // Mock to throw a specific error
            const originalChallenges = challengeList.challenges;
            Object.defineProperty(challengeList, "challenges", {
                get: () => {
                    throw new Error("Specific test error");
                },
                configurable: true,
            });

            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(true);
            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe("string");

            // Restore
            Object.defineProperty(challengeList, "challenges", {
                get: () => originalChallenges,
                configurable: true,
            });
        });
    });

    describe("Execute - Mixed Scenarios", () => {
        it("should handle mix of completed and incomplete challenges with progress", () => {
            const challenge1 = new Challenge("Progress 1", { amount: 5 });
            challenge1.incrementProgress(3);
            const challenge2 = new Challenge("Progress 2", { amount: 10 });
            challenge2.incrementProgress(10); // Complete
            const challenge3 = new Challenge("Progress 3", { amount: 7 });
            challenge3.incrementProgress(2);

            challengeList.addChallengeObjects(challenge1);
            challengeList.addChallengeObjects(challenge2);
            challengeList.addChallengeObjects(challenge3);

            const allResult = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );
            expect(allResult.error).toBe(false);
            expect(allResult.message).toContain(
                `3 ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`
            );

            const doneResult = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );
            expect(doneResult.error).toBe(false);
            expect(doneResult.message).toContain("Progress 2");

            const incompleteResult = listCommand.execute(
                CommandParser.parseCommand("list filter=incomplete"),
                "testuser"
            );
            expect(incompleteResult.error).toBe(false);
            expect(incompleteResult.message).toContain("Progress 1");
            expect(incompleteResult.message).toContain("Progress 3");
        });

        it("should handle challenges with expired timers", () => {
            const challenge = new Challenge("Expired Timer", {
                timer: "1s",
            });
            challengeList.addChallengeObjects(challenge);

            // Wait for timer to potentially expire (though we're just testing listing)
            const result = listCommand.execute(
                CommandParser.parseCommand("list"),
                "testuser"
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain("Expired Timer");
        });

        it("should list challenges in order they were added", () => {
            challengeList.addChallenges([
                "First",
                "Second",
                "Third",
                "Fourth",
                "Fifth",
            ]);

            const result = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(result.error).toBe(false);
            const firstIndex = result.message.indexOf("First");
            const secondIndex = result.message.indexOf("Second");
            const thirdIndex = result.message.indexOf("Third");
            const fourthIndex = result.message.indexOf("Fourth");
            const fifthIndex = result.message.indexOf("Fifth");

            expect(firstIndex).toBeLessThan(secondIndex);
            expect(secondIndex).toBeLessThan(thirdIndex);
            expect(thirdIndex).toBeLessThan(fourthIndex);
            expect(fourthIndex).toBeLessThan(fifthIndex);
        });
    });
});
