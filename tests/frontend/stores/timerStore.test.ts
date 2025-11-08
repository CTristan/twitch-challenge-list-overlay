import type { TimerSnapshot } from "@backend/services/timerService";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

const timerSubscribers = new Set<(snapshot: TimerSnapshot) => void>();

vi.mock("@backend/services/timerService", () => {
    const snapshot: TimerSnapshot = {
        timers: [],
        hasActiveTimers: false,
        activeTimerCount: 0,
        nextExpirationTimestamp: null,
        timestamp: Date.now(),
    };
    const service = {
        getSnapshot: vi.fn(() => snapshot),
        subscribe: vi.fn((listener: (s: TimerSnapshot) => void) => {
            timerSubscribers.add(listener);
            return () => timerSubscribers.delete(listener);
        }),
        startTimer: vi.fn(),
        pauseTimer: vi.fn(),
        resumeTimer: vi.fn(),
        stopTimer: vi.fn(),
        clearTimer: vi.fn(),
    } as const;
    return {
        getTimerService: () => service,
    };
});

describe("frontend stores - timerStore", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.clearAllMocks();
        timerSubscribers.clear();
    });

    it("subscribes and forwards commands", async () => {
        const { timerStore } = await import("@frontend/lib/stores/timerStore");
        let latest: any = null;
        const unsub = timerStore.subscribe((s) => (latest = s));
        expect(latest).not.toBeNull();
        timerSubscribers.forEach((fn) =>
            fn({ ...latest, timestamp: Date.now() })
        );
        unsub();

        const service = (
            await import("@backend/services/timerService")
        ).getTimerService() as any;
        timerStore.startTimer("1");
        expect(service.startTimer).toHaveBeenCalledWith("1");
        timerStore.pauseTimer("1");
        expect(service.pauseTimer).toHaveBeenCalledWith("1");
        timerStore.resumeTimer("1");
        expect(service.resumeTimer).toHaveBeenCalledWith("1");
        timerStore.stopTimer("1");
        expect(service.stopTimer).toHaveBeenCalledWith("1");
        timerStore.clearTimer("1");
        expect(service.clearTimer).toHaveBeenCalledWith("1");
    });
});
