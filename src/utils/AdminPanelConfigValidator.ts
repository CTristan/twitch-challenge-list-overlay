import { AUTH_PROPERTY_NAMES, CORE_CONFIG } from "../types/ConfigConstants";
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
            CORE_CONFIG.AUTH,
            CORE_CONFIG.MAX_CHALLENGES,
            CORE_CONFIG.COMMANDS,
            CORE_CONFIG.RESPONSES,
        ];

        for (const prop of requiredProperties) {
            if (!(prop in config)) {
                return {
                    isValid: false,
                    errorMessage:
                        VALIDATION_MESSAGES.MISSING_REQUIRED_PROPERTY.replace(
                            "{prop}",
                            prop
                        ),
                };
            }
        }

        // Validate auth section
        if (
            !config[CORE_CONFIG.AUTH] ||
            typeof config[CORE_CONFIG.AUTH] !== "object"
        ) {
            return {
                isValid: false,
                errorMessage: VALIDATION_MESSAGES.AUTH_SECTION_INVALID,
            };
        }

        const authProps = [
            AUTH_PROPERTY_NAMES.TWITCH_CHANNEL,
            AUTH_PROPERTY_NAMES.TWITCH_OAUTH,
            AUTH_PROPERTY_NAMES.TWITCH_USERNAME,
        ];
        for (const prop of authProps) {
            if (!(prop in config[CORE_CONFIG.AUTH])) {
                return {
                    isValid: false,
                    errorMessage:
                        VALIDATION_MESSAGES.MISSING_AUTH_PROPERTY.replace(
                            "{prop}",
                            prop
                        ),
                };
            }
            if (typeof config[CORE_CONFIG.AUTH][prop] !== "string") {
                return {
                    isValid: false,
                    errorMessage:
                        VALIDATION_MESSAGES.AUTH_PROPERTY_INVALID_TYPE.replace(
                            "{prop}",
                            prop
                        ),
                };
            }
        }

        // Validate maxChallenges
        if (
            typeof config[CORE_CONFIG.MAX_CHALLENGES] !== "number" ||
            config[CORE_CONFIG.MAX_CHALLENGES] < 1
        ) {
            return {
                isValid: false,
                errorMessage: VALIDATION_MESSAGES.MAX_CHALLENGES_INVALID,
            };
        }

        // Validate commands section
        if (
            !config[CORE_CONFIG.COMMANDS] ||
            typeof config[CORE_CONFIG.COMMANDS] !== "object"
        ) {
            return {
                isValid: false,
                errorMessage: VALIDATION_MESSAGES.COMMANDS_SECTION_INVALID,
            };
        }

        // Validate responses section
        if (
            !config[CORE_CONFIG.RESPONSES] ||
            typeof config[CORE_CONFIG.RESPONSES] !== "object"
        ) {
            return {
                isValid: false,
                errorMessage: VALIDATION_MESSAGES.RESPONSES_SECTION_INVALID,
            };
        }

        return {
            isValid: true,
            errorMessage: "",
        };
    }
}
