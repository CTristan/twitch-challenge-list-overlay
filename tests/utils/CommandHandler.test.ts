import { beforeEach, describe, expect, it, vi } from "vitest";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import CommandHandler from "../../src/utils/CommandHandler";
import CommandParser from "../../src/utils/CommandParser";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("CommandHandler", () => {
    let commandHandler: CommandHandler;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        ensureTestIsolation();
        challengeList = new ChallengeList("CommandHandlerTestStore");
        configManager = ConfigManager.getInstance();
        commandHandler = new CommandHandler(challengeList, configManager);
    });

    describe("Constructor", () => {
        it("should create CommandHandler with CommandRegistry", () => {
            expect(commandHandler).toBeDefined();
            expect(commandHandler).toBeInstanceOf(CommandHandler);
        });
    });

    describe("handleCommand - Non-ch Commands", () => {
        it("should return error for commands not starting with 'ch'", () => {
            const response = commandHandler.handleCommand(
                "testuser",
                "help", // Not starting with "ch"
                "some message",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe("");
        });

        it("should return error for completely different commands", () => {
            const response = commandHandler.handleCommand(
                "testuser",
                "randomcommand",
                "parameters",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe("");
        });

        it("should handle case insensitive 'ch' check", () => {
            const response = commandHandler.handleCommand(
                "testuser",
                "CH", // Uppercase should work
                "help",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });
    });

    describe("handleCommand - Invalid Command Parsing", () => {
        it("should handle invalid command parsing errors", () => {
            // Mock CommandParser to return invalid result
            const originalParseCommand = CommandParser.parseCommand;
            vi.spyOn(CommandParser, "parseCommand").mockReturnValue({
                command: "invalid",
                parameters: {},
                rawParameters: "invalid command",
                errors: ["Invalid parameter format", "Unknown command"],
                isValid: false,
            });

            const response = commandHandler.handleCommand(
                "testuser",
                "ch",
                "invalid command with errors",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe(
                "Invalid command: Invalid parameter format, Unknown command"
            );

            // Restore original method
            CommandParser.parseCommand = originalParseCommand;
        });

        it("should handle single parsing error", () => {
            // Mock CommandParser to return invalid result with single error
            const originalParseCommand = CommandParser.parseCommand;
            vi.spyOn(CommandParser, "parseCommand").mockReturnValue({
                command: "add",
                parameters: {},
                rawParameters: "add invalid",
                errors: ["Title cannot be empty"],
                isValid: false,
            });

            const response = commandHandler.handleCommand(
                "testuser",
                "ch",
                "add invalid",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe(
                "Invalid command: Title cannot be empty"
            );

            // Restore original method
            CommandParser.parseCommand = originalParseCommand;
        });
    });

    describe("handleCommand - Exception Handling", () => {
        it("should handle Error exceptions in try-catch block", () => {
            // Mock CommandParser to throw an Error
            const originalParseCommand = CommandParser.parseCommand;
            vi.spyOn(CommandParser, "parseCommand").mockImplementation(() => {
                throw new Error("Parser crashed");
            });

            const response = commandHandler.handleCommand(
                "testuser",
                "ch",
                "add test",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe("Error: Parser crashed");

            // Restore original method
            CommandParser.parseCommand = originalParseCommand;
        });

        it("should handle non-Error exceptions in try-catch block", () => {
            // Mock CommandParser to throw a string
            const originalParseCommand = CommandParser.parseCommand;
            vi.spyOn(CommandParser, "parseCommand").mockImplementation(() => {
                throw "String error thrown";
            });

            const response = commandHandler.handleCommand(
                "testuser",
                "ch",
                "add test",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe("Error: String error thrown");

            // Restore original method
            CommandParser.parseCommand = originalParseCommand;
        });

        it("should handle CommandRegistry throwing exception", () => {
            // Mock CommandRegistry.executeCommand to throw an error
            const originalExecuteCommand =
                commandHandler["commandRegistry"].executeCommand;
            commandHandler["commandRegistry"].executeCommand = vi.fn(() => {
                throw new Error("Registry execution failed");
            });

            const response = commandHandler.handleCommand(
                "testuser",
                "ch",
                "help",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe("Error: Registry execution failed");

            // Restore original method
            commandHandler["commandRegistry"].executeCommand =
                originalExecuteCommand;
        });
    });

    describe("handleCommand - Permission Handling", () => {
        it("should allow broadcaster commands", () => {
            const response = commandHandler.handleCommand(
                "broadcaster",
                "ch",
                "help",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });

        it("should allow moderator commands", () => {
            const response = commandHandler.handleCommand(
                "moderator",
                "ch",
                "help",
                { broadcaster: false, mod: true }
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });

        it("should silently ignore regular user commands", () => {
            const response = commandHandler.handleCommand(
                "regularuser",
                "ch",
                "help",
                { broadcaster: false, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe("");
        });
    });

    describe("handleCommand - Empty Command Handling", () => {
        it("should default to help for empty command", () => {
            const response = commandHandler.handleCommand(
                "testuser",
                "ch",
                "",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });

        it("should default to help for whitespace-only command", () => {
            const response = commandHandler.handleCommand(
                "testuser",
                "ch",
                "   \t  ",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });
    });

    describe("handleCommand - Unknown Command Handling", () => {
        it("should return help for unknown commands", () => {
            // Test with a command that normalizeCommand would return null for
            // We can test this by using a command that doesn't exist in the system
            const response = commandHandler.handleCommand(
                "testuser",
                "ch",
                "nonexistentcommand",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });
    });

    describe("isMod method", () => {
        it("should return true for broadcaster", () => {
            const response = commandHandler.handleCommand(
                "broadcaster",
                "ch",
                "help",
                { broadcaster: true, mod: false }
            );

            expect(response.error).toBe(false);
        });

        it("should return true for moderator", () => {
            const response = commandHandler.handleCommand(
                "moderator",
                "ch",
                "help",
                { broadcaster: false, mod: true }
            );

            expect(response.error).toBe(false);
        });

        it("should return true for broadcaster who is also mod", () => {
            const response = commandHandler.handleCommand(
                "broadcastermod",
                "ch",
                "help",
                { broadcaster: true, mod: true }
            );

            expect(response.error).toBe(false);
        });

        it("should return false for regular user", () => {
            const response = commandHandler.handleCommand(
                "regularuser",
                "ch",
                "help",
                { broadcaster: false, mod: false }
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe("");
        });
    });
});
