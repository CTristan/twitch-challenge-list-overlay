import { beforeEach, describe, expect, it } from "vitest";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { HelpCommand } from "../../src/commands/HelpCommand";
import {
    ERROR_MESSAGES,
    HELP_MESSAGES,
} from "../../src/types/MessageConstants";

describe("HelpCommand", () => {
    let helpCommand: HelpCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        helpCommand = new HelpCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create HelpCommand instance with required dependencies", () => {
            expect(helpCommand).toBeInstanceOf(HelpCommand);
        });

        it("should inherit from BaseCommand", () => {
            expect(helpCommand).toHaveProperty("execute");
            expect(typeof helpCommand.execute).toBe("function");
        });
    });

    describe("execute - General Help", () => {
        it("should return general help when no parameters provided", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.GENERAL_HELP);
        });

        it("should return general help when rawParameters is empty string", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.GENERAL_HELP);
        });

        it("should return general help when rawParameters is whitespace only", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "   ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.GENERAL_HELP);
        });
    });

    describe("execute - Specific Command Help", () => {
        it("should return help for add command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "add",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
        });

        it("should return help for edit command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "edit",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.EDIT_COMMAND_HELP);
        });

        it("should return help for done command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "done",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.DONE_COMMAND_HELP);
        });

        it("should return help for complete command (alias for done)", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "complete",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.DONE_COMMAND_HELP);
        });

        it("should return help for fail command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "fail",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.FAIL_COMMAND_HELP);
        });

        it("should return help for delete command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "delete",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.DELETE_COMMAND_HELP);
        });

        it("should return help for remove command (alias for delete)", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "remove",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.DELETE_COMMAND_HELP);
        });

        it("should return help for increment command (+)", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "+",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.INCREMENT_COMMAND_HELP);
        });

        it("should return help for increment command (word)", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "increment",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.INCREMENT_COMMAND_HELP);
        });

        it("should return help for decrement command (-)", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "-",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.DECREMENT_COMMAND_HELP);
        });

        it("should return help for decrement command (word)", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "decrement",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.DECREMENT_COMMAND_HELP);
        });

        it("should return help for set command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "set",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.SET_COMMAND_HELP);
        });

        it("should return help for list command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "list",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.LIST_COMMAND_HELP);
        });

        it("should return help for show command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "show",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.SHOW_COMMAND_HELP);
        });

        it("should return help for clearall command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "clearall",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.CLEARALL_COMMAND_HELP);
        });

        it("should return help for cleardone command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "cleardone",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.CLEARDONE_COMMAND_HELP);
        });

        it("should return help for help command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "help",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.HELP_COMMAND_HELP);
        });
    });

    describe("execute - Case Insensitivity", () => {
        it("should handle uppercase command names", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "ADD",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
        });

        it("should handle mixed case command names", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "EdIt",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.EDIT_COMMAND_HELP);
        });

        it("should handle uppercase alias commands", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "COMPLETE",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.DONE_COMMAND_HELP);
        });
    });

    describe("execute - Parameter Parsing", () => {
        it("should parse command from parameters object", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: { command: "add" },
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
        });

        it("should prioritize parameters object over rawParameters", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: { command: "add" },
                    rawParameters: "edit",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.ADD_COMMAND_HELP);
        });

        it("should handle command parameter with uppercase", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: { command: "DELETE" },
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.DELETE_COMMAND_HELP);
        });

        it("should trim whitespace from rawParameters", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "  list  ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.LIST_COMMAND_HELP);
        });
    });

    describe("execute - Unknown Commands", () => {
        it("should return error message for unknown command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "unknown",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(
                ERROR_MESSAGES.UNKNOWN_COMMAND.replace("{command}", "unknown")
            );
        });

        it("should return error message for invalid command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "invalidcommand",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(
                ERROR_MESSAGES.UNKNOWN_COMMAND.replace(
                    "{command}",
                    "invalidcommand"
                )
            );
        });

        it("should return error message for numeric input", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "123",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(
                ERROR_MESSAGES.UNKNOWN_COMMAND.replace("{command}", "123")
            );
        });

        it("should return error message for special characters", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "!@#$",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(
                ERROR_MESSAGES.UNKNOWN_COMMAND.replace("{command}", "!@#$")
            );
        });
    });

    describe("execute - Error Handling", () => {
        it("should handle errors during execution", () => {
            // Mock the parseSpecificCommand method to throw an error
            const originalMethod = (helpCommand as any).parseSpecificCommand;
            (helpCommand as any).parseSpecificCommand = () => {
                throw new Error("Test error");
            };

            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "add",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Error providing help");
            expect(response.message).toContain("Test error");

            // Restore original method
            (helpCommand as any).parseSpecificCommand = originalMethod;
        });

        it("should handle non-Error exceptions", () => {
            // Mock the parseSpecificCommand method to throw a non-Error object
            const originalMethod = (helpCommand as any).parseSpecificCommand;
            (helpCommand as any).parseSpecificCommand = () => {
                throw "String error";
            };

            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "add",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Error providing help");

            // Restore original method
            (helpCommand as any).parseSpecificCommand = originalMethod;
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle null rawParameters", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: null as any,
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.GENERAL_HELP);
        });

        it("should handle undefined rawParameters", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: undefined as any,
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.GENERAL_HELP);
        });

        it("should handle empty parameters object", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.GENERAL_HELP);
        });

        it("should handle command with leading/trailing whitespace in parameters", () => {
            // Note: The implementation doesn't trim whitespace from parameters.command,
            // only from rawParameters. This test verifies the actual behavior.
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: { command: "  add  " },
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            // The command "  add  " (with spaces) is not recognized, so it returns unknown command error
            expect(response.message).toBe(
                ERROR_MESSAGES.UNKNOWN_COMMAND.replace("{command}", "  add  ")
            );
        });

        it("should handle multiple spaces in rawParameters", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "   edit   ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toBe(HELP_MESSAGES.EDIT_COMMAND_HELP);
        });
    });

    describe("Response Format", () => {
        it("should return CommandResponse with error=false for successful help", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response).toHaveProperty("error");
            expect(response).toHaveProperty("message");
            expect(response.error).toBe(false);
        });

        it("should return CommandResponse with error=false for unknown command", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "unknown",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response).toHaveProperty("error");
            expect(response).toHaveProperty("message");
            expect(response.error).toBe(false);
        });

        it("should not include uiUpdate in response", () => {
            const response = helpCommand.execute(
                {
                    command: "help",
                    parameters: {},
                    rawParameters: "add",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.uiUpdate).toBeUndefined();
        });
    });
});
