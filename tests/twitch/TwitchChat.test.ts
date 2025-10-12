import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TwitchChat from "../../src/twitch/TwitchChat";
import { TWITCH_EVENTS } from "../../src/types/ConfigConstants";

// Mock WebSocket interface for testing
interface MockWebSocket {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onopen: ((event: any) => void) | null;
    onclose: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onmessage: ((event: any) => void) | null;
    readyState: number;
}

describe("TwitchChat", () => {
    let mockWebSocket: ReturnType<typeof vi.fn>;
    let mockWsInstance: MockWebSocket;
    let twitchChat: TwitchChat;
    let chatEvent: ReturnType<typeof vi.fn>;
    let consoleLogSpy: any; // Complex console.log mock with overloaded signatures
    let consoleErrorSpy: any; // Complex console.error mock with overloaded signatures

    beforeEach(() => {
        // Spy on console methods
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        chatEvent = vi.fn((data) => {
            const { command, message } = data;
            return command + " " + message;
        });
        mockWsInstance = {
            send: vi.fn(),
            close: vi.fn().mockImplementation(() => {
                mockWsInstance.readyState = WebSocket.CLOSING;

                return new Promise<void>((res, rej) => {
                    mockWsInstance.readyState = WebSocket.CLOSED;

                    if (typeof mockWsInstance.onclose === "function") {
                        mockWsInstance.onclose({
                            code: 1000,
                            reason: "normal close event",
                        });
                        res();
                    } else {
                        rej(new Error("onclose not defined"));
                    }
                });
            }),
            onopen: null,
            onclose: null,
            onerror: null,
            onmessage: null,
            readyState: WebSocket.CONNECTING,
        };
        mockWebSocket = vi.fn(() => mockWsInstance);
        twitchChat = new TwitchChat(
            "ws://test-url:80",
            {
                username: "UserName",
                authToken: "1a2b3c4d5e6f",
                channel: "CHANNEL",
            },
            mockWebSocket
        );
        twitchChat.on(TWITCH_EVENTS.COMMAND, chatEvent);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("constructor method", () => {
        it("should create an instance of TwitchChat", () => {
            expect(twitchChat).toBeInstanceOf(TwitchChat);
            expect(twitchChat.url).toBe("ws://test-url:80");
            expect(twitchChat.username).toBe("username");
            expect(twitchChat.channel).toBe("#channel");
            expect(twitchChat.authToken).toBe("oauth:1a2b3c4d5e6f");
            expect(twitchChat.WebSocketService).toBe(mockWebSocket);
        });

        it("should convert username to lowercase", () => {
            const chat = new TwitchChat(
                "ws://test-url:80",
                {
                    username: "MixedCaseUser",
                    authToken: "oauth:token123",
                    channel: "testchannel",
                },
                mockWebSocket
            );
            expect(chat.username).toBe("mixedcaseuser");
        });

        it("should convert channel to lowercase and add # prefix", () => {
            const chat = new TwitchChat(
                "ws://test-url:80",
                {
                    username: "testuser",
                    authToken: "oauth:token123",
                    channel: "MixedCaseChannel",
                },
                mockWebSocket
            );
            expect(chat.channel).toBe("#mixedcasechannel");
        });
    });

    describe("connect method and its WebSocket events", () => {
        it("should set event listeners onopen, onerror, onmessage, and onclose", () => {
            const onopen = vi.spyOn(mockWsInstance, "onopen", "set");
            const onerror = vi.spyOn(mockWsInstance, "onerror", "set");
            const onmessage = vi.spyOn(mockWsInstance, "onmessage", "set");
            const onclose = vi.spyOn(mockWsInstance, "onclose", "set");
            twitchChat.connect();
            expect(onerror).toHaveBeenCalled();
            expect(onopen).toHaveBeenCalled();
            expect(onmessage).toHaveBeenCalled();
            expect(onclose).toHaveBeenCalled();
        });

        it("should authenticate with Twitch IRC server after the WebSocket connection is open", () => {
            twitchChat.connect();
            mockWsInstance.onopen?.({} as Event);
            const { send } = mockWsInstance;
            expect(send).toHaveBeenCalledWith(
                "CAP REQ :twitch.tv/tags twitch.tv/commands"
            );
            expect(send).toHaveBeenCalledWith("PASS oauth:1a2b3c4d5e6f");
            expect(send).toHaveBeenCalledWith("NICK username");
        });

        it("should log an error if WebSocket connection fails", () => {
            twitchChat.connect();
            const message = "Test WebSocket connection fail";
            expect(mockWsInstance.onerror?.(message as any)).toBe(message);
        });

        it("should parse messages received from Twitch connection", () => {
            twitchChat.connect();
            mockWsInstance.onmessage?.({
                data: "@badge-info=subscriber/3;badges=broadcaster/1,subscriber/3003;color=#9ACD32;display-name=JujocoCS;emotes=;first-msg=0;flags=;id=d9b2fc33-d1fb-451e-b018-12470468b932;mod=0;returning-chatter=0;room-id=221396307;subscriber=1;tmi-sent-ts=1724013060240;turbo=0;user-id=221396307;user-type= :jujococs!jujococs@jujococs.tmi.twitch.tv PRIVMSG #jujococs :!challenge walk dog",
            } as MessageEvent);
            expect(chatEvent).toHaveLastReturnedWith("challenge walk dog");
        });
    });

    describe("IRC Message Handling", () => {
        beforeEach(() => {
            twitchChat.connect();
        });

        it("should handle PING messages and respond with PONG", () => {
            mockWsInstance.onmessage?.({
                data: "PING :tmi.twitch.tv",
            } as MessageEvent);

            expect(mockWsInstance.send).toHaveBeenCalledWith(
                "PONG tmi.twitch.tv"
            );
        });

        it("should handle 001 welcome message and join channel", () => {
            mockWsInstance.onmessage?.({
                data: ":tmi.twitch.tv 001 username :Welcome, GLHF!",
            } as MessageEvent);

            expect(mockWsInstance.send).toHaveBeenCalledWith("JOIN #channel");
        });

        it("should handle JOIN message and emit oauthSuccess event", () => {
            const oauthSuccessSpy = vi.fn();
            twitchChat.on(TWITCH_EVENTS.OAUTH_SUCCESS, oauthSuccessSpy);

            mockWsInstance.onmessage?.({
                data: ":username!username@username.tmi.twitch.tv JOIN #channel",
            } as MessageEvent);

            expect(consoleLogSpy).toHaveBeenCalledWith("Joined #channel");
            expect(oauthSuccessSpy).toHaveBeenCalled();
        });

        it("should handle RECONNECT message and disconnect with code 1012", () => {
            const disconnectSpy = vi.spyOn(twitchChat, "disconnect");

            mockWsInstance.onmessage?.({
                data: "RECONNECT",
            } as MessageEvent);

            expect(disconnectSpy).toHaveBeenCalledWith(
                1012,
                "The Twitch IRC server is terminating the connection for maintenance reasons."
            );
        });

        it("should handle PART message and close connection", () => {
            mockWsInstance.onmessage?.({
                data: ":username!username@username.tmi.twitch.tv PART #channel",
            } as MessageEvent);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "The channel must have banned (/ban) the bot."
            );
            expect(mockWsInstance.close).toHaveBeenCalled();
        });

        it("should handle NOTICE message and emit oauthError event", () => {
            const oauthErrorSpy = vi.fn();
            twitchChat.on(TWITCH_EVENTS.OAUTH_ERROR, oauthErrorSpy);

            mockWsInstance.onmessage?.({
                data: ":tmi.twitch.tv NOTICE * :Login authentication failed",
            } as MessageEvent);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Login authentication failed; left #channel"
            );
            expect(oauthErrorSpy).toHaveBeenCalled();
            expect(mockWsInstance.send).toHaveBeenCalledWith("PART #channel");
        });

        it("should emit command event for PRIVMSG with bot command", () => {
            const commandSpy = vi.fn();
            twitchChat.on(TWITCH_EVENTS.COMMAND, commandSpy);

            mockWsInstance.onmessage?.({
                data: "@badge-info=;badges=broadcaster/1;color=#FF0000;display-name=TestUser;emotes=;id=test-id;mod=0;room-id=12345;subscriber=0;tmi-sent-ts=1234567890;turbo=0;user-id=12345;user-type= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :!test command",
            } as MessageEvent);

            expect(commandSpy).toHaveBeenCalled();
            const callArgs = commandSpy.mock.calls[0]?.[0];
            expect(callArgs?.user).toBe("TestUser");
            expect(callArgs?.command).toBe("test");
            expect(callArgs?.message).toBe("command");
        });

        it("should not emit command event for PRIVMSG without bot command", () => {
            const commandSpy = vi.fn();
            twitchChat.on(TWITCH_EVENTS.COMMAND, commandSpy);

            mockWsInstance.onmessage?.({
                data: "@badge-info=;badges=broadcaster/1;color=#FF0000;display-name=TestUser;emotes=;id=test-id;mod=0;room-id=12345;subscriber=0;tmi-sent-ts=1234567890;turbo=0;user-id=12345;user-type= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :regular message",
            } as MessageEvent);

            expect(commandSpy).not.toHaveBeenCalled();
        });

        it("should handle multiple messages separated by CRLF", () => {
            mockWsInstance.onmessage?.({
                data: "PING :tmi.twitch.tv\r\nPING :tmi.twitch.tv",
            } as MessageEvent);

            expect(mockWsInstance.send).toHaveBeenCalledTimes(2);
            expect(mockWsInstance.send).toHaveBeenCalledWith(
                "PONG tmi.twitch.tv"
            );
        });

        it("should handle messages with null command gracefully", () => {
            // Message that parseIRCMessage returns null for
            mockWsInstance.onmessage?.({
                data: ":tmi.twitch.tv 002 username :Your host is tmi.twitch.tv",
            } as MessageEvent);

            // Should not throw error, just ignore the message
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it("should extract broadcaster flag from badges", () => {
            const commandSpy = vi.fn();
            twitchChat.on(TWITCH_EVENTS.COMMAND, commandSpy);

            mockWsInstance.onmessage?.({
                data: "@badge-info=;badges=broadcaster/1;color=#FF0000;display-name=TestUser;emotes=;id=test-id;mod=0;room-id=12345;subscriber=0;tmi-sent-ts=1234567890;turbo=0;user-id=12345;user-type= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :!test",
            } as MessageEvent);

            const callArgs = commandSpy.mock.calls[0]?.[0];
            expect(callArgs?.flags.broadcaster).toBe(true);
        });

        it("should extract moderator flag from badges", () => {
            const commandSpy = vi.fn();
            twitchChat.on(TWITCH_EVENTS.COMMAND, commandSpy);

            mockWsInstance.onmessage?.({
                data: "@badge-info=;badges=moderator/1;color=#FF0000;display-name=TestUser;emotes=;id=test-id;mod=1;room-id=12345;subscriber=0;tmi-sent-ts=1234567890;turbo=0;user-id=12345;user-type= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :!test",
            } as MessageEvent);

            const callArgs = commandSpy.mock.calls[0]?.[0];
            expect(callArgs?.flags.mod).toBe(true);
        });

        it("should extract user color and message ID from tags", () => {
            const commandSpy = vi.fn();
            twitchChat.on(TWITCH_EVENTS.COMMAND, commandSpy);

            mockWsInstance.onmessage?.({
                data: "@badge-info=;badges=broadcaster/1;color=#FF0000;display-name=TestUser;emotes=;id=test-message-id;mod=0;room-id=12345;subscriber=0;tmi-sent-ts=1234567890;turbo=0;user-id=12345;user-type= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :!test",
            } as MessageEvent);

            const callArgs = commandSpy.mock.calls[0]?.[0];
            expect(callArgs?.extra.userColor).toBe("#FF0000");
            expect(callArgs?.extra.messageId).toBe("test-message-id");
        });
    });

    describe("say method", () => {
        it("should send a message to the Twitch channel via the say() method", () => {
            twitchChat.connect();
            mockWsInstance.readyState = WebSocket.OPEN;
            twitchChat.say("Hello, World!", "test-message-id");
            expect(mockWsInstance.send).toHaveBeenCalledWith(
                "@reply-parent-msg-id=test-message-id PRIVMSG #channel :Hello, World!"
            );
        });

        it("should send message without reply-parent-msg-id when messageId is not provided", () => {
            twitchChat.connect();
            mockWsInstance.readyState = WebSocket.OPEN;
            twitchChat.say("Hello, World!", "");
            expect(mockWsInstance.send).toHaveBeenCalledWith(
                "PRIVMSG #channel :Hello, World!"
            );
        });

        it("should log error when WebSocket is not open (undefined state)", () => {
            // Don't call connect, so WebSocket is null
            twitchChat.say("Hello, World!", "");

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[TwitchChat] Cannot send message - WebSocket state: undefined"
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[TwitchChat] Message was: Hello, World!"
            );
            expect(mockWsInstance.send).not.toHaveBeenCalled();
        });

        it("should log error when WebSocket is in CONNECTING state", () => {
            twitchChat.connect();
            // WebSocket is created but readyState is CONNECTING (0) by default from beforeEach
            // Clear console spy to only capture the say() call
            consoleErrorSpy.mockClear();
            twitchChat.say("Hello, World!", "");

            // Verify error was logged (state could be 0 or undefined depending on mock timing)
            expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
            expect(consoleErrorSpy.mock.calls[0][0]).toMatch(
                /Cannot send message - WebSocket state:/
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[TwitchChat] Message was: Hello, World!"
            );
        });

        it("should log error when WebSocket is closed", () => {
            twitchChat.connect();
            mockWsInstance.readyState = WebSocket.CLOSED;
            consoleErrorSpy.mockClear();
            twitchChat.say("Hello, World!", "");

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[TwitchChat] Cannot send message - WebSocket state: 3"
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[TwitchChat] Message was: Hello, World!"
            );
        });
    });

    describe("disconnect method", () => {
        it("should close the WebSocket connection via the disconnect() method", () => {
            twitchChat.connect();
            mockWsInstance.readyState = WebSocket.OPEN;
            twitchChat.disconnect();
            expect(mockWsInstance.close).toHaveBeenCalled();
        });

        it("should close with custom code and reason", () => {
            twitchChat.connect();
            mockWsInstance.readyState = WebSocket.OPEN;
            twitchChat.disconnect(1001, "Going away");
            expect(mockWsInstance.close).toHaveBeenCalledWith(
                1001,
                "Going away"
            );
        });

        it("should handle disconnect when WebSocket is null", () => {
            // Don't call connect, so WebSocket is null
            expect(() => twitchChat.disconnect()).not.toThrow();
        });
    });

    describe("WebSocket Close Events", () => {
        beforeEach(() => {
            twitchChat.connect();
        });

        it("should log normal close for code 1000", () => {
            mockWsInstance.onclose?.({
                code: 1000,
                reason: "Normal closure",
            } as CloseEvent);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                "Connection closed normally."
            );
        });

        it("should reconnect with exponential backoff for code 1006", () => {
            vi.useFakeTimers();
            const connectSpy = vi.spyOn(twitchChat, "connect");

            mockWsInstance.onclose?.({
                code: 1006,
                reason: "Abnormal closure",
            } as CloseEvent);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Connection dropped. Reconnecting in 1000 milliseconds..."
            );

            // Fast-forward time to trigger reconnect
            vi.advanceTimersByTime(1000);
            expect(connectSpy).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it("should reconnect immediately for code 1012", () => {
            const connectSpy = vi.spyOn(twitchChat, "connect");

            mockWsInstance.onclose?.({
                code: 1012,
                reason: "Service restart",
            } as CloseEvent);

            expect(consoleLogSpy).toHaveBeenCalledWith("Switching  servers...");
            expect(connectSpy).toHaveBeenCalled();
        });

        it("should log unhandled close codes", () => {
            mockWsInstance.onclose?.({
                code: 1008,
                reason: "Policy violation",
            } as CloseEvent);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Unhandled code: 1008. Reason: Policy violation"
            );
        });

        it("should increase reconnect interval exponentially on repeated 1006 closes", () => {
            vi.useFakeTimers();
            const connectSpy = vi.spyOn(twitchChat, "connect");

            // First close - should reconnect after 1000ms
            mockWsInstance.onclose?.({
                code: 1006,
                reason: "Abnormal closure",
            } as CloseEvent);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Connection dropped. Reconnecting in 1000 milliseconds..."
            );

            vi.advanceTimersByTime(1000);
            expect(connectSpy).toHaveBeenCalledTimes(1);

            // Second close - should reconnect after 2000ms (doubled)
            mockWsInstance.onclose?.({
                code: 1006,
                reason: "Abnormal closure",
            } as CloseEvent);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Connection dropped. Reconnecting in 2000 milliseconds..."
            );

            vi.advanceTimersByTime(2000);
            expect(connectSpy).toHaveBeenCalledTimes(2);

            vi.useRealTimers();
        });

        it("should reset reconnect interval to 1000ms after successful JOIN", () => {
            vi.useFakeTimers();

            // Simulate a failed connection with 1006 close
            mockWsInstance.onclose?.({
                code: 1006,
                reason: "Abnormal closure",
            } as CloseEvent);

            vi.advanceTimersByTime(1000);

            // Simulate successful JOIN which resets the interval
            mockWsInstance.onmessage?.({
                data: ":username!username@username.tmi.twitch.tv JOIN #channel",
            } as MessageEvent);

            // Now if we get another 1006, it should use 1000ms again
            mockWsInstance.onclose?.({
                code: 1006,
                reason: "Abnormal closure",
            } as CloseEvent);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Connection dropped. Reconnecting in 1000 milliseconds..."
            );

            vi.useRealTimers();
        });
    });
});
