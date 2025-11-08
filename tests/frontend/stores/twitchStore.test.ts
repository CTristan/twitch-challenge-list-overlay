import type { TwitchConnectionState } from "@backend/services/twitchChatService";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

const connSubscribers = new Set<(s: TwitchConnectionState) => void>();
const cmdSubscribers = new Set<(d: CommandData) => void>();

vi.mock("@backend/services/twitchChatService", () => {
    const state: TwitchConnectionState = {
        status: "idle",
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        error: null,
    };
    const service = {
        updateAuthConfig: vi.fn(),
        connect: vi.fn(),
        reconnect: vi.fn(),
        disconnect: vi.fn(),
        sendMessage: vi.fn(),
        subscribeToCommands: vi.fn((fn: (d: CommandData) => void) => {
            cmdSubscribers.add(fn);
            return () => cmdSubscribers.delete(fn);
        }),
        subscribeToConnection: vi.fn(
            (fn: (s: TwitchConnectionState) => void) => {
                connSubscribers.add(fn);
                fn(state);
                return () => connSubscribers.delete(fn);
            }
        ),
        getConnectionState: vi.fn(() => state),
        isConnected: vi.fn(() => state.status === "connected"),
    } as const;
    return {
        getTwitchChatService: () => service,
    };
});

describe("frontend stores - twitchStore", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.clearAllMocks();
        connSubscribers.clear();
        cmdSubscribers.clear();
    });

    it("forwards twitch operations to service", async () => {
        const { twitchStore } = await import(
            "@frontend/lib/stores/twitchStore"
        );
        const service = (
            await import("@backend/services/twitchChatService")
        ).getTwitchChatService() as any;
        twitchStore.updateAuthConfig(
            { twitch_oauth: "x", twitch_username: "u", twitch_channel: "c" },
            { autoConnect: true }
        );
        expect(service.updateAuthConfig).toHaveBeenCalled();
        twitchStore.connect({
            twitch_oauth: "x",
            twitch_username: "u",
            twitch_channel: "c",
        });
        expect(service.connect).toHaveBeenCalled();
        twitchStore.reconnect();
        expect(service.reconnect).toHaveBeenCalled();
        twitchStore.disconnect();
        expect(service.disconnect).toHaveBeenCalled();
        twitchStore.sendMessage("hi", "1");
        expect(service.sendMessage).toHaveBeenCalledWith("hi", "1");

        const unsubCmds = twitchStore.subscribeToCommands(() => {});
        expect(typeof unsubCmds).toBe("function");
        expect(twitchStore.getConnectionState().status).toBe("idle");
        expect(twitchStore.isConnected()).toBe(false);
    });
});
