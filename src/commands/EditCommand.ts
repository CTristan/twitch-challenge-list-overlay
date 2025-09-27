import type { CommandResponse } from "../types/CommandResponse";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import { ValidationUtils } from "../utils/ValidationUtils";
import { BaseCommand } from "./Command";

/**
 * Command to edit existing challenges
 * Handles: !ch edit 1 title="New Title" desc="New Description" amount=5
 */
export class EditCommand extends BaseCommand {
    /**
     * Execute the edit command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Validate target ID
            const { challenge, index, response } = this.handleSingleTarget(
                parsed.targetId || "",
                "edit"
            );
            if (response) {
                return response;
            }

            if (!challenge || index === undefined) {
                return this.createErrorResponse("Challenge not found");
            }

            // Track what was updated
            const updates: string[] = [];

            // Update title if provided
            if (parsed.parameters.title) {
                try {
                    const newTitle = ValidationUtils.unquoteString(
                        parsed.parameters.title
                    );
                    const validatedTitle =
                        ValidationUtils.validateChallengeTitle(newTitle);
                    challenge.setTitle(validatedTitle);
                    updates.push("title");
                } catch (error: unknown) {
                    return this.createErrorResponse(
                        ResponseFormatter.formatError(error, "updating title")
                    );
                }
            }

            // Update description if provided
            if (parsed.parameters.desc !== undefined) {
                try {
                    const newDesc = ValidationUtils.unquoteString(
                        parsed.parameters.desc
                    );
                    const validatedDesc =
                        ValidationUtils.validateChallengeDescription(newDesc, {
                            allowEmpty: true,
                        });
                    challenge.setDescription(validatedDesc);
                    updates.push("description");
                } catch (error: unknown) {
                    return this.createErrorResponse(
                        ResponseFormatter.formatError(
                            error,
                            "updating description"
                        )
                    );
                }
            }

            // Update amount if provided
            if (parsed.parameters.amount) {
                try {
                    const newAmount = parseInt(parsed.parameters.amount, 10);
                    const validatedAmount =
                        ValidationUtils.validateChallengeAmount(newAmount);
                    challenge.setAmount(validatedAmount);
                    updates.push("amount");
                } catch (error: unknown) {
                    return this.createErrorResponse(
                        ResponseFormatter.formatError(error, "updating amount")
                    );
                }
            }

            // Update timer if provided
            if (parsed.parameters.timer) {
                try {
                    const Timer = require("../utils/Timer").default;
                    Timer.parseDuration(parsed.parameters.timer); // Validate format
                    challenge.setTimer(parsed.parameters.timer);
                    updates.push("timer");
                } catch (error: unknown) {
                    return this.createErrorResponse(
                        ResponseFormatter.formatError(error, "updating timer")
                    );
                }
            }

            // Check if any updates were made
            if (updates.length === 0) {
                return this.createErrorResponse(
                    "No valid parameters provided. Use: title, desc, amount, or timer"
                );
            }

            // Changes are automatically saved to localStorage

            // Format response
            const responseMessage = ResponseFormatter.formatEditResponse(
                challenge,
                index,
                {
                    includeShortId: true,
                }
            );

            // Create UI update data
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.EDIT,
                challengeIndices: [index],
                challenges: [challenge],
                updateTimers: true,
                updateCount: true,
            };

            return this.createSuccessResponseWithUIUpdate(
                responseMessage,
                uiUpdate
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(error, "editing challenge")
            );
        }
    }
}
