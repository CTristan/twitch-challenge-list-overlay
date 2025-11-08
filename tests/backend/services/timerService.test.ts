import { ChallengeStatus } from "@/types/ChallengeStatus";
import { TimerEndBehavior } from "@/types/TimerEndBehavior";
import { WindowMode } from "@/types/WindowMode";
import {
    getChallengeService,
    resetChallengeServiceForTesting,
} from "@backend/services/challengeService";
import {
    getTimerService,
    resetTimerServiceForTesting,
    type TimerSnapshot,
} from "@backend/services/timerService";
import { getWindowSyncService } from "@backend/services/windowSyncService";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

vi.mock("@backend/services/windowSyncService", () => {
    type ChallengeSubscriber = (event: any) => void;
    type ConfigSubscriber = (event: any) => void;
    type ConnectionSubscriber = (state: any) => void;

    const challengeSubscribers = new Set<ChallengeSubscriber>();
    const configSubscribers = new Set<ConfigSubscriber>();
    const connectionSubscribers = new Set<ConnectionSubscriber>();

    const defaultConnectionState = {
        connected: true,
        lastHeartbeat: null,
        mode: WindowMode.VIEWER,
    };

    const mockService = {
        subscribeToChallenge: vi.fn((listener: ChallengeSubscriber) => {
            challengeSubscribers.add(listener);
            return () => challengeSubscribers.delete(listener);
        }),
        subscribeToConfig: vi.fn((listener: ConfigSubscriber) => {
            configSubscribers.add(listener);
            return () => configSubscribers.delete(listener);
        }),
        subscribeToConnection: vi.fn((listener: ConnectionSubscriber) => {
            connectionSubscribers.add(listener);
            listener(defaultConnectionState);
            return () => connectionSubscribers.delete(listener);
        }),
        notifyChallengeStateChanged: vi.fn(),
        notifyConfigurationSaved: vi.fn(),
        notifyConfigurationSavedViewerOnly: vi.fn(),
        announceLocalChallengeStateChanged: vi.fn(),
        announceLocalConfigSaved: vi.fn(),
        setRefreshDelay: vi.fn(),
        isConnected: vi.fn(() => true),
        getConnectionState: vi.fn(() => defaultConnectionState),
        __emitChallenge(event: any) {
            challengeSubscribers.forEach((listener) => listener(event));
        },
        __emitConfig(event: any) {
            configSubscribers.forEach((listener) => listener(event));
        },
        __reset() {
            challengeSubscribers.clear();
            configSubscribers.clear();
            connectionSubscribers.clear();
            this.notifyChallengeStateChanged.mockClear();
            this.notifyConfigurationSaved.mockClear();
            this.notifyConfigurationSavedViewerOnly.mockClear();
        },
    };

    return {
        getWindowSyncService: () => mockService,
        resetWindowSyncServiceForTesting: vi.fn(() => mockService.__reset()),
    };
});

const getMockWindowSync = () => getWindowSyncService() as any;

describe("timerService", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
        vi.clearAllMocks();
        resetTimerServiceForTesting();
        resetChallengeServiceForTesting();
        getMockWindowSync().__reset();
        Object.defineProperty(window, "location", {
            value: { hash: "" },
            configurable: true,
        });
    });

    afterEach(() => {
        resetTimerServiceForTesting();
        resetChallengeServiceForTesting();
        vi.useRealTimers();
    });

    it("emits snapshot updates for active timers", () => {
        const challengeService = getChallengeService();
        const timerService = getTimerService();
        const snapshots: TimerSnapshot[] = [];
        const unsubscribe = timerService.subscribe((snapshot) => {
            snapshots.push(snapshot);
        });

        const created = challengeService.addChallenge({
            title: "Timed",
            timer: "3s",
        });

        timerService.startTimer(created.id);

        expect(timerService.getSnapshot().hasActiveTimers).toBe(true);

        vi.advanceTimersByTime(1000);

        const entryAfterTick = timerService
            .getSnapshot()
            .timers.find((entry) => entry.challengeId === created.id);
        expect(entryAfterTick?.remainingSeconds).toBe(2);

        const sync = getMockWindowSync();

        vi.advanceTimersByTime(3000);

        const finalEntry = timerService
            .getSnapshot()
            .timers.find((entry) => entry.challengeId === created.id);
        expect(finalEntry?.isExpired).toBe(true);
        const updatedChallenge = challengeService
            .getSnapshot()
            .challenges.find((challenge) => challenge.id === created.id);
        expect(updatedChallenge?.status).toBe(ChallengeStatus.FAILED);
        expect(sync.notifyChallengeStateChanged).toHaveBeenCalled();

        unsubscribe();
        expect(snapshots.length).toBeGreaterThan(1);
    });

    it("respects timer end behavior auto-complete", () => {
        const challengeService = getChallengeService();
        const timerService = getTimerService();

        const created = challengeService.addChallenge({
            title: "Auto complete",
            timer: "2s",
            timerEndBehavior: TimerEndBehavior.AUTO_COMPLETE,
        });

        timerService.startTimer(created.id);

        vi.advanceTimersByTime(2100);

        const updatedChallenge = challengeService
            .getSnapshot()
            .challenges.find((challenge) => challenge.id === created.id);
        expect(updatedChallenge?.status).toBe(ChallengeStatus.COMPLETED);
    });

    it("allows pausing and resuming timers", () => {
        const challengeService = getChallengeService();
        const timerService = getTimerService();

        const created = challengeService.addChallenge({
            title: "Pause me",
            timer: "10s",
        });

        timerService.startTimer(created.id);
        vi.advanceTimersByTime(2000);

        const beforePause = timerService
            .getSnapshot()
            .timers.find((entry) => entry.challengeId === created.id);
        expect(beforePause?.remainingSeconds).toBe(8);
        expect(beforePause?.isPaused).toBe(false);

        timerService.pauseTimer(created.id);

        const pausedEntry = timerService
            .getSnapshot()
            .timers.find((entry) => entry.challengeId === created.id);
        expect(pausedEntry?.isPaused).toBe(true);
        const remainingWhilePaused = pausedEntry?.remainingSeconds ?? 0;

        vi.advanceTimersByTime(5000);

        const stillPaused = timerService
            .getSnapshot()
            .timers.find((entry) => entry.challengeId === created.id);
        expect(stillPaused?.remainingSeconds).toBe(remainingWhilePaused);

        timerService.resumeTimer(created.id);
        vi.advanceTimersByTime(1000);

        const afterResume = timerService
            .getSnapshot()
            .timers.find((entry) => entry.challengeId === created.id);
        expect(afterResume?.remainingSeconds).toBeLessThan(
            remainingWhilePaused
        );
        expect(afterResume?.isPaused).toBe(false);
    });
});
