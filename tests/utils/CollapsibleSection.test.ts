import { beforeEach, describe, expect, it, vi } from "vitest";
import CollapsibleSection from "../../src/utils/CollapsibleSection";
import { StorageManager } from "../../src/utils/StorageManager";

// Mock StorageManager for controlled testing
vi.mock("../../src/utils/StorageManager", () => ({
    StorageManager: {
        save: vi.fn(),
        load: vi.fn(),
    },
}));

const mockStorageManager = vi.mocked(StorageManager);

describe("CollapsibleSection", () => {
    let testConfig: {
        id: string;
        title: string;
        content: string;
        defaultExpanded?: boolean;
        storageKey?: string;
    };

    beforeEach(() => {
        // Clear all instances before each test
        CollapsibleSection.clearAllInstances();

        // Reset DOM
        document.body.innerHTML = "";

        // Reset mocks
        vi.clearAllMocks();

        // Setup default test configuration
        testConfig = {
            id: "test-section",
            title: "Test Section",
            content: "<p>Test content</p>",
            defaultExpanded: false,
        };

        // Mock StorageManager.load to return default values
        mockStorageManager.load.mockReturnValue({
            success: true,
            data: testConfig.defaultExpanded,
        });
    });

    describe("Constructor and Initialization", () => {
        it("should create a CollapsibleSection with default configuration", () => {
            const section = new CollapsibleSection(testConfig);

            expect(section.getExpandedState()).toBe(false);
            expect(CollapsibleSection.getInstance("test-section")).toBe(
                section
            );
        });

        it("should use custom storage key when provided", () => {
            const customConfig = {
                ...testConfig,
                storageKey: "custom-storage-key",
            };

            new CollapsibleSection(customConfig);

            expect(mockStorageManager.load).toHaveBeenCalledWith(
                "custom-storage-key",
                false
            );
        });

        it("should generate default storage key when not provided", () => {
            new CollapsibleSection(testConfig);

            expect(mockStorageManager.load).toHaveBeenCalledWith(
                "collapsible-section-test-section",
                false
            );
        });

        it("should load saved expanded state from storage", () => {
            mockStorageManager.load.mockReturnValue({
                success: true,
                data: true,
            });

            const section = new CollapsibleSection(testConfig);

            expect(section.getExpandedState()).toBe(true);
        });

        it("should use default expanded state when storage fails", () => {
            mockStorageManager.load.mockReturnValue({
                success: false,
                data: null,
            });

            const section = new CollapsibleSection({
                ...testConfig,
                defaultExpanded: true,
            });

            expect(section.getExpandedState()).toBe(true);
        });
    });

    describe("DOM Element Creation", () => {
        it("should create proper HTML structure", () => {
            const section = new CollapsibleSection(testConfig);
            const element = section.createElement();

            expect(element.tagName).toBe("DIV");
            expect(element.className).toBe("collapsible-section");
            expect(element.id).toBe("collapsible-test-section");

            // Check header structure
            const header = element.querySelector(".collapsible-header");
            expect(header).toBeTruthy();
            expect(header?.getAttribute("role")).toBe("button");
            expect(header?.getAttribute("tabindex")).toBe("0");
            expect(header?.getAttribute("aria-expanded")).toBe("false");
            expect(header?.getAttribute("aria-controls")).toBe(
                "collapsible-content-test-section"
            );
            expect(header?.getAttribute("aria-label")).toBe(
                "Toggle Test Section section"
            );

            // Check title structure
            const title = header?.querySelector(".collapsible-title");
            expect(title?.tagName).toBe("H4");
            expect(title?.textContent).toBe("Test Section");

            // Check icon structure
            const icon = header?.querySelector(".collapsible-icon");
            expect(icon?.getAttribute("aria-hidden")).toBe("true");

            // Check content structure
            const content = element.querySelector(".collapsible-content");
            expect(content?.id).toBe("collapsible-content-test-section");
            expect(content?.getAttribute("aria-hidden")).toBe("true");
            expect(content?.innerHTML).toBe("<p>Test content</p>");
        });

        it("should apply expanded class when defaultExpanded is true", () => {
            // Set up mock before creating section
            mockStorageManager.load.mockReturnValue({
                success: true,
                data: true,
            });

            const section = new CollapsibleSection({
                ...testConfig,
                defaultExpanded: true,
            });

            const element = section.createElement();

            expect(element.className).toBe("collapsible-section expanded");
            expect(
                element
                    .querySelector(".collapsible-header")
                    ?.getAttribute("aria-expanded")
            ).toBe("true");
            expect(
                element
                    .querySelector(".collapsible-content")
                    ?.getAttribute("aria-hidden")
            ).toBe("false");
        });
    });

    describe("Toggle Functionality", () => {
        let section: CollapsibleSection;
        let element: HTMLElement;
        let header: HTMLElement;

        beforeEach(() => {
            section = new CollapsibleSection(testConfig);
            element = section.createElement();
            header = element.querySelector(
                ".collapsible-header"
            ) as HTMLElement;
            document.body.appendChild(element);
        });

        it("should toggle expanded state when clicked", () => {
            expect(section.getExpandedState()).toBe(false);

            header.click();

            expect(section.getExpandedState()).toBe(true);
            expect(element.classList.contains("expanded")).toBe(true);
            expect(header.getAttribute("aria-expanded")).toBe("true");
            expect(
                element
                    .querySelector(".collapsible-content")
                    ?.getAttribute("aria-hidden")
            ).toBe("false");
        });

        it("should toggle expanded state when Enter key is pressed", () => {
            expect(section.getExpandedState()).toBe(false);

            const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
            header.dispatchEvent(enterEvent);

            expect(section.getExpandedState()).toBe(true);
        });

        it("should toggle expanded state when Space key is pressed", () => {
            expect(section.getExpandedState()).toBe(false);

            const spaceEvent = new KeyboardEvent("keydown", { key: " " });
            header.dispatchEvent(spaceEvent);

            expect(section.getExpandedState()).toBe(true);
        });

        it("should not toggle on other key presses", () => {
            expect(section.getExpandedState()).toBe(false);

            const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
            header.dispatchEvent(tabEvent);

            expect(section.getExpandedState()).toBe(false);
        });

        it("should save state to storage when toggled", () => {
            header.click();

            expect(mockStorageManager.save).toHaveBeenCalledWith(
                "collapsible-section-test-section",
                true
            );
        });
    });

    describe("Expand and Collapse Methods", () => {
        let section: CollapsibleSection;
        let element: HTMLElement;

        beforeEach(() => {
            section = new CollapsibleSection(testConfig);
            element = section.createElement();
            document.body.appendChild(element);
        });

        it("should expand when expand() is called", () => {
            expect(section.getExpandedState()).toBe(false);

            section.expand();

            expect(section.getExpandedState()).toBe(true);
            expect(element.classList.contains("expanded")).toBe(true);
            expect(mockStorageManager.save).toHaveBeenCalledWith(
                "collapsible-section-test-section",
                true
            );
        });

        it("should not trigger save when already expanded", () => {
            section.expand();
            vi.clearAllMocks();

            section.expand();

            expect(mockStorageManager.save).not.toHaveBeenCalled();
        });

        it("should collapse when collapse() is called", () => {
            section.expand();
            expect(section.getExpandedState()).toBe(true);

            section.collapse();

            expect(section.getExpandedState()).toBe(false);
            expect(element.classList.contains("expanded")).toBe(false);
        });

        it("should not trigger save when already collapsed", () => {
            expect(section.getExpandedState()).toBe(false);

            section.collapse();

            expect(mockStorageManager.save).not.toHaveBeenCalled();
        });
    });

    describe("Content Management", () => {
        it("should update content when updateContent() is called", () => {
            const section = new CollapsibleSection(testConfig);
            const element = section.createElement();

            const newContent = "<div>Updated content</div>";
            section.updateContent(newContent);

            const contentElement = element.querySelector(
                ".collapsible-content"
            );
            expect(contentElement?.innerHTML).toBe(newContent);
        });

        it("should handle updateContent() when element not created", () => {
            const section = new CollapsibleSection(testConfig);

            // Should not throw error
            expect(() => {
                section.updateContent("<div>New content</div>");
            }).not.toThrow();
        });
    });

    describe("Static Methods", () => {
        it("should create section using static create method", () => {
            const element = CollapsibleSection.create(testConfig);

            expect(element.tagName).toBe("DIV");
            expect(element.className).toBe("collapsible-section");
            expect(CollapsibleSection.getInstance("test-section")).toBeTruthy();
        });

        it("should retrieve instance by ID", () => {
            const section = new CollapsibleSection(testConfig);

            expect(CollapsibleSection.getInstance("test-section")).toBe(
                section
            );
            expect(CollapsibleSection.getInstance("non-existent")).toBeNull();
        });

        it("should remove instance by ID", () => {
            new CollapsibleSection(testConfig);

            expect(CollapsibleSection.getInstance("test-section")).toBeTruthy();

            CollapsibleSection.removeInstance("test-section");

            expect(CollapsibleSection.getInstance("test-section")).toBeNull();
        });

        it("should clear all instances", () => {
            new CollapsibleSection(testConfig);
            new CollapsibleSection({
                ...testConfig,
                id: "another-section",
            });

            expect(CollapsibleSection.getInstance("test-section")).toBeTruthy();
            expect(
                CollapsibleSection.getInstance("another-section")
            ).toBeTruthy();

            CollapsibleSection.clearAllInstances();

            expect(CollapsibleSection.getInstance("test-section")).toBeNull();
            expect(
                CollapsibleSection.getInstance("another-section")
            ).toBeNull();
        });
    });

    describe("State Persistence", () => {
        it("should persist expanded state across instances", () => {
            // Create first instance and expand it
            const section1 = new CollapsibleSection(testConfig);
            const element1 = section1.createElement();
            document.body.appendChild(element1);

            section1.expand();

            expect(mockStorageManager.save).toHaveBeenCalledWith(
                "collapsible-section-test-section",
                true
            );

            // Simulate page refresh by creating new instance
            CollapsibleSection.clearAllInstances();
            mockStorageManager.load.mockReturnValue({
                success: true,
                data: true,
            });

            const section2 = new CollapsibleSection(testConfig);

            expect(section2.getExpandedState()).toBe(true);
        });

        it("should handle localStorage errors gracefully", () => {
            mockStorageManager.load.mockReturnValue({
                success: false,
                data: null,
            });

            const section = new CollapsibleSection({
                ...testConfig,
                defaultExpanded: true,
            });

            expect(section.getExpandedState()).toBe(true);
        });

        it("should use different storage keys for different sections", () => {
            const section1 = new CollapsibleSection({
                ...testConfig,
                id: "section-1",
            });

            const section2 = new CollapsibleSection({
                ...testConfig,
                id: "section-2",
            });

            // Verify that each section uses its own storage key
            expect(mockStorageManager.load).toHaveBeenCalledWith(
                "collapsible-section-section-1",
                false
            );
            expect(mockStorageManager.load).toHaveBeenCalledWith(
                "collapsible-section-section-2",
                false
            );

            // Verify sections are properly initialized
            expect(section1).toBeDefined();
            expect(section2).toBeDefined();
        });

        it("should save state when toggling multiple times", () => {
            const section = new CollapsibleSection(testConfig);
            const element = section.createElement();
            const header = element.querySelector(
                ".collapsible-header"
            ) as HTMLElement;
            document.body.appendChild(element);

            // Toggle multiple times
            header.click(); // expand
            header.click(); // collapse
            header.click(); // expand again

            expect(mockStorageManager.save).toHaveBeenCalledTimes(3);
            expect(mockStorageManager.save).toHaveBeenNthCalledWith(
                1,
                "collapsible-section-test-section",
                true
            );
            expect(mockStorageManager.save).toHaveBeenNthCalledWith(
                2,
                "collapsible-section-test-section",
                false
            );
            expect(mockStorageManager.save).toHaveBeenNthCalledWith(
                3,
                "collapsible-section-test-section",
                true
            );
        });
    });

    describe("Accessibility Features", () => {
        let section: CollapsibleSection;
        let element: HTMLElement;
        let header: HTMLElement;
        let content: HTMLElement;

        beforeEach(() => {
            section = new CollapsibleSection(testConfig);
            element = section.createElement();
            header = element.querySelector(
                ".collapsible-header"
            ) as HTMLElement;
            content = element.querySelector(
                ".collapsible-content"
            ) as HTMLElement;
            document.body.appendChild(element);
        });

        it("should have proper ARIA attributes when collapsed", () => {
            expect(header.getAttribute("role")).toBe("button");
            expect(header.getAttribute("tabindex")).toBe("0");
            expect(header.getAttribute("aria-expanded")).toBe("false");
            expect(header.getAttribute("aria-controls")).toBe(
                "collapsible-content-test-section"
            );
            expect(header.getAttribute("aria-label")).toBe(
                "Toggle Test Section section"
            );
            expect(content.getAttribute("aria-hidden")).toBe("true");
        });

        it("should update ARIA attributes when expanded", () => {
            section.expand();

            expect(header.getAttribute("aria-expanded")).toBe("true");
            expect(content.getAttribute("aria-hidden")).toBe("false");
        });

        it("should be keyboard accessible", () => {
            // Test Enter key
            const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
            header.dispatchEvent(enterEvent);
            expect(section.getExpandedState()).toBe(true);

            // Test Space key
            const spaceEvent = new KeyboardEvent("keydown", { key: " " });
            header.dispatchEvent(spaceEvent);
            expect(section.getExpandedState()).toBe(false);
        });

        it("should have proper focus management", () => {
            header.focus();
            expect(document.activeElement).toBe(header);

            // Should maintain focus after toggle
            header.click();
            expect(document.activeElement).toBe(header);
        });

        it("should have aria-hidden on icon", () => {
            const icon = header.querySelector(".collapsible-icon");
            expect(icon?.getAttribute("aria-hidden")).toBe("true");
        });
    });

    describe("Memory Leak Prevention", () => {
        it("should properly clean up instances", () => {
            const section1 = new CollapsibleSection({
                ...testConfig,
                id: "cleanup-test-1",
            });

            const section2 = new CollapsibleSection({
                ...testConfig,
                id: "cleanup-test-2",
            });

            expect(CollapsibleSection.getInstance("cleanup-test-1")).toBe(
                section1
            );
            expect(CollapsibleSection.getInstance("cleanup-test-2")).toBe(
                section2
            );

            CollapsibleSection.clearAllInstances();

            expect(CollapsibleSection.getInstance("cleanup-test-1")).toBeNull();
            expect(CollapsibleSection.getInstance("cleanup-test-2")).toBeNull();
        });

        it("should handle multiple createElement calls without memory leaks", () => {
            const section = new CollapsibleSection(testConfig);

            // Create element multiple times (simulating re-initialization)
            const element1 = section.createElement();
            const element2 = section.createElement();
            const element3 = section.createElement();

            // All should be valid elements
            expect(element1.tagName).toBe("DIV");
            expect(element2.tagName).toBe("DIV");
            expect(element3.tagName).toBe("DIV");

            // Should maintain functionality
            const header = element3.querySelector(
                ".collapsible-header"
            ) as HTMLElement;
            header.click();
            expect(section.getExpandedState()).toBe(true);
        });

        it("should not accumulate event listeners on multiple createElement calls", () => {
            const section = new CollapsibleSection(testConfig);

            // Create element multiple times
            section.createElement();
            section.createElement();
            const finalElement = section.createElement();

            document.body.appendChild(finalElement);

            const header = finalElement.querySelector(
                ".collapsible-header"
            ) as HTMLElement;

            // Click should only toggle once, not multiple times
            header.click();
            expect(section.getExpandedState()).toBe(true);

            header.click();
            expect(section.getExpandedState()).toBe(false);
        });
    });

    describe("Error Handling", () => {
        it("should handle missing DOM elements gracefully", () => {
            const section = new CollapsibleSection(testConfig);

            // Call methods before createElement
            expect(() => {
                section.toggle();
                section.expand();
                section.collapse();
                section.updateContent("new content");
            }).not.toThrow();
        });

        it("should handle invalid storage data gracefully", () => {
            mockStorageManager.load.mockReturnValue({
                success: true,
                data: "invalid-boolean-value" as any,
            });

            const section = new CollapsibleSection({
                ...testConfig,
                defaultExpanded: true,
            });

            // Should fall back to default value when data is not a boolean
            expect(section.getExpandedState()).toBe(true);
        });

        it("should handle storage save failures gracefully", () => {
            const section = new CollapsibleSection(testConfig);
            const element = section.createElement();
            document.body.appendChild(element);

            // Mock save to throw error after section is created
            mockStorageManager.save.mockImplementation(() => {
                throw new Error("Storage failed");
            });

            // Should not throw error when storage fails during toggle
            expect(() => {
                section.toggle();
            }).not.toThrow();

            // Should still update the internal state even if save fails
            expect(section.getExpandedState()).toBe(true);
        });
    });
});
