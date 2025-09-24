import { BaseCommand, ProgressOperation } from "./Command";

/**
 * Command to decrement challenge progress
 * Handles: !ch - 1 or !ch - 1 3 (decrement by 3)
 */
export class DecrementCommand extends BaseCommand {
    /**
     * Execute the decrement command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        return this.executeProgressOperation(
            parsed,
            ProgressOperation.DECREMENT,
            (p) => this.parseDecrementAmount(p),
            (challenge, amount) =>
                this.challengeList.decrementChallengeProgress(
                    challenge.id,
                    amount
                )
        );
    }

    /**
     * Parse decrement amount from command parameters
     * @param parsed - Parsed command data
     * @returns Decrement amount (default: 1)
     */
    private parseDecrementAmount(parsed: ParsedCommand): number {
        // Check if there's a value parameter or raw parameters
        if (parsed.parameters["value"]) {
            const amount = parseInt(parsed.parameters["value"], 10);
            if (!isNaN(amount) && amount > 0) {
                return amount;
            }
        }

        // Check raw parameters for a number (e.g., "!ch - 1 3")
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

        // Default decrement amount
        return 1;
    }
}
