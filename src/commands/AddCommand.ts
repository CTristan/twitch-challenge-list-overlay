import Challenge from "../classes/Challenge";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import Timer from "../utils/Timer";
import { ValidationUtils } from "../utils/ValidationUtils";
import { BaseCommand } from "./Command";

/**
 * Command to add new challenges
 * Handles: !ch add title="..." desc="..." amount=N timer=Xm
 * Also supports simple syntax: !ch add Challenge Name
 */
export class AddCommand extends BaseCommand {
    /**
     * Execute the add command
     * @param parsed - Parsed command data
     * @param username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Check challenge limit first
            if (this.isChallengeLimitReached()) {
                return this.createErrorResponse(
                    ResponseFormatter.formatLimitError(this.getMaxChallenges())
                );
            }

            // Check if no arguments provided - show usage message
            if (
                !parsed.rawParameters &&
                Object.keys(parsed.parameters).length === 0
            ) {
                return this.createErrorResponse(this.getUsageMessage());
            }

            // Extract and validate title
            const challengeTitle = this.extractTitle(parsed);
            if (!challengeTitle) {
                return this.createErrorResponse(this.getUsageMessage());
            }

            // Extract optional parameters
            const challengeDesc = this.extractDescription(parsed);
            const challengeAmount = this.extractAmount(parsed);
            const timerValue = this.extractTimer(parsed);

            // Create challenge
            const challengeOptions: {
                description: string;
                amount: number;
                timer?: string;
            } = {
                description: challengeDesc,
                amount: challengeAmount,
            };

            // Only include timer if it's defined
            if (timerValue !== undefined) {
                challengeOptions.timer = timerValue;
            }

            const challenge = new Challenge(challengeTitle, challengeOptions);

            // Start timer if present
            if (timerValue) {
                challenge.startTimer();
            }

            // Add to list
            this.challengeList.addChallengeObjects(challenge);

            // Format response
            const response = ResponseFormatter.formatAddResponse(challenge, {
                includeEmoji: true,
                includeProgress: true,
                includeTimer: true,
                includeShortId: true,
            });

            return this.createSuccessResponse(
                response,
                "add",
                challenge.shortId
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(error, "creating challenge")
            );
        }
    }

    /**
     * Extract title from parsed command
     * @param parsed - Parsed command data
     * @returns Validated title or null if invalid
     */
    private extractTitle(parsed: ParsedCommand): string | null {
        const { title } = parsed.parameters;

        // Support simple string syntax as fallback: "add Challenge Name"
        if (!title && parsed.rawParameters) {
            try {
                return ValidationUtils.validateChallengeTitle(
                    parsed.rawParameters.trim()
                );
            } catch (error) {
                return null;
            }
        }

        // Support key=value parameter syntax
        if (title) {
            try {
                const unquoted = ValidationUtils.unquoteString(title);
                return ValidationUtils.validateChallengeTitle(unquoted);
            } catch (error) {
                return null;
            }
        }

        return null;
    }

    /**
     * Extract description from parsed command
     * @param parsed - Parsed command data
     * @returns Validated description or empty string
     */
    private extractDescription(parsed: ParsedCommand): string {
        const { desc } = parsed.parameters;

        if (!desc) {
            return "";
        }

        try {
            const unquoted = ValidationUtils.unquoteString(desc);
            return ValidationUtils.validateChallengeDescription(unquoted, {
                allowEmpty: true,
            });
        } catch (error) {
            // Return empty string if description validation fails
            return "";
        }
    }

    /**
     * Extract amount from parsed command
     * @param parsed - Parsed command data
     * @returns Validated amount or default value (1)
     */
    private extractAmount(parsed: ParsedCommand): number {
        const { amount } = parsed.parameters;

        if (!amount) {
            return 1; // Default amount
        }

        try {
            const numericAmount = parseInt(amount, 10);
            return ValidationUtils.validateChallengeAmount(numericAmount);
        } catch (error) {
            // Return default if amount validation fails
            return 1;
        }
    }

    /**
     * Extract timer from parsed command
     * @param parsed - Parsed command data
     * @returns Timer value or undefined if not specified/invalid
     */
    private extractTimer(parsed: ParsedCommand): string | undefined {
        const { timer } = parsed.parameters;

        if (!timer) {
            return undefined;
        }

        try {
            // Validate timer format by attempting to parse it
            // Timer class will throw if format is invalid
            Timer.parseDuration(timer);
            return timer;
        } catch (error) {
            // Return undefined if timer validation fails
            // The error will be caught by the main execute method
            return undefined;
        }
    }

    /**
     * Get comprehensive usage message for the add command
     * @returns Detailed usage instructions with parameter descriptions
     */
    private getUsageMessage(): string {
        const usageLines = [
            "Usage: !ch add [parameters]",
            "",
            "Two syntax options:",
            "1. Simple: !ch add Challenge Name",
            '2. Advanced: !ch add title="Challenge Name" desc="Description" amount=5 timer=10m',
            "",
            "Available parameters:",
            '• title="..." (or t="...") - Challenge title (required)',
            '• desc="..." (or d="...") - Challenge description (optional)',
            "• amount=N (or a=N) - Target amount/quantity (optional, default: 1)",
            "• timer=Xm (or tm=Xm) - Timer duration in minutes (optional)",
            "",
            "Examples:",
            "• !ch add Beat the boss",
            '• !ch add title="Collect 100 coins" amount=100',
            '• !ch add t="Speed run" desc="Complete in under 5 minutes" timer=5m',
        ];

        return usageLines.join(" • ");
    }
}
