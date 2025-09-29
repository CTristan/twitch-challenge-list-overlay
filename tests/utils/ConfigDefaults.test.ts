import { beforeEach, describe, expect, it } from "vitest";
import {
    createFallbackConfig,
    getDefaultAuthConfig,
    getDefaultMaxChallenges,
    isValidFallbackConfig,
} from "../../src/utils/ConfigDefaults";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("ConfigDefaults", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    describe("createFallbackConfig", () => {
        it("should return a valid Config object with all required properties", () => {
            const config = createFallbackConfig();

            // Verify top-level structure
            expect(config).toHaveProperty("auth");
            expect(config).toHaveProperty("maxChallenges");
            expect(config).toHaveProperty("commands");
            expect(config).toHaveProperty("responses");
        });

        it("should return correct auth configuration", () => {
            const config = createFallbackConfig();

            expect(config.auth).toEqual({
                twitch_oauth: "",
                twitch_username: "",
                twitch_channel: "",
            });
        });

        it("should return correct maxChallenges value", () => {
            const config = createFallbackConfig();

            expect(config.maxChallenges).toBe(10);
            expect(typeof config.maxChallenges).toBe("number");
        });

        it("should return complete commands configuration", () => {
            const config = createFallbackConfig();

            // Verify all required command types exist
            expect(config.commands).toHaveProperty("clearAll", [
                "!ch clearlist",
                "!ch clearall",
            ]);
            expect(config.commands).toHaveProperty("clearDone", [
                "!ch cleardone",
            ]);
            expect(config.commands).toHaveProperty("addChallenge", ["!ch add"]);
            expect(config.commands).toHaveProperty("editChallenge", [
                "!ch edit",
            ]);
            expect(config.commands).toHaveProperty("finishChallenge", [
                "!ch done",
            ]);
            expect(config.commands).toHaveProperty("deleteChallenge", [
                "!ch delete",
                "!ch del",
            ]);
            expect(config.commands).toHaveProperty("incrementChallenge", [
                "!ch +",
            ]);
            expect(config.commands).toHaveProperty("decrementChallenge", [
                "!ch -",
            ]);
            expect(config.commands).toHaveProperty("setProgress", ["!ch set"]);
            expect(config.commands).toHaveProperty("failChallenge", [
                "!ch fail",
            ]);
            expect(config.commands).toHaveProperty("listChallenges", [
                "!ch list",
            ]);
            expect(config.commands).toHaveProperty("showChallenge", [
                "!ch show",
            ]);
            expect(config.commands).toHaveProperty("check", ["!ch check"]);
            expect(config.commands).toHaveProperty("help", ["!ch help"]);

            // Verify command count
            expect(Object.keys(config.commands)).toHaveLength(14);
        });

        it("should return complete responses configuration", () => {
            const config = createFallbackConfig();

            // Verify all required response types exist
            expect(config.responses).toHaveProperty(
                "clearAll",
                "All challenges have been cleared"
            );
            expect(config.responses).toHaveProperty(
                "clearDone",
                "All done challenges have been cleared"
            );
            expect(config.responses).toHaveProperty(
                "addChallenge",
                "Challenge(s) {message} added!"
            );
            expect(config.responses).toHaveProperty(
                "editChallenge",
                "Challenge {message} updated!"
            );
            expect(config.responses).toHaveProperty(
                "finishChallenge",
                "Good job on completing challenge(s) {message}!"
            );
            expect(config.responses).toHaveProperty(
                "deleteChallenge",
                "Challenge(s) {message} has been deleted!"
            );
            expect(config.responses).toHaveProperty(
                "deleteAll",
                "All of your challenges have been deleted!"
            );
            expect(config.responses).toHaveProperty(
                "check",
                "Your current challenge(s) are: {message}"
            );
            expect(config.responses).toHaveProperty(
                "help",
                "Try these commands - !ch add, !ch edit, !ch done, !ch delete, !ch check, !ch clearlist, !ch cleardone, !ch help"
            );
            expect(config.responses).toHaveProperty(
                "maxChallengesAdded",
                "Maximum number of challenges reached, try deleting old challenges."
            );
            expect(config.responses).toHaveProperty(
                "noChallengeFound",
                "That challenge doesn't seem to exist, try adding one!"
            );
            expect(config.responses).toHaveProperty(
                "invalidCommand",
                "Invalid command: {message}. Try !help"
            );

            // Verify response count
            expect(Object.keys(config.responses)).toHaveLength(12);
        });

        it("should return responses with proper message placeholders", () => {
            const config = createFallbackConfig();

            // Verify responses that should contain {message} placeholder
            expect(config.responses.addChallenge).toContain("{message}");
            expect(config.responses.editChallenge).toContain("{message}");
            expect(config.responses.finishChallenge).toContain("{message}");
            expect(config.responses.deleteChallenge).toContain("{message}");
            expect(config.responses.check).toContain("{message}");
            expect(config.responses.invalidCommand).toContain("{message}");
        });

        it("should return consistent configuration on multiple calls", () => {
            const config1 = createFallbackConfig();
            const config2 = createFallbackConfig();

            expect(config1).toEqual(config2);
        });

        it("should return a new object instance on each call", () => {
            const config1 = createFallbackConfig();
            const config2 = createFallbackConfig();

            // Should be equal but not the same reference
            expect(config1).toEqual(config2);
            expect(config1).not.toBe(config2);
            expect(config1.auth).not.toBe(config2.auth);
            expect(config1.commands).not.toBe(config2.commands);
            expect(config1.responses).not.toBe(config2.responses);
        });
    });

    describe("isValidFallbackConfig", () => {
        it("should return true for valid fallback config", () => {
            const config = createFallbackConfig();
            expect(isValidFallbackConfig(config)).toBe(true);
        });

        it("should return false for null or undefined", () => {
            expect(isValidFallbackConfig(null)).toBe(false);
            expect(isValidFallbackConfig(undefined)).toBe(false);
        });

        it("should return false for non-object types", () => {
            expect(isValidFallbackConfig("string")).toBe(false);
            expect(isValidFallbackConfig(123)).toBe(false);
            expect(isValidFallbackConfig(true)).toBe(false);
            expect(isValidFallbackConfig([])).toBe(false);
        });

        it("should return false for missing required top-level properties", () => {
            expect(isValidFallbackConfig({})).toBe(false);
            expect(isValidFallbackConfig({ auth: {} })).toBe(false);
            expect(isValidFallbackConfig({ auth: {}, maxChallenges: 10 })).toBe(
                false
            );
            expect(
                isValidFallbackConfig({
                    auth: {},
                    maxChallenges: 10,
                    commands: {},
                })
            ).toBe(false);
        });

        it("should return false for invalid auth structure", () => {
            const baseConfig = {
                auth: {},
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            expect(isValidFallbackConfig(baseConfig)).toBe(false);

            // Missing auth properties
            expect(
                isValidFallbackConfig({
                    ...baseConfig,
                    auth: { twitch_oauth: "" },
                })
            ).toBe(false);

            expect(
                isValidFallbackConfig({
                    ...baseConfig,
                    auth: { twitch_oauth: "", twitch_username: "" },
                })
            ).toBe(false);
        });

        it("should return false for invalid maxChallenges", () => {
            const baseConfig = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                commands: {},
                responses: {},
            };

            expect(
                isValidFallbackConfig({
                    ...baseConfig,
                    maxChallenges: "10",
                })
            ).toBe(false);

            expect(
                isValidFallbackConfig({
                    ...baseConfig,
                    maxChallenges: 0,
                })
            ).toBe(false);

            expect(
                isValidFallbackConfig({
                    ...baseConfig,
                    maxChallenges: -1,
                })
            ).toBe(false);
        });

        it("should return false for invalid commands or responses structure", () => {
            const baseConfig = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
            };

            expect(
                isValidFallbackConfig({
                    ...baseConfig,
                    commands: "invalid",
                    responses: {},
                })
            ).toBe(false);

            expect(
                isValidFallbackConfig({
                    ...baseConfig,
                    commands: {},
                    responses: "invalid",
                })
            ).toBe(false);
        });
    });

    describe("getDefaultMaxChallenges", () => {
        it("should return the default max challenges value", () => {
            expect(getDefaultMaxChallenges()).toBe(10);
            expect(typeof getDefaultMaxChallenges()).toBe("number");
        });
    });

    describe("getDefaultAuthConfig", () => {
        it("should return the default auth configuration", () => {
            const authConfig = getDefaultAuthConfig();

            expect(authConfig).toEqual({
                twitch_oauth: "",
                twitch_username: "",
                twitch_channel: "",
            });
        });

        it("should return a new object instance on each call", () => {
            const auth1 = getDefaultAuthConfig();
            const auth2 = getDefaultAuthConfig();

            expect(auth1).toEqual(auth2);
            expect(auth1).not.toBe(auth2);
        });
    });
});
