import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    WindowRefreshManager,
    getWindowRefreshManager,
    isRefreshSystemAvailable,
    notifyConfigurationSaved,
} from "../src/utils/windowRefresh";

// Import the module to access the singleton instance

// Mock BroadcastChannel
class MockBroadcastChannel {
    public name: string;
    public onmessage: ((event: MessageEvent) => void) | null = null;
    public listeners: Map<string, ((event: MessageEvent) => void)[]> =
        new Map();
    public static instances: MockBroadcastChannel[] = [];

    constructor(name: string) {
        this.name = name;
        MockBroadcastChannel.instances.push(this);
    }

    addEventListener(
        type: string,
        listener: (event: MessageEvent) => void
    ): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(listener);
    }

    removeEventListener(
        type: string,
        listener: (event: MessageEvent) => void
    ): void {
        const typeListeners = this.listeners.get(type);
        if (typeListeners) {
            const index = typeListeners.indexOf(listener);
            if (index > -1) {
                typeListeners.splice(index, 1);
            }
        }
    }

    postMessage(data: any): void {
        // Simulate message delivery to all other instances with the same name
        MockBroadcastChannel.instances
            .filter(
                (instance) => instance !== this && instance.name === this.name
            )
            .forEach((instance) => {
                const event = new MessageEvent("message", { data });
                instance.listeners
                    .get("message")
                    ?.forEach((listener) => listener(event));
                if (instance.onmessage) {
                    instance.onmessage(event);
                }
            });
    }

    close(): void {
        const index = MockBroadcastChannel.instances.indexOf(this);
        if (index > -1) {
            MockBroadcastChannel.instances.splice(index, 1);
        }
    }

    static clearInstances(): void {
        MockBroadcastChannel.instances = [];
    }
}

describe("WindowRefreshManager", () => {
    let mockReload: ReturnType<typeof vi.spyOn>;
    let mockConsoleWarn: ReturnType<typeof vi.spyOn>;
    let mockConsoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Reset global state
        MockBroadcastChannel.clearInstances();

        // Create a mock reload function
        const mockReloadFn = vi.fn();
        mockReload = mockReloadFn;

        // Mock console methods
        mockConsoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        mockConsoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Mock BroadcastChannel globally
        global.BroadcastChannel = MockBroadcastChannel as any;

        // Mock window.location with a configurable hash and reload function
        Object.defineProperty(window, "location", {
            value: {
                hash: "",
                reload: mockReloadFn,
            },
            writable: true,
            configurable: true,
        });

        // Clear any existing singleton instance by resetting the module
        vi.resetModules();
    });

    describe("constructor", () => {
        it("should initialize with default configuration", () => {
            const manager = new WindowRefreshManager();
            const config = manager.getConfig();

            expect(config.channelName).toBe("twitch-overlay-config-updates");
            expect(config.refreshDelay).toBe(500);
        });

        it("should initialize with custom configuration", () => {
            const customConfig = {
                channelName: "custom-channel",
                refreshDelay: 1000,
            };

            const manager = new WindowRefreshManager(customConfig);
            const config = manager.getConfig();

            expect(config.channelName).toBe("custom-channel");
            expect(config.refreshDelay).toBe(1000);
        });

        it("should detect admin mode correctly", () => {
            window.location.hash = "#admin";
            const manager = new WindowRefreshManager();

            expect(manager.isAvailable()).toBe(true);
        });

        it("should detect viewer mode correctly", () => {
            window.location.hash = "";
            const manager = new WindowRefreshManager();

            expect(manager.isAvailable()).toBe(true);
        });
    });

    describe("BroadcastChannel communication", () => {
        it("should send configuration saved notification", () => {
            const manager = new WindowRefreshManager();
            const postMessageSpy = vi.spyOn(
                MockBroadcastChannel.prototype,
                "postMessage"
            );

            manager.notifyConfigurationSaved();

            expect(postMessageSpy).toHaveBeenCalledWith({
                type: "config-saved",
                timestamp: expect.any(Number),
                source: "viewer",
            });
        });

        it("should send admin source when in admin mode", () => {
            window.location.hash = "#admin";
            const manager = new WindowRefreshManager();
            const postMessageSpy = vi.spyOn(
                MockBroadcastChannel.prototype,
                "postMessage"
            );

            manager.notifyConfigurationSaved();

            expect(postMessageSpy).toHaveBeenCalledWith({
                type: "config-saved",
                timestamp: expect.any(Number),
                source: "admin",
            });
        });

        it("should receive and process valid messages from other windows", async () => {
            // Create two managers with shorter delay for testing
            window.location.hash = "#admin";
            const adminManager = new WindowRefreshManager({ refreshDelay: 50 });

            window.location.hash = "";
            new WindowRefreshManager({ refreshDelay: 50 });

            // Admin sends notification
            adminManager.notifyConfigurationSaved();

            // Wait for async operations (longer than refresh delay)
            await new Promise((resolve) => setTimeout(resolve, 150));

            // Both windows should have attempted to refresh
            // Admin refreshes itself, viewer receives message and refreshes
            expect(mockReload).toHaveBeenCalledTimes(2);
        });

        it("should ignore messages from the same window type", async () => {
            // Create two admin managers with shorter delay for testing
            window.location.hash = "#admin";
            const adminManager1 = new WindowRefreshManager({
                refreshDelay: 50,
            });
            new WindowRefreshManager({ refreshDelay: 50 });

            // First admin sends notification
            adminManager1.notifyConfigurationSaved();

            // Wait for async operations (longer than refresh delay)
            await new Promise((resolve) => setTimeout(resolve, 150));

            // Only the sender should refresh, receiver should ignore the message
            expect(mockReload).toHaveBeenCalledTimes(1);
        });

        it("should ignore invalid messages", () => {
            new WindowRefreshManager();

            // Simulate receiving an invalid message
            const channel = MockBroadcastChannel.instances[0];
            if (!channel) throw new Error("Channel not found");

            const invalidMessage = new MessageEvent("message", {
                data: { type: "invalid", source: "unknown" },
            });

            const messageHandler = channel.listeners.get("message")?.[0];
            if (messageHandler) {
                messageHandler(invalidMessage);
            }

            expect(mockConsoleWarn).toHaveBeenCalledWith(
                "Invalid refresh message received:",
                { type: "invalid", source: "unknown" }
            );
            expect(mockReload).not.toHaveBeenCalled();
        });
    });

    describe("configuration management", () => {
        it("should update refresh delay", () => {
            const manager = new WindowRefreshManager();

            manager.setRefreshDelay(1500);

            expect(manager.getConfig().refreshDelay).toBe(1500);
        });

        it("should throw error for negative refresh delay", () => {
            const manager = new WindowRefreshManager();

            expect(() => manager.setRefreshDelay(-100)).toThrow(
                "Refresh delay must be non-negative"
            );
        });
    });

    describe("cleanup", () => {
        it("should properly destroy the manager", () => {
            const manager = new WindowRefreshManager();
            const closeSpy = vi.spyOn(MockBroadcastChannel.prototype, "close");

            manager.destroy();

            expect(closeSpy).toHaveBeenCalled();
            expect(manager.isAvailable()).toBe(false);
        });
    });

    describe("singleton functions", () => {
        it("should return the same instance", () => {
            const manager1 = getWindowRefreshManager();
            const manager2 = getWindowRefreshManager();

            expect(manager1).toBe(manager2);
        });

        it("should notify configuration saved", () => {
            const manager = getWindowRefreshManager();
            const notifySpy = vi.spyOn(manager, "notifyConfigurationSaved");

            notifyConfigurationSaved();

            expect(notifySpy).toHaveBeenCalled();
        });

        it("should check if refresh system is available", () => {
            const manager = getWindowRefreshManager();
            const isAvailableSpy = vi.spyOn(manager, "isAvailable");

            isRefreshSystemAvailable();

            expect(isAvailableSpy).toHaveBeenCalled();
        });
    });

    describe("error handling", () => {
        it("should handle BroadcastChannel not supported", () => {
            // Remove BroadcastChannel support
            delete (global as any).BroadcastChannel;

            const manager = new WindowRefreshManager();

            expect(mockConsoleWarn).toHaveBeenCalledWith(
                "BroadcastChannel is not supported in this environment"
            );
            expect(manager.isAvailable()).toBe(false);
        });

        it("should handle BroadcastChannel initialization errors", () => {
            // Mock BroadcastChannel constructor to throw
            global.BroadcastChannel = vi.fn().mockImplementation(() => {
                throw new Error("BroadcastChannel error");
            });

            const manager = new WindowRefreshManager();

            expect(mockConsoleError).toHaveBeenCalledWith(
                "Failed to initialize BroadcastChannel:",
                expect.any(Error)
            );
            expect(manager.isAvailable()).toBe(false);
        });

        it("should handle postMessage errors", () => {
            const manager = new WindowRefreshManager();

            // Mock postMessage to throw
            vi.spyOn(
                MockBroadcastChannel.prototype,
                "postMessage"
            ).mockImplementation(() => {
                throw new Error("postMessage error");
            });

            manager.notifyConfigurationSaved();

            expect(mockConsoleError).toHaveBeenCalledWith(
                "Failed to send configuration saved notification:",
                expect.any(Error)
            );
        });
    });
});
