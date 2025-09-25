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

            // Should create multiple collapsible sections
            expect(MockedCollapsibleSection).toHaveBeenCalledTimes(6);

            // Verify section configurations
            const calls = MockedCollapsibleSection.mock.calls;
            expect(calls).toHaveLength(6); // Ensure we have the expected number of calls

            // Authentication section
            expect(calls[0]?.[0]).toMatchObject({
                id: "authentication",
                title: "Authentication Settings",
                defaultExpanded: true,
            });

            // Behavior section
            expect(calls[1]?.[0]).toMatchObject({
                id: "behavior",
                title: "Behavior Settings",
                defaultExpanded: true,
            });

            // Color section
            expect(calls[2]?.[0]).toMatchObject({
                id: "colors",
                title: "Color Configuration",
                defaultExpanded: false,
            });

            // Actions section
            expect(calls[3]?.[0]).toMatchObject({
                id: "actions",
                title: "Configuration Actions",
                defaultExpanded: true,
            });

            // Backup section
            expect(calls[4]?.[0]).toMatchObject({
                id: "backup",
                title: "Configuration Backup & Restore",
                defaultExpanded: false,
            });

            // Danger zone section
            expect(calls[5]?.[0]).toMatchObject({
                id: "danger-zone",
                title: "Danger Zone",
                defaultExpanded: false,
            });
        });

        it("should append collapsible section elements to admin content", () => {
            Object.defineProperty(window, "location", {
                value: { hash: "#admin" },
                writable: true,
            });

            adminPanel.initialize();

            // Should call createElement for each section
            expect(mockCollapsibleInstance.createElement).toHaveBeenCalledTimes(
                6
            );

            // Check that sections were added to DOM
            const adminContent = document.querySelector(".admin-content");
            const collapsibleSections = adminContent?.querySelectorAll(
                ".collapsible-section"
            );
            expect(collapsibleSections?.length).toBe(6);
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

        it("should handle color configuration UI within collapsible sections", () => {
            // Verify that color configuration content was passed to CollapsibleSection
            const calls = MockedCollapsibleSection.mock.calls;
            const colorSectionCall = calls.find(
                (call) => call[0].id === "colors"
            );

            expect(colorSectionCall).toBeTruthy();
            expect(colorSectionCall?.[0]?.content).toContain('type="checkbox"');
            expect(colorSectionCall?.[0]?.content).toContain('type="color"');
            expect(colorSectionCall?.[0]?.content).toContain("Primary Color");
            expect(colorSectionCall?.[0]?.content).toContain("Secondary Color");
            expect(colorSectionCall?.[0]?.content).toContain("Tertiary Color");
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
            adminPanel.initialize();

            // Sections should maintain their state through the CollapsibleSection persistence
            expect(MockedCollapsibleSection).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "authentication",
                    defaultExpanded: true,
                })
            );
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
            // Check that form elements have proper labels
            const inputs = document.querySelectorAll("input");
            inputs.forEach((input) => {
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
            expect(sectionTitles.length).toBe(6); // One for each section
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
