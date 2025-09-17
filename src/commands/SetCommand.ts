import { ResponseFormatter } from "../utils/ResponseFormatter";
import { ValidationUtils } from "../utils/ValidationUtils";
import { BaseCommand } from "./Command";

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
        try {
            // Handle single target ID for set
            const { challenge, index, response } = this.handleSingleTarget(
                parsed.targetId || "",
                "set"
            );
            if (response) {
                return response;
            }

            if (!challenge || index === undefined) {
                return this.createErrorResponse(
                    "Challenge not found for set progress"
                );
            }

            // Parse new progress value
            const newProgress = this.parseProgressValue(parsed);
            if (newProgress === null) {
                return this.createErrorResponse(
                    "Progress value required. Usage: !ch set 1 5 or !ch set 1 value=5"
                );
            }

            // Validate progress value
            try {
                const validatedProgress = ValidationUtils.validateNumber(
                    newProgress,
                    "Progress value",
                    {
                        min: 0,
                        max: challenge.amount,
                        integer: true,
                        required: true,
                    }
                );

                // Store old progress for response
                const oldProgress = challenge.progress;

                // Set new progress
                challenge.setProgress(validatedProgress);

                // Changes are automatically saved to localStorage

                // Format response
                const responseMessage =
                    ResponseFormatter.formatProgressResponse(
                        challenge,
                        index,
                        oldProgress,
                        {
                            includeShortId: true,
                            includeProgress: true,
                        }
                    );

                return this.createSuccessResponse(
                    responseMessage,
                    "set",
                    index.toString()
                );
            } catch (validationError: unknown) {
                return this.createErrorResponse(
                    ResponseFormatter.formatError(
                        validationError,
                        "validating progress value"
                    )
                );
            }
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "setting challenge progress"
                )
            );
        }
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
        if (parsed.rawParameters) {
            const parts = parsed.rawParameters.trim().split(/\s+/);
            if (parts.length > 1 && parts[1]) {
                const value = parseInt(parts[1], 10);
                if (!isNaN(value)) {
                    return value;
                }
            }
        }

        return null;
    }
}
