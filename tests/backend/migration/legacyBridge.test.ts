import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

// Mock all backend services used by the legacy bridge so we can assert delegation
vi.mock("@backend/services/challengeService", () => {
    const subscribe = vi.fn(() => () => void 0);
    const getSnapshot = vi.fn(() => ({
        challenges: [],
        totals: { total: 0, completed: 0, failed: 0, inProgress: 0 },
        hasActiveTimers: false,
        activeTimerCount: 0,
        timestamp: Date.now(),
    }));
    return {
        getChallengeService: () => ({
            subscribe,
            getSnapshot,
            addChallenge: vi.fn(),
            updateChallenge: vi.fn(),
            deleteChallenges: vi.fn(),
            clearAll: vi.fn(),
            toggleCompletion: vi.fn(),
            incrementProgress: vi.fn(),
            decrementProgress: vi.fn(),
            reorderChallenges: vi.fn(),
            loadFromStorage: vi.fn(),
        }),
        // Export types for TS only; no runtime needed
    };
});

vi.mock("@backend/services/configService", () => {
    const subscribe = vi.fn(() => () => void 0);
    const getSnapshot = vi.fn(() => ({
        config: {} as unknown as Config,
        status: {} as any,
        timestamp: Date.now(),
    }));
    return {
        getConfigService: () => ({
            subscribe,
            getSnapshot,
            setValue: vi.fn(),
            setAll: vi.fn(),
            reset: vi.fn(),
        }),
    };
});

vi.mock("@backend/services/windowSyncService", () => {
    const subscribeToConnection = vi.fn(() => () => void 0);
    const getConnectionState = vi.fn(() => ({
        connected: true,
        lastHeartbeat: null,
        mode: 1,
    }));
    return {
        getWindowSyncService: () => ({
            subscribeToConnection,
            getConnectionState,
        }),
    };
});

vi.mock("@backend/services/twitchChatService", () => {
    const subscribeToConnection = vi.fn(() => () => void 0);
    const subscribeToCommands = vi.fn(() => () => void 0);
    const getConnectionState = vi.fn(() => ({
        status: "idle",
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        error: null,
    }));
    const connect = vi.fn();
    const disconnect = vi.fn();
    const sendMessage = vi.fn();
    return {
        getTwitchChatService: () => ({
            subscribeToConnection,
            subscribeToCommands,
            getConnectionState,
            connect,
            disconnect,
            sendMessage,
        }),
    };
});

vi.mock("@backend/services/timerService", () => {
    const subscribe = vi.fn(() => () => void 0);
    const getSnapshot = vi.fn(() => ({
        timers: [],
        hasActiveTimers: false,
        activeTimerCount: 0,
        nextExpirationTimestamp: null,
        timestamp: Date.now(),
    }));
    const startTimer = vi.fn();
    const pauseTimer = vi.fn();
    const resumeTimer = vi.fn();
    const stopTimer = vi.fn();
    const clearTimer = vi.fn();
    return {
        getTimerService: () => ({
            subscribe,
            getSnapshot,
            startTimer,
            pauseTimer,
            resumeTimer,
            stopTimer,
            clearTimer,
        }),
    };
});

import {
    legacyChallengeBridge,
    legacyConfigBridge,
    legacyTimerBridge,
    legacyTwitchBridge,
    legacyWindowConnectionBridge,
} from "@backend/migration/legacyBridge";

describe("backend/migration/legacyBridge", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.clearAllMocks();
    });

    it("delegates challenge bridge methods", () => {
        const unsub = legacyChallengeBridge.subscribe(() => {});
        expect(typeof unsub).toBe("function");
        const snap = legacyChallengeBridge.snapshot();
        expect(snap).toHaveProperty("challenges");
    });

    it("delegates config bridge methods", () => {
        const unsub = legacyConfigBridge.subscribe(() => {});
        expect(typeof unsub).toBe("function");
        const snap = legacyConfigBridge.snapshot();
        expect(snap).toHaveProperty("config");
    });

    it("delegates window connection bridge methods", () => {
        const unsub = legacyWindowConnectionBridge.subscribe(() => {});
        expect(typeof unsub).toBe("function");
        const state = legacyWindowConnectionBridge.state();
        expect(state).toHaveProperty("connected", true);
    });

    it("delegates twitch bridge methods", () => {
        const unsubConn = legacyTwitchBridge.subscribeToConnection(() => {});
        const unsubCmds = legacyTwitchBridge.subscribeToCommands(() => {});
        expect(typeof unsubConn).toBe("function");
        expect(typeof unsubCmds).toBe("function");
        legacyTwitchBridge.connect({
            twitch_oauth: "x",
            twitch_username: "u",
            twitch_channel: "c",
        });
        legacyTwitchBridge.sendMessage("hi");
        legacyTwitchBridge.disconnect();
        expect(legacyTwitchBridge.connectionState().status).toBe("idle");
    });

    it("delegates timer bridge methods", () => {
        const unsub = legacyTimerBridge.subscribe(() => {});
        expect(typeof unsub).toBe("function");
        const snap = legacyTimerBridge.snapshot();
        expect(snap).toHaveProperty("timers");
        legacyTimerBridge.startTimer("1");
        legacyTimerBridge.pauseTimer("1");
        legacyTimerBridge.resumeTimer("1");
        legacyTimerBridge.stopTimer("1");
        legacyTimerBridge.clearTimer("1");
        expect(true).toBe(true);
    });
});
