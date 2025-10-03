import { beforeEach, describe, expect, it, vi } from "vitest";
import { closeModal, openModal } from "../src/modal";

describe("modal.ts", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Clear DOM before each test
        document.body.innerHTML = "";

        // Set up console error spy
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
    });

    describe("openModal", () => {
        it("should remove 'hidden' class and add 'flex' class when modal element exists", () => {
            // Set up DOM with modal element
            document.body.innerHTML = `
                <div id="modal" class="hidden"></div>
            `;

            const modal = document.getElementById("modal");
            expect(modal?.classList.contains("hidden")).toBe(true);
            expect(modal?.classList.contains("flex")).toBe(false);

            // Execute function
            openModal();

            // Verify class changes
            expect(modal?.classList.contains("hidden")).toBe(false);
            expect(modal?.classList.contains("flex")).toBe(true);
        });

        it("should handle case when modal element does not exist", () => {
            // No modal element in DOM
            document.body.innerHTML = `<div></div>`;

            // Execute function - should not throw error
            expect(() => openModal()).not.toThrow();

            // Verify no errors were logged (function handles gracefully)
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it("should work correctly when modal already has 'flex' class", () => {
            // Set up DOM with modal that already has flex class
            document.body.innerHTML = `
                <div id="modal" class="hidden flex"></div>
            `;

            const modal = document.getElementById("modal");
            expect(modal?.classList.contains("hidden")).toBe(true);
            expect(modal?.classList.contains("flex")).toBe(true);

            // Execute function
            openModal();

            // Verify class changes - hidden removed, flex remains
            expect(modal?.classList.contains("hidden")).toBe(false);
            expect(modal?.classList.contains("flex")).toBe(true);
        });

        it("should work correctly when modal has no classes initially", () => {
            // Set up DOM with modal that has no classes
            document.body.innerHTML = `
                <div id="modal"></div>
            `;

            const modal = document.getElementById("modal");
            expect(modal?.classList.length).toBe(0);

            // Execute function
            openModal();

            // Verify flex class was added
            expect(modal?.classList.contains("flex")).toBe(true);
            expect(modal?.classList.contains("hidden")).toBe(false);
        });
    });

    describe("closeModal", () => {
        it("should remove 'flex' class and add 'hidden' class when modal element exists", () => {
            // Set up DOM with modal element that is open (has flex class)
            document.body.innerHTML = `
                <div id="modal" class="flex"></div>
            `;

            const modal = document.getElementById("modal");
            expect(modal?.classList.contains("flex")).toBe(true);
            expect(modal?.classList.contains("hidden")).toBe(false);

            // Execute function
            closeModal();

            // Verify class changes
            expect(modal?.classList.contains("flex")).toBe(false);
            expect(modal?.classList.contains("hidden")).toBe(true);
        });

        it("should handle case when modal element does not exist", () => {
            // No modal element in DOM
            document.body.innerHTML = `<div></div>`;

            // Execute function - should not throw error
            expect(() => closeModal()).not.toThrow();

            // Verify no errors were logged (function handles gracefully)
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it("should work correctly when modal already has 'hidden' class", () => {
            // Set up DOM with modal that already has hidden class
            document.body.innerHTML = `
                <div id="modal" class="flex hidden"></div>
            `;

            const modal = document.getElementById("modal");
            expect(modal?.classList.contains("flex")).toBe(true);
            expect(modal?.classList.contains("hidden")).toBe(true);

            // Execute function
            closeModal();

            // Verify class changes - flex removed, hidden remains
            expect(modal?.classList.contains("flex")).toBe(false);
            expect(modal?.classList.contains("hidden")).toBe(true);
        });

        it("should work correctly when modal has no classes initially", () => {
            // Set up DOM with modal that has no classes
            document.body.innerHTML = `
                <div id="modal"></div>
            `;

            const modal = document.getElementById("modal");
            expect(modal?.classList.length).toBe(0);

            // Execute function
            closeModal();

            // Verify hidden class was added
            expect(modal?.classList.contains("hidden")).toBe(true);
            expect(modal?.classList.contains("flex")).toBe(false);
        });
    });

    describe("Integration scenarios", () => {
        it("should toggle modal state correctly through open and close sequence", () => {
            // Set up DOM with modal element
            document.body.innerHTML = `
                <div id="modal" class="hidden"></div>
            `;

            const modal = document.getElementById("modal");

            // Initial state: hidden
            expect(modal?.classList.contains("hidden")).toBe(true);
            expect(modal?.classList.contains("flex")).toBe(false);

            // Open modal
            openModal();
            expect(modal?.classList.contains("hidden")).toBe(false);
            expect(modal?.classList.contains("flex")).toBe(true);

            // Close modal
            closeModal();
            expect(modal?.classList.contains("hidden")).toBe(true);
            expect(modal?.classList.contains("flex")).toBe(false);

            // Open again
            openModal();
            expect(modal?.classList.contains("hidden")).toBe(false);
            expect(modal?.classList.contains("flex")).toBe(true);
        });

        it("should handle multiple consecutive open calls gracefully", () => {
            // Set up DOM with modal element
            document.body.innerHTML = `
                <div id="modal" class="hidden"></div>
            `;

            const modal = document.getElementById("modal");

            // Call openModal multiple times
            openModal();
            openModal();
            openModal();

            // Should still be in correct state
            expect(modal?.classList.contains("hidden")).toBe(false);
            expect(modal?.classList.contains("flex")).toBe(true);
        });

        it("should handle multiple consecutive close calls gracefully", () => {
            // Set up DOM with modal element
            document.body.innerHTML = `
                <div id="modal" class="flex"></div>
            `;

            const modal = document.getElementById("modal");

            // Call closeModal multiple times
            closeModal();
            closeModal();
            closeModal();

            // Should still be in correct state
            expect(modal?.classList.contains("flex")).toBe(false);
            expect(modal?.classList.contains("hidden")).toBe(true);
        });
    });

    describe("Custom Modal ID Support", () => {
        describe("openModal with custom ID", () => {
            it("should work with custom modal ID", () => {
                // Set up DOM with custom modal element
                document.body.innerHTML = `
                    <div id="custom-modal" class="hidden"></div>
                `;

                const modal = document.getElementById("custom-modal");
                expect(modal?.classList.contains("hidden")).toBe(true);
                expect(modal?.classList.contains("flex")).toBe(false);

                // Execute function with custom ID
                openModal("custom-modal");

                // Verify class changes
                expect(modal?.classList.contains("hidden")).toBe(false);
                expect(modal?.classList.contains("flex")).toBe(true);
            });

            it("should handle non-existent custom modal ID gracefully", () => {
                // No modal element in DOM
                document.body.innerHTML = `<div></div>`;

                // Execute function with non-existent ID - should not throw error
                expect(() => openModal("non-existent")).not.toThrow();

                // Verify no errors were logged
                expect(consoleErrorSpy).not.toHaveBeenCalled();
            });
        });

        describe("closeModal with custom ID", () => {
            it("should work with custom modal ID", () => {
                // Set up DOM with custom modal element that is open
                document.body.innerHTML = `
                    <div id="custom-modal" class="flex"></div>
                `;

                const modal = document.getElementById("custom-modal");
                expect(modal?.classList.contains("flex")).toBe(true);
                expect(modal?.classList.contains("hidden")).toBe(false);

                // Execute function with custom ID
                closeModal("custom-modal");

                // Verify class changes
                expect(modal?.classList.contains("flex")).toBe(false);
                expect(modal?.classList.contains("hidden")).toBe(true);
            });

            it("should handle non-existent custom modal ID gracefully", () => {
                // No modal element in DOM
                document.body.innerHTML = `<div></div>`;

                // Execute function with non-existent ID - should not throw error
                expect(() => closeModal("non-existent")).not.toThrow();

                // Verify no errors were logged
                expect(consoleErrorSpy).not.toHaveBeenCalled();
            });
        });

        describe("Backward compatibility", () => {
            it("should still work with default modal ID when no parameter provided", () => {
                // Set up DOM with default modal element
                document.body.innerHTML = `
                    <div id="modal" class="hidden"></div>
                `;

                const modal = document.getElementById("modal");

                // Test openModal without parameter
                openModal();
                expect(modal?.classList.contains("hidden")).toBe(false);
                expect(modal?.classList.contains("flex")).toBe(true);

                // Test closeModal without parameter
                closeModal();
                expect(modal?.classList.contains("hidden")).toBe(true);
                expect(modal?.classList.contains("flex")).toBe(false);
            });
        });
    });
});
