import Challenge from "../classes/Challenge";
import ChallengeList from "../classes/ChallengeList";
import ConfigManager from "../classes/ConfigManager";
import {
    getChallengeByPosition,
    getChallengeWithIndex,
    isValidUserPosition,
} from "../utils/PositionUtils";

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

    constructor(challengeList: ChallengeList, configManager: ConfigManager) {
        this.challengeList = challengeList;
        this.configManager = configManager;
    }

    /**
     * Execute the command - must be implemented by subclasses
     */
    abstract execute(parsed: ParsedCommand, username: string): CommandResponse;

    /**
     * Find challenge by position ID
     * @param positionId - Position-based ID to search for
     * @returns Challenge if found, null otherwise
     */
    protected findChallengeByPositionId(positionId: string): Challenge | null {
        return getChallengeByPosition(
            this.challengeList.challenges,
            positionId
        );
    }

    /**
     * Find challenge and index by position ID
     * @param positionId - Position-based ID to search for
     * @returns Object with challenge and index if found, null otherwise
     */
    protected findChallengeWithIndexByPositionId(
        positionId: string
    ): { challenge: Challenge; index: number } | null {
        return getChallengeWithIndex(this.challengeList.challenges, positionId);
    }

    /**
     * Find challenges by multiple position IDs
     * @param positionIds - Array of position IDs to search for
     * @returns Array of found challenges
     */
    protected findChallengesByPositionIds(positionIds: string[]): Challenge[] {
        return positionIds
            .map((id) => this.findChallengeByPositionId(id))
            .filter((challenge): challenge is Challenge => challenge !== null);
    }

    /**
     * Parse comma-separated target IDs
     * @param targetId - Target ID string (e.g., "1,3,5" or "2")
     * @returns Array of position IDs
     */
    protected parseTargetIds(targetId: string): string[] {
        if (!targetId) return [];

        return targetId
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id.length > 0 && isValidUserPosition(id));
    }

    /**
     * Validate that target IDs exist
     * @param positionIds - Array of position IDs to validate
     * @returns Validation result with found and missing IDs
     */
    protected validateTargetIds(positionIds: string[]): {
        found: Challenge[];
        missing: string[];
        isValid: boolean;
    } {
        const found: Challenge[] = [];
        const missing: string[] = [];

        positionIds.forEach((id) => {
            const challenge = this.findChallengeByPositionId(id);
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
     * Validate multiple target IDs and return found/missing challenges with indices
     * @param positionIds - Array of position IDs to validate
     * @returns Validation result with found challenges, indices, and missing IDs
     */
    protected validateTargetIdsWithIndices(positionIds: string[]): {
        found: Challenge[];
        indices: number[];
        missing: string[];
        isValid: boolean;
    } {
        const found: Challenge[] = [];
        const indices: number[] = [];
        const missing: string[] = [];

        positionIds.forEach((id) => {
            const result = this.findChallengeWithIndexByPositionId(id);
            if (result) {
                found.push(result.challenge);
                indices.push(result.index);
            } else {
                missing.push(id);
            }
        });

        return {
            found,
            indices,
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
    ): {
        challenges: Challenge[];
        indices: number[];
        response?: CommandResponse;
    } {
        if (!targetId) {
            return {
                challenges: [],
                indices: [],
                response: this.createErrorResponse(
                    `Target ID required for ${operation} command`
                ),
            };
        }

        const shortIds = this.parseTargetIds(targetId);
        if (shortIds.length === 0) {
            return {
                challenges: [],
                indices: [],
                response: this.createErrorResponse(
                    `Invalid target ID format: ${targetId}`
                ),
            };
        }

        const validation = this.validateTargetIdsWithIndices(shortIds);
        if (!validation.isValid) {
            return {
                challenges: [],
                indices: [],
                response: this.createErrorResponse(
                    `Challenge(s) not found: ${validation.missing.join(", ")}`
                ),
            };
        }

        return { challenges: validation.found, indices: validation.indices };
    }

    /**
     * Handle single target ID with validation
     * @param targetId - Target ID string
     * @param operation - Operation name for error messages
     * @returns Challenge, index, and validation result
     */
    protected handleSingleTarget(
        targetId: string,
        operation: string
    ): {
        challenge: Challenge | null;
        index?: number;
        response?: CommandResponse;
    } {
        if (!targetId) {
            return {
                challenge: null,
                response: this.createErrorResponse(
                    `Target ID required for ${operation} command`
                ),
            };
        }

        const result = this.findChallengeWithIndexByPositionId(targetId.trim());
        if (!result) {
            return {
                challenge: null,
                response: this.createErrorResponse(
                    `Challenge #${targetId} not found`
                ),
            };
        }

        return { challenge: result.challenge, index: result.index };
    }
}
