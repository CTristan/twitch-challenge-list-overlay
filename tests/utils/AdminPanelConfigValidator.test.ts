import { beforeEach, describe, expect, it } from "vitest";
import { AdminPanelConfigValidator } from "../../src/utils/AdminPanelConfigValidator";
import { VALIDATION_MESSAGES } from "../../src/types/MessageConstants";

function ensureTestIsolation() {
    localStorage.clear();
    document.body.innerHTML = "";
}

describe("AdminPanelConfigValidator", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    describe("validateImportedConfiguration", () => {
        it("should validate a valid configuration", () => {
            const validConfig = {
                auth: {
                    twitch_channel: "testchannel",
                    twitch_oauth: "oauth:testtoken",
                    twitch_username: "testuser",
                },
                maxChallenges: 10,
                commands: {
                    add: "!ch add",
                },
                responses: {
                    success: "Success!",
                },
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    validConfig
                );

            expect(result.isValid).toBe(true);
            expect(result.errorMessage).toBe("");
        });

        it("should reject null configuration", () => {
            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(null);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe(
                VALIDATION_MESSAGES.CONFIGURATION_INVALID_OBJECT
            );
        });

        it("should reject non-object configuration", () => {
            const result =
                AdminPanelConfigValidator.validateImportedConfiguration("invalid");

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe(
                VALIDATION_MESSAGES.CONFIGURATION_INVALID_OBJECT
            );
        });

        it("should reject configuration missing auth property", () => {
            const invalidConfig = {
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    invalidConfig
                );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("auth");
        });

        it("should reject configuration missing maxChallenges property", () => {
            const invalidConfig = {
                auth: {
                    twitch_channel: "test",
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    invalidConfig
                );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("maxChallenges");
        });

        it("should reject configuration with invalid auth section", () => {
            const invalidConfig = {
                auth: "invalid",
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    invalidConfig
                );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("Auth section");
        });

        it("should reject auth section missing twitch_channel", () => {
            const invalidConfig = {
                auth: {
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    invalidConfig
                );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("twitch_channel");
        });

        it("should reject auth section with non-string twitch_channel", () => {
            const invalidConfig = {
                auth: {
                    twitch_channel: 123,
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    invalidConfig
                );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("must be a string");
        });

        it("should reject invalid maxChallenges value", () => {
            const invalidConfig = {
                auth: {
                    twitch_channel: "test",
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                maxChallenges: 0,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    invalidConfig
                );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("maxChallenges");
        });

        it("should reject non-object commands section", () => {
            const invalidConfig = {
                auth: {
                    twitch_channel: "test",
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                maxChallenges: 10,
                commands: "invalid",
                responses: {},
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    invalidConfig
                );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("Commands section");
        });

        it("should reject non-object responses section", () => {
            const invalidConfig = {
                auth: {
                    twitch_channel: "test",
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: "invalid",
            };

            const result =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    invalidConfig
                );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("Responses section");
        });
    });
});

