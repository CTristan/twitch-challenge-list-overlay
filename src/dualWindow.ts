/**
 * Dual-Mode Architecture Module
 *
 * Handles the URL fragment-based routing system for the overlay application.
 * Provides two modes:
 * - Default mode: Read-only viewer display for on-stream use (single challenge panel)
 * - Admin mode (#admin): Interactive admin dock for the host (single challenge panel + admin panel)
 *
 * @module dualWindow
 */

/**
 * Initialize the dual-mode architecture based on URL fragment
 * @returns {void}
 */
function initializeDualWindow(): void {
    const adminPanel = document.getElementById("admin-panel");
    const isAdminMode = window.location.hash === "#admin";

    // If we don't have an admin panel to hide then something else is wrong
    if (!adminPanel) {
        console.error("Admin panel element not found");
        return;
    }

    if (isAdminMode) {
        // Show admin panel when #admin fragment is present
        adminPanel.classList.remove("hidden");
    } else {
        // Hide admin panel for default viewer mode
        adminPanel.classList.add("hidden");
    }
}

/**
 * Handle hash change events for dynamic switching
 * @returns {void}
 */
function handleHashChange(): void {
    initializeDualWindow();
}

/**
 * Set up the dual-mode architecture system
 * Initializes event listeners and performs initial setup
 * @returns {void}
 */
export function setupDualWindow(): void {
    // Initialize on page load
    document.addEventListener("DOMContentLoaded", initializeDualWindow);

    // Handle hash changes for dynamic switching
    window.addEventListener("hashchange", handleHashChange);

    // Initialize immediately if DOM is already loaded
    if (document.readyState === "loading") {
        // DOM is still loading, wait for DOMContentLoaded
    } else {
        // DOM is already loaded
        initializeDualWindow();
    }
}
