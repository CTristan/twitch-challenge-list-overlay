import type { CommandResponse } from "../types/CommandResponse";
import { CommandType } from "../types/CommandTypes";
import { ValidationUtils } from "../utils/ValidationUtils";
import { BaseCommand, ProgressOperation } from "./Command";

/**
 * Command to set specific challenge progress
 * Handles: !ch set 1 5 (set progress to 5)
 */
export class SetCommand extends BaseCommand {
    /**
     * Execute the set command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        return this.executeProgressOperation(
            parsed,
            ProgressOperation.SET,
            (p) => this.parseProgressValue(p),
            (challenge, value) =>
                this.challengeList.setChallengeProgress(challenge.id, value),
            (value, challenge) => {
                ValidationUtils.validateNumber(value, "Progress value", {
                    min: 0,
                    max: challenge.amount,
                    integer: true,
                    required: true,
                });
            },
            this.getCommandHelp(CommandType.SET)
        );
    }

    /**
     * Parse progress value from command parameters
     * @param parsed - Parsed command data
     * @returns Progress value or null if not found/invalid
     */
    private parseProgressValue(parsed: ParsedCommand): number | null {
        // Check if there's a value parameter
        if (parsed.parameters["value"]) {
            const value = parseInt(parsed.parameters["value"], 10);
            if (!isNaN(value)) {
                return value;
            }
        }

        // Check raw parameters for a number (e.g., "!ch set 1 5")
        // Note: targetId is already extracted by CommandParser, so rawParameters contains just the amount
        if (parsed.rawParameters) {
            const parts = parsed.rawParameters.trim().split(/\s+/);
            if (parts.length > 0 && parts[0]) {
                const value = parseInt(parts[0], 10);
                if (!isNaN(value)) {
                    return value;
                }
            }
        }

        return null;
    }
}
