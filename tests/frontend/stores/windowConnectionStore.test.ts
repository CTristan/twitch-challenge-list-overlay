import type { WindowConnectionState } from "@backend/services/windowSyncService";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

const connSubscribers = new Set<(s: WindowConnectionState) => void>();

vi.mock("@backend/services/windowSyncService", () => {
    const state: WindowConnectionState = {
        connected: true,
        lastHeartbeat: null,
        mode: 1 as any,
    };
    const service = {
        subscribeToConnection: vi.fn(
            (fn: (s: WindowConnectionState) => void) => {
                connSubscribers.add(fn);
                fn(state);
                return () => connSubscribers.delete(fn);
            }
        ),
        getConnectionState: vi.fn(() => state),
        isConnected: vi.fn(() => state.connected),
    } as const;
    return {
        getWindowSyncService: () => service,
    };
});

describe("frontend stores - windowConnectionStore", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.clearAllMocks();
        connSubscribers.clear();
    });

    it("exposes connection state via subscribe and helpers", async () => {
        const { windowConnectionStore } = await import(
            "@frontend/lib/stores/windowConnectionStore"
        );
        let latest: any = null;
        const unsub = windowConnectionStore.subscribe((s) => (latest = s));
        expect(latest?.connected).toBe(true);
        unsub();
        expect(windowConnectionStore.isConnected()).toBe(true);
    });
});
