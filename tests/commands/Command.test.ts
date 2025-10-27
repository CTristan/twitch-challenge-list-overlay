import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import {
    BaseCommand,
    type Command,
    ProgressOperation,
} from "../../src/commands/Command";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import type { CommandResponse } from "../../src/types/CommandResponse";
import { HELP_MESSAGES } from "../../src/types/MessageConstants";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";
import type { UIUpdateData } from "../../src/types/UIUpdateData";

/**
 * Concrete implementation of BaseCommand for testing purposes
 */
class TestCommand extends BaseCommand {
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        // Simple test implementation that returns the command name
        return this.createSuccessResponse(
            `Test command executed: ${parsed.command}`
        );
    }
}

/**
 * Test command that uses executeProgressOperation for testing
 */
class TestProgressCommand extends BaseCommand {
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        return this.executeProgressOperation<number>(
            parsed,
            ProgressOperation.INCREMENT,
            (p) => {
                const value = parseInt(p.parameters.amount || "1", 10);
                return isNaN(value) ? null : value;
            },
            (challenge, value) => {
                challenge.incrementProgress(value);
                return challenge;
            }
        );
    }
}

describe("Command Interface and BaseCommand", () => {
    let challengeList: ChallengeList;
    let configManager: ConfigManager;
    let testCommand: TestCommand;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();

        // Create test instances
        challengeList = new ChallengeList("testChallengeList");
        configManager = ConfigManager.getInstance();
        testCommand = new TestCommand(challengeList, configManager);
    });

    describe("ProgressOperation Enum", () => {
        it("should define INCREMENT operation", () => {
            expect(ProgressOperation.INCREMENT).toBe("increment");
        });

        it("should define DECREMENT operation", () => {
            expect(ProgressOperation.DECREMENT).toBe("decrement");
        });

        it("should define SET operation", () => {
            expect(ProgressOperation.SET).toBe("set");
        });
    });

    describe("Command Interface", () => {
        it("should define execute method signature", () => {
            const command: Command = testCommand;
            expect(typeof command.execute).toBe("function");
        });

        it("should execute command and return CommandResponse", () => {
            const parsed: ParsedCommand = {
                command: "test",
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const response = testCommand.execute(parsed, "testuser");
            expect(response).toHaveProperty("message");
            expect(response).toHaveProperty("error");
            expect(response.error).toBe(false);
        });
    });

    describe("BaseCommand Constructor", () => {
        it("should initialize with challengeList and configManager", () => {
            expect(testCommand["challengeList"]).toBe(challengeList);
            expect(testCommand["configManager"]).toBe(configManager);
        });

        it("should be abstract and require execute implementation", () => {
            // TypeScript enforces this at compile time, but we can verify the instance
            expect(testCommand.execute).toBeDefined();
            expect(typeof testCommand.execute).toBe("function");
        });
    });

    describe("findChallengeByPositionId", () => {
        beforeEach(() => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
        });

        it("should find challenge by valid position ID", () => {
            const challenge = testCommand["findChallengeByPositionId"]("1");
            expect(challenge).not.toBeNull();
            expect(challenge?.title).toBe("Challenge 1");
        });

        it("should return null for invalid position ID", () => {
            const challenge = testCommand["findChallengeByPositionId"]("99");
            expect(challenge).toBeNull();
        });

        it("should return null for non-numeric position ID", () => {
            const challenge = testCommand["findChallengeByPositionId"]("abc");
            expect(challenge).toBeNull();
        });

        it("should find challenge at different positions", () => {
            const challenge2 = testCommand["findChallengeByPositionId"]("2");
            const challenge3 = testCommand["findChallengeByPositionId"]("3");
            expect(challenge2?.title).toBe("Challenge 2");
            expect(challenge3?.title).toBe("Challenge 3");
        });
    });

    describe("findChallengeWithIndexByPositionId", () => {
        beforeEach(() => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
        });

        it("should find challenge and index by valid position ID", () => {
            const result =
                testCommand["findChallengeWithIndexByPositionId"]("1");
            expect(result).not.toBeNull();
            expect(result?.challenge.title).toBe("Challenge 1");
            expect(result?.index).toBe(0);
        });

        it("should return null for invalid position ID", () => {
            const result =
                testCommand["findChallengeWithIndexByPositionId"]("99");
            expect(result).toBeNull();
        });

        it("should return correct index for different positions", () => {
            const result2 =
                testCommand["findChallengeWithIndexByPositionId"]("2");
            const result3 =
                testCommand["findChallengeWithIndexByPositionId"]("3");
            expect(result2?.index).toBe(1);
            expect(result3?.index).toBe(2);
        });
    });

    describe("findChallengesByPositionIds", () => {
        beforeEach(() => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
        });

        it("should find multiple challenges by position IDs", () => {
            const challenges = testCommand["findChallengesByPositionIds"]([
                "1",
                "3",
            ]);
            expect(challenges.length).toBe(2);
            expect(challenges[0]?.title).toBe("Challenge 1");
            expect(challenges[1]?.title).toBe("Challenge 3");
        });

        it("should filter out invalid position IDs", () => {
            const challenges = testCommand["findChallengesByPositionIds"]([
                "1",
                "99",
                "2",
            ]);
            expect(challenges.length).toBe(2);
            expect(challenges[0]?.title).toBe("Challenge 1");
            expect(challenges[1]?.title).toBe("Challenge 2");
        });

        it("should return empty array for all invalid IDs", () => {
            const challenges = testCommand["findChallengesByPositionIds"]([
                "99",
                "100",
            ]);
            expect(challenges.length).toBe(0);
        });

        it("should return empty array for empty input", () => {
            const challenges = testCommand["findChallengesByPositionIds"]([]);
            expect(challenges.length).toBe(0);
        });
    });

    describe("parseTargetIds", () => {
        it("should parse single target ID", () => {
            const ids = testCommand["parseTargetIds"]("1");
            expect(ids).toEqual(["1"]);
        });

        it("should parse comma-separated target IDs", () => {
            const ids = testCommand["parseTargetIds"]("1,2,3");
            expect(ids).toEqual(["1", "2", "3"]);
        });

        it("should trim whitespace from IDs", () => {
            const ids = testCommand["parseTargetIds"]("1, 2 , 3");
            expect(ids).toEqual(["1", "2", "3"]);
        });

        it("should filter out empty strings", () => {
            const ids = testCommand["parseTargetIds"]("1,,3");
            expect(ids).toEqual(["1", "3"]);
        });

        it("should filter out invalid position IDs", () => {
            const ids = testCommand["parseTargetIds"]("1,abc,3");
            expect(ids).toEqual(["1", "3"]);
        });

        it("should return empty array for empty input", () => {
            const ids = testCommand["parseTargetIds"]("");
            expect(ids).toEqual([]);
        });
    });

    describe("validateTargetIds", () => {
        beforeEach(() => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
        });

        it("should validate all existing IDs", () => {
            const result = testCommand["validateTargetIds"](["1", "2", "3"]);
            expect(result.isValid).toBe(true);
            expect(result.found.length).toBe(3);
            expect(result.missing.length).toBe(0);
        });

        it("should identify missing IDs", () => {
            const result = testCommand["validateTargetIds"](["1", "99", "3"]);
            expect(result.isValid).toBe(false);
            expect(result.found.length).toBe(2);
            expect(result.missing).toEqual(["99"]);
        });

        it("should handle all missing IDs", () => {
            const result = testCommand["validateTargetIds"](["99", "100"]);
            expect(result.isValid).toBe(false);
            expect(result.found.length).toBe(0);
            expect(result.missing).toEqual(["99", "100"]);
        });

        it("should handle empty input", () => {
            const result = testCommand["validateTargetIds"]([]);
            expect(result.isValid).toBe(true);
            expect(result.found.length).toBe(0);
            expect(result.missing.length).toBe(0);
        });
    });

    describe("validateTargetIdsWithIndices", () => {
        beforeEach(() => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
        });

        it("should validate and return challenges with indices", () => {
            const result = testCommand["validateTargetIdsWithIndices"]([
                "1",
                "3",
            ]);
            expect(result.isValid).toBe(true);
            expect(result.found.length).toBe(2);
            expect(result.indices).toEqual([0, 2]);
            expect(result.missing.length).toBe(0);
        });

        it("should identify missing IDs with indices", () => {
            const result = testCommand["validateTargetIdsWithIndices"]([
                "1",
                "99",
                "2",
            ]);
            expect(result.isValid).toBe(false);
            expect(result.found.length).toBe(2);
            expect(result.indices).toEqual([0, 1]);
            expect(result.missing).toEqual(["99"]);
        });

        it("should handle all missing IDs", () => {
            const result = testCommand["validateTargetIdsWithIndices"]([
                "99",
                "100",
            ]);
            expect(result.isValid).toBe(false);
            expect(result.found.length).toBe(0);
            expect(result.indices.length).toBe(0);
            expect(result.missing).toEqual(["99", "100"]);
        });
    });

    describe("isChallengeLimitReached", () => {
        it("should return false when under limit", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            const isLimitReached = testCommand["isChallengeLimitReached"]();
            expect(isLimitReached).toBe(false);
        });

        it("should return true when at limit", () => {
            const maxChallenges = configManager.get("maxChallenges") || 10;
            for (let i = 0; i < maxChallenges; i++) {
                challengeList.addChallenges([`Challenge ${i + 1}`]);
            }
            const isLimitReached = testCommand["isChallengeLimitReached"]();
            expect(isLimitReached).toBe(true);
        });

        it("should return true when over limit", () => {
            const maxChallenges = configManager.get("maxChallenges") || 10;
            for (let i = 0; i < maxChallenges + 2; i++) {
                challengeList.addChallengeObjects(
                    new Challenge(`Challenge ${i + 1}`)
                );
            }
            const isLimitReached = testCommand["isChallengeLimitReached"]();
            expect(isLimitReached).toBe(true);
        });

        it("should use default limit of 10 when config is null", () => {
            // Mock configManager to return null
            const originalGet = configManager.get;
            configManager.get = vi.fn().mockReturnValue(null);

            for (let i = 0; i < 10; i++) {
                challengeList.addChallenges([`Challenge ${i + 1}`]);
            }
            const isLimitReached = testCommand["isChallengeLimitReached"]();
            expect(isLimitReached).toBe(true);

            // Restore original method
            configManager.get = originalGet;
        });
    });

    describe("getMaxChallenges", () => {
        it("should return configured max challenges", () => {
            const maxChallenges = testCommand["getMaxChallenges"]();
            expect(maxChallenges).toBe(10); // Default value
        });

        it("should return default of 10 when config is null", () => {
            const originalGet = configManager.get;
            configManager.get = vi.fn().mockReturnValue(null);

            const maxChallenges = testCommand["getMaxChallenges"]();
            expect(maxChallenges).toBe(10);

            configManager.get = originalGet;
        });
    });

    describe("createErrorResponse", () => {
        it("should create error response with message", () => {
            const response = testCommand["createErrorResponse"]("Test error");
            expect(response.error).toBe(true);
            expect(response.message).toBe("Test error");
            expect(response.uiUpdate).toBeUndefined();
        });

        it("should create error response with empty message", () => {
            const response = testCommand["createErrorResponse"]("");
            expect(response.error).toBe(true);
            expect(response.message).toBe("");
        });
    });

    describe("createSuccessResponse", () => {
        it("should create success response with message", () => {
            const response =
                testCommand["createSuccessResponse"]("Test success");
            expect(response.error).toBe(false);
            expect(response.message).toBe("Test success");
            expect(response.uiUpdate).toBeUndefined();
        });

        it("should create success response with empty message", () => {
            const response = testCommand["createSuccessResponse"]("");
            expect(response.error).toBe(false);
            expect(response.message).toBe("");
        });
    });

    describe("createSuccessResponseWithUIUpdate", () => {
        it("should create success response with UI update data", () => {
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.ADD,
                challengeIndices: [0],
                challenges: [new Challenge("Test")],
                updateTimers: true,
                updateCount: true,
            };

            const response = testCommand["createSuccessResponseWithUIUpdate"](
                "Test success",
                uiUpdate
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe("Test success");
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.ADD);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should include all UI update properties", () => {
            const challenge = new Challenge("Test Challenge");
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.EDIT,
                challengeIndices: [0, 1],
                challenges: [challenge],
                updateTimers: false,
                updateCount: false,
            };

            const response = testCommand["createSuccessResponseWithUIUpdate"](
                "Updated",
                uiUpdate
            );

            expect(response.uiUpdate?.challengeIndices).toEqual([0, 1]);
            expect(response.uiUpdate?.challenges).toEqual([challenge]);
        });
    });

    describe("handleMultipleTargets", () => {
        beforeEach(() => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
        });

        it("should return error when targetId is empty", () => {
            const result = testCommand["handleMultipleTargets"]("", "test");
            expect(result.response).toBeDefined();
            expect(result.response?.error).toBe(true);
            expect(result.response?.message).toContain("Target ID required");
            expect(result.challenges).toEqual([]);
            expect(result.indices).toEqual([]);
        });

        it("should return error when targetId format is invalid", () => {
            const result = testCommand["handleMultipleTargets"](
                "abc,xyz",
                "test"
            );
            expect(result.response).toBeDefined();
            expect(result.response?.error).toBe(true);
            expect(result.response?.message).toContain(
                "Invalid target ID format"
            );
            expect(result.challenges).toEqual([]);
            expect(result.indices).toEqual([]);
        });

        it("should return error when challenges not found", () => {
            const result = testCommand["handleMultipleTargets"](
                "1,99,100",
                "test"
            );
            expect(result.response).toBeDefined();
            expect(result.response?.error).toBe(true);
            expect(result.response?.message).toContain(
                "Challenge(s) not found"
            );
            expect(result.response?.message).toContain("99");
            expect(result.response?.message).toContain("100");
        });

        it("should return challenges and indices for valid IDs", () => {
            const result = testCommand["handleMultipleTargets"]("1,3", "test");
            expect(result.response).toBeUndefined();
            expect(result.challenges.length).toBe(2);
            expect(result.indices).toEqual([0, 2]);
            expect(result.challenges[0]?.title).toBe("Challenge 1");
            expect(result.challenges[1]?.title).toBe("Challenge 3");
        });

        it("should include operation name in error messages", () => {
            const result = testCommand["handleMultipleTargets"](
                "",
                "increment"
            );
            expect(result.response?.message).toContain("increment");
        });
    });

    describe("handleSingleTarget", () => {
        beforeEach(() => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
        });

        it("should return error when targetId is empty", () => {
            const result = testCommand["handleSingleTarget"]("", "test");
            expect(result.response).toBeDefined();
            expect(result.response?.error).toBe(true);
            expect(result.response?.message).toContain("Target ID required");
            expect(result.challenge).toBeNull();
        });

        it("should return error when challenge not found", () => {
            const result = testCommand["handleSingleTarget"]("99", "test");
            expect(result.response).toBeDefined();
            expect(result.response?.error).toBe(true);
            expect(result.response?.message).toContain(
                "Challenge #99 not found"
            );
            expect(result.challenge).toBeNull();
        });

        it("should return challenge and index for valid ID", () => {
            const result = testCommand["handleSingleTarget"]("2", "test");
            expect(result.response).toBeUndefined();
            expect(result.challenge).not.toBeNull();
            expect(result.challenge?.title).toBe("Challenge 2");
            expect(result.index).toBe(1);
        });

        it("should trim whitespace from targetId", () => {
            const result = testCommand["handleSingleTarget"]("  2  ", "test");
            expect(result.response).toBeUndefined();
            expect(result.challenge?.title).toBe("Challenge 2");
        });

        it("should include operation name in error messages", () => {
            const result = testCommand["handleSingleTarget"]("", "edit");
            expect(result.response?.message).toContain("edit");
        });
    });

    describe("executeProgressOperation", () => {
        let progressCommand: TestProgressCommand;

        beforeEach(() => {
            progressCommand = new TestProgressCommand(
                challengeList,
                configManager
            );
            const challenge = new Challenge("Test Challenge", { amount: 5 });
            challengeList.addChallengeObjects(challenge);
        });

        it("should execute progress operation successfully", () => {
            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "1",
                parameters: { amount: "2" },
                rawParameters: "1 2",
                isValid: true,
                errors: [],
            };

            const response = progressCommand.execute(parsed, "testuser");
            expect(response.error).toBe(false);
            expect(response.message).toContain("Challenge #1");
            expect(response.message).toContain("0/5 → 2/5");
            expect(response.uiUpdate).toBeDefined();
        });

        it("should return error when target ID is missing", () => {
            const parsed: ParsedCommand = {
                command: "increment",
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const response = progressCommand.execute(parsed, "testuser");
            expect(response.error).toBe(true);
            expect(response.message).toContain("Target ID required");
        });

        it("should return error when challenge not found", () => {
            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "99",
                parameters: {},
                rawParameters: "99",
                isValid: true,
                errors: [],
            };

            const response = progressCommand.execute(parsed, "testuser");
            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
        });

        it("should return error when parameter parsing fails", () => {
            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "1",
                parameters: { amount: "invalid" },
                rawParameters: "1 invalid",
                isValid: true,
                errors: [],
            };

            const response = progressCommand.execute(parsed, "testuser");
            expect(response.error).toBe(true);
            expect(response.message).toContain("Invalid parameters");
        });

        it("should use COMPLETE action when challenge becomes complete", () => {
            // Set up challenge with 4/5 progress
            const challenge = challengeList.challenges[0];
            if (challenge) {
                challenge.setProgress(4);
            }

            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "1",
                parameters: { amount: "1" },
                rawParameters: "1 1",
                isValid: true,
                errors: [],
            };

            const response = progressCommand.execute(parsed, "testuser");
            expect(response.error).toBe(false);
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.COMPLETE);
        });

        it("should use REVERT action when challenge becomes incomplete", () => {
            // Set up completed challenge
            const challenge = challengeList.challenges[0];
            if (challenge) {
                challenge.setProgress(5);
                challenge.setStatus(ChallengeStatus.COMPLETED);
            }

            // Create a decrement command
            const decrementCommand = new (class extends BaseCommand {
                execute(
                    parsed: ParsedCommand,
                    _username: string
                ): CommandResponse {
                    return this.executeProgressOperation<number>(
                        parsed,
                        ProgressOperation.DECREMENT,
                        (p) => {
                            const value = parseInt(
                                p.parameters.amount || "1",
                                10
                            );
                            return isNaN(value) ? null : value;
                        },
                        (challenge, value) => {
                            challenge.decrementProgress(value);
                            return challenge;
                        }
                    );
                }
            })(challengeList, configManager);

            const parsed: ParsedCommand = {
                command: "decrement",
                targetId: "1",
                parameters: { amount: "1" },
                rawParameters: "1 1",
                isValid: true,
                errors: [],
            };

            const response = decrementCommand.execute(parsed, "testuser");
            expect(response.error).toBe(false);
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.REVERT);
        });

        it("should use EDIT action when completion status unchanged", () => {
            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "1",
                parameters: { amount: "1" },
                rawParameters: "1 1",
                isValid: true,
                errors: [],
            };

            const response = progressCommand.execute(parsed, "testuser");
            expect(response.error).toBe(false);
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.EDIT);
        });

        it("should handle validator function", () => {
            const validatorCommand = new (class extends BaseCommand {
                execute(
                    parsed: ParsedCommand,
                    _username: string
                ): CommandResponse {
                    return this.executeProgressOperation<number>(
                        parsed,
                        ProgressOperation.SET,
                        (p) => {
                            const value = parseInt(
                                p.parameters.amount || "0",
                                10
                            );
                            return isNaN(value) ? null : value;
                        },
                        (challenge, value) => {
                            challenge.setProgress(value);
                            return challenge;
                        },
                        (value, _challenge) => {
                            if (value < 0) {
                                throw new Error("Value cannot be negative");
                            }
                        }
                    );
                }
            })(challengeList, configManager);

            const parsed: ParsedCommand = {
                command: "set",
                targetId: "1",
                parameters: { amount: "-1" },
                rawParameters: "1 -1",
                isValid: true,
                errors: [],
            };

            const response = validatorCommand.execute(parsed, "testuser");
            expect(response.error).toBe(true);
            expect(response.message).toContain("Value cannot be negative");
        });

        it("should use custom error message when provided", () => {
            const customErrorCommand = new (class extends BaseCommand {
                execute(
                    parsed: ParsedCommand,
                    _username: string
                ): CommandResponse {
                    return this.executeProgressOperation<number>(
                        parsed,
                        ProgressOperation.INCREMENT,
                        (_p) => null, // Always fail parsing
                        (challenge, _value) => challenge,
                        undefined,
                        "Custom error message for parsing failure"
                    );
                }
            })(challengeList, configManager);

            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "1",
                parameters: {},
                rawParameters: "1",
                isValid: true,
                errors: [],
            };

            const response = customErrorCommand.execute(parsed, "testuser");
            expect(response.error).toBe(true);
            expect(response.message).toBe(
                "Custom error message for parsing failure"
            );
        });

        it("should handle mutation failure", () => {
            const failingMutationCommand = new (class extends BaseCommand {
                execute(
                    parsed: ParsedCommand,
                    _username: string
                ): CommandResponse {
                    return this.executeProgressOperation<number>(
                        parsed,
                        ProgressOperation.INCREMENT,
                        (p) => {
                            const value = parseInt(
                                p.parameters.amount || "1",
                                10
                            );
                            return isNaN(value) ? null : value;
                        },
                        (_challenge, _value) => null // Mutation fails
                    );
                }
            })(challengeList, configManager);

            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "1",
                parameters: { amount: "1" },
                rawParameters: "1 1",
                isValid: true,
                errors: [],
            };

            const response = failingMutationCommand.execute(parsed, "testuser");
            expect(response.error).toBe(true);
            expect(response.message).toContain(
                "Failed to increment challenge progress"
            );
        });

        it("should handle unexpected errors during execution", () => {
            const errorThrowingCommand = new (class extends BaseCommand {
                execute(
                    parsed: ParsedCommand,
                    _username: string
                ): CommandResponse {
                    return this.executeProgressOperation<number>(
                        parsed,
                        ProgressOperation.INCREMENT,
                        (_p) => {
                            throw new Error("Unexpected parsing error");
                        },
                        (challenge, _value) => challenge
                    );
                }
            })(challengeList, configManager);

            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "1",
                parameters: {},
                rawParameters: "1",
                isValid: true,
                errors: [],
            };

            const response = errorThrowingCommand.execute(parsed, "testuser");
            expect(response.error).toBe(true);
            expect(response.message).toContain(
                "incrementing challenge progress"
            );
        });

        it("should include UI update data with correct properties", () => {
            const parsed: ParsedCommand = {
                command: "increment",
                targetId: "1",
                parameters: { amount: "1" },
                rawParameters: "1 1",
                isValid: true,
                errors: [],
            };

            const response = progressCommand.execute(parsed, "testuser");
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.challengeIndices).toEqual([0]);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
            expect(response.uiUpdate?.challenges).toBeDefined();
            expect(response.uiUpdate?.challenges?.length).toBe(1);
        });
    });

    describe("getCommandHelp", () => {
        it("should return help for add command", () => {
            const help = testCommand["getCommandHelp"]("add");
            expect(help).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
        });

        it("should return help for edit command", () => {
            const help = testCommand["getCommandHelp"]("edit");
            expect(help).toBe(HELP_MESSAGES.EDIT_COMMAND_HELP);
        });

        it("should return help for done command", () => {
            const help = testCommand["getCommandHelp"]("done");
            expect(help).toBe(HELP_MESSAGES.DONE_COMMAND_HELP);
        });

        it("should return help for complete alias", () => {
            const help = testCommand["getCommandHelp"]("complete");
            expect(help).toBe(HELP_MESSAGES.DONE_COMMAND_HELP);
        });

        it("should return help for fail command", () => {
            const help = testCommand["getCommandHelp"]("fail");
            expect(help).toBe(HELP_MESSAGES.FAIL_COMMAND_HELP);
        });

        it("should return help for delete command", () => {
            const help = testCommand["getCommandHelp"]("delete");
            expect(help).toBe(HELP_MESSAGES.DELETE_COMMAND_HELP);
        });

        it("should return help for remove alias", () => {
            const help = testCommand["getCommandHelp"]("remove");
            expect(help).toBe(HELP_MESSAGES.DELETE_COMMAND_HELP);
        });

        it("should return help for increment command", () => {
            const help = testCommand["getCommandHelp"]("+");
            expect(help).toBe(HELP_MESSAGES.INCREMENT_COMMAND_HELP);
        });

        it("should return help for increment alias", () => {
            const help = testCommand["getCommandHelp"]("increment");
            expect(help).toBe(HELP_MESSAGES.INCREMENT_COMMAND_HELP);
        });

        it("should return help for decrement command", () => {
            const help = testCommand["getCommandHelp"]("-");
            expect(help).toBe(HELP_MESSAGES.DECREMENT_COMMAND_HELP);
        });

        it("should return help for decrement alias", () => {
            const help = testCommand["getCommandHelp"]("decrement");
            expect(help).toBe(HELP_MESSAGES.DECREMENT_COMMAND_HELP);
        });

        it("should return help for set command", () => {
            const help = testCommand["getCommandHelp"]("set");
            expect(help).toBe(HELP_MESSAGES.SET_COMMAND_HELP);
        });

        it("should return help for list command", () => {
            const help = testCommand["getCommandHelp"]("list");
            expect(help).toBe(HELP_MESSAGES.LIST_COMMAND_HELP);
        });

        it("should return help for show command", () => {
            const help = testCommand["getCommandHelp"]("show");
            expect(help).toBe(HELP_MESSAGES.SHOW_COMMAND_HELP);
        });

        it("should return help for clearall command", () => {
            const help = testCommand["getCommandHelp"]("clearall");
            expect(help).toBe(HELP_MESSAGES.CLEARALL_COMMAND_HELP);
        });

        it("should return help for cleardone command", () => {
            const help = testCommand["getCommandHelp"]("cleardone");
            expect(help).toBe(HELP_MESSAGES.CLEARDONE_COMMAND_HELP);
        });

        it("should return help for help command", () => {
            const help = testCommand["getCommandHelp"]("help");
            expect(help).toBe(HELP_MESSAGES.HELP_COMMAND_HELP);
        });

        it("should return unknown command message for invalid command", () => {
            const help = testCommand["getCommandHelp"]("invalidcommand");
            expect(help).toContain("Unknown command");
            expect(help).toContain("invalidcommand");
        });

        it("should handle empty command name", () => {
            const help = testCommand["getCommandHelp"]("");
            expect(help).toContain("Unknown command");
        });
    });
});
