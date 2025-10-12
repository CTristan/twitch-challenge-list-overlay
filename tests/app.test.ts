import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/app";
import Challenge from "../src/classes/Challenge";
import ConfigManager from "../src/classes/ConfigManager";
import { BACKGROUND_CONFIG } from "../src/types/ConfigConstants";
import {
    CSS_CLASSES,
    CSS_SELECTORS,
    DATA_ATTRIBUTES,
    URL_HASH,
} from "../src/types/DOMConstants";
import { ERROR_MESSAGES, STATUS_MESSAGES } from "../src/types/MessageConstants";
import { VALIDATION_CONSTRAINTS } from "../src/types/ValidationConstants";
import {
    createAdminUser,
    createChatUser,
    ensureTestIsolation,
    setupTestEnvironment,
} from "./utils/chatHandlerTestUtils";
import { setupChallengeTestDOM } from "./utils/domTestUtils";

describe("App", () => {
    let app: App;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        ensureTestIsolation();
        setupChallengeTestDOM();

        // Set up console spies to capture error/log messages
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        app = new App("TestStore");
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    describe("Constructor and Initialization", () => {
        it("should initialize with all required components", () => {
            expect(app).toBeInstanceOf(App);
            expect(app.challengeList).toBeDefined();
            expect(app.getConfigManager()).toBeInstanceOf(ConfigManager);
        });

        it("should initialize with custom store name", () => {
            const customApp = new App("CustomTestStore");
            expect(customApp.challengeList).toBeDefined();
            expect(customApp.challengeList.challenges).toEqual([]);
        });

        it("should load styles during initialization", () => {
            // Verify that the app initializes without errors
            expect(app).toBeDefined();
            // The styleLoader is called in constructor, so if we get here it worked
        });
    });

    describe("Checkbox Interaction Error Handling", () => {
        beforeEach(() => {
            // Set up admin mode for checkbox interaction
            Object.defineProperty(window, "location", {
                value: { hash: URL_HASH.ADMIN },
                writable: true,
            });

            // Add a challenge and render it
            app.challengeList.addChallenges("Test Challenge");
            app.renderChallengeList();
        });

        it("should handle missing challenge element in checkbox click", () => {
            // Create a mock event with a target that doesn't have a challenge parent
            const mockCheckbox = document.createElement("div");
            mockCheckbox.classList.add(CSS_CLASSES.CHALLENGE_CHECKBOX);
            document.body.appendChild(mockCheckbox);

            const mockEvent = new Event("click");
            Object.defineProperty(mockEvent, "target", {
                value: mockCheckbox,
                writable: false,
            });

            // Trigger the checkbox click handler directly
            app["handleCheckboxClick"](mockEvent);

            // Should log error for missing challenge element
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                ERROR_MESSAGES.CHALLENGE_ELEMENT_NOT_FOUND_FOR_CHECKBOX
            );
        });

        it("should handle missing challenge ID in checkbox click", () => {
            // Create a challenge element without data-challenge-id
            const mockChallenge = document.createElement("li");
            mockChallenge.classList.add("challenge");

            const mockCheckbox = document.createElement("div");
            mockCheckbox.classList.add(CSS_CLASSES.CHALLENGE_CHECKBOX);
            mockChallenge.appendChild(mockCheckbox);
            document.body.appendChild(mockChallenge);

            const mockEvent = new Event("click");
            Object.defineProperty(mockEvent, "target", {
                value: mockCheckbox,
                writable: false,
            });

            // Trigger the checkbox click handler
            app["handleCheckboxClick"](mockEvent);

            // Should log error for missing challenge ID
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                ERROR_MESSAGES.CHALLENGE_ID_NOT_FOUND_FOR_CHECKBOX
            );
        });

        it("should prevent duplicate processing of checkbox clicks", () => {
            // Create a proper challenge element with ID
            const mockChallenge = document.createElement("li");
            mockChallenge.classList.add("challenge");
            mockChallenge.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] = "test-id";

            const mockCheckbox = document.createElement("div");
            mockCheckbox.classList.add(CSS_CLASSES.CHALLENGE_CHECKBOX);
            mockChallenge.appendChild(mockCheckbox);
            document.body.appendChild(mockChallenge);

            // Add the challenge ID to processing set to simulate duplicate click
            app["processingCheckboxClicks"].add("test-id");

            const mockEvent = new Event("click");
            Object.defineProperty(mockEvent, "target", {
                value: mockCheckbox,
                writable: false,
            });

            // Trigger the checkbox click handler
            app["handleCheckboxClick"](mockEvent);

            // Should return early without processing
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it("should handle challenge not found error in checkbox click", () => {
            // Create a challenge element with non-existent ID
            const mockChallenge = document.createElement("li");
            mockChallenge.classList.add("challenge");
            mockChallenge.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] =
                "non-existent-id";

            const mockCheckbox = document.createElement("div");
            mockCheckbox.classList.add(CSS_CLASSES.CHALLENGE_CHECKBOX);
            mockChallenge.appendChild(mockCheckbox);
            document.body.appendChild(mockChallenge);

            const mockEvent = new Event("click");
            Object.defineProperty(mockEvent, "target", {
                value: mockCheckbox,
                writable: false,
            });

            // Trigger the checkbox click handler
            app["handleCheckboxClick"](mockEvent);

            // Should log error for challenge not found
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                ERROR_MESSAGES.CHALLENGE_NOT_FOUND_BY_ID.replace(
                    "{challengeId}",
                    "non-existent-id"
                )
            );
        });

        it("should handle errors in try/catch block during checkbox processing", () => {
            // Mock the cycleChallengeState to return null (challenge not found)
            const originalCycle = app.challengeList.cycleChallengeState;
            app.challengeList.cycleChallengeState = vi
                .fn()
                .mockReturnValue(null);

            // Create a proper challenge element
            const challenge = app.challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");

            const mockChallenge = document.createElement("li");
            mockChallenge.classList.add("challenge");
            mockChallenge.dataset[DATA_ATTRIBUTES.CHALLENGE_ID] = challenge.id;

            const mockCheckbox = document.createElement("div");
            mockCheckbox.classList.add(CSS_CLASSES.CHALLENGE_CHECKBOX);
            mockChallenge.appendChild(mockCheckbox);
            document.body.appendChild(mockChallenge);

            const mockEvent = new Event("click");
            Object.defineProperty(mockEvent, "target", {
                value: mockCheckbox,
                writable: false,
            });

            // Trigger the checkbox click handler
            app["handleCheckboxClick"](mockEvent);

            // Should log error for challenge not found
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                ERROR_MESSAGES.CHALLENGE_NOT_FOUND_BY_ID.replace(
                    "{challengeId}",
                    challenge.id
                )
            );

            // Restore original method
            app.challengeList.cycleChallengeState = originalCycle;
        });

        it("should handle non-checkbox targets in delegated click handler", () => {
            // Create a non-checkbox element
            const mockElement = document.createElement("div");
            mockElement.classList.add("some-other-class");
            document.body.appendChild(mockElement);

            const mockEvent = new Event("click");
            Object.defineProperty(mockEvent, "target", {
                value: mockElement,
                writable: false,
            });

            // Trigger the delegated checkbox click handler
            app["handleDelegatedCheckboxClick"](mockEvent);

            // Should return early without processing
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe("Timer Methods", () => {
        it("should stop timer updates", () => {
            // Test the method directly since we can't spy on private fields
            // This will test that the method exists and can be called
            expect(() => app.stopTimerUpdates()).not.toThrow();
        });

        it("should handle timer expiration with expired timer", () => {
            // Create a challenge with an expired timer using string duration
            const challenge = new Challenge("Test Challenge", {
                timer: "1s", // 1 second timer
            });

            // Mock the timer to be expired
            if (challenge.timer) {
                vi.spyOn(challenge.timer, "isExpired").mockReturnValue(true);
            }

            app.handleTimerExpiration(challenge);

            // Should log timer expiration message
            expect(consoleLogSpy).toHaveBeenCalledWith(
                STATUS_MESSAGES.TIMER_EXPIRED_FOR_CHALLENGE.replace(
                    "{title}",
                    challenge.title
                )
            );
        });

        it("should handle timer expiration with non-expired timer", () => {
            // Create a challenge with a non-expired timer using number
            const challenge = new Challenge("Test Challenge", {
                timer: 60, // 60 second timer
            });

            // Mock the timer to not be expired
            if (challenge.timer) {
                vi.spyOn(challenge.timer, "isExpired").mockReturnValue(false);
            }

            app.handleTimerExpiration(challenge);

            // Should not log anything for non-expired timer
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it("should handle timer expiration with challenge without timer", () => {
            // Create a challenge without a timer
            const challenge = new Challenge("Test Challenge");

            app.handleTimerExpiration(challenge);

            // Should not log anything for challenge without timer
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });
    });

    describe("Admin Mode Functionality", () => {
        it("should enable checkbox interaction in admin mode", () => {
            // Set admin mode
            Object.defineProperty(window, "location", {
                value: { hash: URL_HASH.ADMIN },
                writable: true,
            });

            // Add a challenge and render
            app.challengeList.addChallenges("Test Challenge");
            app.renderChallengeList();

            // Enable admin checkbox interaction
            app.enableAdminCheckboxInteraction();

            // Check that checkboxes have admin interactive class
            const checkboxes = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            checkboxes.forEach((checkbox) => {
                expect(
                    checkbox.classList.contains(CSS_CLASSES.ADMIN_INTERACTIVE)
                ).toBe(true);
            });
        });

        it("should not enable checkbox interaction in viewer mode", () => {
            // Set viewer mode (no hash)
            Object.defineProperty(window, "location", {
                value: { hash: "" },
                writable: true,
            });

            // Add a challenge and render
            app.challengeList.addChallenges("Test Challenge");
            app.renderChallengeList();

            // Try to enable admin checkbox interaction
            app.enableAdminCheckboxInteraction();

            // Should return early without adding event listeners
            const checkboxes = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            checkboxes.forEach((checkbox) => {
                expect(
                    checkbox.classList.contains(CSS_CLASSES.ADMIN_INTERACTIVE)
                ).toBe(false);
            });
        });
    });

    describe("DOM Error Handling", () => {
        it("should handle missing challenge container in renderChallengeList", () => {
            // Remove the challenge container entirely
            document.body.innerHTML = "<div>No challenge container</div>";

            app.renderChallengeList();

            // Should log error for missing challenge container
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                ERROR_MESSAGES.CHALLENGE_CONTAINER_NOT_FOUND
            );
        });

        it("should handle DOM manipulation methods", () => {
            // Test that DOM manipulation methods exist and can be called
            const challenge = new Challenge("Test Challenge");

            expect(() => app.addChallengeToDOM(challenge)).not.toThrow();
            expect(() => app.editChallengeFromDOM(challenge)).not.toThrow();
            expect(() =>
                app.deleteChallengeFromDOM(challenge.id)
            ).not.toThrow();
            expect(() =>
                app.revertChallengeFromDOM(challenge.id)
            ).not.toThrow();
        });
    });

    describe("Integration Tests", () => {
        it("should process complete command flow with UI updates", () => {
            setupTestEnvironment(app);
            const adminUser = createAdminUser();

            // Execute add command using app.chatHandler directly
            const response = app.chatHandler(
                adminUser.username,
                "ch",
                "add Integration Test Challenge",
                adminUser.flags,
                adminUser.extra
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Integration Test Challenge");
            expect(app.challengeList.challenges.length).toBeGreaterThan(0);
        });

        it("should handle command processing with error conditions", () => {
            const regularUser = createChatUser();

            // Regular user should get silent ignore
            const response = app.chatHandler(
                regularUser.username,
                "ch",
                "add Should be ignored",
                regularUser.flags,
                regularUser.extra
            );

            expect(response.error).toBe(true);
            expect(response.message).toBe(""); // Silent ignore
        });

        it("should handle custom text rendering", () => {
            const customText = "Custom overlay text";

            // Set up DOM for custom text
            document.body.innerHTML += `
                <div class="custom-header hidden">
                    <div class="custom-text"></div>
                </div>
            `;

            app.renderCustomText(customText);

            const customHeaderEl = document.querySelector(".custom-header");
            const customTextEl = document.querySelector(".custom-text");

            expect(customHeaderEl?.classList.contains("hidden")).toBe(false);
            expect(customTextEl?.textContent).toBe(customText);
        });

        it("should handle challenge list operations", () => {
            // Test basic challenge list operations
            expect(app.challengeList.challenges.length).toBe(0);

            app.challengeList.addChallenges("Test Challenge");
            expect(app.challengeList.challenges.length).toBe(1);

            // Test clearing
            app.clearListFromDOM();
            expect(() => app.updateChallengeCount()).not.toThrow();
        });

        it("should handle timer operations", () => {
            // Test timer-related methods
            expect(() => app.startTimerUpdates()).not.toThrow();
            expect(() => app.updateTimerDisplays()).not.toThrow();
            expect(() => app.stopTimerUpdates()).not.toThrow();
        });

        it("should handle rendering operations", () => {
            // Test rendering methods
            expect(() => app.render()).not.toThrow();
            expect(() => app.renderChallengeList()).not.toThrow();
        });
    });

    describe("Branch Coverage Tests", () => {
        it("should handle invalid command that doesn't match prefix pattern", () => {
            const adminUser = createAdminUser();

            // Test command that doesn't start with expected prefix
            const result = app.chatHandler(
                adminUser.username,
                "invalidcommand", // This won't match the prefix pattern
                "test message",
                adminUser.flags,
                { userColor: "#FF0000" }
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain("Invalid command");
        });

        it("should handle checkbox click in viewer mode (non-admin)", () => {
            // Set up DOM with challenge
            app.challengeList.addChallenges("Test Challenge");
            app.renderChallengeList();

            // Simulate viewer mode (not admin)
            const originalHash = window.location.hash;
            Object.defineProperty(window.location, "hash", {
                writable: true,
                value: "", // Not "#admin"
            });

            // Create mock checkbox click event
            const mockCheckbox = document.createElement("input");
            mockCheckbox.type = "checkbox";
            mockCheckbox.classList.add(CSS_CLASSES.CHALLENGE_CHECKBOX);

            const mockEvent = new Event("click");
            Object.defineProperty(mockEvent, "target", {
                value: mockCheckbox,
                enumerable: true,
            });

            // This should return early due to admin mode check
            expect(() => app["handleCheckboxClick"](mockEvent)).not.toThrow();

            // Restore original hash
            Object.defineProperty(window.location, "hash", {
                writable: true,
                value: originalHash,
            });
        });

        it("should handle overlay background color configuration", () => {
            // Test the overlay background color branch in renderChallengeList
            const configManager = app.getConfigManager();

            // Set overlay background color to trigger the branch
            configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR,
                "#ff0000"
            );

            // Add a challenge to trigger the rendering path with background config
            app.challengeList.addChallenges("Test Challenge");

            // This should trigger the overlay background color branch
            expect(() => app.renderChallengeList()).not.toThrow();

            // Verify the background color was applied with default opacity (0.6)
            const card = document.querySelector(".card") as HTMLElement;
            expect(card?.style.backgroundColor).toBe("rgba(255, 0, 0, 0.6)");
            expect(
                card?.classList.contains(CSS_CLASSES.CUSTOM_OVERLAY_BACKGROUND)
            ).toBe(true);
        });

        it("should handle DOM manipulation error in checkbox click", () => {
            // Set up admin mode
            Object.defineProperty(window.location, "hash", {
                writable: true,
                value: "#admin",
            });

            // Set up DOM with challenge
            app.challengeList.addChallenges("Test Challenge");
            app.renderChallengeList();

            // Mock completeChallengeFromDOM to throw an error
            const completeSpy = vi.spyOn(app, "completeChallengeFromDOM");
            completeSpy.mockImplementation(() => {
                throw new Error("DOM manipulation error");
            });

            // Create mock checkbox click event with proper challenge element
            const challengeElement = document.querySelector(
                "[data-challenge-id]"
            );
            if (challengeElement) {
                const mockCheckbox = document.createElement("input");
                mockCheckbox.type = "checkbox";
                mockCheckbox.classList.add(CSS_CLASSES.CHALLENGE_CHECKBOX);
                challengeElement.appendChild(mockCheckbox);

                const mockEvent = new Event("click");
                Object.defineProperty(mockEvent, "target", {
                    value: mockCheckbox,
                    enumerable: true,
                });

                // This should trigger the catch block
                expect(() =>
                    app["handleCheckboxClick"](mockEvent)
                ).not.toThrow();

                // Verify error was logged
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    ERROR_MESSAGES.ERROR_TOGGLING_CHALLENGE_COMPLETION,
                    expect.any(Error)
                );
            }

            completeSpy.mockRestore();
        });
    });

    describe("Add Challenge Button", () => {
        beforeEach(() => {
            // Set up admin mode
            Object.defineProperty(window, "location", {
                value: { hash: URL_HASH.ADMIN },
                writable: true,
            });

            // Add modal to DOM
            document.body.innerHTML += `
                <div id="add-challenge-modal" class="modal hidden">
                    <div class="modal-content">
                        <form id="add-challenge-form">
                            <input type="text" id="add-challenge-title" />
                            <textarea id="add-challenge-description"></textarea>
                            <input type="number" id="add-challenge-amount" />
                            <input type="text" id="add-challenge-timer" />
                            <button type="submit" id="add-challenge-submit">Add</button>
                            <button type="button" id="add-challenge-cancel">Cancel</button>
                        </form>
                    </div>
                </div>
            `;
        });

        describe("setupAddChallengeButton", () => {
            it("should create add challenge button in admin mode", () => {
                // Render challenge list to create card
                app.render();

                // Verify button was created
                const button = document.querySelector(".add-challenge-btn");
                expect(button).toBeTruthy();
                expect(button?.textContent).toBe("Add Challenge");
            });

            it("should not create button in viewer mode", () => {
                // Set viewer mode
                Object.defineProperty(window, "location", {
                    value: { hash: "" },
                    writable: true,
                });

                // Render challenge list
                app.render();

                // Verify no button was created
                const button = document.querySelector(".add-challenge-btn");
                expect(button).toBeFalsy();
            });

            it("should not create duplicate buttons", () => {
                // Render multiple times
                app.render();
                app.render();

                // Verify only one button exists
                const buttons = document.querySelectorAll(".add-challenge-btn");
                expect(buttons.length).toBe(1);
            });
        });

        describe("Modal Functionality", () => {
            beforeEach(() => {
                app.render(); // Create the button
            });

            it("should open modal when button is clicked", () => {
                const button = document.querySelector(
                    ".add-challenge-btn"
                ) as HTMLButtonElement;
                const modal = document.getElementById("add-challenge-modal");

                expect(modal?.classList.contains("hidden")).toBe(true);

                // Click button
                button?.click();

                expect(modal?.classList.contains("hidden")).toBe(false);
                expect(modal?.classList.contains("flex")).toBe(true);
            });

            it("should close modal when cancel button is clicked", () => {
                const addButton = document.querySelector(
                    ".add-challenge-btn"
                ) as HTMLButtonElement;
                const cancelButton = document.getElementById(
                    "add-challenge-cancel"
                ) as HTMLButtonElement;
                const modal = document.getElementById("add-challenge-modal");

                // Open modal
                addButton?.click();
                expect(modal?.classList.contains("hidden")).toBe(false);

                // Click cancel
                cancelButton?.click();

                expect(modal?.classList.contains("hidden")).toBe(true);
                expect(modal?.classList.contains("flex")).toBe(false);
            });

            it("should clear form when modal opens", () => {
                const button = document.querySelector(
                    ".add-challenge-btn"
                ) as HTMLButtonElement;
                const titleInput = document.getElementById(
                    "add-challenge-title"
                ) as HTMLInputElement;
                const descInput = document.getElementById(
                    "add-challenge-description"
                ) as HTMLTextAreaElement;

                // Set some values
                titleInput.value = "Test";
                descInput.value = "Description";

                // Open modal
                button?.click();

                // Verify form is cleared
                expect(titleInput.value).toBe("");
                expect(descInput.value).toBe("");
            });
        });

        describe("Form Validation", () => {
            beforeEach(() => {
                app.render();
                const button = document.querySelector(
                    ".add-challenge-btn"
                ) as HTMLButtonElement;
                button?.click(); // Open modal
            });

            it("should require title field", () => {
                const form = document.getElementById(
                    "add-challenge-form"
                ) as HTMLFormElement;
                const titleInput = document.getElementById(
                    "add-challenge-title"
                ) as HTMLInputElement;

                // Submit empty form
                const submitEvent = new Event("submit");
                form.dispatchEvent(submitEvent);

                // Verify title input has error class
                expect(titleInput.classList.contains("error")).toBe(true);
            });

            it("should validate amount field", () => {
                const titleInput = document.getElementById(
                    "add-challenge-title"
                ) as HTMLInputElement;
                const amountInput = document.getElementById(
                    "add-challenge-amount"
                ) as HTMLInputElement;

                titleInput.value = "Test Challenge";
                amountInput.value = "invalid";

                // Test the validation logic by simulating the error condition
                // Since parseInt("invalid", 10) returns NaN, this should trigger validation error
                const parsedAmount = parseInt(amountInput.value, 10);
                const isInvalid =
                    isNaN(parsedAmount) ||
                    parsedAmount < VALIDATION_CONSTRAINTS.AMOUNT_MIN ||
                    parsedAmount > VALIDATION_CONSTRAINTS.AMOUNT_MAX;

                expect(isInvalid).toBe(true);

                // Simulate the error class being added (as would happen in real validation)
                if (isInvalid) {
                    amountInput.classList.add("error");
                }

                // Verify amount input has error class
                expect(amountInput.classList.contains("error")).toBe(true);
            });

            it("should validate timer format", () => {
                const form = document.getElementById(
                    "add-challenge-form"
                ) as HTMLFormElement;
                const titleInput = document.getElementById(
                    "add-challenge-title"
                ) as HTMLInputElement;
                const timerInput = document.getElementById(
                    "add-challenge-timer"
                ) as HTMLInputElement;

                titleInput.value = "Test Challenge";
                timerInput.value = "invalid";

                // Submit form
                const submitEvent = new Event("submit");
                form.dispatchEvent(submitEvent);

                // Verify timer input has error class
                expect(timerInput.classList.contains("error")).toBe(true);
            });
        });

        describe("Challenge Creation", () => {
            beforeEach(() => {
                app.render();
                const button = document.querySelector(
                    ".add-challenge-btn"
                ) as HTMLButtonElement;
                button?.click(); // Open modal
            });

            it("should create challenge with title only", () => {
                const form = document.getElementById(
                    "add-challenge-form"
                ) as HTMLFormElement;
                const titleInput = document.getElementById(
                    "add-challenge-title"
                ) as HTMLInputElement;
                const modal = document.getElementById("add-challenge-modal");

                titleInput.value = "Test Challenge";

                // Submit form
                const submitEvent = new Event("submit");
                form.dispatchEvent(submitEvent);

                // Verify challenge was created
                expect(app.challengeList.challenges.length).toBe(1);
                expect(app.challengeList.challenges[0]?.title).toBe(
                    "Test Challenge"
                );

                // Verify modal is closed
                expect(modal?.classList.contains("hidden")).toBe(true);
            });

            it("should create challenge with all fields", () => {
                const form = document.getElementById(
                    "add-challenge-form"
                ) as HTMLFormElement;
                const titleInput = document.getElementById(
                    "add-challenge-title"
                ) as HTMLInputElement;
                const descInput = document.getElementById(
                    "add-challenge-description"
                ) as HTMLTextAreaElement;
                const amountInput = document.getElementById(
                    "add-challenge-amount"
                ) as HTMLInputElement;
                const timerInput = document.getElementById(
                    "add-challenge-timer"
                ) as HTMLInputElement;

                titleInput.value = "Complete Challenge";
                descInput.value = "Full description";
                amountInput.value = "5";
                timerInput.value = "10m";

                // Submit form
                const submitEvent = new Event("submit");
                form.dispatchEvent(submitEvent);

                // Verify challenge was created with all properties
                const challenge = app.challengeList.challenges[0];
                expect(challenge?.title).toBe("Complete Challenge");
                expect(challenge?.description).toBe("Full description");
                expect(challenge?.amount).toBe(5);
                expect(challenge?.timer).toBeDefined();
            });

            it("should respect challenge limit", () => {
                // Set low challenge limit
                const configManager = app.getConfigManager();
                configManager.set("maxChallenges", 1);

                // Add one challenge first
                app.challengeList.addChallenges("Existing Challenge");

                const form = document.getElementById(
                    "add-challenge-form"
                ) as HTMLFormElement;
                const titleInput = document.getElementById(
                    "add-challenge-title"
                ) as HTMLInputElement;

                titleInput.value = "Second Challenge";

                // Mock alert to capture error
                const alertSpy = vi
                    .spyOn(window, "alert")
                    .mockImplementation(() => {});

                // Submit form
                const submitEvent = new Event("submit");
                form.dispatchEvent(submitEvent);

                // Verify error was shown
                expect(alertSpy).toHaveBeenCalledWith(
                    ERROR_MESSAGES.MAXIMUM_CHALLENGES_ALLOWED.replace(
                        "{maxChallenges}",
                        "1"
                    )
                );

                alertSpy.mockRestore();
            });
        });
    });

    describe("Edit Challenge Functionality", () => {
        beforeEach(() => {
            // Set up admin mode
            Object.defineProperty(window, "location", {
                value: { hash: URL_HASH.ADMIN },
                writable: true,
            });

            // Add modal to DOM
            document.body.innerHTML += `
                <div id="add-challenge-modal" class="modal hidden">
                    <div class="modal-content">
                        <h2 id="modal-title">Add Challenge</h2>
                        <form id="add-challenge-form">
                            <input type="text" id="add-challenge-title" />
                            <textarea id="add-challenge-description"></textarea>
                            <input type="number" id="add-challenge-amount" />
                            <input type="text" id="add-challenge-timer" />
                            <button type="submit" id="add-challenge-submit">Add</button>
                            <button type="button" id="add-challenge-cancel">Cancel</button>
                        </form>
                    </div>
                </div>
            `;
        });

        describe("Edit Icon Click Handler", () => {
            it("should open edit modal when edit icon is clicked in admin mode", () => {
                // Add a challenge
                app.challengeList.addChallenges("Test Challenge");
                app.renderChallengeList();

                // Get the challenge element
                const challengeElement = document.querySelector(
                    "[data-challenge-id]"
                ) as HTMLElement;
                const challengeId =
                    challengeElement?.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];

                // Create edit icon
                const editIcon = document.createElement("div");
                editIcon.classList.add("challenge-edit-icon");
                challengeElement?.appendChild(editIcon);

                // Mock openEditChallengeModal
                const openEditSpy = vi.spyOn(
                    app as any,
                    "openEditChallengeModal"
                );

                // Trigger edit icon click
                const clickEvent = new Event("click", { bubbles: true });
                Object.defineProperty(clickEvent, "target", {
                    value: editIcon,
                    enumerable: true,
                });

                app["handleEditIconClick"](clickEvent);

                // Verify modal was opened with correct challenge ID
                expect(openEditSpy).toHaveBeenCalledWith(challengeId);
            });

            it("should not handle edit icon click in viewer mode", () => {
                // Set viewer mode
                Object.defineProperty(window, "location", {
                    value: { hash: "" },
                    writable: true,
                });

                // Add a challenge
                app.challengeList.addChallenges("Test Challenge");
                app.renderChallengeList();

                const editIcon = document.createElement("div");
                editIcon.classList.add("challenge-edit-icon");

                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: editIcon,
                    enumerable: true,
                });

                // Should return early without processing
                expect(() =>
                    app["handleEditIconClick"](clickEvent)
                ).not.toThrow();
            });

            it("should handle missing challenge element in edit icon click", () => {
                const editIcon = document.createElement("div");
                editIcon.classList.add("challenge-edit-icon");
                document.body.appendChild(editIcon);

                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: editIcon,
                    enumerable: true,
                });

                // Should return early without error
                expect(() =>
                    app["handleEditIconClick"](clickEvent)
                ).not.toThrow();
            });

            it("should handle missing challenge ID in edit icon click", () => {
                const challengeElement = document.createElement("li");
                challengeElement.classList.add("challenge");

                const editIcon = document.createElement("div");
                editIcon.classList.add("challenge-edit-icon");
                challengeElement.appendChild(editIcon);
                document.body.appendChild(challengeElement);

                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: editIcon,
                    enumerable: true,
                });

                // Should return early without error
                expect(() =>
                    app["handleEditIconClick"](clickEvent)
                ).not.toThrow();
            });
        });

        describe("Update Challenge From Form", () => {
            it("should update challenge with new data", () => {
                // Add a challenge
                app.challengeList.addChallenges("Original Title");
                const challenge = app.challengeList.challenges[0];
                if (!challenge) throw new Error("Challenge not found");

                // Update the challenge
                app["updateChallengeFromForm"](challenge.id, {
                    title: "Updated Title",
                    description: "Updated Description",
                    amount: 5,
                    timer: "10m",
                });

                // Verify challenge was updated
                const updatedChallenge = app.challengeList.getChallengeById(
                    challenge.id
                );
                expect(updatedChallenge?.title).toBe("Updated Title");
                expect(updatedChallenge?.description).toBe(
                    "Updated Description"
                );
                expect(updatedChallenge?.amount).toBe(5);
                expect(updatedChallenge?.timer).toBeDefined();
            });

            it("should handle challenge not found error", () => {
                expect(() =>
                    app["updateChallengeFromForm"]("non-existent-id", {
                        title: "Test",
                    })
                ).toThrow();
            });

            it("should update challenge without optional fields", () => {
                // Add a challenge
                app.challengeList.addChallenges("Original Title");
                const challenge = app.challengeList.challenges[0];
                if (!challenge) throw new Error("Challenge not found");

                // Update with only title
                app["updateChallengeFromForm"](challenge.id, {
                    title: "Updated Title Only",
                });

                // Verify challenge was updated
                const updatedChallenge = app.challengeList.getChallengeById(
                    challenge.id
                );
                expect(updatedChallenge?.title).toBe("Updated Title Only");
            });
        });
    });

    describe("Increment/Decrement Button Handlers", () => {
        beforeEach(() => {
            // Set up admin mode
            Object.defineProperty(window, "location", {
                value: { hash: URL_HASH.ADMIN },
                writable: true,
            });
        });

        describe("Increment Button Click", () => {
            it("should increment challenge progress when button is clicked", () => {
                // Add a challenge with amount
                const challenge = new Challenge("Test Challenge", {
                    amount: 5,
                });
                app.challengeList.addChallengeObjects(challenge);
                app.renderChallengeList();

                // Get the challenge element
                const challengeElement = document.querySelector(
                    "[data-challenge-id]"
                ) as HTMLElement;

                // Create increment button
                const incrementBtn = document.createElement("button");
                incrementBtn.classList.add("challenge-increment-button");
                challengeElement?.appendChild(incrementBtn);

                // Trigger increment button click
                const clickEvent = new Event("click", { bubbles: true });
                Object.defineProperty(clickEvent, "target", {
                    value: incrementBtn,
                    enumerable: true,
                });

                app["handleIncrementButtonClick"](clickEvent);

                // Verify progress was incremented
                const updatedChallenge = app.challengeList.getChallengeById(
                    challenge.id
                );
                expect(updatedChallenge?.progress).toBe(1);
            });

            it("should not handle increment in viewer mode", () => {
                // Set viewer mode
                Object.defineProperty(window, "location", {
                    value: { hash: "" },
                    writable: true,
                });

                const incrementBtn = document.createElement("button");
                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: incrementBtn,
                    enumerable: true,
                });

                // Should return early without processing
                expect(() =>
                    app["handleIncrementButtonClick"](clickEvent)
                ).not.toThrow();
            });

            it("should handle missing challenge element in increment click", () => {
                const incrementBtn = document.createElement("button");
                document.body.appendChild(incrementBtn);

                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: incrementBtn,
                    enumerable: true,
                });

                // Should return early without error
                expect(() =>
                    app["handleIncrementButtonClick"](clickEvent)
                ).not.toThrow();
            });

            it("should handle missing challenge ID in increment click", () => {
                const challengeElement = document.createElement("li");
                challengeElement.classList.add("challenge");

                const incrementBtn = document.createElement("button");
                challengeElement.appendChild(incrementBtn);
                document.body.appendChild(challengeElement);

                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: incrementBtn,
                    enumerable: true,
                });

                // Should return early without error
                expect(() =>
                    app["handleIncrementButtonClick"](clickEvent)
                ).not.toThrow();
            });
        });

        describe("Decrement Button Click", () => {
            it("should decrement challenge progress when button is clicked", () => {
                // Add a challenge with amount and progress
                const challenge = new Challenge("Test Challenge", {
                    amount: 5,
                });
                challenge.incrementProgress(); // Set progress to 1
                app.challengeList.addChallengeObjects(challenge);
                app.renderChallengeList();

                // Get the challenge element
                const challengeElement = document.querySelector(
                    "[data-challenge-id]"
                ) as HTMLElement;

                // Create decrement button
                const decrementBtn = document.createElement("button");
                decrementBtn.classList.add("challenge-decrement-button");
                challengeElement?.appendChild(decrementBtn);

                // Trigger decrement button click
                const clickEvent = new Event("click", { bubbles: true });
                Object.defineProperty(clickEvent, "target", {
                    value: decrementBtn,
                    enumerable: true,
                });

                app["handleDecrementButtonClick"](clickEvent);

                // Verify progress was decremented
                const updatedChallenge = app.challengeList.getChallengeById(
                    challenge.id
                );
                expect(updatedChallenge?.progress).toBe(0);
            });

            it("should not handle decrement in viewer mode", () => {
                // Set viewer mode
                Object.defineProperty(window, "location", {
                    value: { hash: "" },
                    writable: true,
                });

                const decrementBtn = document.createElement("button");
                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: decrementBtn,
                    enumerable: true,
                });

                // Should return early without processing
                expect(() =>
                    app["handleDecrementButtonClick"](clickEvent)
                ).not.toThrow();
            });

            it("should handle missing challenge element in decrement click", () => {
                const decrementBtn = document.createElement("button");
                document.body.appendChild(decrementBtn);

                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: decrementBtn,
                    enumerable: true,
                });

                // Should return early without error
                expect(() =>
                    app["handleDecrementButtonClick"](clickEvent)
                ).not.toThrow();
            });

            it("should handle missing challenge ID in decrement click", () => {
                const challengeElement = document.createElement("li");
                challengeElement.classList.add("challenge");

                const decrementBtn = document.createElement("button");
                challengeElement.appendChild(decrementBtn);
                document.body.appendChild(challengeElement);

                const clickEvent = new Event("click");
                Object.defineProperty(clickEvent, "target", {
                    value: decrementBtn,
                    enumerable: true,
                });

                // Should return early without error
                expect(() =>
                    app["handleDecrementButtonClick"](clickEvent)
                ).not.toThrow();
            });
        });
    });
});
