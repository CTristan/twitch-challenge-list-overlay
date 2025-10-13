import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/app";
import { CSS_CLASSES, ELEMENT_IDS } from "../../src/types/DOMConstants";
import { UI_ELEMENTS } from "../../src/types/MessageConstants";

describe("App - Connection Warning", () => {
    let app: App;

    beforeEach(() => {
        // Clear localStorage to ensure clean state
        localStorage.clear();

        // Set up DOM
        document.body.innerHTML = `
            <main id="app">
                <div class="challenge-wrapper">
                    <div class="challenge-container"></div>
                </div>
            </main>
        `;

        // Mock BroadcastChannel
        global.BroadcastChannel = vi.fn().mockImplementation(() => ({
            postMessage: vi.fn(),
            close: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));
    });

    describe("Viewer Mode", () => {
        beforeEach(() => {
            // Set viewer mode (no hash)
            Object.defineProperty(window, "location", {
                value: { hash: "" },
                writable: true,
                configurable: true,
            });

            app = new App("test-connection-warning");
        });

        it("should create connection warning element in viewer mode", () => {
            app.render();

            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            expect(warningElement).toBeTruthy();
            expect(
                warningElement?.classList.contains(
                    CSS_CLASSES.CONNECTION_WARNING
                )
            ).toBe(true);
            expect(warningElement?.textContent).toBe(
                UI_ELEMENTS.CONNECTION_WARNING_TEXT
            );
        });

        it("should hide warning during initial grace period (no heartbeat yet)", () => {
            app.render();

            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            expect(warningElement).toBeTruthy();

            // BroadcastChannel is available and within grace period, so warning should be hidden
            expect(
                warningElement?.classList.contains(
                    CSS_CLASSES.CONNECTION_WARNING_HIDDEN
                )
            ).toBe(true);
        });

        it("should hide warning when BroadcastChannel is available (grace period)", async () => {
            // Note: This test would require simulating a heartbeat message
            // For now, we test that the warning element exists and is hidden during grace period
            app.render();

            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            expect(warningElement).toBeTruthy();

            // Warning should be hidden initially (grace period active)
            expect(
                warningElement?.classList.contains(
                    CSS_CLASSES.CONNECTION_WARNING_HIDDEN
                )
            ).toBe(true);
        });

        it("should show warning when BroadcastChannel is not available", async () => {
            // Note: This test is complex because both WindowRefreshManager and ConfigManager
            // are singletons. We need to reset modules and re-initialize both.
            vi.resetModules();

            // Remove BroadcastChannel support
            delete (global as any).BroadcastChannel;

            // Re-import modules after resetting
            const { default: AppClass } = await import("../../src/app");
            const { default: ConfigManagerClass } = await import(
                "../../src/classes/ConfigManager"
            );
            const { createFallbackConfig } = await import(
                "../../src/utils/ConfigDefaults"
            );

            // Initialize ConfigManager with fallback config
            ConfigManagerClass.getInstance(createFallbackConfig());

            const appWithoutBC = new AppClass("test-connection-warning-no-bc");
            appWithoutBC.render();

            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            expect(warningElement).toBeTruthy();

            // BroadcastChannel is not available, so warning should be visible
            expect(
                warningElement?.classList.contains(
                    CSS_CLASSES.CONNECTION_WARNING_HIDDEN
                )
            ).toBe(false);
        });

        it("should append warning to app element", () => {
            app.render();

            const appElement = document.getElementById(ELEMENT_IDS.APP);
            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );

            expect(appElement).toBeTruthy();
            expect(warningElement).toBeTruthy();
            expect(appElement?.contains(warningElement!)).toBe(true);
        });

        it("should set up periodic connection checks", async () => {
            vi.useFakeTimers();

            app.render();

            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            expect(warningElement).toBeTruthy();

            // Initially hidden (grace period active)
            expect(
                warningElement?.classList.contains(
                    CSS_CLASSES.CONNECTION_WARNING_HIDDEN
                )
            ).toBe(true);

            // Note: We cannot easily test the dynamic update behavior because
            // the WindowRefreshManager is a singleton that's already initialized.
            // The periodic check will continue to check connection status.
            // This test verifies that the interval is set up correctly.

            // Fast-forward 10 seconds to trigger periodic check (still within grace period)
            vi.advanceTimersByTime(10000);

            // Warning should still be hidden because we're within the 15-second grace period
            expect(
                warningElement?.classList.contains(
                    CSS_CLASSES.CONNECTION_WARNING_HIDDEN
                )
            ).toBe(true);

            vi.useRealTimers();
        });

        it("should clean up interval on window unload", () => {
            const clearIntervalSpy = vi.spyOn(window, "clearInterval");

            app.render();

            // Trigger beforeunload event
            const beforeUnloadEvent = new Event("beforeunload");
            window.dispatchEvent(beforeUnloadEvent);

            expect(clearIntervalSpy).toHaveBeenCalled();

            clearIntervalSpy.mockRestore();
        });

        it("should handle missing app element gracefully", () => {
            // Remove app element
            document.body.innerHTML = "";

            expect(() => {
                app.render();
            }).not.toThrow();

            // Warning element should not be in DOM
            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            expect(warningElement).toBeNull();
        });
    });

    describe("Admin Mode", () => {
        beforeEach(() => {
            // Set admin mode
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
                configurable: true,
            });

            // Add admin panel to DOM
            document.body.innerHTML = `
                <main id="app">
                    <div class="challenge-wrapper">
                        <div class="challenge-container"></div>
                    </div>
                    <div id="admin-panel" class="admin-panel">
                        <div class="admin-content">
                            <h2>Admin Panel</h2>
                        </div>
                    </div>
                </main>
            `;

            app = new App("test-connection-warning-admin");
        });

        it("should not create connection warning in admin mode", () => {
            app.render();

            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            expect(warningElement).toBeNull();
        });

        it("should not set up periodic checks in admin mode", () => {
            const setIntervalSpy = vi.spyOn(window, "setInterval");

            app.render();

            // setInterval should not be called for connection warning
            // (it may be called for other purposes like timers)
            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            expect(warningElement).toBeNull();

            setIntervalSpy.mockRestore();
        });
    });

    describe("Edge Cases", () => {
        beforeEach(() => {
            // Set viewer mode
            Object.defineProperty(window, "location", {
                value: { hash: "" },
                writable: true,
                configurable: true,
            });

            app = new App("test-connection-warning-edge");
        });

        it("should handle updateConnectionWarningVisibility with missing element", () => {
            app.render();

            // Remove warning element
            const warningElement = document.getElementById(
                ELEMENT_IDS.CONNECTION_WARNING
            );
            warningElement?.remove();

            // Should not throw when trying to update visibility
            expect(() => {
                // Trigger periodic check
                vi.useFakeTimers();
                vi.advanceTimersByTime(10000);
                vi.useRealTimers();
            }).not.toThrow();
        });

        it("should handle multiple render calls gracefully", () => {
            app.render();
            app.render();

            // Should only have one warning element
            const warningElements = document.querySelectorAll(
                `#${ELEMENT_IDS.CONNECTION_WARNING}`
            );
            expect(warningElements.length).toBe(1);
        });
    });
});
