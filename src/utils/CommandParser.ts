import { normalizeCommand, TARGET_ID_COMMANDS } from "../types/CommandTypes";
import Timer from "./Timer";

/**
 * @class CommandParser
 * Parses command syntax with key=value parameters, flexible ordering,
 * and smart quoting for the Twitch challenge overlay system.
 */
export default class CommandParser {
    private static readonly PARAMETER_ALIASES: Record<string, string> = {
        t: "title",
        d: "desc",
        description: "desc", // Allow both desc and description
        a: "amount",
        tm: "timer",
    };

    private static readonly VALID_PARAMETERS = new Set([
        "title",
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
            result.subCommand = parts.subCommand;
            result.targetId = parts.targetId;

            if (parts.parameterString) {
                result.rawParameters = parts.parameterString;
                result.parameters = CommandParser.parseParameters(
                    parts.parameterString
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
        const command = parts[0].toLowerCase();

        // Normalize command using the type system
        const normalizedCommand = normalizeCommand(command);

        // Handle different command patterns based on command type
        if (normalizedCommand && TARGET_ID_COMMANDS.has(normalizedCommand)) {
            // Commands with target ID: "+ A7 5" or "edit A7 title=..."
            const targetId = parts[1];
            return {
                command,
                targetId,
                parameterString: parts.slice(2).join(" "),
            };
        } else {
            // Simple commands: "add title=..." or "list" or "clearlist"
            return {
                command,
                parameterString: parts.slice(1).join(" "),
            };
        }
    }

    /**
     * Parse key=value parameters from string
     * @param paramString - Parameter string
     * @returns Parsed parameters
     */
    private static parseParameters(
        paramString: string
    ): ParsedCommandParameters {
        const parameters: ParsedCommandParameters = {};
        const tokens = CommandParser.tokenize(paramString);

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

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

        // Validate specific parameter values
        if (parameters.title !== undefined) {
            const title = CommandParser.unquoteString(parameters.title);
            if (!title.trim()) {
                errors.push("Title cannot be empty");
            } else if (title.length > 100) {
                errors.push("Title too long (max 100 characters)");
            }
        }

        if (parameters.desc !== undefined) {
            const desc = CommandParser.unquoteString(parameters.desc);
            if (desc.length > 200) {
                errors.push("Description too long (max 200 characters)");
            }
        }

        if (parameters.amount !== undefined) {
            const amount = parseInt(parameters.amount, 10);
            if (isNaN(amount) || amount < 1) {
                errors.push("Amount must be a positive integer");
            }
        }

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

        // Command-specific validation
        if (command === "add") {
            // If using key=value parameter syntax, title is required
            // If using simple string syntax (no key=value parameters), validation is handled in CommandHandler
            const hasKeyValueParameters = Object.keys(parameters).length > 0;
            if (hasKeyValueParameters && !parameters.title) {
                errors.push("Title is required for add command");
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
        if (!value) return "";

        const trimmed = value.trim();
        if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
            const unquoted = trimmed.slice(1, -1);
            // Handle escaped quotes
            return unquoted.replace(/\\"/g, '"').replace(/\\'/g, "'");
        }

        return trimmed;
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
