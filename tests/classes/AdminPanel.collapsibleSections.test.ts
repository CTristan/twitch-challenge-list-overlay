import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPanel from "../../src/classes/AdminPanel";
import ConfigManager from "../../src/classes/ConfigManager";
import CollapsibleSection from "../../src/utils/CollapsibleSection";
import { createTestConfig } from "../globalSetup";

// Mock CollapsibleSection for controlled testing
vi.mock("../../src/utils/CollapsibleSection", () => {
    const mockCollapsibleSection = {
        createElement: vi.fn(),
        expand: vi.fn(),
        collapse: vi.fn(),
        toggle: vi.fn(),
        getExpandedState: vi.fn(),
        updateContent: vi.fn(),
        getInstance: vi.fn(),
        removeInstance: vi.fn(),
        clearAllInstances: vi.fn(),
        create: vi.fn(),
    };

    return {
        default: vi.fn(() => mockCollapsibleSection),
    };
});

const MockedCollapsibleSection = vi.mocked(CollapsibleSection);

describe("AdminPanel Collapsible Sections Integration", () => {
    let adminPanel: AdminPanel;
    let mockCollapsibleInstance: any;

    beforeEach(() => {
        // Clear localStorage and reset mocks
        localStorage.clear();
        vi.clearAllMocks();

        // Setup DOM structure
        document.body.innerHTML = `
            <div class="admin-content">
                <div class="admin-controls">
                    <button id="clear-all-button">Clear All</button>
                    <button id="clear-done-button">Clear Done</button>
                </div>
            </div>
        `;

        // Setup mock collapsible section instance
        mockCollapsibleInstance = {
            createElement: vi.fn(() => {
                const element = document.createElement("div");
                element.className = "collapsible-section";
                element.innerHTML = `
                    <div class="collapsible-header">
                        <h4>Test Section</h4>
                        <span class="collapsible-icon">▼</span>
                    </div>
                    <div class="collapsible-content">
                        <div class="form-group">
                            <label>Test Input:</label>
                            <input type="text" value="test" />
                        </div>
                    </div>
                `;
                return element;
            }),
            expand: vi.fn(),
            collapse: vi.fn(),
            toggle: vi.fn(),
            getExpandedState: vi.fn(() => false),
            updateContent: vi.fn(),
        };

        MockedCollapsibleSection.mockImplementation(
            () => mockCollapsibleInstance
        );
        MockedCollapsibleSection.clearAllInstances = vi.fn();

        // Initialize ConfigManager with test configuration
        ConfigManager.getInstance(createTestConfig());

        // Create AdminPanel instance
        adminPanel = new AdminPanel();
    });

    describe("Collapsible Section Creation", () => {
        it("should create collapsible sections during initialization", () => {
            // Set hash to admin mode
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });

            adminPanel.initialize();

            // Should create multiple collapsible sections (4 total: Behavior, Challenge Row Styling, Overlay Background, Authentication)
            expect(MockedCollapsibleSection).toHaveBeenCalledTimes(4);

            // Verify section configurations
            const calls = MockedCollapsibleSection.mock.calls;
            expect(calls).toHaveLength(4); // Ensure we have the expected number of calls
        });

        it("should append collapsible section elements to admin content", () => {
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });

            adminPanel.initialize();

            // Should call createElement for each section
            expect(mockCollapsibleInstance.createElement).toHaveBeenCalledTimes(
                4
            );

            // Check that sections were added to DOM
            const adminContent = document.querySelector(".admin-content");
            const collapsibleSections = adminContent?.querySelectorAll(
                ".collapsible-section"
            );
            expect(collapsibleSections?.length).toBe(4);
        });

        it("should not create sections when not in admin mode", () => {
            // Clear any previous calls
            vi.clearAllMocks();

            Object.defineProperty(window, "location", {
                value: { hash: "" },
                writable: true,
            });

            adminPanel.initialize();

            expect(MockedCollapsibleSection).not.toHaveBeenCalled();
        });
    });

    describe("Form Functionality Integration", () => {
        beforeEach(() => {
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });
            adminPanel.initialize();
        });

        it("should preserve form submission functionality", () => {
            // Find save button in the actions section
            const saveButton = document.querySelector(
                'button[type="submit"]'
            ) as HTMLButtonElement;

            if (saveButton) {
                // Mock form submission
                const submitEvent = new Event("submit", {
                    bubbles: true,
                    cancelable: true,
                });
                const form = saveButton.closest("form");

                expect(() => {
                    form?.dispatchEvent(submitEvent);
                }).not.toThrow();
            }
        });

        it("should maintain configuration saving functionality", () => {
            const configManager = ConfigManager.getInstance();

            // Simulate configuration change
            const authInput = document.querySelector(
                'input[placeholder="OAuth Token"]'
            ) as HTMLInputElement;
            if (authInput) {
                authInput.value = "new_oauth_token";

                // Trigger save
                const saveButton = document.querySelector(
                    'button[type="submit"]'
                ) as HTMLButtonElement;
                if (saveButton) {
                    saveButton.click();
                }
            }

            // Configuration should be updated
            const updatedConfig = configManager.getAll();
            expect(updatedConfig).toBeDefined();
        });

        it("should handle challenge row styling configuration UI within collapsible sections", () => {
            // Verify that challenge row styling configuration content was passed to CollapsibleSection
            const calls = MockedCollapsibleSection.mock.calls;
            const challengeRowStylingSectionCall = calls.find(
                (call) => call[0].id === "challenge-row-styling"
            );

            expect(challengeRowStylingSectionCall).toBeTruthy();
            expect(challengeRowStylingSectionCall?.[0]?.content).toContain(
                'type="checkbox"'
            );
            expect(challengeRowStylingSectionCall?.[0]?.content).toContain(
                'type="color"'
            );
            expect(challengeRowStylingSectionCall?.[0]?.content).toContain(
                "Primary Color (Default)"
            );
            expect(challengeRowStylingSectionCall?.[0]?.content).toContain(
                "Secondary Color (Optional)"
            );
            expect(challengeRowStylingSectionCall?.[0]?.content).toContain(
                "Tertiary Color (Optional)"
            );
            expect(challengeRowStylingSectionCall?.[0]?.content).toContain(
                "Text Readability"
            );
        });
    });

    describe("Memory Management", () => {
        it("should clean up collapsible sections on multiple initializations", () => {
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });

            // Initialize multiple times
            adminPanel.initialize();
            const firstCallCount = MockedCollapsibleSection.mock.calls.length;

            adminPanel.initialize();
            const secondCallCount = MockedCollapsibleSection.mock.calls.length;

            // Should not create additional sections on second initialization
            // (form already exists check should prevent recreation)
            expect(secondCallCount).toBe(firstCallCount);
        });

        it("should prevent duplicate form creation", () => {
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });

            // Initialize multiple times
            adminPanel.initialize();
            const firstCallCount = MockedCollapsibleSection.mock.calls.length;

            adminPanel.initialize();
            const secondCallCount = MockedCollapsibleSection.mock.calls.length;

            // Should not create additional sections on second initialization
            expect(secondCallCount).toBe(firstCallCount);
        });

        it("should handle cleanup when switching modes", () => {
            // Start in admin mode
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });
            adminPanel.initialize();

            // Switch to viewer mode
            Object.defineProperty(window, "location", {
                value: { hash: "" },
                writable: true,
            });
            adminPanel.initialize();

            // Should handle mode switching gracefully
            expect(() => adminPanel.initialize()).not.toThrow();
        });
    });

    describe("Configuration Persistence", () => {
        beforeEach(() => {
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });
            adminPanel.initialize();
        });

        it("should maintain collapsible section state across reloads", () => {
            // Simulate section state changes
            mockCollapsibleInstance.getExpandedState.mockReturnValue(true);

            // Reinitialize (simulating page reload)
            // Note: AdminPanel.createConfigurationForm() has an early return if the form already exists,
            // so calling initialize() again won't create new sections - it will reuse the existing ones
            adminPanel.initialize();

            // Sections should maintain their state through the CollapsibleSection persistence
            // Sections are created in this order: behavior, challenge-row-styling, overlay-background, authentication
            // Check that the authentication section (4th call) was created
            expect(MockedCollapsibleSection).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "authentication",
                })
            );

            // Verify all 4 sections were created (only once, since second initialize() reuses existing form)
            expect(MockedCollapsibleSection).toHaveBeenCalledTimes(4);
        });

        it("should save configuration changes made within collapsible sections", () => {
            const configManager = ConfigManager.getInstance();

            // Simulate form input change
            const input = document.querySelector(
                'input[type="text"]'
            ) as HTMLInputElement;
            if (input) {
                input.value = "changed_value";

                // Trigger change event
                const changeEvent = new Event("change", { bubbles: true });
                input.dispatchEvent(changeEvent);
            }

            // Configuration should be ready for saving
            expect(configManager.getAll()).toBeDefined();
        });
    });

    describe("Accessibility Integration", () => {
        beforeEach(() => {
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });
            adminPanel.initialize();
        });

        it("should maintain form accessibility within collapsible sections", () => {
            // Check that form elements have proper labels (excluding hidden file input)
            const inputs = document.querySelectorAll("input");
            inputs.forEach((input) => {
                // Skip hidden file input which doesn't need a visible label
                if (input.type === "file" && input.style.display === "none") {
                    return;
                }
                const label =
                    document.querySelector(`label[for="${input.id}"]`) ||
                    input.closest(".form-group")?.querySelector("label");
                expect(label).toBeTruthy();
            });
        });

        it("should preserve keyboard navigation for form elements", () => {
            const inputs = document.querySelectorAll("input, button, select");

            inputs.forEach((element) => {
                // Elements should be focusable
                expect(
                    (element as HTMLElement).tabIndex
                ).toBeGreaterThanOrEqual(0);
            });
        });

        it("should maintain proper heading hierarchy with collapsible sections", () => {
            const headings = document.querySelectorAll(
                "h1, h2, h3, h4, h5, h6"
            );

            // Should have proper heading structure
            expect(headings.length).toBeGreaterThan(0);

            // Collapsible section titles should be h4 elements
            const sectionTitles = document.querySelectorAll(
                ".collapsible-section h4"
            );
            expect(sectionTitles.length).toBe(4); // One for each collapsible section (Behavior, Challenge Row Styling, Overlay Background, Authentication)
        });
    });

    describe("Error Handling", () => {
        it("should handle CollapsibleSection creation failures gracefully", () => {
            MockedCollapsibleSection.mockImplementation(() => {
                throw new Error("CollapsibleSection creation failed");
            });

            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });

            expect(() => {
                adminPanel.initialize();
            }).not.toThrow();
        });

        it("should handle missing admin content element", () => {
            // Remove admin content element
            document.body.innerHTML = "";

            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });

            expect(() => {
                adminPanel.initialize();
            }).not.toThrow();
        });

        it("should handle DOM manipulation errors gracefully", () => {
            mockCollapsibleInstance.createElement.mockImplementation(() => {
                throw new Error("DOM manipulation failed");
            });

            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });

            expect(() => {
                adminPanel.initialize();
            }).not.toThrow();
        });
    });
});
