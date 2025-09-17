import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

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
        try {
            // Handle single target ID for decrement
            const { challenge, index, response } = this.handleSingleTarget(
                parsed.targetId || "",
                "decrement"
            );
            if (response) {
                return response;
            }

            if (!challenge || index === undefined) {
                return this.createErrorResponse(
                    "Challenge not found for decrement"
                );
            }

            // Parse decrement amount from parameters or default to 1
            const decrementAmount = this.parseDecrementAmount(parsed);

            // Store old progress for response
            const oldProgress = challenge.progress;

            // Decrement progress
            challenge.decrementProgress(decrementAmount);

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

            return this.createSuccessResponse(responseMessage, "decrement");
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "decrementing challenge progress"
                )
            );
        }
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
        if (parsed.rawParameters) {
            const parts = parsed.rawParameters.trim().split(/\s+/);
            if (parts.length > 1 && parts[1]) {
                const amount = parseInt(parts[1], 10);
                if (!isNaN(amount) && amount > 0) {
                    return amount;
                }
            }
        }

        // Default decrement amount
        return 1;
    }
}
