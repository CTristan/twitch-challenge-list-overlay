import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { DecrementCommand } from "../../src/commands/DecrementCommand";
import { IncrementCommand } from "../../src/commands/IncrementCommand";
import { SetCommand } from "../../src/commands/SetCommand";
import CommandParser from "../../src/utils/CommandParser";

describe("Progress Commands Parameter Parsing", () => {
    let challengeList: ChallengeList;
    let configManager: ConfigManager;
    let setCommand: SetCommand;
    let incrementCommand: IncrementCommand;
    let decrementCommand: DecrementCommand;

    beforeEach(() => {
        localStorage.clear();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        setCommand = new SetCommand(challengeList, configManager);
        incrementCommand = new IncrementCommand(challengeList, configManager);
        decrementCommand = new DecrementCommand(challengeList, configManager);
    });

    describe("SetCommand parameter parsing", () => {
        it("should correctly parse amount from 'set 1 5' command", () => {
            // Add a challenge first
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
                amount: 10,
            });
            challengeList.addChallengeObjects(challenge);

            // Parse the command
            const parsed = CommandParser.parseCommand("set 1 5");

            // Verify parsing
            expect(parsed.command).toBe("set");
            expect(parsed.targetId).toBe("1");
            expect(parsed.rawParameters).toBe("5");

            // Execute the command
            const response = setCommand.execute(parsed, "testuser");

            // Verify the command succeeded
            expect(response.error).toBe(false);
            expect(response.message).toContain("progress: 0/10 → 5/10");

            // Verify the challenge was updated
            const challenges = challengeList.getAllChallenges();
            expect(challenges[0]?.progress).toBe(5);
        });

        it("should correctly parse amount from 'set 2 15' command", () => {
            // Add two challenges
            const challenge1 = new Challenge("Challenge 1", {
                description: "Description 1",
                amount: 10,
            });
            const challenge2 = new Challenge("Challenge 2", {
                description: "Description 2",
                amount: 20,
            });
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Parse the command
            const parsed = CommandParser.parseCommand("set 2 15");

            // Verify parsing
            expect(parsed.command).toBe("set");
            expect(parsed.targetId).toBe("2");
            expect(parsed.rawParameters).toBe("15");

            // Execute the command
            const response = setCommand.execute(parsed, "testuser");

            // Verify the command succeeded
            expect(response.error).toBe(false);
            expect(response.message).toContain("progress: 0/20 → 15/20");

            // Verify the correct challenge was updated
            const challenges = challengeList.getAllChallenges();
            expect(challenges[0]?.progress).toBe(0); // First challenge unchanged
            expect(challenges[1]?.progress).toBe(15); // Second challenge updated
        });
    });

    describe("IncrementCommand parameter parsing", () => {
        it("should correctly parse amount from '+ 1 5' command", () => {
            // Add a challenge first
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
                amount: 10,
            });
            challengeList.addChallengeObjects(challenge);

            // Parse the command
            const parsed = CommandParser.parseCommand("+ 1 5");

            // Verify parsing
            expect(parsed.command).toBe("+");
            expect(parsed.targetId).toBe("1");
            expect(parsed.rawParameters).toBe("5");

            // Execute the command
            const response = incrementCommand.execute(parsed, "testuser");

            // Verify the command succeeded
            expect(response.error).toBe(false);
            expect(response.message).toContain("0 → 5");

            // Verify the challenge was updated
            const challenges = challengeList.getAllChallenges();
            expect(challenges[0]?.progress).toBe(5);
        });

        it("should correctly parse amount from '+ 2 3' command", () => {
            // Add two challenges
            const challenge1 = new Challenge("Challenge 1", {
                description: "Description 1",
                amount: 10,
            });
            const challenge2 = new Challenge("Challenge 2", {
                description: "Description 2",
                amount: 20,
            });
            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Parse the command
            const parsed = CommandParser.parseCommand("+ 2 3");

            // Verify parsing
            expect(parsed.command).toBe("+");
            expect(parsed.targetId).toBe("2");
            expect(parsed.rawParameters).toBe("3");

            // Execute the command
            const response = incrementCommand.execute(parsed, "testuser");

            // Verify the command succeeded
            expect(response.error).toBe(false);
            expect(response.message).toContain("0 → 3");

            // Verify the correct challenge was updated
            const challenges = challengeList.getAllChallenges();
            expect(challenges[0]?.progress).toBe(0); // First challenge unchanged
            expect(challenges[1]?.progress).toBe(3); // Second challenge updated
        });

        it("should default to increment by 1 when no amount specified", () => {
            // Add a challenge first
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
                amount: 10,
            });
            challengeList.addChallengeObjects(challenge);

            // Parse the command without amount
            const parsed = CommandParser.parseCommand("+ 1");

            // Verify parsing
            expect(parsed.command).toBe("+");
            expect(parsed.targetId).toBe("1");
            expect(parsed.rawParameters).toBe("");

            // Execute the command
            const response = incrementCommand.execute(parsed, "testuser");

            // Verify the command succeeded with default increment
            expect(response.error).toBe(false);
            expect(response.message).toContain("0 → 1");

            // Verify the challenge was updated
            const challenges = challengeList.getAllChallenges();
            expect(challenges[0]?.progress).toBe(1);
        });
    });

    describe("DecrementCommand parameter parsing", () => {
        it("should correctly parse amount from '- 1 3' command", () => {
            // Add a challenge with some progress
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
                amount: 10,
            });
            challengeList.addChallengeObjects(challenge);
            challengeList.incrementChallengeProgress(
                challengeList.getAllChallenges()[0]!.id,
                8
            ); // Set to 8

            // Parse the command
            const parsed = CommandParser.parseCommand("- 1 3");

            // Verify parsing
            expect(parsed.command).toBe("-");
            expect(parsed.targetId).toBe("1");
            expect(parsed.rawParameters).toBe("3");

            // Execute the command
            const response = decrementCommand.execute(parsed, "testuser");

            // Verify the command succeeded
            expect(response.error).toBe(false);
            expect(response.message).toContain("progress: 8/10 → 5/10");

            // Verify the challenge was updated
            const challenges = challengeList.getAllChallenges();
            expect(challenges[0]?.progress).toBe(5);
        });

        it("should correctly parse amount from '- 2 2' command", () => {
            // Add two challenges with progress
            const challenge1 = new Challenge("Challenge 1", {
                description: "Description 1",
                amount: 10,
            });
            const challenge2 = new Challenge("Challenge 2", {
                description: "Description 2",
                amount: 20,
            });
            challengeList.addChallengeObjects([challenge1, challenge2]);
            challengeList.incrementChallengeProgress(
                challengeList.getAllChallenges()[0]!.id,
                5
            );
            challengeList.incrementChallengeProgress(
                challengeList.getAllChallenges()[1]!.id,
                10
            );

            // Parse the command
            const parsed = CommandParser.parseCommand("- 2 2");

            // Verify parsing
            expect(parsed.command).toBe("-");
            expect(parsed.targetId).toBe("2");
            expect(parsed.rawParameters).toBe("2");

            // Execute the command
            const response = decrementCommand.execute(parsed, "testuser");

            // Verify the command succeeded
            expect(response.error).toBe(false);
            expect(response.message).toContain("progress: 10/20 → 8/20");

            // Verify the correct challenge was updated
            const challenges = challengeList.getAllChallenges();
            expect(challenges[0]?.progress).toBe(5); // First challenge unchanged
            expect(challenges[1]?.progress).toBe(8); // Second challenge updated
        });

        it("should default to decrement by 1 when no amount specified", () => {
            // Add a challenge with some progress
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
                amount: 10,
            });
            challengeList.addChallengeObjects(challenge);
            challengeList.incrementChallengeProgress(
                challengeList.getAllChallenges()[0]!.id,
                5
            );

            // Parse the command without amount
            const parsed = CommandParser.parseCommand("- 1");

            // Verify parsing
            expect(parsed.command).toBe("-");
            expect(parsed.targetId).toBe("1");
            expect(parsed.rawParameters).toBe("");

            // Execute the command
            const response = decrementCommand.execute(parsed, "testuser");

            // Verify the command succeeded with default decrement
            expect(response.error).toBe(false);
            expect(response.message).toContain("progress: 5/10 → 4/10");

            // Verify the challenge was updated
            const challenges = challengeList.getAllChallenges();
            expect(challenges[0]?.progress).toBe(4);
        });
    });

    describe("CommandParser integration", () => {
        it("should correctly extract targetId and rawParameters for progress commands", () => {
            const testCases = [
                {
                    input: "set 1 5",
                    expectedTargetId: "1",
                    expectedRawParams: "5",
                },
                {
                    input: "+ 2 10",
                    expectedTargetId: "2",
                    expectedRawParams: "10",
                },
                {
                    input: "- 3 7",
                    expectedTargetId: "3",
                    expectedRawParams: "7",
                },
                {
                    input: "set 1",
                    expectedTargetId: "1",
                    expectedRawParams: "",
                },
                { input: "+ 2", expectedTargetId: "2", expectedRawParams: "" },
                { input: "- 3", expectedTargetId: "3", expectedRawParams: "" },
            ];

            testCases.forEach(
                ({ input, expectedTargetId, expectedRawParams }) => {
                    const parsed = CommandParser.parseCommand(input);
                    expect(parsed.targetId).toBe(expectedTargetId);
                    expect(parsed.rawParameters).toBe(expectedRawParams);
                }
            );
        });
    });
});
