import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../src/classes/Challenge";
import ChallengeList from "../src/classes/ChallengeList";
import ConfigManager from "../src/classes/ConfigManager";
import { AddCommand } from "../src/commands/AddCommand";
import { HELP_MESSAGES } from "../src/types/MessageConstants";
import { UIUpdateAction } from "../src/types/UIUpdateAction";

describe("AddCommand", () => {
    let challengeList: ChallengeList;
    let configManager: ConfigManager;
    let addCommand: AddCommand;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();

        // Create test instances
        challengeList = new ChallengeList("testChallengeList");
        configManager = ConfigManager.getInstance();
        addCommand = new AddCommand(challengeList, configManager);
    });

    describe("execute - Challenge Limit", () => {
        it("should return error when challenge limit is reached", () => {
            // Add challenges up to the limit (default is 10)
            const maxChallenges = configManager.get("maxChallenges") || 10;
            for (let i = 0; i < maxChallenges; i++) {
                challengeList.addChallengeObjects(
                    new Challenge(`Challenge ${i + 1}`)
                );
            }

            // Try to add one more challenge
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Test Challenge"' },
                    rawParameters: '"Test Challenge"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Maximum number of challenges");
            expect(response.message).toContain(String(maxChallenges));
        });

        it("should add challenge when under limit", () => {
            // Add one challenge when list is empty
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Test Challenge"' },
                    rawParameters: '"Test Challenge"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Test Challenge");
            expect(response.message).toContain("added!");
            expect(challengeList.challenges.length).toBe(1);
        });
    });

    describe("execute - No Arguments", () => {
        it("should return usage message when no arguments provided", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
        });
    });

    describe("execute - Title Extraction", () => {
        it("should extract title from parameters.title", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Valid Title"' },
                    rawParameters: '"Valid Title"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Valid Title");
            expect(challengeList.challenges[0]?.title).toBe("Valid Title");
        });

        it("should extract title from rawParameters fallback", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: {},
                    rawParameters: "Simple Title",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Simple Title");
            expect(challengeList.challenges[0]?.title).toBe("Simple Title");
        });

        it("should return error for title that is too long", () => {
            // Create a title longer than 100 characters (the max length)
            const longTitle = "A".repeat(101);

            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: `"${longTitle}"` },
                    rawParameters: `"${longTitle}"`,
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should return error for empty title", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '""' },
                    rawParameters: '""',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
            expect(challengeList.challenges.length).toBe(0);
        });
    });

    describe("execute - Description Extraction", () => {
        it("should add challenge with valid description", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: {
                        title: '"Test Challenge"',
                        desc: '"Test Description"',
                    },
                    rawParameters: '"Test Challenge" desc="Test Description"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.description).toBe(
                "Test Description"
            );
        });

        it("should add challenge with empty description when not specified", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Test Challenge"' },
                    rawParameters: '"Test Challenge"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.description).toBe("");
        });

        it("should handle invalid description gracefully by using empty string", () => {
            // Create a description longer than 500 characters (the max length)
            const longDesc = "A".repeat(501);

            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: {
                        title: '"Test Challenge"',
                        desc: `"${longDesc}"`,
                    },
                    rawParameters: `"Test Challenge" desc="${longDesc}"`,
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should still succeed but with empty description
            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.description).toBe("");
        });
    });

    describe("execute - Amount Extraction", () => {
        it("should add challenge with valid amount", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Test Challenge"', amount: "5" },
                    rawParameters: '"Test Challenge" amount=5',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.amount).toBe(5);
            expect(response.message).toContain("0/5");
        });

        it("should use default amount (1) when not specified", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Test Challenge"' },
                    rawParameters: '"Test Challenge"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.amount).toBe(1);
        });

        it("should use default amount (1) for invalid amount", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: {
                        title: '"Test Challenge"',
                        amount: "invalid",
                    },
                    rawParameters: '"Test Challenge" amount=invalid',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.amount).toBe(1);
        });
    });

    describe("execute - Timer Extraction", () => {
        it("should add challenge with timer and start it", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Timed Challenge"', timer: "5m" },
                    rawParameters: '"Timed Challenge" timer=5m',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            const challenge = challengeList.challenges[0];
            expect(challenge?.timer).toBeDefined();
            expect(challenge?.timer?.isActive).toBe(true);
            expect(response.message).toContain("timer started");
        });

        it("should add challenge without timer when not specified", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"No Timer Challenge"' },
                    rawParameters: '"No Timer Challenge"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            const challenge = challengeList.challenges[0];
            expect(challenge?.timer).toBeUndefined();
            expect(response.message).not.toContain("timer started");
        });

        it("should handle timer parameter correctly", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Timer Test"', timer: "10s" },
                    rawParameters: '"Timer Test" timer=10s',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            const challenge = challengeList.challenges[0];
            expect(challenge?.timer).toBeDefined();
            expect(challenge?.timer?.duration).toBe(10);
        });
    });

    describe("execute - Integration Tests", () => {
        it("should create challenge with all parameters", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: {
                        title: '"Complete Challenge"',
                        desc: '"Full description"',
                        amount: "10",
                        timer: "30m",
                    },
                    rawParameters:
                        '"Complete Challenge" desc="Full description" amount=10 timer=30m',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            const challenge = challengeList.challenges[0];
            expect(challenge?.title).toBe("Complete Challenge");
            expect(challenge?.description).toBe("Full description");
            expect(challenge?.amount).toBe(10);
            expect(challenge?.timer).toBeDefined();
            expect(challenge?.timer?.isActive).toBe(true);
        });

        it("should verify UI update data structure", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"UI Test"' },
                    rawParameters: '"UI Test"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.ADD);
            expect(response.uiUpdate?.challengeIndices).toEqual([0]);
            expect(response.uiUpdate?.challenges).toHaveLength(1);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should verify response formatting", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Format Test"', amount: "3" },
                    rawParameters: '"Format Test" amount=3',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("[#1]"); // Short ID
            expect(response.message).toContain("Format Test"); // Title
            expect(response.message).toContain("0/3"); // Progress
            expect(response.message).toContain("added!"); // Success message
        });

        it("should handle Challenge constructor errors", () => {
            // Create a challenge with invalid title to trigger constructor error
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: `"${"A".repeat(101)}"` }, // Title too long
                    rawParameters: `"${"A".repeat(101)}"`,
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should return error message (usage help)
            expect(response.error).toBe(true);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
        });
    });

    describe("execute - Error Handling", () => {
        it("should handle unexpected errors in try-catch", () => {
            // Mock challengeList.addChallengeObjects to throw an error
            vi.spyOn(challengeList, "addChallengeObjects").mockImplementation(
                () => {
                    throw new Error("Unexpected error");
                }
            );

            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Error Test"' },
                    rawParameters: '"Error Test"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("creating challenge");
            expect(response.message).toContain("Unexpected error");

            vi.restoreAllMocks();
        });

        it("should format error messages correctly", () => {
            // Mock to throw a non-Error object
            vi.spyOn(challengeList, "addChallengeObjects").mockImplementation(
                () => {
                    throw "String error";
                }
            );

            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Error Test"' },
                    rawParameters: '"Error Test"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("creating challenge");

            vi.restoreAllMocks();
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle whitespace-only title gracefully", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"   "' },
                    rawParameters: '"   "',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
        });

        it("should handle negative amount gracefully", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Test"', amount: "-5" },
                    rawParameters: '"Test" amount=-5',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should use default amount (1) for invalid negative amount
            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.amount).toBe(1);
        });

        it("should handle zero amount gracefully", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Test"', amount: "0" },
                    rawParameters: '"Test" amount=0',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Should use default amount (1) for invalid zero amount
            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.amount).toBe(1);
        });

        it("should handle very large amount correctly", () => {
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Test"', amount: "99999" },
                    rawParameters: '"Test" amount=99999',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Large amounts are valid (no maximum constraint in ValidationUtils)
            expect(response.error).toBe(false);
            expect(challengeList.challenges[0]?.amount).toBe(99999);
        });

        it("should correctly index challenges when multiple exist", () => {
            // Add first challenge
            addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"First"' },
                    rawParameters: '"First"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // Add second challenge
            const response = addCommand.execute(
                {
                    command: "add",
                    parameters: { title: '"Second"' },
                    rawParameters: '"Second"',
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("[#2]"); // Second challenge should have index 1, display position 2
            expect(challengeList.challenges.length).toBe(2);
        });
    });
});
