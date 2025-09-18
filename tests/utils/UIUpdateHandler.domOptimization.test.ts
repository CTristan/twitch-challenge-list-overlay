import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import UIUpdateHandler from "../../src/utils/UIUpdateHandler";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("UIUpdateHandler DOM Optimization", () => {
    let challengeList: ChallengeList;
    let uiUpdateHandler: UIUpdateHandler;

    beforeEach(() => {
        ensureTestIsolation();
        challengeList = new ChallengeList("test-store");
        uiUpdateHandler = new UIUpdateHandler(challengeList);

        // Create DOM containers for testing
        document.body.innerHTML = `
            <div class="challenge-container primary"></div>
            <div class="challenge-container secondary"></div>
        `;
    });

    describe("DOM cloning optimization", () => {
        it("should verify that addChallengeToDOM creates exactly 2 DOM elements (not 3)", () => {
            const challenge = new Challenge("Test Challenge");

            // Spy on cloneNode to count how many times it's called
            const cloneNodeSpy = vi.spyOn(Element.prototype, "cloneNode");

            uiUpdateHandler.addChallengeToDOM(challenge);

            // Should only clone once (for secondary container)
            // Original element goes to primary container without cloning
            expect(cloneNodeSpy).toHaveBeenCalledTimes(1);
            expect(cloneNodeSpy).toHaveBeenCalledWith(true);

            cloneNodeSpy.mockRestore();
        });

        it("should verify that renderChallengeList optimizes cloning for multiple challenges", () => {
            const challenges = [
                new Challenge("Challenge 1"),
                new Challenge("Challenge 2"),
                new Challenge("Challenge 3"),
            ];

            challenges.forEach((challenge) =>
                challengeList.addChallengeObjects(challenge)
            );

            // Spy on cloneNode to count how many times it's called
            const cloneNodeSpy = vi.spyOn(Element.prototype, "cloneNode");

            uiUpdateHandler.renderChallengeList();

            // Should only clone once per challenge (3 challenges = 3 clones)
            // Each original element goes to primary container without cloning
            expect(cloneNodeSpy).toHaveBeenCalledTimes(3);

            cloneNodeSpy.mockRestore();
        });

        it("should ensure both containers have identical markup after optimization", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
            });

            uiUpdateHandler.addChallengeToDOM(challenge);

            const primaryContainer = document.querySelector(
                ".challenge-container.primary"
            );
            const secondaryContainer = document.querySelector(
                ".challenge-container.secondary"
            );

            const primaryChallenge =
                primaryContainer?.firstElementChild as HTMLElement;
            const secondaryChallenge =
                secondaryContainer?.firstElementChild as HTMLElement;

            // Both should have identical structure
            expect(primaryChallenge.outerHTML).toBe(
                secondaryChallenge.outerHTML
            );
            expect(primaryChallenge.dataset["challengeId"]).toBe(challenge.id);
            expect(secondaryChallenge.dataset["challengeId"]).toBe(
                challenge.id
            );
        });

        it("should maintain event handlers on both original and cloned elements", () => {
            const challenge = new Challenge("Test Challenge");

            uiUpdateHandler.addChallengeToDOM(challenge);

            const primaryCheckbox = document.querySelector(
                ".challenge-container.primary .challenge-checkbox"
            );
            const secondaryCheckbox = document.querySelector(
                ".challenge-container.secondary .challenge-checkbox"
            );

            // Both checkboxes should exist and have proper structure
            expect(primaryCheckbox).toBeTruthy();
            expect(secondaryCheckbox).toBeTruthy();
            expect(
                primaryCheckbox?.classList.contains("challenge-checkbox")
            ).toBe(true);
            expect(
                secondaryCheckbox?.classList.contains("challenge-checkbox")
            ).toBe(true);
        });

        it("should demonstrate performance improvement with large number of challenges", () => {
            const challenges: Challenge[] = [];
            for (let i = 0; i < 100; i++) {
                challenges.push(new Challenge(`Challenge ${i + 1}`));
            }

            challenges.forEach((challenge) =>
                challengeList.addChallengeObjects(challenge)
            );

            // Spy on cloneNode to verify optimization
            const cloneNodeSpy = vi.spyOn(Element.prototype, "cloneNode");

            const startTime = performance.now();
            uiUpdateHandler.renderChallengeList();
            const endTime = performance.now();

            // Should only clone once per challenge (100 challenges = 100 clones)
            // Without optimization, it would be 200 clones (2 per challenge)
            expect(cloneNodeSpy).toHaveBeenCalledTimes(100);

            // Performance should be reasonable (less than 100ms for 100 challenges)
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(100);

            cloneNodeSpy.mockRestore();
        });
    });

    describe("optimization verification", () => {
        it("should confirm that original element is used directly in primary container", () => {
            const challenge = new Challenge("Test Challenge");

            // Spy on appendChild to see what gets appended
            const primaryContainer = document.querySelector(
                ".challenge-container.primary"
            );
            const appendChildSpy = vi.spyOn(primaryContainer!, "appendChild");

            uiUpdateHandler.addChallengeToDOM(challenge);

            // Should be called once with the original element
            expect(appendChildSpy).toHaveBeenCalledTimes(1);

            const appendedElement = appendChildSpy.mock
                .calls[0]?.[0] as HTMLElement;
            expect(appendedElement.dataset["challengeId"]).toBe(challenge.id);

            appendChildSpy.mockRestore();
        });

        it("should confirm that cloned element is used in secondary container", () => {
            const challenge = new Challenge("Test Challenge");

            // Spy on appendChild for secondary container
            const secondaryContainer = document.querySelector(
                ".challenge-container.secondary"
            );
            const appendChildSpy = vi.spyOn(secondaryContainer!, "appendChild");

            uiUpdateHandler.addChallengeToDOM(challenge);

            // Should be called once with the cloned element
            expect(appendChildSpy).toHaveBeenCalledTimes(1);

            const appendedElement = appendChildSpy.mock
                .calls[0]?.[0] as HTMLElement;
            expect(appendedElement.dataset["challengeId"]).toBe(challenge.id);

            appendChildSpy.mockRestore();
        });
    });
});
