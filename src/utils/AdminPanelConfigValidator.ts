import { VALIDATION_MESSAGES } from "../types/MessageConstants";

/**
 * Validation result interface
 */
export interface ValidationResult {
    isValid: boolean;
    errorMessage: string;
}

/**
 * Utility class for validating imported configuration
 */
export class AdminPanelConfigValidator {
    /**
     * Validate imported configuration structure
     * @param config - Configuration object to validate
     * @returns Validation result with isValid flag and error message
     */
    static validateImportedConfiguration(config: any): ValidationResult {
        if (!config || typeof config !== "object") {
            return {
                isValid: false,
                errorMessage: VALIDATION_MESSAGES.CONFIGURATION_INVALID_OBJECT,
            };
        }

        // Check for required top-level properties
        const requiredProperties = [
            "auth",
            "maxChallenges",
            "commands",
            "responses",
        ];

        for (const prop of requiredProperties) {
            if (!(prop in config)) {
                return {
                    isValid: false,
                    errorMessage: `Missing required property: ${prop}`,
                };
            }
        }

        // Validate auth section
        if (!config.auth || typeof config.auth !== "object") {
            return {
                isValid: false,
                errorMessage: "Auth section must be an object!",
            };
        }

        const authProps = ["twitch_channel", "twitch_oauth", "twitch_username"];
        for (const prop of authProps) {
            if (!(prop in config.auth)) {
                return {
                    isValid: false,
                    errorMessage: `Missing auth property: ${prop}`,
                };
            }
            if (typeof config.auth[prop] !== "string") {
                return {
                    isValid: false,
                    errorMessage: `Auth property ${prop} must be a string`,
                };
            }
        }

        // Validate maxChallenges
        if (
            typeof config.maxChallenges !== "number" ||
            config.maxChallenges < 1
        ) {
            return {
                isValid: false,
                errorMessage: "maxChallenges must be a positive number!",
            };
        }

        // Validate commands section
        if (!config.commands || typeof config.commands !== "object") {
            return {
                isValid: false,
                errorMessage: "Commands section must be an object!",
            };
        }

        // Validate responses section
        if (!config.responses || typeof config.responses !== "object") {
            return {
                isValid: false,
                errorMessage: "Responses section must be an object!",
            };
        }

        return {
            isValid: true,
            errorMessage: "",
        };
    }
}

