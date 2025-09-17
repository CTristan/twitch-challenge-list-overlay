import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to clear all challenges
 * Handles: !ch clearall
 */
export class ClearAllCommand extends BaseCommand {
    /**
     * Execute the clear all command
     * @param _parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(_parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Get current challenge count
            const challengeCount = this.challengeList.challenges.length;

            // Check if there are any challenges to clear
            if (challengeCount === 0) {
                return this.createSuccessResponse(
                    "No challenges to clear",
                    "clearall"
                );
            }

            // Clear all challenges (automatically saves to localStorage)
            this.challengeList.clearChallengeList();

            // Format response
            const responseMessage = ResponseFormatter.formatClearResponse(
                "all",
                challengeCount
            );

            // Create UI update data
            const uiUpdate: UIUpdateData = {
                action: "clearAll" as UIUpdateAction,
                updateTimers: true,
                updateCount: true,
            };

            return this.createSuccessResponseWithUIUpdate(
                responseMessage,
                uiUpdate,
                "clearAll"
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(error, "clearing all challenges")
            );
        }
    }
}
