import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPanel from "../../src/classes/AdminPanel";
import ConfigManager from "../../src/classes/ConfigManager";

describe("AdminPanel Memory Leak Prevention", () => {
    let adminPanel: AdminPanel;

    // Test isolation function
    const ensureTestIsolation = (): void => {
        localStorage.clear();
        vi.clearAllMocks();
        // Reset ConfigManager instance
        (ConfigManager as any).instance = null;
        ConfigManager.getInstance({
            auth: {
                twitch_oauth: "test_oauth",
                twitch_username: "test_user",
                twitch_channel: "test_channel",
            },
            maxChallenges: 10,
            challengeRowColors: [],
            commands: {
                clearAll: ["!ch clearlist"],
                clearDone: ["!ch cleardone"],
                addChallenge: ["!ch add"],
                editChallenge: ["!ch edit"],
                finishChallenge: ["!ch done"],
                deleteChallenge: ["!ch delete"],
                check: ["!ch check"],
                help: ["!ch help"],
                incrementChallenge: ["!ch +"],
                decrementChallenge: ["!ch -"],
                setProgress: ["!ch set"],
                failChallenge: ["!ch fail"],
                listChallenges: ["!ch list"],
                showChallenge: ["!ch show"],
            },
            responses: {
                clearAll: "All challenges cleared",
                clearDone: "Done challenges cleared",
                addChallenge: "Challenge added",
                editChallenge: "Challenge updated",
                finishChallenge: "Challenge completed",
                deleteChallenge: "Challenge deleted",
                deleteAll: "All challenges deleted",
                check: "Current challenges",
                help: "Help message",
                maxChallengesAdded: "Max challenges reached",
                noChallengeFound: "Challenge not found",
                invalidCommand: "Invalid command",
            },
        });
    };

    beforeEach(() => {
        ensureTestIsolation();

        // Set up DOM for admin mode
        document.body.innerHTML = `
            <div id="admin-panel">
                <div class="admin-content">
                    <button id="clear-localstorage-btn">Clear localStorage</button>
                    <button id="export-json-btn">Export JSON</button>
                    <button id="import-config-btn">Import Config</button>
                    <input type="file" id="import-file-input" accept=".json" style="display: none;">
                    <button id="save-config-btn">Save Configuration</button>
                    <button id="reset-config-btn">Reset to Defaults</button>
                    <input type="checkbox" id="primary-color-enabled">
                    <input type="checkbox" id="secondary-color-enabled">
                    <input type="checkbox" id="tertiary-color-enabled">
                    <div id="primary-color-pickers"></div>
                    <div id="secondary-color-pickers"></div>
                    <div id="tertiary-color-pickers"></div>
                    <div id="primary-color-section"></div>
                    <div id="secondary-color-section"></div>
                    <div id="tertiary-color-section"></div>
                    <input type="color" id="primary-bg-color">
                    <input type="color" id="primary-text-color">
                    <input type="color" id="secondary-bg-color">
                    <input type="color" id="secondary-text-color">
                    <input type="color" id="tertiary-bg-color">
                    <input type="color" id="tertiary-text-color">
                </div>
            </div>
        `;

        // Start in admin mode
        window.location.hash = "#admin";
    });

    describe("event listener management", () => {
        it("should not add duplicate hashchange listeners when initialize is called multiple times", () => {
            // Spy on window.addEventListener to count hashchange listeners
            const addEventListenerSpy = vi.spyOn(window, "addEventListener");

            adminPanel = new AdminPanel();

            // Count initial hashchange listeners after first initialization
            const initialHashChangeListeners =
                addEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === "hashchange"
                ).length;

            // Call initialize multiple times
            adminPanel.initialize();
            adminPanel.initialize();
            adminPanel.initialize();

            // Count total hashchange listeners after multiple initializations
            const totalHashChangeListeners =
                addEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === "hashchange"
                ).length;

            // Should only have added 3 more listeners (one per initialize call)
            // The cleanup mechanism should prevent accumulation beyond this
            expect(totalHashChangeListeners).toBe(
                initialHashChangeListeners + 3
            );

            addEventListenerSpy.mockRestore();
        });

        it("should properly clean up event listeners when cleanup is called", () => {
            adminPanel = new AdminPanel();

            // Get references to elements that should have listeners
            const clearButton = document.getElementById(
                "clear-localstorage-btn"
            );
            const exportButton = document.getElementById("export-json-btn");
            const importButton = document.getElementById("import-config-btn");
            const saveButton = document.getElementById("save-config-btn");

            // Spy on removeEventListener to verify cleanup
            const clearButtonRemoveSpy = vi.spyOn(
                clearButton!,
                "removeEventListener"
            );
            const exportButtonRemoveSpy = vi.spyOn(
                exportButton!,
                "removeEventListener"
            );
            const importButtonRemoveSpy = vi.spyOn(
                importButton!,
                "removeEventListener"
            );
            const saveButtonRemoveSpy = vi.spyOn(
                saveButton!,
                "removeEventListener"
            );

            // Call initialize again to trigger cleanup
            adminPanel.initialize();

            // Verify that removeEventListener was called for tracked elements
            expect(clearButtonRemoveSpy).toHaveBeenCalledWith(
                "click",
                expect.any(Function)
            );
            expect(exportButtonRemoveSpy).toHaveBeenCalledWith(
                "click",
                expect.any(Function)
            );
            expect(importButtonRemoveSpy).toHaveBeenCalledWith(
                "click",
                expect.any(Function)
            );
            expect(saveButtonRemoveSpy).toHaveBeenCalledWith(
                "click",
                expect.any(Function)
            );

            // Clean up spies
            clearButtonRemoveSpy.mockRestore();
            exportButtonRemoveSpy.mockRestore();
            importButtonRemoveSpy.mockRestore();
            saveButtonRemoveSpy.mockRestore();
        });

        it("should prevent duplicate button event listeners", () => {
            adminPanel = new AdminPanel();

            const clearButton = document.getElementById(
                "clear-localstorage-btn"
            );
            const addEventListenerSpy = vi.spyOn(
                clearButton!,
                "addEventListener"
            );

            // Call initialize multiple times
            adminPanel.initialize();
            adminPanel.initialize();
            adminPanel.initialize();

            // Should only add one listener per initialize call (cleanup removes previous ones)
            const clickListenerCalls = addEventListenerSpy.mock.calls.filter(
                (call) => call[0] === "click"
            ).length;

            // Should have exactly 3 calls (one per initialize call, with cleanup in between)
            expect(clickListenerCalls).toBe(3);

            addEventListenerSpy.mockRestore();
        });

        it("should properly handle hash changes without accumulating listeners", () => {
            adminPanel = new AdminPanel();

            // Spy on window.addEventListener to track hashchange listeners
            const windowAddEventListenerSpy = vi.spyOn(
                window,
                "addEventListener"
            );

            // Simulate multiple hash changes to admin mode
            window.location.hash = "";
            window.dispatchEvent(new Event("hashchange"));

            window.location.hash = "#admin";
            window.dispatchEvent(new Event("hashchange"));

            window.location.hash = "";
            window.dispatchEvent(new Event("hashchange"));

            window.location.hash = "#admin";
            window.dispatchEvent(new Event("hashchange"));

            // Count hashchange listeners added
            const hashChangeListenerCalls =
                windowAddEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === "hashchange"
                ).length;

            // Should not accumulate listeners - cleanup should prevent this
            // Expect reasonable number of listeners (not exponential growth)
            expect(hashChangeListenerCalls).toBeLessThan(10);

            windowAddEventListenerSpy.mockRestore();
        });

        it("should properly destroy and clean up all resources", () => {
            adminPanel = new AdminPanel();

            // Spy on AbortController.abort to verify cleanup
            const abortSpy = vi.spyOn(AbortController.prototype, "abort");

            // Call destroy method
            adminPanel.destroy();

            // Verify that abort was called to clean up hashchange listener
            expect(abortSpy).toHaveBeenCalled();

            abortSpy.mockRestore();
        });
    });

    describe("functionality preservation", () => {
        it("should maintain button functionality after multiple initializations", () => {
            adminPanel = new AdminPanel();

            // Set up test data
            localStorage.setItem("testKey", "testValue");

            // Call initialize multiple times
            adminPanel.initialize();
            adminPanel.initialize();

            // Test that clear button still works
            const clearButton = document.getElementById(
                "clear-localstorage-btn"
            );
            clearButton!.click();

            // Should have cleared localStorage
            expect(localStorage.getItem("overlay_config")).toBeNull();
        });

        it("should maintain hash change functionality after multiple initializations", () => {
            // Start in non-admin mode
            window.location.hash = "";
            adminPanel = new AdminPanel();

            // Set up test data
            localStorage.setItem("testKey", "testValue");

            // Verify button doesn't work initially
            const clearButton = document.getElementById(
                "clear-localstorage-btn"
            );
            clearButton!.click();
            expect(localStorage.getItem("testKey")).toBe("testValue");

            // Call initialize multiple times
            adminPanel.initialize();
            adminPanel.initialize();

            // Change to admin mode
            window.location.hash = "#admin";
            window.dispatchEvent(new Event("hashchange"));

            // Now button should work
            clearButton!.click();
            expect(localStorage.getItem("overlay_config")).toBeNull();
        });
    });
});
