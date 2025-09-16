import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to clear completed challenges
 * Handles: !ch cleardone
 */
export class ClearDoneCommand extends BaseCommand {
    /**
     * Execute the clear done command
     * @param _parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(_parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Get completed challenges count before clearing
            const completedChallenges = this.challengeList.challenges.filter(
                (c) => c.isComplete()
            );
            const completedCount = completedChallenges.length;

            // Check if there are any completed challenges to clear
            if (completedCount === 0) {
                return this.createSuccessResponse(
                    "No completed challenges to clear",
                    "cleardone"
                );
            }

            // Clear completed challenges (automatically saves to localStorage)
            this.challengeList.clearDoneChallenges();

            // Format response
            const responseMessage = ResponseFormatter.formatClearResponse(
                "done",
                completedCount
            );

            return this.createSuccessResponse(responseMessage, "cleardone");
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "clearing completed challenges"
                )
            );
        }
    }
}
