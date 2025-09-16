import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to delete challenges
 * Handles: !ch delete 1 or !ch delete 1,3,5
 */
export class DeleteCommand extends BaseCommand {
    /**
     * Execute the delete command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Handle multiple target IDs
            const { challenges, response } = this.handleMultipleTargets(
                parsed.targetId || "",
                "delete"
            );
            if (response) {
                return response;
            }

            if (challenges.length === 0) {
                return this.createErrorResponse(
                    "No valid challenges found to delete"
                );
            }

            // Store challenge info before deletion for response
            const challengesToDelete = challenges.map((c) => ({
                shortId: c.shortId,
                title: c.title,
            }));

            // Delete challenges by short ID
            const deletedChallenges = challenges.filter((challenge) => {
                const index = this.challengeList.challenges.findIndex(
                    (c) => c.shortId === challenge.shortId
                );
                if (index !== -1) {
                    this.challengeList.deleteChallenges([index]);
                    return true;
                }
                return false;
            });

            // Check if any challenges were actually deleted
            if (deletedChallenges.length === 0) {
                return this.createErrorResponse("No challenges were deleted");
            }

            // Changes are automatically saved to localStorage

            // Format response using the stored challenge info
            const responseMessage = ResponseFormatter.formatDeleteResponse(
                challengesToDelete.map(
                    (info) =>
                        ({ shortId: info.shortId, title: info.title } as any)
                ),
                {
                    includeShortId: true,
                }
            );

            return this.createSuccessResponse(
                responseMessage,
                "delete",
                challengesToDelete.map((c) => c.shortId).join(",")
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(error, "deleting challenges")
            );
        }
    }
}
