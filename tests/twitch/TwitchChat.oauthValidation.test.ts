import { beforeEach, describe, expect, it, vi } from "vitest";
import TwitchChat from "../../src/twitch/TwitchChat";
import { NETWORK_URLS } from "../../src/types/ConfigConstants";

describe("TwitchChat OAuth Token Validation", () => {
    let mockWebSocket: any;
    let consoleWarnSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Mock WebSocket
        mockWebSocket = vi.fn().mockImplementation(() => ({
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            send: vi.fn(),
            close: vi.fn(),
            readyState: WebSocket.OPEN,
        }));

        // Spy on console methods
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Valid OAuth Token Handling", () => {
        it("should accept token with correct oauth: prefix", () => {
            const client = new TwitchChat(
                NETWORK_URLS.TWITCH_IRC,
                {
                    username: "testuser",
                    authToken: "oauth:example_token_123",
                    channel: "testchannel",
                },
                mockWebSocket
            );

            expect(client.authToken).toBe("oauth:example_token_123");
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it("should auto-correct token missing oauth: prefix", () => {
            const client = new TwitchChat(
                NETWORK_URLS.TWITCH_IRC,
                {
                    username: "testuser",
                    authToken: "example_token_123",
                    channel: "testchannel",
                },
                mockWebSocket
            );

            expect(client.authToken).toBe("oauth:example_token_123");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[TwitchChat] OAuth token format auto-corrected: Added missing "oauth:" prefix'
            );
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[TwitchChat] Original: "example_to..." → Corrected: "oauth:example_to..."'
            );
        });

        it("should handle token with extra whitespace", () => {
            const client = new TwitchChat(
                NETWORK_URLS.TWITCH_IRC,
                {
                    username: "testuser",
                    authToken: "  oauth:example_token_123  ",
                    channel: "testchannel",
                },
                mockWebSocket
            );

            expect(client.authToken).toBe("oauth:example_token_123");
        });

        it("should auto-correct token with whitespace and missing prefix", () => {
            const client = new TwitchChat(
                NETWORK_URLS.TWITCH_IRC,
                {
                    username: "testuser",
                    authToken: "  example_token_123  ",
                    channel: "testchannel",
                },
                mockWebSocket
            );

            expect(client.authToken).toBe("oauth:example_token_123");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[TwitchChat] OAuth token format auto-corrected: Added missing "oauth:" prefix'
            );
        });
    });

    describe("Invalid OAuth Token Handling", () => {
        it("should throw error for null token", () => {
            expect(() => {
                new TwitchChat(
                    NETWORK_URLS.TWITCH_IRC,
                    {
                        username: "testuser",
                        authToken: null as any,
                        channel: "testchannel",
                    },
                    mockWebSocket
                );
            }).toThrow("OAuth token is required and must be a valid string");

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[TwitchChat] Invalid OAuth token: Token is null, undefined, or not a string"
            );
        });

        it("should throw error for undefined token", () => {
            expect(() => {
                new TwitchChat(
                    NETWORK_URLS.TWITCH_IRC,
                    {
                        username: "testuser",
                        authToken: undefined as any,
                        channel: "testchannel",
                    },
                    mockWebSocket
                );
            }).toThrow("OAuth token is required and must be a valid string");
        });

        it("should throw error for empty string token", () => {
            expect(() => {
                new TwitchChat(
                    NETWORK_URLS.TWITCH_IRC,
                    {
                        username: "testuser",
                        authToken: "",
                        channel: "testchannel",
                    },
                    mockWebSocket
                );
            }).toThrow("OAuth token cannot be empty");

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[TwitchChat] Invalid OAuth token: Token is empty"
            );
        });

        it("should throw error for whitespace-only token", () => {
            expect(() => {
                new TwitchChat(
                    NETWORK_URLS.TWITCH_IRC,
                    {
                        username: "testuser",
                        authToken: "   ",
                        channel: "testchannel",
                    },
                    mockWebSocket
                );
            }).toThrow("OAuth token cannot be empty");
        });

        it("should throw error for oauth: prefix with no content", () => {
            expect(() => {
                new TwitchChat(
                    NETWORK_URLS.TWITCH_IRC,
                    {
                        username: "testuser",
                        authToken: "oauth:",
                        channel: "testchannel",
                    },
                    mockWebSocket
                );
            }).toThrow(
                'OAuth token must contain content after "oauth:" prefix'
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[TwitchChat] Invalid OAuth token: Token has "oauth:" prefix but no content'
            );
        });

        it("should throw error for non-string token", () => {
            expect(() => {
                new TwitchChat(
                    NETWORK_URLS.TWITCH_IRC,
                    {
                        username: "testuser",
                        authToken: 123 as any,
                        channel: "testchannel",
                    },
                    mockWebSocket
                );
            }).toThrow("OAuth token is required and must be a valid string");
        });
    });

    describe("Real-world OAuth Token Scenarios", () => {
        it("should handle typical Twitch OAuth token format", () => {
            const client = new TwitchChat(
                NETWORK_URLS.TWITCH_IRC,
                {
                    username: "testuser",
                    authToken: "anonymized_token_example_30chars",
                    channel: "testchannel",
                },
                mockWebSocket
            );

            expect(client.authToken).toBe(
                "oauth:anonymized_token_example_30chars"
            );
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[TwitchChat] OAuth token format auto-corrected: Added missing "oauth:" prefix'
            );
        });

        it("should handle token that already has oauth: prefix", () => {
            const client = new TwitchChat(
                NETWORK_URLS.TWITCH_IRC,
                {
                    username: "testuser",
                    authToken: "oauth:anonymized_token_example_30chars",
                    channel: "testchannel",
                },
                mockWebSocket
            );

            expect(client.authToken).toBe(
                "oauth:anonymized_token_example_30chars"
            );
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it("should handle case-sensitive oauth: prefix validation", () => {
            // Should NOT match "OAuth:" or "OAUTH:" - only "oauth:"
            const client = new TwitchChat(
                NETWORK_URLS.TWITCH_IRC,
                {
                    username: "testuser",
                    authToken: "OAuth:anonymized_token_example_30chars",
                    channel: "testchannel",
                },
                mockWebSocket
            );

            expect(client.authToken).toBe(
                "oauth:OAuth:anonymized_token_example_30chars"
            );
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[TwitchChat] OAuth token format auto-corrected: Added missing "oauth:" prefix'
            );
        });
    });
});
