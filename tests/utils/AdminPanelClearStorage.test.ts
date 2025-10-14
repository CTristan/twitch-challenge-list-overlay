import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfigManager from "../../src/classes/ConfigManager";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";
import { ADMIN_FEEDBACK_MESSAGES } from "../../src/types/MessageConstants";
import { TIMING_CONSTANTS } from "../../src/types/NumericConstants";
import { LOCALSTORAGE_PREFIX } from "../../src/types/StorageConstants";
import { AdminPanelClearStorage } from "../../src/utils/AdminPanelClearStorage";

// Mock dependencies
vi.mock("../../src/utils/windowRefresh");

function ensureTestIsolation() {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.clearAllTimers();
}

describe("AdminPanelClearStorage", () => {
    let configManager: ConfigManager;
    let consoleErrorSpy: any;

    beforeEach(() => {
        ensureTestIsolation();
        vi.useFakeTimers();

        // Create fresh ConfigManager instance
        (ConfigManager as any).instance = null;
        configManager = ConfigManager.getInstance({
            auth: {
                twitch_oauth: "oauth:test",
                twitch_username: "testuser",
                twitch_channel: "testchannel",
            },
            maxChallenges: 10,
            commands: {
                clearAll: ["!ch clearlist", "!ch clearall"],
                clearDone: ["!ch cleardone"],
                addChallenge: ["!ch add"],
                editChallenge: ["!ch edit"],
                finishChallenge: ["!ch done"],
                deleteChallenge: ["!ch delete", "!ch del"],
                incrementChallenge: ["!ch +"],
                decrementChallenge: ["!ch -"],
                setProgress: ["!ch set"],
                failChallenge: ["!ch fail"],
                listChallenges: ["!ch list"],
                showChallenge: ["!ch show"],
                check: ["!ch check"],
                help: ["!ch help"],
            },
            responses: {
                clearAll: "All challenges have been cleared",
                clearDone: "All done challenges have been cleared",
                addChallenge: "Challenge(s) {message} added!",
                editChallenge: "Challenge {message} updated!",
                finishChallenge:
                    "Good job on completing challenge(s) {message}!",
                deleteChallenge: "Challenge(s) {message} has been deleted!",
                deleteAll: "All of your challenges have been deleted!",
                check: "Your current challenge(s) are: {message}",
                help: "Try these commands - !ch add, !ch edit, !ch done, !ch delete, !ch check, !ch clearlist, !ch cleardone, !ch help",
                maxChallengesAdded:
                    "Maximum number of challenges reached, try deleting old challenges.",
                noChallengeFound:
                    "That challenge doesn't seem to exist, try adding one!",
                invalidCommand: "Invalid command: {message}. Try !help",
            },
        });

        // Spy on console.error
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Setup DOM with clear button
        document.body.innerHTML = `
            <button id="${ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN}">Clear All Data</button>
        `;
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        vi.useRealTimers();
    });

    describe("clearLocalStorage", () => {
        describe("User Confirmation", () => {
            it("should show confirmation dialog when called", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(false);

                AdminPanelClearStorage.clearLocalStorage(configManager);

                expect(confirmSpy).toHaveBeenCalledWith(
                    expect.stringContaining(
                        "Are you sure you want to clear all data?"
                    )
                );
                expect(confirmSpy).toHaveBeenCalledWith(
                    expect.stringContaining("This will permanently delete:")
                );
                expect(confirmSpy).toHaveBeenCalledWith(
                    expect.stringContaining("All configuration settings")
                );
                expect(confirmSpy).toHaveBeenCalledWith(
                    expect.stringContaining("All challenges")
                );
                expect(confirmSpy).toHaveBeenCalledWith(
                    expect.stringContaining("All UI preferences")
                );

                confirmSpy.mockRestore();
            });

            it("should return early when user cancels confirmation", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(false);
                const clearStorageSpy = vi.spyOn(configManager, "clearStorage");

                // Add some localStorage data
                localStorage.setItem(
                    `${LOCALSTORAGE_PREFIX}test-key`,
                    "test-value"
                );

                AdminPanelClearStorage.clearLocalStorage(configManager);

                // Should not clear storage when user cancels
                expect(clearStorageSpy).not.toHaveBeenCalled();
                expect(
                    localStorage.getItem(`${LOCALSTORAGE_PREFIX}test-key`)
                ).toBe("test-value");

                confirmSpy.mockRestore();
            });
        });

        describe("Successful Clear Operation", () => {
            it("should remove all localStorage keys with application prefix", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(true);

                // Add application-specific keys
                localStorage.setItem(
                    `${LOCALSTORAGE_PREFIX}config`,
                    "config-data"
                );
                localStorage.setItem(
                    `${LOCALSTORAGE_PREFIX}challenges`,
                    "challenge-data"
                );
                localStorage.setItem(
                    `${LOCALSTORAGE_PREFIX}ui-state`,
                    "ui-data"
                );

                // Add non-application key (should not be removed)
                localStorage.setItem("other-app-key", "other-data");

                AdminPanelClearStorage.clearLocalStorage(configManager);

                // Application keys should be removed
                expect(
                    localStorage.getItem(`${LOCALSTORAGE_PREFIX}config`)
                ).toBeNull();
                expect(
                    localStorage.getItem(`${LOCALSTORAGE_PREFIX}challenges`)
                ).toBeNull();
                expect(
                    localStorage.getItem(`${LOCALSTORAGE_PREFIX}ui-state`)
                ).toBeNull();

                // Non-application key should remain
                expect(localStorage.getItem("other-app-key")).toBe(
                    "other-data"
                );

                confirmSpy.mockRestore();
            });

            it("should update button with success message and count", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(true);

                // Add 3 application keys
                localStorage.setItem(`${LOCALSTORAGE_PREFIX}key1`, "value1");
                localStorage.setItem(`${LOCALSTORAGE_PREFIX}key2`, "value2");
                localStorage.setItem(`${LOCALSTORAGE_PREFIX}key3`, "value3");

                const button = document.getElementById(
                    ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN
                ) as HTMLButtonElement;

                AdminPanelClearStorage.clearLocalStorage(configManager);

                expect(button.textContent).toBe(
                    `${ADMIN_FEEDBACK_MESSAGES.CLEARED} (3 keys)`
                );
                // backgroundColor can be in hex or rgb format
                expect(button.style.backgroundColor).toMatch(
                    /^(#28a745|rgb\(40,\s*167,\s*69\))$/
                );

                confirmSpy.mockRestore();
            });

            it("should call configManager.clearStorage() on success", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(true);
                const clearStorageSpy = vi.spyOn(configManager, "clearStorage");

                localStorage.setItem(`${LOCALSTORAGE_PREFIX}test`, "value");

                AdminPanelClearStorage.clearLocalStorage(configManager);

                expect(clearStorageSpy).toHaveBeenCalled();

                confirmSpy.mockRestore();
            });
        });

        describe("Failure Cases", () => {
            it("should show error when no keys are removed", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(true);

                // No application keys in localStorage
                const button = document.getElementById(
                    ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN
                ) as HTMLButtonElement;
                const originalText = button.textContent;

                AdminPanelClearStorage.clearLocalStorage(configManager);

                expect(button.textContent).toBe(ADMIN_FEEDBACK_MESSAGES.ERROR);
                // backgroundColor can be in hex or rgb format
                expect(button.style.backgroundColor).toMatch(
                    /^(#dc3545|rgb\(220,\s*53,\s*69\))$/
                );

                // Should reset after timeout
                vi.advanceTimersByTime(TIMING_CONSTANTS.FEEDBACK_TIMEOUT);

                expect(button.textContent).toBe(originalText);
                expect(button.style.backgroundColor).toBe("");

                confirmSpy.mockRestore();
            });

            it("should handle missing button element gracefully on success", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(true);

                // Remove button from DOM
                document.body.innerHTML = "";

                localStorage.setItem(`${LOCALSTORAGE_PREFIX}test`, "value");

                // Should not throw error
                expect(() => {
                    AdminPanelClearStorage.clearLocalStorage(configManager);
                }).not.toThrow();

                confirmSpy.mockRestore();
            });

            it("should handle missing button element gracefully on failure", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(true);

                // Remove button from DOM
                document.body.innerHTML = "";

                // No localStorage keys to remove

                // Should not throw error
                expect(() => {
                    AdminPanelClearStorage.clearLocalStorage(configManager);
                }).not.toThrow();

                confirmSpy.mockRestore();
            });
        });

        describe("Error Handling", () => {
            it("should handle localStorage errors and show error feedback", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(true);
                const button = document.getElementById(
                    ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN
                ) as HTMLButtonElement;
                const originalText = button.textContent;

                // Mock localStorage.removeItem to throw error
                const originalRemoveItem = Storage.prototype.removeItem;
                Storage.prototype.removeItem = vi.fn(() => {
                    throw new Error("localStorage error");
                });

                // Add a key to trigger the removal
                localStorage.setItem(`${LOCALSTORAGE_PREFIX}test`, "value");

                AdminPanelClearStorage.clearLocalStorage(configManager);

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "[AdminPanel] Error clearing localStorage:",
                    expect.any(Error)
                );
                expect(button.textContent).toBe(ADMIN_FEEDBACK_MESSAGES.ERROR);
                // backgroundColor can be in hex or rgb format
                expect(button.style.backgroundColor).toMatch(
                    /^(#dc3545|rgb\(220,\s*53,\s*69\))$/
                );

                // Should reset after timeout
                vi.advanceTimersByTime(TIMING_CONSTANTS.FEEDBACK_TIMEOUT);

                expect(button.textContent).toBe(originalText);
                expect(button.style.backgroundColor).toBe("");

                // Restore original method
                Storage.prototype.removeItem = originalRemoveItem;
                confirmSpy.mockRestore();
            });

            it("should handle errors when button is missing during error handling", () => {
                const confirmSpy = vi
                    .spyOn(window, "confirm")
                    .mockReturnValue(true);

                // Mock localStorage.removeItem to throw error
                const originalRemoveItem = Storage.prototype.removeItem;
                Storage.prototype.removeItem = vi.fn(() => {
                    throw new Error("localStorage error");
                });

                // Add a key to trigger the removal
                localStorage.setItem(`${LOCALSTORAGE_PREFIX}test`, "value");

                // Remove button from DOM
                document.body.innerHTML = "";

                // Should not throw error
                expect(() => {
                    AdminPanelClearStorage.clearLocalStorage(configManager);
                }).not.toThrow();

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "[AdminPanel] Error clearing localStorage:",
                    expect.any(Error)
                );

                // Restore original method
                Storage.prototype.removeItem = originalRemoveItem;
                confirmSpy.mockRestore();
            });
        });
    });
});
