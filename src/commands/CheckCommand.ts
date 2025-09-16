import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to check challenge status and summary
 * Handles: !ch check
 */
export class CheckCommand extends BaseCommand {
    /**
     * Execute the check command
     * @param _parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(_parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Get challenge statistics
            const stats = this.getChallengeStatistics();

            // Format summary response
            const responseMessage = this.formatChallengeStatistics(stats);

            return this.createSuccessResponse(responseMessage, "check");
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "checking challenge status"
                )
            );
        }
    }

    /**
     * Get challenge statistics
     * @returns Challenge statistics
     */
    private getChallengeStatistics(): {
        total: number;
        completed: number;
        failed: number;
        inProgress: number;
        withTimers: number;
        activeTimers: number;
    } {
        const challenges = this.challengeList.challenges;

        const stats = {
            total: challenges.length,
            completed: 0,
            failed: 0,
            inProgress: 0,
            withTimers: 0,
            activeTimers: 0,
        };

        challenges.forEach((challenge) => {
            if (challenge.isComplete()) {
                stats.completed++;
            } else if (challenge.isFailed()) {
                stats.failed++;
            } else {
                stats.inProgress++;
            }

            if (challenge.timer) {
                stats.withTimers++;
                if (challenge.timer.isActive) {
                    stats.activeTimers++;
                }
            }
        });

        return stats;
    }

    /**
     * Format challenge statistics into a readable message
     * @param stats - Challenge statistics
     * @returns Formatted statistics message
     */
    private formatChallengeStatistics(stats: {
        total: number;
        completed: number;
        failed: number;
        inProgress: number;
        withTimers: number;
        activeTimers: number;
    }): string {
        if (stats.total === 0) {
            return "No challenges found. Use !ch add to create your first challenge!";
        }

        const parts: string[] = [];

        // Total challenges
        parts.push(
            `${stats.total} total challenge${stats.total === 1 ? "" : "s"}`
        );

        // Status breakdown
        const statusParts: string[] = [];
        if (stats.completed > 0) {
            statusParts.push(`${stats.completed} completed ✅`);
        }
        if (stats.failed > 0) {
            statusParts.push(`${stats.failed} failed ❌`);
        }
        if (stats.inProgress > 0) {
            statusParts.push(`${stats.inProgress} in progress 🔄`);
        }

        if (statusParts.length > 0) {
            parts.push(`(${statusParts.join(", ")})`);
        }

        // Timer information
        if (stats.withTimers > 0) {
            if (stats.activeTimers > 0) {
                parts.push(
                    `${stats.activeTimers} active timer${
                        stats.activeTimers === 1 ? "" : "s"
                    } ⏰`
                );
            } else {
                parts.push(
                    `${stats.withTimers} timer${
                        stats.withTimers === 1 ? "" : "s"
                    } (stopped)`
                );
            }
        }

        // Completion percentage
        if (stats.total > 0) {
            const completionRate = Math.round(
                (stats.completed / stats.total) * 100
            );
            parts.push(`${completionRate}% completion rate`);
        }

        return parts.join(" • ");
    }
}
