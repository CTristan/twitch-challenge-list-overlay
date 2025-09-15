import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupDualWindow } from "../src/dualWindow";

describe("dualWindow", () => {
  let mockAdminPanel: HTMLElement;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = "";
    
    // Create mock admin panel element
    mockAdminPanel = document.createElement("div");
    mockAdminPanel.id = "admin-panel";
    mockAdminPanel.classList.add("hidden"); // Start hidden by default
    document.body.appendChild(mockAdminPanel);

    // Mock console.error
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset window location hash
    window.location.hash = "";

    // Reset document ready state
    Object.defineProperty(document, "readyState", {
      writable: true,
      value: "loading",
    });

    // Clear any existing event listeners
    vi.clearAllMocks();
  });

  describe("setupDualWindow", () => {
    it("should add DOMContentLoaded event listener when DOM is loading", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      setupDualWindow();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "DOMContentLoaded",
        expect.any(Function)
      );
    });

    it("should add hashchange event listener", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      setupDualWindow();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "hashchange",
        expect.any(Function)
      );
    });

    it("should initialize immediately when DOM is already loaded (complete)", () => {
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      // Admin panel should remain hidden in default mode
      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
    });

    it("should initialize immediately when DOM is interactive", () => {
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "interactive",
      });

      setupDualWindow();

      // Admin panel should remain hidden in default mode
      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
    });

    it("should not initialize immediately when DOM is still loading", () => {
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "loading",
      });

      // Start with admin panel visible to test it doesn't get modified
      mockAdminPanel.classList.remove("hidden");

      setupDualWindow();

      // Admin panel should remain visible since initialization didn't run
      expect(mockAdminPanel.classList.contains("hidden")).toBe(false);
    });
  });

  describe("initializeDualWindow (via setupDualWindow)", () => {
    it("should hide admin panel in default viewer mode", () => {
      window.location.hash = "";
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
    });

    it("should show admin panel when hash is #admin", () => {
      window.location.hash = "#admin";
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      expect(mockAdminPanel.classList.contains("hidden")).toBe(false);
    });

    it("should hide admin panel for any other hash", () => {
      window.location.hash = "#other";
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
    });

    it("should log error and return early when admin panel element is not found", () => {
      // Remove admin panel from DOM
      document.body.removeChild(mockAdminPanel);
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      expect(mockConsoleError).toHaveBeenCalledWith("Admin panel element not found");
    });
  });

  describe("hashchange event handling", () => {
    it("should toggle admin panel visibility when hash changes to #admin", () => {
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      // Initially hidden
      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);

      // Change hash to #admin
      window.location.hash = "#admin";
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      expect(mockAdminPanel.classList.contains("hidden")).toBe(false);
    });

    it("should hide admin panel when hash changes from #admin to empty", () => {
      window.location.hash = "#admin";
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      // Initially shown
      expect(mockAdminPanel.classList.contains("hidden")).toBe(false);

      // Change hash to empty
      window.location.hash = "";
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
    });

    it("should hide admin panel when hash changes from #admin to other value", () => {
      window.location.hash = "#admin";
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      // Initially shown
      expect(mockAdminPanel.classList.contains("hidden")).toBe(false);

      // Change hash to something else
      window.location.hash = "#viewer";
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
    });
  });

  describe("DOMContentLoaded event handling", () => {
    it("should initialize dual window when DOMContentLoaded is fired", () => {
      window.location.hash = "#admin";
      
      setupDualWindow();
      
      // Admin panel should still be hidden initially since DOM is loading
      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
      
      // Fire DOMContentLoaded event
      document.dispatchEvent(new Event("DOMContentLoaded"));
      
      // Now admin panel should be shown
      expect(mockAdminPanel.classList.contains("hidden")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle case-sensitive hash comparison", () => {
      window.location.hash = "#ADMIN";
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      // Should remain hidden since hash is case-sensitive
      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
    });

    it("should handle hash with additional parameters", () => {
      window.location.hash = "#admin?param=value";
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      // Should remain hidden since exact match is required
      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
    });

    it("should handle multiple class toggles correctly", () => {
      // Start with admin panel having multiple classes
      mockAdminPanel.classList.add("some-other-class");

      window.location.hash = "#admin";
      Object.defineProperty(document, "readyState", {
        writable: true,
        value: "complete",
      });

      setupDualWindow();

      expect(mockAdminPanel.classList.contains("hidden")).toBe(false);
      expect(mockAdminPanel.classList.contains("some-other-class")).toBe(true);

      // Change back to viewer mode
      window.location.hash = "";
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      expect(mockAdminPanel.classList.contains("hidden")).toBe(true);
      expect(mockAdminPanel.classList.contains("some-other-class")).toBe(true);
    });
  });
});
