import ChallengeList from "../classes/ChallengeList";
import ConfigManager from "../classes/ConfigManager";
import type { CommandResponse } from "../types/CommandResponse";
import {
    CommandType,
    normalizeCommand,
    type CommandTypeValue,
} from "../types/CommandTypes";
import { ResponseFormatter } from "../utils/ResponseFormatter";
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
 * Configuration interface for command registration
 * Maps command types to their corresponding class constructors
 */
interface CommandConfig {
    type: CommandTypeValue;
    constructor: new (
        challengeList: ChallengeList,
        configManager: ConfigManager
    ) => Command;
}

/**
 * Command configuration array - data-driven command registration
 * To add a new command: import the class and add an entry to this array
 */
const COMMAND_CONFIGURATIONS: CommandConfig[] = [
    { type: CommandType.ADD, constructor: AddCommand },
    { type: CommandType.EDIT, constructor: EditCommand },
    { type: CommandType.DONE, constructor: DoneCommand },
    { type: CommandType.UNDONE, constructor: UndoneCommand },
    { type: CommandType.DELETE, constructor: DeleteCommand },
    { type: CommandType.FAIL, constructor: FailCommand },
    { type: CommandType.INCREMENT, constructor: IncrementCommand },
    { type: CommandType.DECREMENT, constructor: DecrementCommand },
    { type: CommandType.SET, constructor: SetCommand },
    { type: CommandType.LIST, constructor: ListCommand },
    { type: CommandType.SHOW, constructor: ShowCommand },
    { type: CommandType.CHECK, constructor: CheckCommand },
    { type: CommandType.HELP, constructor: HelpCommand },
    { type: CommandType.CLEAR_ALL, constructor: ClearAllCommand },
    { type: CommandType.CLEAR_DONE, constructor: ClearDoneCommand },
];

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
     * Initialize all command implementations using data-driven approach
     * Commands are automatically instantiated and registered based on COMMAND_CONFIGURATIONS
     */
    private initializeCommands(): void {
        COMMAND_CONFIGURATIONS.forEach((config) => {
            const commandInstance = new config.constructor(
                this.challengeList,
                this.configManager
            );
            this.commands.set(config.type, commandInstance);
        });
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
            // Return help response for unknown commands instead of error message
            return {
                message: ResponseFormatter.formatHelp(),
                error: false,
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
