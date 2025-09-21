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

            return this.createSuccessResponse(responseMessage, "help");
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
            add: '!ch add title="Challenge Name" desc="Description" amount=5 timer=10m - Add a new challenge with optional parameters',
            edit: '!ch edit 1 title="New Title" desc="New Description" amount=10 - Edit challenge properties',
            done: "!ch done 1,2,3 - Mark challenges as completed (supports multiple IDs)",
            complete:
                "!ch done 1,2,3 - Mark challenges as completed (supports multiple IDs)",
            fail: "!ch fail 1,2,3 - Mark challenges as failed (supports multiple IDs)",
            delete: "!ch delete 1,2,3 - Delete challenges (supports multiple IDs)",
            remove: "!ch delete 1,2,3 - Delete challenges (supports multiple IDs)",
            "+": "!ch + 1 [amount] - Increment challenge progress by amount (default: 1)",
            increment:
                "!ch + 1 [amount] - Increment challenge progress by amount (default: 1)",
            "-": "!ch - 1 [amount] - Decrement challenge progress by amount (default: 1)",
            decrement:
                "!ch - 1 [amount] - Decrement challenge progress by amount (default: 1)",
            set: "!ch set 1 5 - Set challenge progress to specific value",
            list: "!ch list [all|done|incomplete] - List challenges with optional filter (default: incomplete)",
            show: "!ch show 1 - Show detailed information about a specific challenge",
            check: "!ch check - Show challenge statistics and summary",
            clearall:
                "!ch clearall - Clear all challenges (requires confirmation)",
            cleardone: "!ch cleardone - Clear all completed challenges",
            help: "!ch help [command] - Show general help or specific command help",
        };

        const helpText = helpMap[command];
        if (helpText) {
            return helpText;
        }

        return `Unknown command: ${command}. Use !ch help for available commands.`;
    }
}
