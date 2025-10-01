import { beforeEach, describe, expect, it } from "vitest";
import { ValidationUtils } from "../../src/utils/ValidationUtils";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("ValidationUtils", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    describe("validateString", () => {
        it("should validate a valid string", () => {
            const result = ValidationUtils.validateString("test", "field");
            expect(result).toBe("test");
        });

        it("should trim whitespace from string", () => {
            const result = ValidationUtils.validateString("  test  ", "field");
            expect(result).toBe("test");
        });

        it("should throw error for non-string input", () => {
            expect(() => ValidationUtils.validateString(123, "field")).toThrow(
                "field must be of type string"
            );
        });

        it("should throw error for empty string when required", () => {
            expect(() => ValidationUtils.validateString("", "field")).toThrow(
                "field cannot be empty"
            );
        });

        it("should allow empty string when allowEmpty is true", () => {
            const result = ValidationUtils.validateString("", "field", {
                allowEmpty: true,
            });
            expect(result).toBe("");
        });

        it("should throw error when string is too short", () => {
            expect(() =>
                ValidationUtils.validateString("ab", "field", { minLength: 3 })
            ).toThrow("field must be at least 3 characters long");
        });

        it("should throw error when string is too long", () => {
            expect(() =>
                ValidationUtils.validateString("toolong", "field", {
                    maxLength: 5,
                })
            ).toThrow("field too long (max 5 characters)");
        });

        it("should handle optional field with empty string", () => {
            const result = ValidationUtils.validateString("", "field", {
                required: false,
                allowEmpty: true,
            });
            expect(result).toBe("");
        });
    });

    describe("validateNumber", () => {
        it("should validate a valid number", () => {
            const result = ValidationUtils.validateNumber(42, "field");
            expect(result).toBe(42);
        });

        it("should return 0 for optional undefined field", () => {
            const result = ValidationUtils.validateNumber(undefined, "field", {
                required: false,
            });
            expect(result).toBe(0);
        });

        it("should return 0 for optional null field", () => {
            const result = ValidationUtils.validateNumber(null, "field", {
                required: false,
            });
            expect(result).toBe(0);
        });

        it("should throw error for non-number input", () => {
            expect(() =>
                ValidationUtils.validateNumber("not a number", "field")
            ).toThrow("field must be a number");
        });

        it("should throw error for NaN input", () => {
            expect(() => ValidationUtils.validateNumber(NaN, "field")).toThrow(
                "field must be a number"
            );
        });

        it("should throw error when number is below minimum", () => {
            expect(() =>
                ValidationUtils.validateNumber(5, "field", { min: 10 })
            ).toThrow("field must be at least 10");
        });

        it("should throw error when number is above maximum", () => {
            expect(() =>
                ValidationUtils.validateNumber(15, "field", { max: 10 })
            ).toThrow("field must be at most 10");
        });

        it("should return integer when integer option is true", () => {
            const result = ValidationUtils.validateNumber(3.7, "field", {
                integer: true,
            });
            expect(result).toBe(3);
        });

        it("should return decimal when integer option is false", () => {
            const result = ValidationUtils.validateNumber(3.7, "field", {
                integer: false,
            });
            expect(result).toBe(3.7);
        });
    });

    describe("validateRequired", () => {
        it("should return value when not null or undefined", () => {
            const result = ValidationUtils.validateRequired("test", "field");
            expect(result).toBe("test");
        });

        it("should throw error for null value", () => {
            expect(() =>
                ValidationUtils.validateRequired(null, "field")
            ).toThrow("field is required");
        });

        it("should throw error for undefined value", () => {
            expect(() =>
                ValidationUtils.validateRequired(undefined, "field")
            ).toThrow("field is required");
        });
    });

    describe("validateLength", () => {
        it("should validate string within length constraints", () => {
            const result = ValidationUtils.validateLength(
                "test",
                "field",
                2,
                6
            );
            expect(result).toBe("test");
        });

        it("should throw error when string is too short", () => {
            expect(() =>
                ValidationUtils.validateLength("ab", "field", 3, 10)
            ).toThrow("field must be at least 3 characters long");
        });

        it("should throw error when string is too long", () => {
            expect(() =>
                ValidationUtils.validateLength("toolongstring", "field", 1, 5)
            ).toThrow("field must be at most 5 characters long");
        });
    });

    describe("validateChallengeTitle", () => {
        it("should validate a valid challenge title", () => {
            const result =
                ValidationUtils.validateChallengeTitle("Valid Title");
            expect(result).toBe("Valid Title");
        });

        it("should throw error for non-string title", () => {
            expect(() => ValidationUtils.validateChallengeTitle(123)).toThrow(
                "Challenge title must be of type string"
            );
        });

        it("should throw error for empty title", () => {
            expect(() => ValidationUtils.validateChallengeTitle("")).toThrow(
                "Challenge title cannot be empty"
            );
        });

        it("should throw error for title exceeding max length", () => {
            const longTitle = "a".repeat(101);
            expect(() =>
                ValidationUtils.validateChallengeTitle(longTitle)
            ).toThrow("Challenge title too long (max 100 characters)");
        });
    });

    describe("validateChallengeDescription", () => {
        it("should validate a valid description", () => {
            const result =
                ValidationUtils.validateChallengeDescription(
                    "Valid description"
                );
            expect(result).toBe("Valid description");
        });

        it("should allow empty description by default", () => {
            const result = ValidationUtils.validateChallengeDescription("");
            expect(result).toBe("");
        });

        it("should allow empty description when allowEmpty is false but required is false", () => {
            // Note: validateChallengeDescription uses required: false, so empty strings are allowed
            // even when allowEmpty is false, because the field itself is optional
            const result = ValidationUtils.validateChallengeDescription("", {
                allowEmpty: false,
            });
            expect(result).toBe("");
        });

        it("should throw error for description exceeding max length", () => {
            const longDesc = "a".repeat(201);
            expect(() =>
                ValidationUtils.validateChallengeDescription(longDesc)
            ).toThrow("Challenge description too long (max 200 characters)");
        });
    });

    describe("validateChallengeAmount", () => {
        it("should validate a valid amount", () => {
            const result = ValidationUtils.validateChallengeAmount(5);
            expect(result).toBe(5);
        });

        it("should throw error for amount less than 1", () => {
            expect(() => ValidationUtils.validateChallengeAmount(0)).toThrow(
                "Challenge amount must be at least 1"
            );
        });

        it("should return integer for decimal input", () => {
            const result = ValidationUtils.validateChallengeAmount(3.7);
            expect(result).toBe(3);
        });
    });

    describe("validateConfiguration", () => {
        it("should validate a complete valid configuration", () => {
            const config = {
                auth: {
                    twitch_oauth: "oauth:token",
                    twitch_username: "user",
                    twitch_channel: "channel",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result = ValidationUtils.validateConfiguration(config);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it("should return error for null config", () => {
            const result = ValidationUtils.validateConfiguration(null);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Configuration must be a valid object"
            );
        });

        it("should return error for non-object config", () => {
            const result =
                ValidationUtils.validateConfiguration("not an object");
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Configuration must be a valid object"
            );
        });

        it("should return errors for missing required properties", () => {
            const config = {};
            const result = ValidationUtils.validateConfiguration(config);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Missing required property: auth");
            expect(result.errors).toContain(
                "Missing required property: maxChallenges"
            );
            expect(result.errors).toContain(
                "Missing required property: commands"
            );
            expect(result.errors).toContain(
                "Missing required property: responses"
            );
        });

        it("should return error for invalid auth object", () => {
            const config = {
                auth: "not an object",
                maxChallenges: 10,
                commands: {},
                responses: {},
            };
            const result = ValidationUtils.validateConfiguration(config);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Auth configuration must be an object"
            );
        });

        it("should return errors for invalid auth properties", () => {
            const config = {
                auth: {
                    twitch_oauth: 123,
                    twitch_username: null,
                    twitch_channel: undefined,
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };
            const result = ValidationUtils.validateConfiguration(config);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Auth.twitch_oauth must be a string"
            );
            expect(result.errors).toContain(
                "Auth.twitch_username must be a string"
            );
            expect(result.errors).toContain(
                "Auth.twitch_channel must be a string"
            );
        });

        it("should return error for invalid maxChallenges", () => {
            const config = {
                auth: {
                    twitch_oauth: "oauth:token",
                    twitch_username: "user",
                    twitch_channel: "channel",
                },
                maxChallenges: -1,
                commands: {},
                responses: {},
            };
            const result = ValidationUtils.validateConfiguration(config);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("maxChallenges must be at least 1");
        });
    });

    describe("validateCommandParameters", () => {
        it("should validate valid parameters", () => {
            const params = {
                desc: "Valid description",
                amount: "5",
            };
            const result = ValidationUtils.validateCommandParameters(params);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.warnings).toEqual([]);
        });

        it("should return error for invalid description", () => {
            const params = {
                desc: "a".repeat(201), // Too long
            };
            const result = ValidationUtils.validateCommandParameters(params);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Challenge description too long (max 200 characters)"
            );
        });

        it("should return error for invalid amount", () => {
            const params = {
                amount: "0", // Too low
            };
            const result = ValidationUtils.validateCommandParameters(params);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Challenge amount must be at least 1"
            );
        });

        it("should handle undefined parameters", () => {
            const params = {};
            const result = ValidationUtils.validateCommandParameters(params);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
    });

    describe("unquoteString", () => {
        it("should return empty string for falsy input", () => {
            expect(ValidationUtils.unquoteString("")).toBe("");
            expect(ValidationUtils.unquoteString(null as any)).toBe("");
            expect(ValidationUtils.unquoteString(undefined as any)).toBe("");
        });

        it("should remove double quotes", () => {
            const result = ValidationUtils.unquoteString('"quoted string"');
            expect(result).toBe("quoted string");
        });

        it("should remove single quotes", () => {
            const result = ValidationUtils.unquoteString("'quoted string'");
            expect(result).toBe("quoted string");
        });

        it("should handle escaped quotes", () => {
            const result = ValidationUtils.unquoteString(
                '"string with \\"escaped\\" quotes"'
            );
            expect(result).toBe('string with "escaped" quotes');
        });

        it("should handle escaped single quotes", () => {
            const result = ValidationUtils.unquoteString(
                "'string with \\'escaped\\' quotes'"
            );
            expect(result).toBe("string with 'escaped' quotes");
        });

        it("should return trimmed string if not quoted", () => {
            const result = ValidationUtils.unquoteString("  unquoted string  ");
            expect(result).toBe("unquoted string");
        });
    });

    describe("validateEnum", () => {
        it("should validate value in allowed list", () => {
            const result = ValidationUtils.validateEnum(
                "option1",
                ["option1", "option2"],
                "field"
            );
            expect(result).toBe("option1");
        });

        it("should throw error for value not in allowed list", () => {
            expect(() =>
                ValidationUtils.validateEnum(
                    "invalid",
                    ["option1", "option2"],
                    "field"
                )
            ).toThrow("field must be one of: option1, option2");
        });
    });

    describe("validateArray", () => {
        it("should validate array without element validator", () => {
            const result = ValidationUtils.validateArray([1, 2, 3], "field");
            expect(result).toEqual([1, 2, 3]);
        });

        it("should throw error for non-array input", () => {
            expect(() =>
                ValidationUtils.validateArray("not array", "field")
            ).toThrow("field must be an array");
        });

        it("should validate array with element validator", () => {
            const validator = (element: any) => {
                if (typeof element !== "number")
                    throw new Error("must be number");
                return element;
            };
            const result = ValidationUtils.validateArray(
                [1, 2, 3],
                "field",
                validator
            );
            expect(result).toEqual([1, 2, 3]);
        });

        it("should throw error when element validation fails", () => {
            const validator = (element: any) => {
                if (typeof element !== "number")
                    throw new Error("must be number");
                return element;
            };
            expect(() =>
                ValidationUtils.validateArray(
                    [1, "invalid", 3],
                    "field",
                    validator
                )
            ).toThrow("field[1]: must be number");
        });
    });
});
