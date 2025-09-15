import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TwitchChat from "../../src/twitch/TwitchChat";

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

  beforeEach(() => {
    chatEvent = vi.fn((data) => {
      const { user, command, message, flags, extra } = data;
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
    twitchChat.on("command", chatEvent);
  });

  afterEach(() => {
    vi.resetAllMocks();
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

  describe("say method", () => {
    it("should send a message to the Twitch channel via the say() method", () => {
      twitchChat.connect();
      mockWsInstance.readyState = WebSocket.OPEN;
      twitchChat.say("Hello, World!", "test-message-id");
      expect(mockWsInstance.send).toHaveBeenCalledWith(
        "@reply-parent-msg-id=test-message-id PRIVMSG #channel :Hello, World!"
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
  });
});
