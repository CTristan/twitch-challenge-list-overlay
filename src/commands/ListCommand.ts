import Challenge from "../classes/Challenge";
import type { CommandResponse } from "../types/CommandResponse";
import { ERROR_MESSAGES, LIST_MESSAGES } from "../types/MessageConstants";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to list challenges
 * Handles: !ch list [all|done|incomplete]
 */
export class ListCommand extends BaseCommand {
    /**
     * Execute the list command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Parse filter type from parameters
            const filterType = this.parseFilterType(parsed);

            // Get challenges based on filter
            const { challenges, indices } =
                this.getFilteredChallenges(filterType);

            // Format response
            let responseMessage: string;

            if (challenges.length === 0) {
                responseMessage = this.getEmptyMessage(filterType);
            } else {
                const prefix = this.getListPrefix(
                    filterType,
                    challenges.length
                );
                const challengeList = ResponseFormatter.formatChallengeList(
                    challenges,
                    {
                        includeEmoji: true,
                        includeProgress: true,
                        includeTimer: true,
                        includeShortId: true,
                        maxLength: 350, // Leave room for prefix
                    },
                    indices // Pass original indices for correct position numbering
                );
                responseMessage = `${prefix}: ${challengeList}`;
            }

            return this.createSuccessResponse(responseMessage);
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(error, "listing challenges")
            );
        }
    }

    /**
     * Parse filter type from command parameters
     * @param parsed - Parsed command data
     * @returns Filter type
     */
    private parseFilterType(
        parsed: ParsedCommand
    ): "all" | "done" | "incomplete" {
        // Check parameters for filter type
        if (parsed.parameters["filter"]) {
            const filter = parsed.parameters["filter"].toLowerCase();
            if (
                filter === "all" ||
                filter === "done" ||
                filter === "incomplete"
            ) {
                return filter as "all" | "done" | "incomplete";
            }
        }

        // Check raw parameters for filter type
        if (parsed.rawParameters) {
            const filter = parsed.rawParameters.trim().toLowerCase();
            if (
                filter === "all" ||
                filter === "done" ||
                filter === "incomplete"
            ) {
                return filter as "all" | "done" | "incomplete";
            }
        }

        // Default to showing incomplete challenges
        return "incomplete";
    }

    /**
     * Get challenges based on filter type
     * @param filterType - Type of filter to apply
     * @returns Object containing filtered challenges and their original indices
     */
    private getFilteredChallenges(filterType: "all" | "done" | "incomplete"): {
        challenges: Challenge[];
        indices: number[];
    } {
        const allChallenges = this.challengeList.challenges;
        const challenges: Challenge[] = [];
        const indices: number[] = [];

        switch (filterType) {
            case "all":
                allChallenges.forEach((challenge, index) => {
                    challenges.push(challenge);
                    indices.push(index);
                });
                break;
            case "done":
                allChallenges.forEach((challenge, index) => {
                    if (challenge.isComplete()) {
                        challenges.push(challenge);
                        indices.push(index);
                    }
                });
                break;
            case "incomplete":
                allChallenges.forEach((challenge, index) => {
                    if (!challenge.isComplete()) {
                        challenges.push(challenge);
                        indices.push(index);
                    }
                });
                break;
            default:
                allChallenges.forEach((challenge, index) => {
                    if (!challenge.isComplete()) {
                        challenges.push(challenge);
                        indices.push(index);
                    }
                });
                break;
        }

        return { challenges, indices };
    }

    /**
     * Get empty message for filter type
     * @param filterType - Type of filter
     * @returns Empty message
     */
    private getEmptyMessage(filterType: "all" | "done" | "incomplete"): string {
        switch (filterType) {
            case "all":
                return ERROR_MESSAGES.NO_CHALLENGES_FOUND;
            case "done":
                return ERROR_MESSAGES.NO_COMPLETED_CHALLENGES_FOUND;
            case "incomplete":
                return ERROR_MESSAGES.NO_INCOMPLETE_CHALLENGES_FOUND;
            default:
                return ERROR_MESSAGES.NO_CHALLENGES_FOUND;
        }
    }

    /**
     * Get list prefix for filter type
     * @param filterType - Type of filter
     * @param count - Number of challenges
     * @returns List prefix
     */
    private getListPrefix(
        filterType: "all" | "done" | "incomplete",
        count: number
    ): string {
        const countText =
            count === 1
                ? LIST_MESSAGES.ONE_CHALLENGE
                : `${count} ${LIST_MESSAGES.MULTIPLE_CHALLENGES}`;

        switch (filterType) {
            case "all":
                return `${LIST_MESSAGES.ALL_CHALLENGES} ${countText}`;
            case "done":
                return `${LIST_MESSAGES.COMPLETED_CHALLENGES} ${countText}`;
            case "incomplete":
                return `${LIST_MESSAGES.INCOMPLETE_CHALLENGES} ${countText}`;
            default:
                return `${countText}`;
        }
    }
}
