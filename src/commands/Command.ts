import Challenge from "../classes/Challenge";
import ChallengeList from "../classes/ChallengeList";
import ConfigManager from "../classes/ConfigManager";
import type { CommandResponse } from "../types/CommandResponse";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
import {
    getChallengeByPosition,
    getChallengeWithIndex,
    isValidUserPosition,
} from "../utils/PositionUtils";
import { ResponseFormatter } from "../utils/ResponseFormatter";

/**
 * Enum for progress operation types to ensure type safety
 */
export enum ProgressOperation {
    INCREMENT = "increment",
    DECREMENT = "decrement",
    SET = "set",
}

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
     * @returns Error response
     */
    protected createErrorResponse(message: string): CommandResponse {
        return {
            message,
            error: true,
        };
    }

    /**
     * Create a success response
     * @param message - Success message
     * @returns Success response
     */
    protected createSuccessResponse(message: string): CommandResponse {
        return {
            message,
            error: false,
        };
    }

    /**
     * Create a success response with UI update data
     * @param message - Success message
     * @param uiUpdate - UI update data
     * @returns Success response with UI update data
     */
    protected createSuccessResponseWithUIUpdate(
        message: string,
        uiUpdate: UIUpdateData
    ): CommandResponse {
        return {
            message,
            error: false,
            uiUpdate,
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

    /**
     * Execute a progress operation with common pattern: find challenge, capture old progress, update list, format response
     * @param parsed - Parsed command data
     * @param operation - Progress operation type
     * @param parameterParser - Function to parse operation-specific parameters
     * @param progressMutator - Function to perform the progress update
     * @param validator - Optional function to validate parsed parameters
     * @param parameterErrorMessage - Optional custom error message for parameter parsing failures
     * @returns Command response
     */
    protected executeProgressOperation<T>(
        parsed: ParsedCommand,
        operation: ProgressOperation,
        parameterParser: (parsed: ParsedCommand) => T | null,
        progressMutator: (
            challenge: Challenge,
            parsedValue: T
        ) => Challenge | null,
        validator?: (parsedValue: T, challenge: Challenge) => void,
        parameterErrorMessage?: string
    ): CommandResponse {
        try {
            // Handle single target validation
            const { challenge, index, response } = this.handleSingleTarget(
                parsed.targetId || "",
                operation
            );
            if (response) {
                return response;
            }

            if (!challenge || index === undefined) {
                return this.createErrorResponse(
                    `Challenge not found for ${operation}`
                );
            }

            // Parse parameters
            const parsedValue = parameterParser(parsed);
            if (parsedValue === null) {
                return this.createErrorResponse(
                    parameterErrorMessage ||
                        `Invalid parameters for ${operation} command`
                );
            }

            // Validate if validator provided
            if (validator) {
                try {
                    validator(parsedValue, challenge);
                } catch (validationError: unknown) {
                    return this.createErrorResponse(
                        ResponseFormatter.formatError(
                            validationError,
                            `validating ${operation} parameters`
                        )
                    );
                }
            }

            // Store old progress for response
            const oldProgress = challenge.progress;

            // Apply mutation
            const updatedChallenge = progressMutator(challenge, parsedValue);
            if (!updatedChallenge) {
                return this.createErrorResponse(
                    `Failed to ${operation} challenge progress`
                );
            }

            // Format response
            const responseMessage = ResponseFormatter.formatProgressResponse(
                challenge,
                index,
                oldProgress,
                {
                    includeShortId: true,
                    includeProgress: true,
                }
            );

            // Create UI update data - progress changes are essentially edits
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.EDIT,
                challengeIndices: [index],
                challenges: [updatedChallenge],
                updateTimers: true,
                updateCount: true,
            };

            return this.createSuccessResponseWithUIUpdate(
                responseMessage,
                uiUpdate
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    `${operation}ing challenge progress`
                )
            );
        }
    }
}
