import Challenge from "../classes/Challenge";
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
            const challenges = this.getFilteredChallenges(filterType);

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
                    }
                );
                responseMessage = `${prefix}: ${challengeList}`;
            }

            return this.createSuccessResponse(responseMessage, "list");
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
     * @returns Filtered challenges
     */
    private getFilteredChallenges(
        filterType: "all" | "done" | "incomplete"
    ): Challenge[] {
        const allChallenges = this.challengeList.challenges;

        switch (filterType) {
            case "all":
                return allChallenges;
            case "done":
                return allChallenges.filter((c) => c.isComplete());
            case "incomplete":
                return allChallenges.filter((c) => !c.isComplete());
            default:
                return allChallenges.filter((c) => !c.isComplete());
        }
    }

    /**
     * Get empty message for filter type
     * @param filterType - Type of filter
     * @returns Empty message
     */
    private getEmptyMessage(filterType: "all" | "done" | "incomplete"): string {
        switch (filterType) {
            case "all":
                return "No challenges found";
            case "done":
                return "No completed challenges found";
            case "incomplete":
                return "No incomplete challenges found";
            default:
                return "No challenges found";
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
        const countText = count === 1 ? "1 challenge" : `${count} challenges`;

        switch (filterType) {
            case "all":
                return `All ${countText}`;
            case "done":
                return `Completed ${countText}`;
            case "incomplete":
                return `Incomplete ${countText}`;
            default:
                return `${countText}`;
        }
    }
}
