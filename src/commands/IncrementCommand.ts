import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

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
        try {
            // Handle single target ID for increment
            const { challenge, index, response } = this.handleSingleTarget(
                parsed.targetId || "",
                "increment"
            );
            if (response) {
                return response;
            }

            if (!challenge || index === undefined) {
                return this.createErrorResponse(
                    "Challenge not found for increment"
                );
            }

            // Parse increment amount from parameters or default to 1
            const incrementAmount = this.parseIncrementAmount(parsed);

            // Store old progress for response
            const oldProgress = challenge.progress;

            // Increment progress
            challenge.incrementProgress(incrementAmount);

            // Changes are automatically saved to localStorage

            // Format response
            const responseMessage = ResponseFormatter.formatProgressResponse(
                challenge,
                index,
                oldProgress,
                {
                    includeShortId: true,
                    includeProgress: true,
                }
            );

            return this.createSuccessResponse(responseMessage, "increment");
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "incrementing challenge progress"
                )
            );
        }
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
        if (parsed.rawParameters) {
            const parts = parsed.rawParameters.trim().split(/\s+/);
            if (parts.length > 1 && parts[1]) {
                const amount = parseInt(parts[1], 10);
                if (!isNaN(amount) && amount > 0) {
                    return amount;
                }
            }
        }

        // Default increment amount
        return 1;
    }
}
