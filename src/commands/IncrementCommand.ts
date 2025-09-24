import { BaseCommand, ProgressOperation } from "./Command";

/**
 * Command to increment challenge progress
 * Handles: !ch + 1 or !ch + 1 5 (increment by 5)
 */
export class IncrementCommand extends BaseCommand {
    /**
     * Execute the increment command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        return this.executeProgressOperation(
            parsed,
            ProgressOperation.INCREMENT,
            (p) => this.parseIncrementAmount(p),
            (challenge, amount) =>
                this.challengeList.incrementChallengeProgress(
                    challenge.id,
                    amount
                )
        );
    }

    /**
     * Parse increment amount from command parameters
     * @param parsed - Parsed command data
     * @returns Increment amount (default: 1)
     */
    private parseIncrementAmount(parsed: ParsedCommand): number {
        // Check if there's a value parameter or raw parameters
        if (parsed.parameters["value"]) {
            const amount = parseInt(parsed.parameters["value"], 10);
            if (!isNaN(amount) && amount > 0) {
                return amount;
            }
        }

        // Check raw parameters for a number (e.g., "!ch + 1 5")
        // Note: targetId is already extracted by CommandParser, so rawParameters contains just the amount
        if (parsed.rawParameters) {
            const parts = parsed.rawParameters.trim().split(/\s+/);
            if (parts.length > 0 && parts[0]) {
                const amount = parseInt(parts[0], 10);
                if (!isNaN(amount) && amount > 0) {
                    return amount;
                }
            }
        }

        // Default increment amount
        return 1;
    }
}
