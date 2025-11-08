import ConfigManager from "@/classes/ConfigManager";
import { ChallengeStatus } from "@/types/ChallengeStatus";
import { AUTH_CONFIG } from "@/types/ConfigConstants";
import { MessageVariant } from "@/types/MessageVariant";
import { TimerEndBehavior } from "@/types/TimerEndBehavior";
import { WindowMode } from "@/types/WindowMode";
import {
    getChallengeService,
    resetChallengeServiceForTesting,
    type ChallengeUpdateEvent,
} from "@backend/services/challengeService";
import {
    getConfigService,
    resetConfigServiceForTesting,
    type ConfigUpdateEvent,
} from "@backend/services/configService";
import { getWindowSyncService } from "@backend/services/windowSyncService";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("backend services integration", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.clearAllMocks();
        resetChallengeServiceForTesting();
        resetConfigServiceForTesting();
        getMockWindowSync().__reset();
        Object.defineProperty(window, "location", {
            value: { hash: "" },
            configurable: true,
        });
    });

    describe("challengeService", () => {
        it("emits init snapshot on subscribe", () => {
            const service = getChallengeService();
            const events: ChallengeUpdateEvent[] = [];
            const unsubscribe = service.subscribe((event) => {
                events.push(event);
            });
            unsubscribe();

            expect(events).toHaveLength(1);
            const initEvent = events[0]!;
            expect(initEvent.type).toBe("init");
            expect(initEvent.snapshot.challenges).toHaveLength(0);
        });

        it("adds challenges and notifies window sync", () => {
            const service = getChallengeService();
            const sync = getMockWindowSync();
            const events: ChallengeUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));

            const created = service.addChallenge({ title: "Defeat Boss" });

            expect(created.title).toBe("Defeat Boss");
            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("add");
            expect(lastEvent.changedIds).toEqual([created.id]);
            expect(sync.notifyChallengeStateChanged).toHaveBeenCalledTimes(1);
        });

        it("removes timers when null is provided", () => {
            const service = getChallengeService();
            const events: ChallengeUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));

            const created = service.addChallenge({
                title: "Timed",
                timer: "10s",
            });

            expect(created.timer?.duration).toBe(10);

            const updated = service.updateChallenge(created.id, {
                timer: null,
            });
            expect(updated.timer).toBeNull();
            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("update");
            expect(lastEvent.changedIds).toEqual([created.id]);
        });

        it("handles external challenge sync events", () => {
            const service = getChallengeService();
            const sync = getMockWindowSync();
            const events: ChallengeUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));
            service.addChallenge({ title: "Local" });
            const previousEventCount = events.length;

            sync.__emitChallenge({
                type: "challenge-state-changed",
                source: WindowMode.ADMIN,
                timestamp: Date.now(),
            });

            expect(events.length).toBe(previousEventCount + 1);
            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("sync");
            expect(lastEvent.origin).toBe("external");
        });

        it("toggles completion and broadcasts updates", () => {
            const service = getChallengeService();
            const sync = getMockWindowSync();
            const events: ChallengeUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));
            const created = service.addChallenge({ title: "Toggle" });

            const toggled = service.toggleCompletion(created.id);

            expect(toggled.status).toBe(ChallengeStatus.COMPLETED);
            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("update");
            expect(lastEvent.changedIds).toEqual([created.id]);
            expect(sync.notifyChallengeStateChanged).toHaveBeenCalledTimes(2);
        });

        it("increments, decrements, and deletes challenges", () => {
            const service = getChallengeService();
            const sync = getMockWindowSync();
            const events: ChallengeUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));
            const first = service.addChallenge({
                title: "Progress",
                amount: 5,
            });
            const second = service.addChallenge({ title: "Delete me" });

            const incremented = service.incrementProgress(first.id, 3);
            expect(incremented.progress).toBe(3);
            const decremented = service.decrementProgress(first.id, 2);
            expect(decremented.progress).toBe(1);

            service.deleteChallenges([second.id]);

            const snapshot = service.getSnapshot();
            expect(snapshot.challenges).toHaveLength(1);
            expect(snapshot.challenges[0]?.id).toBe(first.id);
            const reasons = events
                .filter((event) => event.type === "delete")
                .map((event) => event.reason ?? null);
            expect(reasons).toContain(null);
            expect(sync.notifyChallengeStateChanged).toHaveBeenCalledTimes(5);
        });

        it("reorders challenges and clears all", () => {
            const service = getChallengeService();
            const events: ChallengeUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));
            const first = service.addChallenge({ title: "A" });
            const second = service.addChallenge({ title: "B" });
            const third = service.addChallenge({ title: "C" });

            service.reorderChallenges([third.id, first.id]);
            let snapshot = service.getSnapshot();
            expect(snapshot.challenges.map((c) => c.id)).toEqual([
                third.id,
                first.id,
                second.id,
            ]);

            service.clearAll();
            snapshot = service.getSnapshot();
            expect(snapshot.challenges).toHaveLength(0);
            const clearEvent = events.find(
                (event) => event.reason === "clear-all"
            );
            expect(clearEvent).toBeDefined();
        });

        it("manages timer lifecycle primitives", () => {
            vi.useFakeTimers();
            const service = getChallengeService();
            const sync = getMockWindowSync();
            service.subscribe(() => {});
            const created = service.addChallenge({
                title: "Timer",
                timer: "5s",
            });

            const started = service.startTimer(created.id);
            expect(started.timer?.isActive).toBe(true);

            const paused = service.pauseTimer(created.id);
            expect(paused.timer?.isPaused).toBe(true);

            const resumed = service.resumeTimer(created.id);
            expect(resumed.timer?.isPaused).toBe(false);

            const stopped = service.stopTimer(created.id);
            expect(stopped.timer?.isActive).toBe(false);

            const cleared = service.clearTimer(created.id);
            expect(cleared.timer).toBeNull();

            expect(sync.notifyChallengeStateChanged).toHaveBeenCalledTimes(6);
            vi.useRealTimers();
        });

        it("loads from storage and emits sync events", () => {
            const service = getChallengeService();
            const events: ChallengeUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));
            const created = service.addChallenge({ title: "Persist" });
            const list = service.getLegacyChallengeList();
            list.toggleChallengeCompletion(created.id);
            list.saveToLocalStorage();

            service.loadFromStorage();

            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("sync");
            expect(lastEvent.origin).toBe("external");
            const refreshed = service.getSnapshot().challenges[0]!;
            expect(refreshed.status).toBe(ChallengeStatus.COMPLETED);
        });

        it("handles errors in broadcast gracefully", () => {
            const service = getChallengeService();
            const sync = getMockWindowSync();
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            sync.notifyChallengeStateChanged.mockImplementationOnce(() => {
                throw new Error("Broadcast failed");
            });

            expect(() => {
                service.addChallenge({ title: "Error test" });
            }).not.toThrow();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Failed to broadcast"),
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("handles errors in listeners gracefully", () => {
            const service = getChallengeService();
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            let shouldThrow = false;
            service.subscribe(() => {
                if (shouldThrow) {
                    throw new Error("Listener error");
                }
            });

            shouldThrow = true;
            expect(() => {
                service.addChallenge({ title: "Listener test" });
            }).not.toThrow();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("listener error"),
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("throws when toggling non-existent challenge", () => {
            const service = getChallengeService();
            service.subscribe(() => {});

            expect(() => service.toggleCompletion("non-existent")).toThrow(
                "Challenge with id non-existent not found"
            );
        });

        it("throws when updating non-existent challenge", () => {
            const service = getChallengeService();
            service.subscribe(() => {});

            expect(() =>
                service.updateChallenge("non-existent", { title: "New" })
            ).toThrow("Challenge with id non-existent not found");
        });

        it("throws when operating on timers without timer", () => {
            vi.useFakeTimers();
            const service = getChallengeService();
            service.subscribe(() => {});
            const created = service.addChallenge({ title: "No timer" });

            expect(() => service.startTimer(created.id)).toThrow(
                `Challenge with id ${created.id} does not have a timer`
            );
            expect(() => service.pauseTimer(created.id)).toThrow(
                `Challenge with id ${created.id} does not have a timer`
            );
            expect(() => service.resumeTimer(created.id)).toThrow(
                `Challenge with id ${created.id} does not have a timer`
            );
            expect(() => service.stopTimer(created.id)).toThrow(
                `Challenge with id ${created.id} does not have a timer`
            );
            expect(() => service.clearTimer(created.id)).toThrow(
                `Challenge with id ${created.id} does not have a timer`
            );

            vi.useRealTimers();
        });

        it("filters out invalid IDs when deleting", () => {
            const service = getChallengeService();
            const events: ChallengeUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));
            const created = service.addChallenge({ title: "Valid" });

            service.deleteChallenges([created.id, "invalid-1", "invalid-2"]);

            const snapshot = service.getSnapshot();
            expect(snapshot.challenges).toHaveLength(0);
        });

        it("supports all optional parameters in addChallenge", () => {
            const service = getChallengeService();
            service.subscribe(() => {});

            const withAllOptions = service.addChallenge({
                title: "Full",
                description: "Desc",
                amount: 5,
                timer: "10s",
                timerEndBehavior: TimerEndBehavior.AUTO_COMPLETE,
            });

            expect(withAllOptions.description).toBe("Desc");
            expect(withAllOptions.amount).toBe(5);
            expect(withAllOptions.timer).not.toBeNull();
            expect(withAllOptions.timerEndBehavior).toBe(
                TimerEndBehavior.AUTO_COMPLETE
            );

            const withNoOptions = service.addChallenge({
                title: "Minimal",
            });

            expect(withNoOptions.description).toBe("");
            expect(withNoOptions.timer).toBeNull();
        });

        it("supports all optional parameters in updateChallenge", () => {
            const service = getChallengeService();
            service.subscribe(() => {});
            const created = service.addChallenge({ title: "Original" });

            const updated = service.updateChallenge(created.id, {
                title: "New Title",
                description: "New Desc",
                amount: 10,
                progress: 5,
                status: ChallengeStatus.COMPLETED,
                timerEndBehavior: TimerEndBehavior.AUTO_FAIL,
            });

            expect(updated.title).toBe("New Title");
            expect(updated.description).toBe("New Desc");
            expect(updated.amount).toBe(10);
            expect(updated.progress).toBe(5);
            expect(updated.status).toBe(ChallengeStatus.COMPLETED);
            expect(updated.timerEndBehavior).toBe(TimerEndBehavior.AUTO_FAIL);
        });
    });

    describe("configService", () => {
        it("updates individual configuration values and broadcasts", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();
            const events: ConfigUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));

            const success = service.setValue(
                AUTH_CONFIG.TWITCH_USERNAME,
                "new_user"
            );

            expect(success).toBe(true);
            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("set");
            expect(lastEvent.changedPaths).toEqual([
                AUTH_CONFIG.TWITCH_USERNAME,
            ]);
            expect(sync.notifyConfigurationSaved).toHaveBeenCalledTimes(1);
        });

        it("uses viewer-only broadcasts when requested", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();

            const snapshot = service.getSnapshot();
            const success = service.setAll(snapshot.config, {
                variant: MessageVariant.VIEWER_ONLY,
            });

            expect(success).toBe(true);
            expect(
                sync.notifyConfigurationSavedViewerOnly
            ).toHaveBeenCalledTimes(1);
        });

        it("ignores self-originated sync events", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();
            const events: ConfigUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));

            service.setValue(AUTH_CONFIG.TWITCH_CHANNEL, "example_channel");
            const eventCountAfterSet = events.length;

            sync.__emitConfig({
                type: "config-saved",
                variant: MessageVariant.ALL,
                source: WindowMode.VIEWER,
                timestamp: Date.now(),
            });

            expect(events.length).toBe(eventCountAfterSet);
        });

        it("handles external configuration sync", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();
            const events: ConfigUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));

            const manager = ConfigManager.getInstance();
            manager.set(AUTH_CONFIG.TWITCH_OAUTH, "oauth:external");

            sync.__emitConfig({
                type: "config-saved",
                variant: MessageVariant.ALL,
                source: WindowMode.ADMIN,
                timestamp: Date.now(),
            });

            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("sync");
            expect(lastEvent.origin).toBe("external");
            expect(service.getSnapshot().config.auth.twitch_oauth).toBe(
                "oauth:external"
            );
        });

        it("rejects undefined values in setValue", () => {
            const service = getConfigService();
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const success = service.setValue(
                AUTH_CONFIG.TWITCH_USERNAME,
                undefined
            );

            expect(success).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("undefined value"),
                AUTH_CONFIG.TWITCH_USERNAME
            );

            consoleErrorSpy.mockRestore();
        });

        it("handles listener errors gracefully", () => {
            const service = getConfigService();
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            let shouldThrow = false;
            service.subscribe(() => {
                if (shouldThrow) {
                    throw new Error("Config listener error");
                }
            });

            shouldThrow = true;
            expect(() => {
                service.setValue(AUTH_CONFIG.TWITCH_CHANNEL, "test");
            }).not.toThrow();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("listener error"),
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("handles broadcast errors gracefully", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            sync.notifyConfigurationSaved.mockImplementationOnce(() => {
                throw new Error("Broadcast error");
            });

            expect(() => {
                service.setValue(AUTH_CONFIG.TWITCH_OAUTH, "test");
            }).not.toThrow();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("failed to broadcast"),
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("handles storage reload errors in sync gracefully", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const manager = ConfigManager.getInstance();
            vi.spyOn(manager, "reloadFromStorage").mockImplementationOnce(
                () => {
                    throw new Error("Storage error");
                }
            );

            sync.__emitConfig({
                type: "config-saved",
                variant: MessageVariant.ALL,
                source: WindowMode.ADMIN,
                timestamp: Date.now(),
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("failed to reload"),
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("reloads from storage manually", () => {
            const service = getConfigService();
            const manager = ConfigManager.getInstance();
            manager.set(AUTH_CONFIG.TWITCH_USERNAME, "before");

            manager.set(AUTH_CONFIG.TWITCH_USERNAME, "after");
            const snapshot = service.reloadFromStorage();

            expect(snapshot.config.auth.twitch_username).toBe("after");
        });

        it("supports reset operation", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();
            const events: ConfigUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));
            service.setValue(AUTH_CONFIG.TWITCH_USERNAME, "custom");

            const success = service.reset();

            expect(success).toBe(true);
            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("reset");
            expect(sync.notifyConfigurationSaved).toHaveBeenCalled();
        });

        it("supports import operation", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();
            const events: ConfigUpdateEvent[] = [];
            service.subscribe((event) => events.push(event));
            const snapshot = service.getSnapshot();
            const importedConfig = {
                ...snapshot.config,
                auth: {
                    ...snapshot.config.auth,
                    twitch_username: "imported",
                },
            };

            const success = service.importConfig(importedConfig);

            expect(success).toBe(true);
            const lastEvent = events[events.length - 1]!;
            expect(lastEvent.type).toBe("import");
            expect(sync.notifyConfigurationSaved).toHaveBeenCalled();
        });

        it("supports suppressSelfRefresh option", () => {
            const service = getConfigService();
            const sync = getMockWindowSync();

            service.setValue(AUTH_CONFIG.TWITCH_USERNAME, "test", {
                suppressSelfRefresh: true,
            });

            expect(sync.notifyConfigurationSaved).toHaveBeenCalledWith({
                suppressSelfRefresh: true,
            });
        });
    });
});
