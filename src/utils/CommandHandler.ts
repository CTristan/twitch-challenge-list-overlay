import ChallengeList from "../classes/ChallengeList";
import ConfigManager from "../classes/ConfigManager";
import { CommandRegistry } from "../commands/CommandRegistry";
import { normalizeCommand } from "../types/CommandTypes";
import CommandParser from "./CommandParser";

/**
 * @class CommandHandler
 * Handles command syntax for the Twitch challenge overlay system.
 * Supports key=value parameters, short IDs, timer functionality, and progress tracking.
 */
export default class CommandHandler {
    private commandRegistry: CommandRegistry;

    constructor(challengeList: ChallengeList, configManager: ConfigManager) {
        this.commandRegistry = new CommandRegistry(
            challengeList,
            configManager
        );
    }

    /**
     * Handle command syntax
     * @param username - Username of the command sender
     * @param command - Command name (without !)
     * @param message - Command parameters
     * @param flags - User permission flags
     * @returns Command response
     */
    handleCommand(
        username: string,
        command: string,
        message: string,
        flags: { broadcaster: boolean; mod: boolean }
    ): CommandResponse {
        try {
            // Check if this is a ch command (starts with "ch")
            if (!command.toLowerCase().startsWith("ch")) {
                return { message: "", error: true, action: "not_ch_command" };
            }

            // Parse the command
            // For "ch" command, the actual subcommand is in the message parameter
            const fullCommand = message || "";
            const parsed = CommandParser.parseCommand(fullCommand);

            if (!parsed.isValid) {
                return {
                    message: `Invalid command: ${parsed.errors.join(", ")}`,
                    error: true,
                };
            }

            // Normalize the command using the type system
            const commandType = normalizeCommand(parsed.command);
            if (!commandType) {
                return {
                    message: `Unknown command: ${parsed.command}. Try !ch help`,
                    error: true,
                };
            }

            // Check permissions - ALL commands require moderator/broadcaster privileges
            if (!this.isMod(flags)) {
                return {
                    message:
                        "Only moderators and the broadcaster can manage challenges",
                    error: true,
                };
            }

            // Use the CommandRegistry for all commands
            return this.commandRegistry.executeCommand(parsed, username);
        } catch (error) {
            return {
                message: `Error: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    // All legacy command handlers removed - now handled by CommandRegistry

    /**
     * Check if user has moderator privileges
     * @param flags - User flags
     * @returns True if user is moderator or broadcaster
     */
    private isMod(flags: { broadcaster: boolean; mod: boolean }): boolean {
        return flags.broadcaster || flags.mod;
    }
}
