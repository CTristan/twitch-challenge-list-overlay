/**
 * @class ValidationUtils
 * Centralized validation utilities for the Twitch Challenge List Overlay.
 * Consolidates validation logic from Challenge, CommandParser, and ConfigManager
 * to eliminate duplication and provide consistent validation behavior.
 */
export class ValidationUtils {
    /**
     * Validate a string field with type checking, trimming, and length constraints
     * @param value - The value to validate
     * @param fieldName - Name of the field for error messages
     * @param options - Validation options
     * @returns Validated and trimmed string
     * @throws Error if validation fails
     */
    static validateString(
        value: any,
        fieldName: string,
        options: {
            required?: boolean;
            minLength?: number;
            maxLength?: number;
            allowEmpty?: boolean;
        } = {}
    ): string {
        const {
            required = true,
            minLength = 0,
            maxLength,
            allowEmpty = false,
        } = options;

        // Type check
        if (typeof value !== "string") {
            throw new Error(`${fieldName} must be of type string`);
        }

        // Trim the value
        const trimmed = value.trim();

        // Check if required
        if (required && !allowEmpty && trimmed.length === 0) {
            throw new Error(`${fieldName} cannot be empty`);
        }

        // Check minimum length
        if (minLength > 0 && trimmed.length < minLength) {
            throw new Error(
                `${fieldName} must be at least ${minLength} characters long`
            );
        }

        // Check maximum length
        if (maxLength && trimmed.length > maxLength) {
            throw new Error(
                `${fieldName} too long (max ${maxLength} characters)`
            );
        }

        return trimmed;
    }

    /**
     * Validate a number field with type checking and range constraints
     * @param value - The value to validate
     * @param fieldName - Name of the field for error messages
     * @param options - Validation options
     * @returns Validated number
     * @throws Error if validation fails
     */
    static validateNumber(
        value: any,
        fieldName: string,
        options: {
            min?: number;
            max?: number;
            integer?: boolean;
            required?: boolean;
        } = {}
    ): number {
        const { min, max, integer = false, required = true } = options;

        // Handle undefined/null for optional fields
        if (!required && (value === undefined || value === null)) {
            return 0; // Default value for optional numbers
        }

        // Type check and NaN check
        if (typeof value !== "number" || isNaN(value)) {
            throw new Error(`${fieldName} must be a number`);
        }

        // Check minimum value
        if (min !== undefined && value < min) {
            throw new Error(`${fieldName} must be at least ${min}`);
        }

        // Check maximum value
        if (max !== undefined && value > max) {
            throw new Error(`${fieldName} must be at most ${max}`);
        }

        // Return integer if required
        return integer ? Math.floor(value) : value;
    }

    /**
     * Validate that a required field is not null or undefined
     * @param value - The value to validate
     * @param fieldName - Name of the field for error messages
     * @returns The validated value
     * @throws Error if value is null or undefined
     */
    static validateRequired<T>(
        value: T | null | undefined,
        fieldName: string
    ): T {
        if (value === null || value === undefined) {
            throw new Error(`${fieldName} is required`);
        }
        return value;
    }

    /**
     * Validate string length constraints
     * @param value - The string to validate
     * @param fieldName - Name of the field for error messages
     * @param min - Minimum length
     * @param max - Maximum length
     * @returns The validated string
     * @throws Error if length constraints are violated
     */
    static validateLength(
        value: string,
        fieldName: string,
        min: number,
        max: number
    ): string {
        if (value.length < min) {
            throw new Error(
                `${fieldName} must be at least ${min} characters long`
            );
        }
        if (value.length > max) {
            throw new Error(
                `${fieldName} must be at most ${max} characters long`
            );
        }
        return value;
    }

    /**
     * Validate challenge title with specific business rules
     * @param title - The title to validate
     * @returns Validated title
     * @throws Error if title is invalid
     */
    static validateChallengeTitle(title: any): string {
        return this.validateString(title, "Challenge title", {
            required: true,
            maxLength: 100,
            allowEmpty: false,
        });
    }

    /**
     * Validate challenge description with specific business rules
     * @param description - The description to validate
     * @param options - Validation options
     * @returns Validated description
     * @throws Error if description is invalid
     */
    static validateChallengeDescription(
        description: any,
        options: { allowEmpty?: boolean } = {}
    ): string {
        const { allowEmpty = true } = options;

        // Description validation: can be empty for title-only challenges
        return this.validateString(description, "Challenge description", {
            required: false,
            maxLength: 200,
            allowEmpty: allowEmpty,
        });
    }

    /**
     * Validate challenge amount with specific business rules
     * @param amount - The amount to validate
     * @returns Validated amount
     * @throws Error if amount is invalid
     */
    static validateChallengeAmount(amount: any): number {
        return this.validateNumber(amount, "Challenge amount", {
            min: 1,
            integer: true,
            required: true,
        });
    }

    /**
     * Validate configuration object structure
     * @param config - Configuration to validate
     * @returns Validation result with detailed errors
     */
    static validateConfiguration(config: any): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Basic type check
        if (!config || typeof config !== "object") {
            errors.push("Configuration must be a valid object");
            return { isValid: false, errors };
        }

        // Check required top-level properties
        const requiredProps = [
            "auth",
            "maxChallenges",
            "commands",
            "responses",
        ];
        for (const prop of requiredProps) {
            if (!(prop in config)) {
                errors.push(`Missing required property: ${prop}`);
            }
        }

        // Validate auth object
        if (config.auth) {
            if (typeof config.auth !== "object") {
                errors.push("Auth configuration must be an object");
            } else {
                const authProps = [
                    "twitch_oauth",
                    "twitch_username",
                    "twitch_channel",
                ];
                for (const prop of authProps) {
                    if (typeof config.auth[prop] !== "string") {
                        errors.push(`Auth.${prop} must be a string`);
                    }
                }
            }
        }

        // Validate maxChallenges
        if (config.maxChallenges !== undefined) {
            try {
                this.validateNumber(config.maxChallenges, "maxChallenges", {
                    min: 1,
                    integer: true,
                });
            } catch (error) {
                errors.push(
                    error instanceof Error ? error.message : String(error)
                );
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate parameter values for commands
     * @param parameters - Parameters to validate
     * @returns Validation result with errors and warnings
     */
    static validateCommandParameters(
        parameters: Record<string, string | undefined>
    ): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate description parameter
        if (parameters["desc"] !== undefined) {
            try {
                const desc = this.unquoteString(parameters["desc"]);
                this.validateChallengeDescription(desc, { allowEmpty: true });
            } catch (error) {
                errors.push(
                    error instanceof Error ? error.message : String(error)
                );
            }
        }

        // Validate amount parameter
        if (parameters["amount"] !== undefined) {
            try {
                const amount = parseInt(parameters["amount"], 10);
                this.validateChallengeAmount(amount);
            } catch (error) {
                errors.push(
                    error instanceof Error ? error.message : String(error)
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
     * Remove quotes from a string value (utility method)
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
     * Validate that a value is one of the allowed options
     * @param value - Value to validate
     * @param allowedValues - Array of allowed values
     * @param fieldName - Name of the field for error messages
     * @returns The validated value
     * @throws Error if value is not in allowed values
     */
    static validateEnum<T>(value: T, allowedValues: T[], fieldName: string): T {
        if (!allowedValues.includes(value)) {
            throw new Error(
                `${fieldName} must be one of: ${allowedValues.join(", ")}`
            );
        }
        return value;
    }

    /**
     * Validate array with element validation
     * @param value - Array to validate
     * @param fieldName - Name of the field for error messages
     * @param elementValidator - Function to validate each element
     * @returns Validated array
     * @throws Error if validation fails
     */
    static validateArray<T>(
        value: any,
        fieldName: string,
        elementValidator?: (element: any, index: number) => T
    ): T[] {
        if (!Array.isArray(value)) {
            throw new Error(`${fieldName} must be an array`);
        }

        if (elementValidator) {
            return value.map((element, index) => {
                try {
                    return elementValidator(element, index);
                } catch (error) {
                    throw new Error(
                        `${fieldName}[${index}]: ${
                            error instanceof Error
                                ? error.message
                                : String(error)
                        }`
                    );
                }
            });
        }

        return value;
    }
}
