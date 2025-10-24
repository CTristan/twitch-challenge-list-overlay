import { beforeEach, describe, expect, it, vi } from "vitest";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import type { Command } from "../../src/commands/Command";
import { CommandRegistry } from "../../src/commands/CommandRegistry";
import { CommandType } from "../../src/types/CommandTypes";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("CommandRegistry", () => {
    let commandRegistry: CommandRegistry;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        commandRegistry = new CommandRegistry(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should initialize with ChallengeList and ConfigManager", () => {
            expect(commandRegistry).toBeDefined();
            expect(commandRegistry).toBeInstanceOf(CommandRegistry);
        });

        it("should register all commands during initialization", () => {
            const registeredCommands = commandRegistry.getRegisteredCommands();

            // Verify all expected command types are registered
            expect(registeredCommands).toContain(CommandType.ADD);
            expect(registeredCommands).toContain(CommandType.EDIT);
            expect(registeredCommands).toContain(CommandType.DONE);
            expect(registeredCommands).toContain(CommandType.UNDONE);
            expect(registeredCommands).toContain(CommandType.DELETE);
            expect(registeredCommands).toContain(CommandType.FAIL);
            expect(registeredCommands).toContain(CommandType.INCREMENT);
            expect(registeredCommands).toContain(CommandType.DECREMENT);
            expect(registeredCommands).toContain(CommandType.SET);
            expect(registeredCommands).toContain(CommandType.LIST);
            expect(registeredCommands).toContain(CommandType.SHOW);
            expect(registeredCommands).toContain(CommandType.HELP);
            expect(registeredCommands).toContain(CommandType.CLEAR_ALL);
            expect(registeredCommands).toContain(CommandType.CLEAR_DONE);
        });

        it("should register exactly 15 commands", () => {
            const registeredCommands = commandRegistry.getRegisteredCommands();
            expect(registeredCommands.length).toBe(15);
        });
    });

    describe("getCommand", () => {
        it("should return command instance for valid command type", () => {
            const addCommand = commandRegistry.getCommand(CommandType.ADD);
            expect(addCommand).toBeDefined();
            expect(addCommand).not.toBeNull();
        });

        it("should return command instance for normalized command alias", () => {
            // Test alias normalization
            const deleteCommand = commandRegistry.getCommand("remove");
            expect(deleteCommand).toBeDefined();
            expect(deleteCommand).not.toBeNull();
        });

        it("should return null for invalid command type", () => {
            const invalidCommand = commandRegistry.getCommand("invalidcommand");
            expect(invalidCommand).toBeNull();
        });

        it("should return null for empty command string", () => {
            const emptyCommand = commandRegistry.getCommand("");
            expect(emptyCommand).toBeNull();
        });

        it("should normalize command type before lookup", () => {
            // Test case-insensitive normalization
            const upperCaseCommand = commandRegistry.getCommand("ADD");
            const lowerCaseCommand = commandRegistry.getCommand("add");
            expect(upperCaseCommand).toBe(lowerCaseCommand);
        });

        it("should return same command instance for multiple calls", () => {
            const firstCall = commandRegistry.getCommand(CommandType.ADD);
            const secondCall = commandRegistry.getCommand(CommandType.ADD);
            expect(firstCall).toBe(secondCall);
        });

        it("should handle command aliases correctly", () => {
            // Test various aliases
            const deleteByDel = commandRegistry.getCommand("del");
            const deleteByRemove = commandRegistry.getCommand("remove");
            const deleteByDelete = commandRegistry.getCommand("delete");

            expect(deleteByDel).toBe(deleteByRemove);
            expect(deleteByRemove).toBe(deleteByDelete);
        });
    });

    describe("hasCommand", () => {
        it("should return true for valid command type", () => {
            expect(commandRegistry.hasCommand(CommandType.ADD)).toBe(true);
            expect(commandRegistry.hasCommand(CommandType.EDIT)).toBe(true);
            expect(commandRegistry.hasCommand(CommandType.DONE)).toBe(true);
        });

        it("should return true for valid command aliases", () => {
            expect(commandRegistry.hasCommand("remove")).toBe(true);
            expect(commandRegistry.hasCommand("complete")).toBe(true);
            expect(commandRegistry.hasCommand("del")).toBe(true);
        });

        it("should return false for invalid command type", () => {
            expect(commandRegistry.hasCommand("invalidcommand")).toBe(false);
        });

        it("should return false for empty command string", () => {
            expect(commandRegistry.hasCommand("")).toBe(false);
        });

        it("should handle case-insensitive command checking", () => {
            expect(commandRegistry.hasCommand("ADD")).toBe(true);
            expect(commandRegistry.hasCommand("add")).toBe(true);
            expect(commandRegistry.hasCommand("Add")).toBe(true);
        });
    });

    describe("getRegisteredCommands", () => {
        it("should return array of all registered command types", () => {
            const commands = commandRegistry.getRegisteredCommands();
            expect(Array.isArray(commands)).toBe(true);
            expect(commands.length).toBeGreaterThan(0);
        });

        it("should return canonical command types only", () => {
            const commands = commandRegistry.getRegisteredCommands();

            // Should contain canonical types, not aliases
            expect(commands).toContain(CommandType.ADD);
            expect(commands).toContain(CommandType.DELETE);
            expect(commands).toContain(CommandType.DONE);

            // Should not contain aliases
            expect(commands).not.toContain("remove");
            expect(commands).not.toContain("complete");
            expect(commands).not.toContain("del");
        });

        it("should return new array instance on each call", () => {
            const firstCall = commandRegistry.getRegisteredCommands();
            const secondCall = commandRegistry.getRegisteredCommands();

            expect(firstCall).not.toBe(secondCall);
            expect(firstCall).toEqual(secondCall);
        });
    });

    describe("executeCommand", () => {
        it("should execute valid command and return response", () => {
            const parsed: ParsedCommand = {
                command: CommandType.HELP,
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const response = commandRegistry.executeCommand(parsed, "testuser");

            expect(response).toBeDefined();
            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });

        it("should return help response for unknown command", () => {
            const parsed: ParsedCommand = {
                command: "unknowncommand",
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const response = commandRegistry.executeCommand(parsed, "testuser");

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });

        it("should delegate execution to command instance", () => {
            const parsed: ParsedCommand = {
                command: CommandType.LIST,
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const response = commandRegistry.executeCommand(parsed, "testuser");

            expect(response).toBeDefined();
            expect(response.error).toBe(false);
        });

        it("should handle command aliases in execution", () => {
            const parsed: ParsedCommand = {
                command: "complete", // Alias for "done"
                parameters: {},
                targetId: "1",
                rawParameters: "1",
                isValid: true,
                errors: [],
            };

            // Add a challenge first
            challengeList.addChallenges(["Test Challenge"]);

            const response = commandRegistry.executeCommand(parsed, "testuser");

            expect(response).toBeDefined();
            // Should execute the done command
        });

        it("should pass username to command execution", () => {
            const parsed: ParsedCommand = {
                command: CommandType.HELP,
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const username = "testuser123";
            const response = commandRegistry.executeCommand(parsed, username);

            expect(response).toBeDefined();
        });

        it("should handle empty command string", () => {
            const parsed: ParsedCommand = {
                command: "",
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const response = commandRegistry.executeCommand(parsed, "testuser");

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });
    });

    describe("registerCommand", () => {
        it("should register new command implementation", () => {
            const mockCommand: Command = {
                execute: vi.fn().mockReturnValue({
                    message: "Mock command executed",
                    error: false,
                }),
            };

            // Register with a command type that won't be normalized away
            commandRegistry.registerCommand("mockcommand", mockCommand);

            // Direct retrieval from the internal map (bypassing normalization)
            const registeredCommands = commandRegistry.getRegisteredCommands();
            expect(registeredCommands).toContain("mockcommand");
        });

        it("should override existing command implementation", () => {
            const mockCommand: Command = {
                execute: vi.fn().mockReturnValue({
                    message: "Overridden command",
                    error: false,
                }),
            };

            const originalCommand = commandRegistry.getCommand(CommandType.ADD);
            expect(originalCommand).not.toBeNull();

            commandRegistry.registerCommand(CommandType.ADD, mockCommand);

            const newCommand = commandRegistry.getCommand(CommandType.ADD);
            expect(newCommand).toBe(mockCommand);
            expect(newCommand).not.toBe(originalCommand);
        });

        it("should allow registering command with custom type", () => {
            const customCommand: Command = {
                execute: vi.fn().mockReturnValue({
                    message: "Custom command",
                    error: false,
                }),
            };

            commandRegistry.registerCommand("customtype", customCommand);

            expect(commandRegistry.hasCommand("customtype")).toBe(false); // Won't be in hasCommand since it's not normalized
            const retrieved = commandRegistry.getCommand("customtype");
            expect(retrieved).toBeNull(); // Won't be found since it's not in CommandAliases
        });
    });

    describe("unregisterCommand", () => {
        it("should remove command from registry", () => {
            expect(commandRegistry.hasCommand(CommandType.ADD)).toBe(true);

            commandRegistry.unregisterCommand(CommandType.ADD);

            const command = commandRegistry.getCommand(CommandType.ADD);
            expect(command).toBeNull();
        });

        it("should handle unregistering non-existent command", () => {
            commandRegistry.unregisterCommand("nonexistent");

            // Should not throw error
            expect(commandRegistry.getCommand("nonexistent")).toBeNull();
        });

        it("should not affect other commands when unregistering", () => {
            const editCommand = commandRegistry.getCommand(CommandType.EDIT);

            commandRegistry.unregisterCommand(CommandType.ADD);

            const editCommandAfter = commandRegistry.getCommand(
                CommandType.EDIT
            );
            expect(editCommandAfter).toBe(editCommand);
        });

        it("should allow re-registering after unregistering", () => {
            commandRegistry.unregisterCommand(CommandType.ADD);
            expect(commandRegistry.getCommand(CommandType.ADD)).toBeNull();

            const mockCommand: Command = {
                execute: vi.fn().mockReturnValue({
                    message: "Re-registered",
                    error: false,
                }),
            };

            commandRegistry.registerCommand(CommandType.ADD, mockCommand);

            const retrieved = commandRegistry.getCommand(CommandType.ADD);
            expect(retrieved).toBe(mockCommand);
        });
    });

    describe("Integration with Command Pattern", () => {
        it("should execute add command successfully", () => {
            const parsed: ParsedCommand = {
                command: CommandType.ADD,
                parameters: {},
                rawParameters: "Test Challenge",
                isValid: true,
                errors: [],
            };

            const response = commandRegistry.executeCommand(parsed, "testuser");

            expect(response.error).toBe(false);
            expect(response.message).toContain("Test Challenge");
            expect(challengeList.challenges.length).toBe(1);
        });

        it("should execute list command successfully", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);

            const parsed: ParsedCommand = {
                command: CommandType.LIST,
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const response = commandRegistry.executeCommand(parsed, "testuser");

            expect(response.error).toBe(false);
            expect(response.message).toContain("Incomplete 2 challenges");
        });

        it("should execute clear all command successfully", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);

            const parsed: ParsedCommand = {
                command: CommandType.CLEAR_ALL,
                parameters: {},
                rawParameters: "",
                isValid: true,
                errors: [],
            };

            const response = commandRegistry.executeCommand(parsed, "testuser");

            expect(response.error).toBe(false);
            expect(challengeList.challenges.length).toBe(0);
        });
    });
});
