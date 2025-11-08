import { NETWORK_URLS, TWITCH_EVENTS } from "@/types/ConfigConstants";
import {
    getTwitchChatService,
    resetTwitchChatServiceForTesting,
    type TwitchConnectionState,
} from "@backend/services/twitchChatService";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

const { COMMAND, OAUTH_ERROR, OAUTH_SUCCESS } = TWITCH_EVENTS;

type CommandListener = (...args: any[]) => void;

type ListenerMap = Map<string, CommandListener[]>;

class MockTwitchChat {
    options: { username: string; authToken: string; channel: string };
    listeners: ListenerMap = new Map();
    connect = vi.fn();
    disconnect = vi.fn();
    say = vi.fn();

    constructor(
        _url: string,
        options: { username: string; authToken: string; channel: string }
    ) {
        this.options = options;
    }

    on(event: string, listener: CommandListener): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
    }

    off(event: string, listener: CommandListener): void {
        const eventListeners = this.listeners.get(event);
        if (!eventListeners) return;
        const index = eventListeners.indexOf(listener);
        if (index !== -1) {
            eventListeners.splice(index, 1);
        }
        if (eventListeners.length === 0) {
            this.listeners.delete(event);
        }
    }

    emit(event: string, ...args: any[]): void {
        this.listeners.get(event)?.forEach((listener) => listener(...args));
    }
}

const createFactory = () => {
    const instances: MockTwitchChat[] = [];
    const factory = vi.fn(
        (
            url: string,
            options: { username: string; authToken: string; channel: string }
        ) => {
            const instance = new MockTwitchChat(url, options);
            instances.push(instance);
            return instance;
        }
    );
    return { factory, instances };
};

const credentials: Config["auth"] = {
    twitch_oauth: "oauth:test-token",
    twitch_username: "TestUser",
    twitch_channel: "SomeChannel",
};

describe("twitchChatService", () => {
    beforeEach(() => {
        ensureTestIsolation();
        resetTwitchChatServiceForTesting();
        vi.clearAllMocks();
    });

    afterEach(() => {
        resetTwitchChatServiceForTesting();
        vi.restoreAllMocks();
    });

    it("warns when reconnect is called without credentials", () => {
        const { factory } = createFactory();
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);

        service.reconnect();

        expect(warnSpy).toHaveBeenCalled();
        expect(factory).not.toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    it("connects when credentials are provided", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);

        service.connect(credentials);

        expect(factory).toHaveBeenCalledWith(NETWORK_URLS.TWITCH_IRC, {
            username: "TestUser",
            authToken: "oauth:test-token",
            channel: "SomeChannel",
        });

        const client = instances[0]!;
        expect(client.connect).toHaveBeenCalled();
        expect(service.getConnectionState().status).toBe("connecting");
    });

    it("exposes current connection state to subscribers", () => {
        const { factory } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);

        const received: TwitchConnectionState[] = [];
        const unsubscribe = service.subscribeToConnection((state) => {
            received.push(state);
        });

        expect(received).toHaveLength(1);
        expect(received[0]!.status).toBe("idle");
        unsubscribe();
    });

    it("auto-connects when auth config is updated", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);

        service.updateAuthConfig(credentials);

        const client = instances[0]!;
        expect(client.connect).toHaveBeenCalled();
    });

    it("can update auth config without auto connect", () => {
        const { factory } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);

        service.updateAuthConfig(credentials, { autoConnect: false });

        expect(factory).not.toHaveBeenCalled();
    });

    it("tracks connection state transitions", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);

        service.connect(credentials);
        const client = instances[0]!;

        client.emit(OAUTH_SUCCESS);
        const connectedState: TwitchConnectionState =
            service.getConnectionState();
        expect(connectedState.status).toBe("connected");
        expect(connectedState.lastConnectedAt).not.toBeNull();
        expect(connectedState.error).toBeNull();

        client.emit(OAUTH_ERROR);
        const errorState: TwitchConnectionState = service.getConnectionState();
        expect(errorState.status).toBe("error");
        expect(errorState.error).toBe("OAuth authentication failed");
        expect(errorState.lastDisconnectedAt).not.toBeNull();
    });

    it("forwards commands to subscribers", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const client = instances[0]!;

        const received: CommandData[] = [];
        const unsubscribe = service.subscribeToCommands((data) => {
            received.push(data);
        });

        client.emit(COMMAND, {
            user: "tester",
            command: "ch",
            message: "payload",
            flags: { broadcaster: true, mod: false },
            extra: { userColor: "#fff", messageId: "1" },
        } satisfies CommandData);

        expect(received).toHaveLength(1);
        expect(received[0]!.command).toBe("ch");
        unsubscribe();
    });

    it("disconnects active clients and updates state", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const client = instances[0]!;

        service.disconnect();

        expect(client.disconnect).toHaveBeenCalled();
        expect(service.getConnectionState().status).toBe("disconnected");
    });

    it("sends chat messages through active client", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const client = instances[0]!;

        service.sendMessage("hello", "msg-1");

        expect(client.say).toHaveBeenCalledWith("hello", "msg-1");
    });

    it("warns when sending messages without an active client", () => {
        const { factory } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);

        service.sendMessage("hello world");

        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    it("handles disconnect errors gracefully", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const client = instances[0]!;
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        client.disconnect.mockImplementationOnce(() => {
            throw new Error("Disconnect error");
        });

        expect(() => service.disconnect()).not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("disconnect error"),
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("handles send message errors gracefully", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const client = instances[0]!;
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        client.say.mockImplementationOnce(() => {
            throw new Error("Send error");
        });

        expect(() => service.sendMessage("test")).not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("failed to send message"),
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("handles command listener errors gracefully", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const client = instances[0]!;
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        service.subscribeToCommands(() => {
            throw new Error("Listener error");
        });

        client.emit(COMMAND, {
            user: "test",
            command: "ch",
            message: "test",
            flags: { broadcaster: false, mod: false },
            extra: { userColor: "#fff", messageId: "1" },
        } satisfies CommandData);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("command listener error"),
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("handles connection listener errors gracefully", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        let shouldThrow = false;
        service.subscribeToConnection(() => {
            if (shouldThrow) {
                throw new Error("Connection listener error");
            }
        });

        shouldThrow = true;
        service.connect(credentials);
        const client = instances[0]!;
        client.emit(OAUTH_SUCCESS);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("connection listener error"),
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("reconnects when credentials change", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const firstClient = instances[0]!;

        const newCredentials: Config["auth"] = {
            ...credentials,
            twitch_username: "NewUser",
        };
        service.reconnect();
        service.updateAuthConfig(newCredentials);

        expect(firstClient.disconnect).toHaveBeenCalled();
        expect(instances).toHaveLength(3);
        expect(instances[2]!.options.username).toBe("NewUser");
    });

    it("does not reconnect when already connected with same credentials", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const client = instances[0]!;
        client.emit(OAUTH_SUCCESS);

        service.reconnect();

        expect(instances).toHaveLength(1);
        expect(client.disconnect).not.toHaveBeenCalled();
    });

    it("disconnects and reports error when credentials are invalid", () => {
        const { factory } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);

        service.reconnect();
        service.updateAuthConfig({
            twitch_oauth: "",
            twitch_username: "",
            twitch_channel: "",
        });

        const state = service.getConnectionState();
        expect(state.status).toBe("error");
        expect(state.error).toBe("Missing Twitch credentials");
    });

    it("normalizes auth config by trimming whitespace", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);

        service.connect({
            twitch_oauth: "  oauth:token  ",
            twitch_username: "  User  ",
            twitch_channel: "  Channel  ",
        });

        const client = instances[0]!;
        expect(client.options.authToken).toBe("oauth:token");
        expect(client.options.username).toBe("User");
        expect(client.options.channel).toBe("Channel");
    });

    it("returns correct isConnected status", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);

        expect(service.isConnected()).toBe(false);

        service.connect(credentials);
        expect(service.isConnected()).toBe(false);

        const client = instances[0]!;
        client.emit(OAUTH_SUCCESS);
        expect(service.isConnected()).toBe(true);

        service.disconnect();
        expect(service.isConnected()).toBe(false);
    });

    it("cleans up all state on destroy", () => {
        const { factory, instances } = createFactory();
        const service = getTwitchChatService(NETWORK_URLS.TWITCH_IRC, factory);
        service.connect(credentials);
        const client = instances[0]!;
        const commandSpy = vi.fn();
        const connectionSpy = vi.fn();
        service.subscribeToCommands(commandSpy);
        service.subscribeToConnection(connectionSpy);

        service.destroy();

        expect(client.disconnect).toHaveBeenCalled();
        expect(service.getConnectionState().status).toBe("idle");

        client.emit(COMMAND, {} as CommandData);
        expect(commandSpy).toHaveBeenCalledTimes(0);
    });
});
