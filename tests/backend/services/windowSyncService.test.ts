import { URL_HASH } from "@/types/DOMConstants";
import { MessageVariant } from "@/types/MessageVariant";
import { RefreshMessageType } from "@/types/RefreshMessageType";
import { WindowMode } from "@/types/WindowMode";
import {
    getWindowSyncService,
    resetWindowSyncServiceForTesting,
    type ChallengeStateEvent,
    type ConfigSavedEvent,
    type WindowConnectionState,
} from "@backend/services/windowSyncService";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

class MockBroadcastChannel {
    static instances: Set<MockBroadcastChannel> = new Set();
    static messages: any[] = [];

    name: string;
    #listeners: Set<(event: MessageEvent<any>) => void> = new Set();

    constructor(name: string) {
        this.name = name;
        MockBroadcastChannel.instances.add(this);
    }

    addEventListener(
        type: string,
        listener: (event: MessageEvent<any>) => void
    ) {
        if (type === "message") {
            this.#listeners.add(listener);
        }
    }

    removeEventListener(
        type: string,
        listener: (event: MessageEvent<any>) => void
    ) {
        if (type === "message") {
            this.#listeners.delete(listener);
        }
    }

    postMessage(message: any) {
        MockBroadcastChannel.messages.push({ name: this.name, message });
        MockBroadcastChannel.broadcast(message);
    }

    close() {
        MockBroadcastChannel.instances.delete(this);
        this.#listeners.clear();
    }

    static broadcast(message: any) {
        this.instances.forEach((instance) => {
            instance.#listeners.forEach((listener) =>
                listener({ data: message } as MessageEvent<any>)
            );
        });
    }

    static reset() {
        this.instances.forEach((instance) => instance.#listeners.clear());
        this.instances.clear();
        this.messages = [];
    }
}

describe("windowSyncService", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.useFakeTimers();
        MockBroadcastChannel.reset();
        globalThis.BroadcastChannel = MockBroadcastChannel as unknown as any;
        resetWindowSyncServiceForTesting();
        Object.defineProperty(window, "location", {
            value: {
                hash: "",
                reload: vi.fn(),
            },
            configurable: true,
        });
    });

    afterEach(() => {
        resetWindowSyncServiceForTesting();
        vi.useRealTimers();
        MockBroadcastChannel.reset();
    });

    it("notifies configuration saves and schedules reloads", () => {
        const service = getWindowSyncService();
        const configEvents: ConfigSavedEvent[] = [];
        service.subscribeToConfig((event) => {
            configEvents.push(event);
        });

        service.notifyConfigurationSaved();

        expect(MockBroadcastChannel.messages).toHaveLength(1);
        const [firstMessage] = MockBroadcastChannel.messages;
        expect(firstMessage.message.type).toBe(RefreshMessageType.CONFIG_SAVED);

        const refreshDelay = service.getRefreshDelay();
        vi.advanceTimersByTime(refreshDelay + 10);
        expect(window.location.reload).toHaveBeenCalledTimes(1);
        expect(configEvents).toHaveLength(1);
        expect(configEvents[0]?.variant).toBe(MessageVariant.ALL);
    });

    it("processes incoming config messages in viewer mode", () => {
        window.location.hash = "";
        resetWindowSyncServiceForTesting();
        const service = getWindowSyncService();
        const reloadSpy = window.location.reload as ReturnType<typeof vi.fn>;

        const configEvents: ConfigSavedEvent[] = [];
        service.subscribeToConfig((event) => configEvents.push(event));

        MockBroadcastChannel.broadcast({
            type: RefreshMessageType.CONFIG_SAVED,
            variant: MessageVariant.ALL,
            timestamp: Date.now(),
            source: WindowMode.ADMIN,
        });

        expect(configEvents[configEvents.length - 1]?.source).toBe(
            WindowMode.ADMIN
        );
        vi.advanceTimersByTime(service.getRefreshDelay() + 5);
        expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it("handles challenge state broadcasts and custom events", () => {
        window.location.hash = URL_HASH.ADMIN;
        resetWindowSyncServiceForTesting();
        const service = getWindowSyncService();
        const challengeEvents: ChallengeStateEvent[] = [];
        service.subscribeToChallenge((event) => challengeEvents.push(event));
        const eventListener = vi.fn();
        window.addEventListener("challenge-list-refresh", eventListener);

        service.notifyChallengeStateChanged();

        expect(MockBroadcastChannel.messages.length).toBeGreaterThanOrEqual(2);
        const messageTypes = MockBroadcastChannel.messages.map(
            (entry) => entry.message.type
        );
        expect(messageTypes).toContain(RefreshMessageType.HEARTBEAT);
        const challengeMessageIndex = messageTypes.lastIndexOf(
            RefreshMessageType.CHALLENGE_STATE_CHANGED
        );
        expect(challengeMessageIndex).toBeGreaterThan(-1);
        expect(challengeEvents).toHaveLength(1);
        expect(eventListener).toHaveBeenCalledTimes(1);
        const dispatchedEvent = eventListener.mock.calls[0]?.[0] as CustomEvent;
        expect(dispatchedEvent.detail.source).toBe(WindowMode.ADMIN);
        window.removeEventListener("challenge-list-refresh", eventListener);
    });

    it("tracks heartbeat connectivity for viewer windows", () => {
        window.location.hash = "";
        resetWindowSyncServiceForTesting();
        const service = getWindowSyncService();
        const connectionStates: WindowConnectionState[] = [];
        service.subscribeToConnection((state) => connectionStates.push(state));

        MockBroadcastChannel.broadcast({
            type: RefreshMessageType.HEARTBEAT,
            timestamp: Date.now(),
            source: WindowMode.ADMIN,
        });

        vi.advanceTimersByTime(2005);
        expect(connectionStates[connectionStates.length - 1]?.connected).toBe(
            true
        );

        vi.advanceTimersByTime(16000);
        expect(connectionStates[connectionStates.length - 1]?.connected).toBe(
            false
        );
    });

    it("handles missing BroadcastChannel gracefully", () => {
        const consoleWarnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        const originalBC = globalThis.BroadcastChannel;
        (globalThis as any).BroadcastChannel = undefined;

        resetWindowSyncServiceForTesting();
        getWindowSyncService();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining("BroadcastChannel is not supported")
        );

        (globalThis as any).BroadcastChannel = originalBC;
        consoleWarnSpy.mockRestore();
    });

    it("handles BroadcastChannel initialization errors", () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const FaultyBC = class {
            constructor() {
                throw new Error("BC init error");
            }
        };
        globalThis.BroadcastChannel = FaultyBC as any;

        resetWindowSyncServiceForTesting();
        getWindowSyncService();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to initialize BroadcastChannel"),
            expect.any(Error)
        );

        globalThis.BroadcastChannel = MockBroadcastChannel as unknown as any;
        consoleErrorSpy.mockRestore();
    });

    it("handles postMessage errors gracefully", () => {
        const service = getWindowSyncService();
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const instance = Array.from(MockBroadcastChannel.instances)[0]!;
        const originalPostMessage = instance.postMessage;
        instance.postMessage = vi.fn(() => {
            throw new Error("postMessage error");
        });

        service.notifyConfigurationSaved();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to dispatch configuration message"),
            expect.any(Error)
        );

        service.notifyChallengeStateChanged();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "Failed to dispatch challenge state message"
            ),
            expect.any(Error)
        );

        instance.postMessage = originalPostMessage;
        consoleErrorSpy.mockRestore();
    });

    it("handles heartbeat send errors", () => {
        window.location.hash = URL_HASH.ADMIN;
        resetWindowSyncServiceForTesting();
        vi.useRealTimers();
        vi.useFakeTimers();
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        getWindowSyncService();
        const instance = Array.from(MockBroadcastChannel.instances)[0]!;
        instance.postMessage = vi.fn(() => {
            throw new Error("Heartbeat send error");
        });

        vi.advanceTimersByTime(5010);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("failed to send heartbeat"),
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("handles schedule refresh errors", () => {
        const service = getWindowSyncService();
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (() => {
            throw new Error("setTimeout error");
        }) as any;

        service.notifyConfigurationSaved();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("failed to schedule refresh"),
            expect.any(Error)
        );

        window.setTimeout = originalSetTimeout;
        consoleErrorSpy.mockRestore();
    });

    it("handles custom event dispatch errors", () => {
        const service = getWindowSyncService();
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const originalDispatchEvent = window.dispatchEvent;
        window.dispatchEvent = vi.fn(() => {
            throw new Error("dispatchEvent error");
        });

        service.notifyChallengeStateChanged();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "failed to dispatch challenge-list-refresh"
            ),
            expect.any(Error)
        );

        window.dispatchEvent = originalDispatchEvent;
        consoleErrorSpy.mockRestore();
    });

    it("handles config listener errors", () => {
        const service = getWindowSyncService();
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        service.subscribeToConfig(() => {
            throw new Error("Config listener error");
        });

        service.notifyConfigurationSaved({ suppressSelfRefresh: true });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("config listener error"),
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("handles challenge listener errors", () => {
        const service = getWindowSyncService();
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        service.subscribeToChallenge(() => {
            throw new Error("Challenge listener error");
        });

        service.notifyChallengeStateChanged();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("challenge listener error"),
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("handles connection listener errors", () => {
        const service = getWindowSyncService();
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
        MockBroadcastChannel.broadcast({
            type: RefreshMessageType.HEARTBEAT,
            timestamp: Date.now(),
            source: WindowMode.ADMIN,
        });
        vi.advanceTimersByTime(2005);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("connection listener error"),
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("ignores malformed messages", () => {
        const service = getWindowSyncService();
        const configSpy = vi.fn();
        const challengeSpy = vi.fn();
        service.subscribeToConfig(configSpy);
        service.subscribeToChallenge(challengeSpy);

        MockBroadcastChannel.broadcast({} as any);
        MockBroadcastChannel.broadcast({ type: "config-saved" } as any);
        MockBroadcastChannel.broadcast({
            type: "config-saved",
            timestamp: Date.now(),
        } as any);

        expect(configSpy).toHaveBeenCalledTimes(0);
        expect(challengeSpy).toHaveBeenCalledTimes(0);
    });

    it("supports custom refresh delays", () => {
        resetWindowSyncServiceForTesting();
        const customDelay = 1000;
        const service = new (getWindowSyncService().constructor as any)(
            customDelay
        );

        expect(service.getRefreshDelay()).toBe(customDelay);

        service.setRefreshDelay(2000);
        expect(service.getRefreshDelay()).toBe(2000);
    });

    it("throws when setting negative refresh delay", () => {
        const service = getWindowSyncService();

        expect(() => service.setRefreshDelay(-100)).toThrow(
            "Refresh delay must be non-negative"
        );
    });

    it("viewer mode marks as disconnected when no heartbeat received", () => {
        window.location.hash = "";
        resetWindowSyncServiceForTesting();
        const service = getWindowSyncService();
        const states: WindowConnectionState[] = [];
        service.subscribeToConnection((state) => states.push(state));

        vi.advanceTimersByTime(16000);

        const lastState = states[states.length - 1];
        expect(lastState?.connected).toBe(false);
    });

    it("cleans up all resources on destroy", () => {
        const service = getWindowSyncService();
        const instancesBefore = MockBroadcastChannel.instances.size;

        service.destroy();

        expect(MockBroadcastChannel.instances.size).toBeLessThan(
            instancesBefore
        );
    });
});
