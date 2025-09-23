import { beforeEach, describe, expect, it } from "vitest";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { ListCommand } from "../../src/commands/ListCommand";
import CommandParser from "../../src/utils/CommandParser";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("ListCommand Position Numbering", () => {
    let listCommand: ListCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        listCommand = new ListCommand(challengeList, configManager);
    });

    describe("Position numbering consistency", () => {
        it("should maintain original position numbers in filtered lists", () => {
            // Add 5 challenges
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
                "Challenge 4",
                "Challenge 5",
            ]);

            // Complete challenges at positions 2 and 4 (indices 1 and 3)
            challengeList.completeChallenges([1, 3]);

            // Test completed challenges list
            const doneResponse = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );

            expect(doneResponse.error).toBe(false);
            expect(doneResponse.message).toContain("Completed 2 challenges");
            // Should show #2 and #4, not #1 and #2
            expect(doneResponse.message).toContain("#2 Challenge 2");
            expect(doneResponse.message).toContain("#4 Challenge 4");
            expect(doneResponse.message).not.toContain("#1 Challenge 2");
            expect(doneResponse.message).not.toContain("#3 Challenge 4");
        });

        it("should maintain original position numbers for incomplete challenges", () => {
            // Add 5 challenges
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
                "Challenge 4",
                "Challenge 5",
            ]);

            // Complete challenges at positions 2 and 4 (indices 1 and 3)
            challengeList.completeChallenges([1, 3]);

            // Test incomplete challenges list
            const incompleteResponse = listCommand.execute(
                CommandParser.parseCommand("list filter=incomplete"),
                "testuser"
            );

            expect(incompleteResponse.error).toBe(false);
            expect(incompleteResponse.message).toContain(
                "Incomplete 3 challenges"
            );
            // Should show #1, #3, #5, not #1, #2, #3
            expect(incompleteResponse.message).toContain("#1 Challenge 1");
            expect(incompleteResponse.message).toContain("#3 Challenge 3");
            expect(incompleteResponse.message).toContain("#5 Challenge 5");
        });

        it("should show sequential numbering for 'all' filter", () => {
            // Add 3 challenges
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);

            // Complete one challenge
            challengeList.completeChallenges([1]);

            // Test all challenges list
            const allResponse = listCommand.execute(
                CommandParser.parseCommand("list filter=all"),
                "testuser"
            );

            expect(allResponse.error).toBe(false);
            expect(allResponse.message).toContain("All 3 challenges");
            expect(allResponse.message).toContain("#1 Challenge 1");
            expect(allResponse.message).toContain("#2 Challenge 2");
            expect(allResponse.message).toContain("#3 Challenge 3");
        });

        it("should handle edge case with only one completed challenge", () => {
            // Add 3 challenges
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);

            // Complete only the middle challenge (index 1)
            challengeList.completeChallenges([1]);

            // Test completed challenges list
            const doneResponse = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );

            expect(doneResponse.error).toBe(false);
            expect(doneResponse.message).toContain("Completed 1 challenge");
            // Should show #2, not #1
            expect(doneResponse.message).toContain("#2 Challenge 2");
            expect(doneResponse.message).not.toContain("#1 Challenge 2");
        });

        it("should handle sparse completion pattern correctly", () => {
            // Add 7 challenges
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
                "Challenge 4",
                "Challenge 5",
                "Challenge 6",
                "Challenge 7",
            ]);

            // Complete challenges at positions 1, 3, 5, 7 (indices 0, 2, 4, 6)
            challengeList.completeChallenges([0, 2, 4, 6]);

            // Test completed challenges list
            const doneResponse = listCommand.execute(
                CommandParser.parseCommand("list filter=done"),
                "testuser"
            );

            expect(doneResponse.error).toBe(false);
            expect(doneResponse.message).toContain("Completed 4 challenges");
            // Should show original positions #1, #3, #5, #7
            expect(doneResponse.message).toContain("#1 Challenge 1");
            expect(doneResponse.message).toContain("#3 Challenge 3");
            expect(doneResponse.message).toContain("#5 Challenge 5");
            expect(doneResponse.message).toContain("#7 Challenge 7");

            // Test incomplete challenges list
            const incompleteResponse = listCommand.execute(
                CommandParser.parseCommand("list filter=incomplete"),
                "testuser"
            );

            expect(incompleteResponse.error).toBe(false);
            expect(incompleteResponse.message).toContain(
                "Incomplete 3 challenges"
            );
            // Should show original positions #2, #4, #6
            expect(incompleteResponse.message).toContain("#2 Challenge 2");
            expect(incompleteResponse.message).toContain("#4 Challenge 4");
            expect(incompleteResponse.message).toContain("#6 Challenge 6");
        });
    });
});
