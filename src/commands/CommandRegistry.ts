import ChallengeList from "../classes/ChallengeList";
import ConfigManager from "../classes/ConfigManager";
import { CommandType, normalizeCommand } from "../types/CommandTypes";
import { AddCommand } from "./AddCommand";
import { CheckCommand } from "./CheckCommand";
import { ClearAllCommand } from "./ClearAllCommand";
import { ClearDoneCommand } from "./ClearDoneCommand";
import type { Command } from "./Command";
import { DecrementCommand } from "./DecrementCommand";
import { DeleteCommand } from "./DeleteCommand";
import { DoneCommand } from "./DoneCommand";
import { EditCommand } from "./EditCommand";
import { FailCommand } from "./FailCommand";
import { HelpCommand } from "./HelpCommand";
import { IncrementCommand } from "./IncrementCommand";
import { ListCommand } from "./ListCommand";
import { SetCommand } from "./SetCommand";
import { ShowCommand } from "./ShowCommand";
import { UndoneCommand } from "./UndoneCommand";

/**
 * Registry for managing command implementations
 * Provides centralized command routing and instantiation
 */
export class CommandRegistry {
    private commands: Map<string, Command> = new Map();
    private challengeList: ChallengeList;
    private configManager: ConfigManager;

    constructor(challengeList: ChallengeList, configManager: ConfigManager) {
        this.challengeList = challengeList;
        this.configManager = configManager;
        this.initializeCommands();
    }

    /**
     * Initialize all command implementations
     */
    private initializeCommands(): void {
        // Create command instances
        const addCommand = new AddCommand(
            this.challengeList,
            this.configManager
        );
        const editCommand = new EditCommand(
            this.challengeList,
            this.configManager
        );
        const doneCommand = new DoneCommand(
            this.challengeList,
            this.configManager
        );
        const undoneCommand = new UndoneCommand(
            this.challengeList,
            this.configManager
        );
        const deleteCommand = new DeleteCommand(
            this.challengeList,
            this.configManager
        );
        const failCommand = new FailCommand(
            this.challengeList,
            this.configManager
        );
        const incrementCommand = new IncrementCommand(
            this.challengeList,
            this.configManager
        );
        const decrementCommand = new DecrementCommand(
            this.challengeList,
            this.configManager
        );
        const setCommand = new SetCommand(
            this.challengeList,
            this.configManager
        );
        const listCommand = new ListCommand(
            this.challengeList,
            this.configManager
        );
        const showCommand = new ShowCommand(
            this.challengeList,
            this.configManager
        );
        const checkCommand = new CheckCommand(
            this.challengeList,
            this.configManager
        );
        const helpCommand = new HelpCommand(
            this.challengeList,
            this.configManager
        );
        const clearAllCommand = new ClearAllCommand(
            this.challengeList,
            this.configManager
        );
        const clearDoneCommand = new ClearDoneCommand(
            this.challengeList,
            this.configManager
        );

        // Register commands by their canonical types
        this.commands.set(CommandType.ADD, addCommand);
        this.commands.set(CommandType.EDIT, editCommand);
        this.commands.set(CommandType.DONE, doneCommand);
        this.commands.set(CommandType.UNDONE, undoneCommand);
        this.commands.set(CommandType.DELETE, deleteCommand);
        this.commands.set(CommandType.FAIL, failCommand);
        this.commands.set(CommandType.INCREMENT, incrementCommand);
        this.commands.set(CommandType.DECREMENT, decrementCommand);
        this.commands.set(CommandType.SET, setCommand);
        this.commands.set(CommandType.LIST, listCommand);
        this.commands.set(CommandType.SHOW, showCommand);
        this.commands.set(CommandType.CHECK, checkCommand);
        this.commands.set(CommandType.HELP, helpCommand);
        this.commands.set(CommandType.CLEAR_ALL, clearAllCommand);
        this.commands.set(CommandType.CLEAR_DONE, clearDoneCommand);
    }

    /**
     * Get command implementation for a given command type
     * @param commandType - Command type (normalized)
     * @returns Command implementation or null if not found
     */
    getCommand(commandType: string): Command | null {
        // Normalize the command type first
        const normalizedType = normalizeCommand(commandType);
        if (!normalizedType) {
            return null;
        }
        return this.commands.get(normalizedType) || null;
    }

    /**
     * Check if a command type is supported
     * @param commandType - Command type to check
     * @returns Whether the command is supported
     */
    hasCommand(commandType: string): boolean {
        const normalizedType = normalizeCommand(commandType);
        if (!normalizedType) {
            return false;
        }
        return this.commands.has(normalizedType);
    }

    /**
     * Get all registered command types
     * @returns Array of registered command types
     */
    getRegisteredCommands(): string[] {
        return Array.from(this.commands.keys());
    }

    /**
     * Execute a command with the given parameters
     * @param parsed - Parsed command data
     * @param username - Username of the command sender
     * @returns Command response
     */
    executeCommand(parsed: ParsedCommand, username: string): CommandResponse {
        const command = this.getCommand(parsed.command);

        if (!command) {
            return {
                message: `Unknown command: ${parsed.command}. Use !ch help for available commands.`,
                error: true,
            };
        }

        return command.execute(parsed, username);
    }

    /**
     * Add or update a command implementation
     * @param commandType - Command type
     * @param command - Command implementation
     */
    registerCommand(commandType: string, command: Command): void {
        this.commands.set(commandType, command);
    }

    /**
     * Remove a command implementation
     * @param commandType - Command type to remove
     */
    unregisterCommand(commandType: string): void {
        this.commands.delete(commandType);
    }
}
