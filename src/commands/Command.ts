import Challenge from "../classes/Challenge";
import ChallengeList from "../classes/ChallengeList";
import ConfigManager from "../classes/ConfigManager";
import IDManager from "../utils/IDManager";

/**
 * Base interface for all command implementations
 */
export interface Command {
    /**
     * Execute the command with the given parameters
     * @param parsed - Parsed command data
     * @param username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, username: string): CommandResponse;
}

/**
 * Abstract base class for command implementations
 * Provides common functionality and dependencies for all commands
 */
export abstract class BaseCommand implements Command {
    protected challengeList: ChallengeList;
    protected configManager: ConfigManager;
    protected idManager: IDManager;

    constructor(challengeList: ChallengeList, configManager: ConfigManager) {
        this.challengeList = challengeList;
        this.configManager = configManager;
        this.idManager = IDManager.getInstance();
    }

    /**
     * Execute the command - must be implemented by subclasses
     */
    abstract execute(parsed: ParsedCommand, username: string): CommandResponse;

    /**
     * Find challenge by short ID
     * @param shortId - Short ID to search for
     * @returns Challenge if found, null otherwise
     */
    protected findChallengeByShortId(shortId: string): Challenge | null {
        return (
            this.challengeList.challenges.find((c) => c.shortId === shortId) ||
            null
        );
    }

    /**
     * Find challenges by multiple short IDs
     * @param shortIds - Array of short IDs to search for
     * @returns Array of found challenges
     */
    protected findChallengesByShortIds(shortIds: string[]): Challenge[] {
        return shortIds
            .map((id) => this.findChallengeByShortId(id))
            .filter((challenge): challenge is Challenge => challenge !== null);
    }

    /**
     * Parse comma-separated target IDs
     * @param targetId - Target ID string (e.g., "1,3,5" or "A7")
     * @returns Array of short IDs
     */
    protected parseTargetIds(targetId: string): string[] {
        if (!targetId) return [];

        return targetId
            .split(",")
            .map((id) => id.trim().toUpperCase())
            .filter((id) => id.length > 0);
    }

    /**
     * Validate that target IDs exist
     * @param shortIds - Array of short IDs to validate
     * @returns Validation result with found and missing IDs
     */
    protected validateTargetIds(shortIds: string[]): {
        found: Challenge[];
        missing: string[];
        isValid: boolean;
    } {
        const found: Challenge[] = [];
        const missing: string[] = [];

        shortIds.forEach((id) => {
            const challenge = this.findChallengeByShortId(id);
            if (challenge) {
                found.push(challenge);
            } else {
                missing.push(id);
            }
        });

        return {
            found,
            missing,
            isValid: missing.length === 0,
        };
    }

    /**
     * Check if the challenge list has reached the maximum limit
     * @returns Whether the limit is reached
     */
    protected isChallengeLimitReached(): boolean {
        const maxChallenges = this.configManager.get("maxChallenges") || 10;
        return this.challengeList.challenges.length >= maxChallenges;
    }

    /**
     * Get the maximum challenge limit
     * @returns Maximum number of challenges allowed
     */
    protected getMaxChallenges(): number {
        return this.configManager.get("maxChallenges") || 10;
    }

    /**
     * Create an error response
     * @param message - Error message
     * @param action - Optional action identifier
     * @returns Error response
     */
    protected createErrorResponse(
        message: string,
        action?: string
    ): CommandResponse {
        return {
            message,
            error: true,
            ...(action && { action }),
        };
    }

    /**
     * Create a success response
     * @param message - Success message
     * @param action - Action identifier
     * @param challengeId - Optional challenge ID
     * @returns Success response
     */
    protected createSuccessResponse(
        message: string,
        action: string,
        challengeId?: string
    ): CommandResponse {
        return {
            message,
            error: false,
            action,
            ...(challengeId && { challengeId }),
        };
    }

    /**
     * Handle multiple target IDs with validation
     * @param targetId - Target ID string
     * @param operation - Operation name for error messages
     * @returns Validation result or error response
     */
    protected handleMultipleTargets(
        targetId: string,
        operation: string
    ): { challenges: Challenge[]; response?: CommandResponse } {
        if (!targetId) {
            return {
                challenges: [],
                response: this.createErrorResponse(
                    `Target ID required for ${operation} command`
                ),
            };
        }

        const shortIds = this.parseTargetIds(targetId);
        if (shortIds.length === 0) {
            return {
                challenges: [],
                response: this.createErrorResponse(
                    `Invalid target ID format: ${targetId}`
                ),
            };
        }

        const validation = this.validateTargetIds(shortIds);
        if (!validation.isValid) {
            return {
                challenges: [],
                response: this.createErrorResponse(
                    `Challenge(s) not found: ${validation.missing.join(", ")}`
                ),
            };
        }

        return { challenges: validation.found };
    }

    /**
     * Handle single target ID with validation
     * @param targetId - Target ID string
     * @param operation - Operation name for error messages
     * @returns Challenge and validation result
     */
    protected handleSingleTarget(
        targetId: string,
        operation: string
    ): { challenge: Challenge | null; response?: CommandResponse } {
        if (!targetId) {
            return {
                challenge: null,
                response: this.createErrorResponse(
                    `Target ID required for ${operation} command`
                ),
            };
        }

        const challenge = this.findChallengeByShortId(
            targetId.trim().toUpperCase()
        );
        if (!challenge) {
            return {
                challenge: null,
                response: this.createErrorResponse(
                    `Challenge #${targetId} not found`
                ),
            };
        }

        return { challenge };
    }
}
