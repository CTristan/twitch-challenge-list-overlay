import Challenge from "../classes/Challenge";
import type { CommandResponse } from "../types/CommandResponse";
import { HELP_MESSAGES } from "../types/MessageConstants";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
import { ResponseFormatter } from "../utils/ResponseFormatter";
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
                return this.createSuccessResponse(this.getUsageMessage());
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

            // Get the index of the newly added challenge (last in array)
            const challengeIndex = this.challengeList.challenges.length - 1;

            // Format response
            const response = ResponseFormatter.formatAddResponse(
                challenge,
                challengeIndex,
                {
                    includeEmoji: true,
                    includeProgress: true,
                    includeTimer: true,
                    includeShortId: true,
                }
            );

            // Create UI update data
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.ADD,
                challengeIndices: [challengeIndex],
                challenges: [challenge],
                updateTimers: true,
                updateCount: true,
            };

            return this.createSuccessResponseWithUIUpdate(response, uiUpdate);
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

        // Title is now always extracted from the first token by CommandParser
        if (title) {
            try {
                const unquoted = ValidationUtils.unquoteString(title);
                return ValidationUtils.validateChallengeTitle(unquoted);
            } catch (error) {
                return null;
            }
        }

        // Fallback for simple string syntax when no parameters are parsed
        if (!title && parsed.rawParameters) {
            try {
                return ValidationUtils.validateChallengeTitle(
                    parsed.rawParameters.trim()
                );
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
     * @returns Timer value or undefined if not specified
     * @note Timer format validation is handled by CommandParser - this method trusts that validation
     */
    private extractTimer(parsed: ParsedCommand): string | undefined {
        const { timer } = parsed.parameters;
        return timer || undefined;
    }

    /**
     * Get usage message for the add command using centralized help system
     * @returns Help message from the centralized help system
     */
    private getUsageMessage(): string {
        return HELP_MESSAGES.ADD_COMMAND_HELP;
    }
}
