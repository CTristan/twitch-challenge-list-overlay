import Challenge from "../classes/Challenge";
import ChallengeList from "../classes/ChallengeList";
import ConfigManager from "../classes/ConfigManager";
import { CommandType, normalizeCommand } from "../types/CommandTypes";
import CommandParser from "./CommandParser";
import IDManager from "./IDManager";

/**
 * @class CommandHandler
 * Handles command syntax for the Twitch challenge overlay system.
 * Supports key=value parameters, short IDs, timer functionality, and progress tracking.
 */
export default class CommandHandler {
    private challengeList: ChallengeList;
    private configManager: ConfigManager;
    private idManager: IDManager;

    constructor(challengeList: ChallengeList, configManager: ConfigManager) {
        this.challengeList = challengeList;
        this.configManager = configManager;
        this.idManager = IDManager.getInstance();
    }

    /**
     * Handle command syntax
     * @param username - Username of the command sender
     * @param command - Command name (without !)
     * @param message - Command parameters
     * @param flags - User permission flags
     * @returns Command response
     */
    handleCommand(
        username: string,
        command: string,
        message: string,
        flags: { broadcaster: boolean; mod: boolean }
    ): CommandResponse {
        try {
            // Check if this is a ch command (starts with "ch")
            if (!command.toLowerCase().startsWith("ch")) {
                return { message: "", error: true, action: "not_ch_command" };
            }

            // Parse the command
            const subCommand = command.slice(2).trim(); // Remove "ch" prefix
            const fullCommand = subCommand + (message ? ` ${message}` : "");
            const parsed = CommandParser.parseCommand(fullCommand);

            if (!parsed.isValid) {
                return {
                    message: `Invalid command: ${parsed.errors.join(", ")}`,
                    error: true,
                };
            }

            // Normalize the command using the type system
            const commandType = normalizeCommand(parsed.command);
            if (!commandType) {
                return {
                    message: `Unknown command: ${parsed.command}. Try !ch help`,
                    error: true,
                };
            }

            // Check permissions - ALL commands require moderator/broadcaster privileges
            if (!this.isMod(flags)) {
                return {
                    message:
                        "Only moderators and the broadcaster can manage challenges",
                    error: true,
                };
            }

            // Route to appropriate handler using normalized command types
            switch (commandType) {
                case CommandType.ADD:
                    return this.handleAdd(parsed, username);
                case CommandType.INCREMENT:
                    return this.handleIncrement(parsed, username);
                case CommandType.DECREMENT:
                    return this.handleDecrement(parsed, username);
                case CommandType.SET:
                    return this.handleSetProgress(parsed, username);
                case CommandType.EDIT:
                    return this.handleEdit(parsed, username);
                case CommandType.DONE:
                    return this.handleComplete(parsed, username);
                case CommandType.FAIL:
                    return this.handleFail(parsed, username);
                case CommandType.DELETE:
                    return this.handleDelete(parsed, username);
                case CommandType.LIST:
                    return this.handleList(parsed, username);
                case CommandType.SHOW:
                    return this.handleShow(parsed, username);
                case CommandType.CHECK:
                    return this.handleCheck(parsed, username);
                case CommandType.CLEAR_ALL:
                    return this.handleClearAll(parsed, username);
                case CommandType.CLEAR_DONE:
                    return this.handleClearDone(parsed, username);
                case CommandType.HELP:
                    return this.handleHelp(parsed, username);
                default:
                    return {
                        message: `Unknown command: ${parsed.command}. Try !ch help`,
                        error: true,
                    };
            }
        } catch (error) {
            return {
                message: `Error: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle add command: !ch add title="..." desc="..." amount=N timer=Xm
     */
    private handleAdd(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        const { title, desc, amount, timer } = parsed.parameters;

        // Support simple string syntax as fallback: "add Challenge Name"
        let challengeTitle: string;
        if (!title && parsed.rawParameters) {
            // If no title parameter but we have raw parameters, use them as the title
            challengeTitle = parsed.rawParameters.trim();
        } else if (title) {
            challengeTitle = CommandParser.unquoteString(title);
        } else {
            return {
                message:
                    'Title is required. Usage: !ch add title="Challenge name" or !ch add Challenge name',
                error: true,
            };
        }

        try {
            const challengeDesc = desc ? CommandParser.unquoteString(desc) : "";
            const challengeAmount = amount ? parseInt(amount, 10) : 1;

            // Check challenge limit
            const maxChallenges = this.configManager.get("maxChallenges") || 10;
            if (this.challengeList.challenges.length >= maxChallenges) {
                return {
                    message:
                        "Maximum number of challenges reached. Delete some challenges first.",
                    error: true,
                };
            }

            // Create challenge
            const challenge = new Challenge(challengeTitle, {
                description: challengeDesc,
                amount: challengeAmount,
                timer: timer,
            });

            // Start timer if present
            if (timer) {
                challenge.startTimer();
            }

            // Add to list
            this.challengeList.addChallengeObjects(challenge);

            // Format response
            const timerStr = challenge.timer
                ? ` • ${challenge.getTimerString()} timer started`
                : "";
            const response = `[#${challenge.shortId}] ${
                challenge.title
            } — ${challenge.getProgressString()}${timerStr} added!`;

            return {
                message: `${response}`,
                error: false,
                challengeId: challenge.shortId,
                action: "add",
            };
        } catch (error) {
            return {
                message: `Error creating challenge: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle increment command: !ch + A7 [amount]
     */
    private handleIncrement(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        if (!parsed.targetId) {
            return {
                message: "Challenge ID required. Usage: !ch + A7 [amount]",
                error: true,
            };
        }

        const challenge = this.findChallengeByShortId(parsed.targetId);
        if (!challenge) {
            return {
                message: `Challenge #${parsed.targetId} not found. Use !ch list to see all challenges.`,
                error: true,
            };
        }

        const incrementAmount = parsed.parameters.amount
            ? parseInt(parsed.parameters.amount, 10)
            : 1;
        if (isNaN(incrementAmount) || incrementAmount < 1) {
            return {
                message: "Increment amount must be a positive number",
                error: true,
            };
        }

        try {
            const oldProgress = challenge.progress;
            challenge.incrementProgress(incrementAmount);

            const statusEmoji = challenge.getStatusEmoji();
            const timerStr = challenge.timer?.isActive
                ? ` • ${challenge.getTimerString()}`
                : "";

            let response = `[#${
                challenge.shortId
            }] Progress: ${challenge.getProgressString()}${timerStr}`;

            if (challenge.isComplete()) {
                response = `[#${
                    challenge.shortId
                }] Completed! Final: ${challenge.getProgressString()}`;
            }

            return {
                message: `${response}`,
                error: false,
                challengeId: challenge.shortId,
                action: "increment",
            };
        } catch (error) {
            return {
                message: `Error updating progress: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle decrement command: !ch - A7 [amount]
     */
    private handleDecrement(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        if (!parsed.targetId) {
            return {
                message: "Challenge ID required. Usage: !ch - A7 [amount]",
                error: true,
            };
        }

        const challenge = this.findChallengeByShortId(parsed.targetId);
        if (!challenge) {
            return {
                message: `Challenge #${parsed.targetId} not found. Use !ch list to see all challenges.`,
                error: true,
            };
        }

        const decrementAmount = parsed.parameters.amount
            ? parseInt(parsed.parameters.amount, 10)
            : 1;
        if (isNaN(decrementAmount) || decrementAmount < 1) {
            return {
                message: "Decrement amount must be a positive number",
                error: true,
            };
        }

        try {
            challenge.decrementProgress(decrementAmount);

            const timerStr = challenge.timer?.isActive
                ? ` • ${challenge.getTimerString()}`
                : "";
            const response = `[#${
                challenge.shortId
            }] Progress: ${challenge.getProgressString()}${timerStr}`;

            return {
                message: `${response}`,
                error: false,
                challengeId: challenge.shortId,
                action: "decrement",
            };
        } catch (error) {
            return {
                message: `Error updating progress: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Find challenge by short ID
     */
    private findChallengeByShortId(shortId: string): Challenge | null {
        // Get fresh IDManager instance to handle singleton resets in tests
        const idManager = IDManager.getInstance();
        const longId = idManager.getLongId(shortId);
        if (!longId) return null;

        return (
            this.challengeList.challenges.find((c) => c.id === longId) || null
        );
    }

    /**
     * Check if user has moderator privileges
     */
    private isMod(flags: { broadcaster: boolean; mod: boolean }): boolean {
        return flags.broadcaster || flags.mod;
    }

    /**
     * Handle list command: !ch list
     */
    private handleList(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        const challenges = this.challengeList.challenges.filter(
            (c) => !c.isComplete()
        );

        if (challenges.length === 0) {
            return {
                message: "No active challenges. Use !ch add to create one!",
                error: false,
            };
        }

        const list = challenges.slice(0, 5).map((challenge) => {
            const statusEmoji = challenge.getStatusEmoji();
            const timerStr = challenge.timer?.isActive
                ? ` ${challenge.getTimerString()}`
                : "";
            return `#${challenge.shortId} ${
                challenge.title
            } (${challenge.getProgressString()})${timerStr}`;
        });

        const moreText =
            challenges.length > 5 ? ` (+${challenges.length - 5} more)` : "";

        return {
            message: `Active challenges: ${list.join(" • ")}${moreText}`,
            error: false,
            action: "list",
        };
    }

    /**
     * Handle show command: !ch show A7
     */
    private handleShow(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        if (!parsed.targetId) {
            return {
                message: "Challenge ID required. Usage: !ch show A7",
                error: true,
            };
        }

        const challenge = this.findChallengeByShortId(parsed.targetId);
        if (!challenge) {
            return {
                message: `Challenge #${parsed.targetId} not found.`,
                error: true,
            };
        }

        const statusEmoji = challenge.getStatusEmoji();
        const timerStr = challenge.timer?.isActive
            ? ` • Timer: ${challenge.getTimerString()}`
            : "";
        const descStr = challenge.description
            ? ` • ${challenge.description}`
            : "";

        const response = `[#${challenge.shortId}] ${
            challenge.title
        } — ${challenge.getProgressString()}${timerStr}${descStr}`;

        return {
            message: `${response}`,
            error: false,
            challengeId: challenge.shortId,
            action: "show",
        };
    }

    /**
     * Handle set progress command: !ch set A7 25
     */
    private handleSetProgress(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        if (!parsed.targetId) {
            return {
                message:
                    "Challenge ID and progress value required. Usage: !ch set A7 25",
                error: true,
            };
        }

        const challenge = this.findChallengeByShortId(parsed.targetId);
        if (!challenge) {
            return {
                message: `Challenge #${parsed.targetId} not found.`,
                error: true,
            };
        }

        // Get progress value from parameters string
        const progressValue = parseInt(
            parsed.rawParameters.split(/\s+/)[1] || "0",
            10
        );
        if (isNaN(progressValue) || progressValue < 0) {
            return {
                message: "Progress value must be a non-negative number",
                error: true,
            };
        }

        try {
            challenge.setProgress(progressValue);

            const timerStr = challenge.timer?.isActive
                ? ` • ${challenge.getTimerString()}`
                : "";
            let response = `[#${
                challenge.shortId
            }] Progress set to: ${challenge.getProgressString()}${timerStr}`;

            if (challenge.isComplete()) {
                response = `[#${
                    challenge.shortId
                }] Completed! Final: ${challenge.getProgressString()}`;
            }

            return {
                message: `${response}`,
                error: false,
                challengeId: challenge.shortId,
                action: "set",
            };
        } catch (error) {
            return {
                message: `Error setting progress: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle edit command: !ch edit A7 title="New title" amount=50
     */
    private handleEdit(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        if (!parsed.targetId) {
            return {
                message:
                    'Challenge ID required. Usage: !ch edit A7 title="New title"',
                error: true,
            };
        }

        const challenge = this.findChallengeByShortId(parsed.targetId);
        if (!challenge) {
            return {
                message: `Challenge #${parsed.targetId} not found.`,
                error: true,
            };
        }

        const { title, desc, amount, timer } = parsed.parameters;
        let changes: string[] = [];

        try {
            if (title) {
                const newTitle = CommandParser.unquoteString(title);
                challenge.setTitle(newTitle);
                changes.push("title");
            }

            if (desc !== undefined) {
                const newDesc = CommandParser.unquoteString(desc);
                challenge.setDescription(newDesc);
                changes.push("description");
            }

            if (amount) {
                const newAmount = parseInt(amount, 10);
                challenge.setAmount(newAmount);
                changes.push("amount");
            }

            if (timer) {
                challenge.setTimer(timer);
                challenge.startTimer();
                changes.push("timer");
            }

            if (changes.length === 0) {
                return {
                    message:
                        "No changes specified. Use: title, desc, amount, or timer parameters",
                    error: true,
                };
            }

            const timerStr = challenge.timer?.isActive
                ? ` • ${challenge.getTimerString()}`
                : "";
            const response = `[#${challenge.shortId}] Updated ${changes.join(
                ", "
            )} — ${challenge.getProgressString()}${timerStr}`;

            return {
                message: `${response}`,
                error: false,
                challengeId: challenge.shortId,
                action: "edit",
            };
        } catch (error) {
            return {
                message: `Error editing challenge: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle complete command: !ch done A7 or !ch done A7,B8,C9
     */
    private handleComplete(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        if (!parsed.targetId) {
            return {
                message: "Challenge ID required. Usage: !ch done A7",
                error: true,
            };
        }

        // Handle multiple target IDs (comma-separated)
        // Need to reconstruct the full target string from targetId and rawParameters
        const fullTargetString = parsed.rawParameters
            ? `${parsed.targetId} ${parsed.rawParameters}`
            : parsed.targetId;

        const targetIds = fullTargetString.includes(",")
            ? fullTargetString
                  .split(",")
                  .map((id) => id.trim())
                  .filter((id) => id)
            : [parsed.targetId];

        const completedChallenges: string[] = [];
        const errors: string[] = [];

        for (const targetId of targetIds) {
            const challenge = this.findChallengeByShortId(targetId);
            if (!challenge) {
                errors.push(`Challenge #${targetId} not found`);
                continue;
            }

            if (challenge.isComplete()) {
                errors.push(
                    `Challenge #${challenge.shortId} is already complete`
                );
                continue;
            }

            try {
                challenge.setProgress(challenge.amount); // Set to full amount
                challenge.setCompletionStatus(true);
                completedChallenges.push(challenge.shortId);
            } catch (error) {
                errors.push(
                    `Error completing challenge #${challenge.shortId}: ${
                        error instanceof Error ? error.message : String(error)
                    }`
                );
            }
        }

        // Return response based on results
        if (completedChallenges.length === 0) {
            return {
                message:
                    errors.length > 0
                        ? errors.join(", ")
                        : "No challenges were completed",
                error: true,
            };
        }

        const successMessage =
            completedChallenges.length === 1
                ? `[#${completedChallenges[0]}] Completed!`
                : `Completed challenges: ${completedChallenges
                      .map((id) => `#${id}`)
                      .join(", ")}`;

        const finalMessage =
            errors.length > 0
                ? `${successMessage}. Errors: ${errors.join(", ")}`
                : successMessage;

        return {
            message: finalMessage,
            error: false,
            challengeId: completedChallenges.join(","),
            action: "complete",
        };
    }

    /**
     * Handle fail command: !ch fail A7
     */
    private handleFail(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        if (!parsed.targetId) {
            return {
                message: "Challenge ID required. Usage: !ch fail A7",
                error: true,
            };
        }

        const challenge = this.findChallengeByShortId(parsed.targetId);
        if (!challenge) {
            return {
                message: `Challenge #${parsed.targetId} not found.`,
                error: true,
            };
        }

        if (challenge.isFailed()) {
            return {
                message: `Challenge #${challenge.shortId} is already failed!`,
                error: true,
            };
        }

        try {
            challenge.setFailureStatus(true);

            const response = `[#${
                challenge.shortId
            }] Failed: ${challenge.getProgressString()}`;

            return {
                message: `${response}`,
                error: false,
                challengeId: challenge.shortId,
                action: "fail",
            };
        } catch (error) {
            return {
                message: `Error failing challenge: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle delete command: !ch del A7
     */
    private handleDelete(
        parsed: ParsedCommand,
        username: string
    ): CommandResponse {
        if (!parsed.targetId) {
            return {
                message: "Challenge ID required. Usage: !ch del A7",
                error: true,
            };
        }

        const challenge = this.findChallengeByShortId(parsed.targetId);
        if (!challenge) {
            return {
                message: `Challenge #${parsed.targetId} not found.`,
                error: true,
            };
        }

        try {
            // Find the index of the challenge in the list
            const index = this.challengeList.challenges.findIndex(
                (c) => c.id === challenge.id
            );
            if (index === -1) {
                return {
                    message: `Challenge #${parsed.targetId} not found in list.`,
                    error: true,
                };
            }

            // Delete the challenge
            this.challengeList.deleteChallenges([index]);

            // Remove ID mapping
            this.idManager.removeMapping(challenge.id);

            const response = `[#${challenge.shortId}] "${challenge.title}" deleted`;

            return {
                message: `${response}`,
                error: false,
                challengeId: challenge.shortId,
                action: "delete",
            };
        } catch (error) {
            return {
                message: `Error deleting challenge: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle check command: !ch check (legacy format)
     */
    private handleCheck(
        _parsed: ParsedCommand,
        _username: string
    ): CommandResponse {
        const challengeMap = this.challengeList.checkChallenges();
        const list = [];
        for (let [challengeNumber, challenge] of challengeMap) {
            list.push(`📝 ${challengeNumber + 1}. ${challenge.description}`);
        }
        const responseDetail = list.join(" ");

        if (responseDetail === "") {
            return {
                message: "No challenges found. Use !ch add to create one!",
                error: false,
            };
        } else {
            return {
                message: `Your current challenge(s) are: ${responseDetail}`,
                error: false,
            };
        }
    }

    /**
     * Handle clear all command: !ch clearlist / !ch clearall
     */
    private handleClearAll(
        _parsed: ParsedCommand,
        _username: string
    ): CommandResponse {
        try {
            this.challengeList.clearChallengeList();
            return {
                message: "All challenges have been cleared",
                error: false,
                action: "clearAll",
            };
        } catch (error) {
            return {
                message: `Error clearing challenges: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle clear done command: !ch cleardone
     */
    private handleClearDone(
        _parsed: ParsedCommand,
        _username: string
    ): CommandResponse {
        try {
            this.challengeList.clearDoneChallenges();
            return {
                message: "All done challenges have been cleared",
                error: false,
                action: "clearDone",
            };
        } catch (error) {
            return {
                message: `Error clearing done challenges: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error: true,
            };
        }
    }

    /**
     * Handle help command: !ch help
     */
    private handleHelp(
        _parsed: ParsedCommand,
        _username: string
    ): CommandResponse {
        const helpMessage =
            "Available commands: !ch add, !ch edit, !ch done, !ch delete, !ch list, !ch check, !ch clearlist, !ch cleardone, !ch help";
        return {
            message: helpMessage,
            error: false,
        };
    }
}
