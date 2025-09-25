import { StorageManager } from "./StorageManager";

/**
 * @interface CollapsibleSectionConfig
 * Configuration options for collapsible sections
 */
interface CollapsibleSectionConfig {
    id: string;
    title: string;
    content: string;
    defaultExpanded?: boolean;
    storageKey?: string;
}

/**
 * @class CollapsibleSection
 * Utility class for creating and managing collapsible sections with localStorage persistence
 * and accessibility features.
 */
export default class CollapsibleSection {
    private static readonly STORAGE_PREFIX = "collapsible-section-";
    private static instances: Map<string, CollapsibleSection> = new Map();

    private id: string;
    private title: string;
    private content: string;
    private defaultExpanded: boolean;
    private storageKey: string;
    private element: HTMLElement | null = null;
    private headerElement: HTMLElement | null = null;
    private contentElement: HTMLElement | null = null;
    private isExpanded: boolean = false;

    /**
     * @constructor
     * @param config - Configuration for the collapsible section
     */
    constructor(config: CollapsibleSectionConfig) {
        this.id = config.id;
        this.title = config.title;
        this.content = config.content;
        this.defaultExpanded = config.defaultExpanded ?? false;
        this.storageKey =
            config.storageKey ??
            `${CollapsibleSection.STORAGE_PREFIX}${this.id}`;

        // Load saved state or use default
        this.isExpanded = this.loadExpandedState();

        // Register this instance
        CollapsibleSection.instances.set(this.id, this);
    }

    /**
     * Create the HTML element for the collapsible section
     * @returns The created HTML element
     */
    createElement(): HTMLElement {
        const section = document.createElement("div");
        section.className = this.isExpanded
            ? "collapsible-section expanded"
            : "collapsible-section";
        section.id = `collapsible-${this.id}`;

        // Create header
        const header = document.createElement("div");
        header.className = "collapsible-header";
        header.setAttribute("role", "button");
        header.setAttribute("tabindex", "0");
        header.setAttribute("aria-expanded", this.isExpanded.toString());
        header.setAttribute("aria-controls", `collapsible-content-${this.id}`);
        header.setAttribute("aria-label", `Toggle ${this.title} section`);

        const title = document.createElement("h4");
        title.className = "collapsible-title";
        title.textContent = this.title;

        const icon = document.createElement("span");
        icon.className = "collapsible-icon";
        icon.setAttribute("aria-hidden", "true");

        header.appendChild(title);
        header.appendChild(icon);

        // Create content container
        const contentContainer = document.createElement("div");
        contentContainer.className = "collapsible-content";
        contentContainer.id = `collapsible-content-${this.id}`;
        contentContainer.setAttribute(
            "aria-hidden",
            (!this.isExpanded).toString()
        );
        contentContainer.innerHTML = this.content;

        section.appendChild(header);
        section.appendChild(contentContainer);

        // Store references
        this.element = section;
        this.headerElement = header;
        this.contentElement = contentContainer;

        // Add event listeners
        this.attachEventListeners();

        return section;
    }

    /**
     * Attach event listeners for expand/collapse functionality
     */
    private attachEventListeners(): void {
        if (!this.headerElement) return;

        // Click handler
        const clickHandler = (event: Event) => {
            event.preventDefault();
            this.toggle();
        };

        // Keyboard handler
        const keyHandler = (event: KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.toggle();
            }
        };

        this.headerElement.addEventListener("click", clickHandler);
        this.headerElement.addEventListener("keydown", keyHandler);
    }

    /**
     * Toggle the expanded state of the section
     */
    toggle(): void {
        this.isExpanded = !this.isExpanded;
        this.updateUI();
        this.saveExpandedState();
    }

    /**
     * Expand the section
     */
    expand(): void {
        if (!this.isExpanded) {
            this.isExpanded = true;
            this.updateUI();
            this.saveExpandedState();
        }
    }

    /**
     * Collapse the section
     */
    collapse(): void {
        if (this.isExpanded) {
            this.isExpanded = false;
            this.updateUI();
            this.saveExpandedState();
        }
    }

    /**
     * Update the UI to reflect the current expanded state
     */
    private updateUI(): void {
        if (!this.element || !this.headerElement || !this.contentElement)
            return;

        // Update classes
        if (this.isExpanded) {
            this.element.classList.add("expanded");
        } else {
            this.element.classList.remove("expanded");
        }

        // Update ARIA attributes
        this.headerElement.setAttribute(
            "aria-expanded",
            this.isExpanded.toString()
        );
        this.contentElement.setAttribute(
            "aria-hidden",
            (!this.isExpanded).toString()
        );
    }

    /**
     * Load the expanded state from localStorage
     * @returns The saved expanded state or default value
     */
    private loadExpandedState(): boolean {
        try {
            const result = StorageManager.load<boolean>(
                this.storageKey,
                this.defaultExpanded
            );
            if (result.success && typeof result.data === "boolean") {
                return result.data;
            }
        } catch (error) {
            console.warn(
                `[CollapsibleSection] Failed to load state for ${this.id}:`,
                error
            );
        }
        return this.defaultExpanded;
    }

    /**
     * Save the current expanded state to localStorage
     */
    private saveExpandedState(): void {
        try {
            StorageManager.save(this.storageKey, this.isExpanded);
        } catch (error) {
            console.warn(
                `[CollapsibleSection] Failed to save state for ${this.id}:`,
                error
            );
        }
    }

    /**
     * Update the content of the section
     * @param newContent - The new HTML content
     */
    updateContent(newContent: string): void {
        this.content = newContent;
        if (this.contentElement) {
            this.contentElement.innerHTML = newContent;
        }
    }

    /**
     * Get the current expanded state
     * @returns Whether the section is currently expanded
     */
    getExpandedState(): boolean {
        return this.isExpanded;
    }

    /**
     * Get a collapsible section instance by ID
     * @param id - The section ID
     * @returns The section instance or null if not found
     */
    static getInstance(id: string): CollapsibleSection | null {
        return CollapsibleSection.instances.get(id) ?? null;
    }

    /**
     * Remove a collapsible section instance
     * @param id - The section ID to remove
     */
    static removeInstance(id: string): void {
        CollapsibleSection.instances.delete(id);
    }

    /**
     * Clear all instances (useful for cleanup)
     */
    static clearAllInstances(): void {
        CollapsibleSection.instances.clear();
    }

    /**
     * Create a collapsible section with the given configuration
     * @param config - Section configuration
     * @returns The created HTML element
     */
    static create(config: CollapsibleSectionConfig): HTMLElement {
        const section = new CollapsibleSection(config);
        return section.createElement();
    }
}
