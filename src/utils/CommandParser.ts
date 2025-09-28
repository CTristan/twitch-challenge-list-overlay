import {
    CommandType,
    normalizeCommand,
    TARGET_ID_COMMANDS,
} from "../types/CommandTypes";
import Timer from "./Timer";
import { ValidationUtils } from "./ValidationUtils";

/**
 * @class CommandParser
 * Parses command syntax with key=value parameters, flexible ordering,
 * and smart quoting for the Twitch challenge overlay system.
 */
export default class CommandParser {
    private static readonly PARAMETER_ALIASES: Record<string, string> = {
        d: "desc",
        description: "desc", // Allow both desc and description
        a: "amount",
        t: "timer",
    };

    private static readonly VALID_PARAMETERS = new Set([
        "title", // Internally generated from first token for add commands
        "desc",
        "amount",
        "timer",
    ]);

    /**
     * Parse a command with key=value parameters
     * @param input - Raw command input (e.g., "add title=\"Kick zombies\" amount=30")
     * @returns Parsed command object
     */
    static parseCommand(input: string): ParsedCommand {
        const result: ParsedCommand = {
            command: "",
            parameters: {},
            rawParameters: input,
            errors: [],
            isValid: false,
        };

        try {
            const trimmed = input.trim();
            if (!trimmed) {
                result.errors.push("Command cannot be empty");
                return result;
            }

            // Split into command and parameters
            const parts = CommandParser.splitCommand(trimmed);
            result.command = parts.command;
            if (parts.subCommand !== undefined) {
                result.subCommand = parts.subCommand;
            }
            if (parts.targetId !== undefined) {
                result.targetId = parts.targetId;
            }

            if (parts.parameterString) {
                result.rawParameters = parts.parameterString;
                result.parameters = CommandParser.parseParameters(
                    parts.parameterString,
                    result.command
                );

                // Resolve aliases
                result.parameters = CommandParser.resolveAliases(
                    result.parameters
                );

                // Validate parameters
                const validation = CommandParser.validateParameters(
                    result.parameters,
                    result.command
                );
                result.errors = validation.errors;
                result.isValid =
                    validation.isValid && result.errors.length === 0;
            } else {
                result.rawParameters = "";
                result.isValid = true; // Commands without parameters are valid
            }
        } catch (error) {
            result.errors.push(
                error instanceof Error ? error.message : String(error)
            );
        }

        return result;
    }

    /**
     * Split command into main command, subcommand, target ID, and parameters
     * @param input - Command input
     * @returns Command parts
     */
    private static splitCommand(input: string): {
        command: string;
        subCommand?: string;
        targetId?: string;
        parameterString?: string;
    } {
        const parts = input.split(/\s+/);
        const command = parts[0]?.toLowerCase() ?? "";

        // Normalize command using the type system
        const normalizedCommand = normalizeCommand(command);

        // Handle different command patterns based on command type
        if (normalizedCommand && TARGET_ID_COMMANDS.has(normalizedCommand)) {
            // Commands with target ID: "done 1,3" or "edit A7 title=..." or "+ A7 5"
            const remainingParts = parts.slice(1);

            if (remainingParts.length > 0) {
                const firstPart = remainingParts[0];
                if (!firstPart) {
                    return { command };
                }

                // Special handling for increment/decrement commands: "+ A7 5" or "- A7 3"
                if (
                    (normalizedCommand === "+" ||
                        normalizedCommand === "-" ||
                        normalizedCommand === "set") &&
                    remainingParts.length >= 2
                ) {
                    // Format: "command targetId amount"
                    const targetId = remainingParts[0];
                    const parameterString = remainingParts.slice(1).join(" ");
                    const result: {
                        command: string;
                        targetId?: string;
                        parameterString?: string;
                    } = { command };

                    if (targetId !== undefined) {
                        result.targetId = targetId;
                    }
                    if (parameterString) {
                        result.parameterString = parameterString;
                    }
                    return result;
                }

                const secondPart = remainingParts[1];
                // For commands that support multiple targets, check if we have comma-separated IDs
                if (
                    firstPart.includes(",") ||
                    (remainingParts.length > 1 &&
                        secondPart &&
                        !secondPart.includes("="))
                ) {
                    // Find where parameters start (first part with =)
                    let paramStartIndex = remainingParts.findIndex((part) =>
                        part.includes("=")
                    );
                    if (paramStartIndex === -1) {
                        // No parameters, everything is target IDs
                        const result: {
                            command: string;
                            targetId?: string;
                        } = { command };

                        const targetIdString = remainingParts.join(" ");
                        if (targetIdString) {
                            result.targetId = targetIdString;
                        }
                        return result;
                    } else {
                        // Split between target IDs and parameters
                        const result: {
                            command: string;
                            targetId?: string;
                            parameterString?: string;
                        } = { command };

                        const targetIdString = remainingParts
                            .slice(0, paramStartIndex)
                            .join(" ");
                        const paramString = remainingParts
                            .slice(paramStartIndex)
                            .join(" ");

                        if (targetIdString) {
                            result.targetId = targetIdString;
                        }
                        if (paramString) {
                            result.parameterString = paramString;
                        }
                        return result;
                    }
                } else {
                    // Single target ID: "edit A7 title=..."
                    const targetId = remainingParts[0];
                    const result: {
                        command: string;
                        targetId?: string;
                        parameterString?: string;
                    } = { command };

                    if (targetId !== undefined) {
                        result.targetId = targetId;
                    }

                    const paramString = remainingParts.slice(1).join(" ");
                    if (paramString) {
                        result.parameterString = paramString;
                    }
                    return result;
                }
            } else {
                // No target ID provided
                return {
                    command,
                };
            }
        } else {
            // Simple commands: "add title=..." or "list" or "clearlist"
            const result: {
                command: string;
                parameterString?: string;
            } = { command };

            const paramString = parts.slice(1).join(" ");
            if (paramString) {
                result.parameterString = paramString;
            }
            return result;
        }
    }

    /**
     * Parse parameters from string, treating first token as title for add commands and rest as key=value parameters
     * @param paramString - Parameter string
     * @param command - Command type to determine if title extraction is needed
     * @returns Parsed parameters with title extracted from first token for add commands
     */
    private static parseParameters(
        paramString: string,
        command: string
    ): ParsedCommandParameters {
        const parameters: ParsedCommandParameters = {};
        const tokens = CommandParser.tokenize(paramString);

        if (tokens.length === 0) {
            return parameters;
        }

        let startIndex = 0;

        // For add commands, handle title extraction
        if (command === CommandType.ADD) {
            const firstToken = tokens[0];
            if (firstToken) {
                // Check if first token is quoted (contains quotes)
                if (
                    (firstToken.startsWith('"') && firstToken.endsWith('"')) ||
                    (firstToken.startsWith("'") && firstToken.endsWith("'"))
                ) {
                    // Quoted title - use first token only
                    parameters.title = firstToken;
                    startIndex = 1; // Start parsing key=value parameters from second token
                } else {
                    // Check if any remaining tokens contain key=value pairs
                    const hasKeyValueParams = tokens
                        .slice(1)
                        .some((token) => token.includes("="));

                    if (hasKeyValueParams) {
                        // Mixed syntax: unquoted title + parameters
                        parameters.title = firstToken;
                        startIndex = 1;
                    } else {
                        // Simple string syntax: entire remaining string is title
                        parameters.title = tokens.join(" ");
                        startIndex = tokens.length; // Skip all tokens since they're part of title
                    }
                }
            }
        }

        // Parse remaining tokens as key=value parameters
        for (let i = startIndex; i < tokens.length; i++) {
            const token = tokens[i];
            if (!token) continue;

            if (token.includes("=")) {
                const [key, ...valueParts] = token.split("=");
                const value = valueParts.join("="); // Handle values with = in them

                if (key && value !== undefined) {
                    parameters[key.toLowerCase()] = value;
                }
            }
        }

        return parameters;
    }

    /**
     * Tokenize parameter string, respecting quoted strings
     * @param input - Input string
     * @returns Array of tokens
     */
    private static tokenize(input: string): string[] {
        const tokens: string[] = [];
        let current = "";
        let inQuotes = false;
        let quoteChar = "";

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                current += char;
                quoteChar = "";
            } else if (!inQuotes && char === " ") {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = "";
                }
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            tokens.push(current.trim());
        }

        return tokens;
    }

    /**
     * Resolve parameter aliases to canonical names
     * @param parameters - Raw parameters
     * @returns Parameters with resolved aliases
     */
    private static resolveAliases(
        parameters: ParsedCommandParameters
    ): ParsedCommandParameters {
        const resolved: ParsedCommandParameters = {};

        for (const [key, value] of Object.entries(parameters)) {
            const canonicalKey = CommandParser.PARAMETER_ALIASES[key] || key;
            resolved[canonicalKey] = value;
        }

        return resolved;
    }

    /**
     * Validate parameters for a specific command
     * @param parameters - Parsed parameters
     * @param command - Command name
     * @returns Validation result
     */
    private static validateParameters(
        parameters: ParsedCommandParameters,
        command: string
    ): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for unknown parameters
        for (const key of Object.keys(parameters)) {
            if (!CommandParser.VALID_PARAMETERS.has(key)) {
                errors.push(
                    `Unknown parameter '${key}'. Valid parameters: ${Array.from(
                        CommandParser.VALID_PARAMETERS
                    ).join(", ")}`
                );
            }
        }

        // Validate specific parameter values using ValidationUtils
        const paramValidation =
            ValidationUtils.validateCommandParameters(parameters);
        errors.push(...paramValidation.errors);
        warnings.push(...paramValidation.warnings);

        if (parameters.timer !== undefined) {
            try {
                Timer.parseDuration(parameters.timer);
            } catch (error) {
                errors.push(
                    `Timer format invalid: ${
                        error instanceof Error ? error.message : String(error)
                    }`
                );
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Remove quotes from a string value
     * @param value - Potentially quoted string
     * @returns Unquoted string
     */
    static unquoteString(value: string): string {
        return ValidationUtils.unquoteString(value);
    }

    /**
     * Parse a simple positional command (for backward compatibility)
     * @param input - Command input
     * @returns Parsed parameters
     */
    static parsePositionalCommand(input: string): {
        index?: number;
        value?: string;
        values?: string[];
    } {
        const trimmed = input.trim();
        if (!trimmed) return {};

        // Handle comma-separated values (e.g., "1, 2, 3")
        if (trimmed.includes(",")) {
            const values = trimmed
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v);
            return { values };
        }

        // Handle single index + value (e.g., "1 new description")
        const spaceIndex = trimmed.search(/(?<=\d)\s/);
        if (spaceIndex !== -1) {
            const indexStr = trimmed.slice(0, spaceIndex);
            const value = trimmed.slice(spaceIndex + 1);
            const index = parseInt(indexStr, 10);

            if (!isNaN(index)) {
                return { index: index - 1, value }; // Convert to 0-based index
            }
        }

        // Handle single value
        const singleIndex = parseInt(trimmed, 10);
        if (!isNaN(singleIndex)) {
            return { index: singleIndex - 1 }; // Convert to 0-based index
        }

        return { value: trimmed };
    }
}
