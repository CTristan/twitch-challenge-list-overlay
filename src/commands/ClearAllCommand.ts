import type { CommandResponse } from "../types/CommandResponse";
import { ERROR_MESSAGES } from "../types/MessageConstants";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
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
                    ERROR_MESSAGES.NO_CHALLENGES_TO_CLEAR
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
                action: UIUpdateAction.CLEAR_ALL,
                updateTimers: true,
                updateCount: true,
            };

            return this.createSuccessResponseWithUIUpdate(
                responseMessage,
                uiUpdate
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(error, "clearing all challenges")
            );
        }
    }
}
