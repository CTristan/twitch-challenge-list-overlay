import type { CommandResponse } from "../types/CommandResponse";
import { ERROR_MESSAGES, HELP_MESSAGES } from "../types/MessageConstants";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to provide help information
 * Handles: !ch help [command]
 */
export class HelpCommand extends BaseCommand {
    /**
     * Execute the help command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Parse specific command help request
            const specificCommand = this.parseSpecificCommand(parsed);

            // Format help response
            const responseMessage = specificCommand
                ? this.getSpecificCommandHelp(specificCommand)
                : this.getGeneralHelp();

            return this.createSuccessResponse(responseMessage);
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(error, "providing help")
            );
        }
    }

    /**
     * Parse specific command from parameters
     * @param parsed - Parsed command data
     * @returns Specific command name or null
     */
    private parseSpecificCommand(parsed: ParsedCommand): string | null {
        // Check parameters for command
        if (parsed.parameters["command"]) {
            return parsed.parameters["command"].toLowerCase();
        }

        // Check raw parameters for command
        if (parsed.rawParameters) {
            const command = parsed.rawParameters.trim().toLowerCase();
            if (command) {
                return command;
            }
        }

        return null;
    }

    /**
     * Get general help information
     * @returns General help message
     */
    private getGeneralHelp(): string {
        // Use ResponseFormatter.formatHelp() for consistent help formatting
        return ResponseFormatter.formatHelp();
    }

    /**
     * Get specific command help
     * @param command - Command name
     * @returns Specific command help
     */
    private getSpecificCommandHelp(command: string): string {
        const helpMap: Record<string, string> = {
            add: HELP_MESSAGES.ADD_COMMAND_HELP,
            edit: HELP_MESSAGES.EDIT_COMMAND_HELP,
            done: HELP_MESSAGES.DONE_COMMAND_HELP,
            complete: HELP_MESSAGES.DONE_COMMAND_HELP,
            fail: HELP_MESSAGES.FAIL_COMMAND_HELP,
            delete: HELP_MESSAGES.DELETE_COMMAND_HELP,
            remove: HELP_MESSAGES.DELETE_COMMAND_HELP,
            "+": HELP_MESSAGES.INCREMENT_COMMAND_HELP,
            increment: HELP_MESSAGES.INCREMENT_COMMAND_HELP,
            "-": HELP_MESSAGES.DECREMENT_COMMAND_HELP,
            decrement: HELP_MESSAGES.DECREMENT_COMMAND_HELP,
            set: HELP_MESSAGES.SET_COMMAND_HELP,
            list: HELP_MESSAGES.LIST_COMMAND_HELP,
            show: HELP_MESSAGES.SHOW_COMMAND_HELP,
            clearall: HELP_MESSAGES.CLEARALL_COMMAND_HELP,
            cleardone: HELP_MESSAGES.CLEARDONE_COMMAND_HELP,
            help: HELP_MESSAGES.HELP_COMMAND_HELP,
        };

        const helpText = helpMap[command];
        if (helpText) {
            return helpText;
        }

        return ERROR_MESSAGES.UNKNOWN_COMMAND.replace("{command}", command);
    }
}
