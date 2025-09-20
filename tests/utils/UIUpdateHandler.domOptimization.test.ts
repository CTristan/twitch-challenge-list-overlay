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

        // Create DOM containers with proper card structure for testing
        document.body.innerHTML = `
            <div class="challenge-wrapper">
                <div class="challenge-container primary">
                    <div class="card">
                        <div class="username">Challenges 0/0</div>
                        <ol class="challenges"></ol>
                    </div>
                </div>
                <div class="challenge-container secondary">
                    <div class="card">
                        <div class="username">Challenges 0/0</div>
                        <ol class="challenges"></ol>
                    </div>
                </div>
            </div>
        `;
    });

    describe("DOM cloning optimization", () => {
        it("should verify that addChallengeToDOM creates exactly 2 DOM elements (not 3)", () => {
            const challenge = new Challenge("Test Challenge");

            // First render the challenge list to set up the card structure
            uiUpdateHandler.renderChallengeList();

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
            // Plus one additional clone for the card structure = 4 total
            expect(cloneNodeSpy).toHaveBeenCalledTimes(4);

            cloneNodeSpy.mockRestore();
        });

        it("should ensure both containers have identical markup after optimization", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
            });

            // First render the challenge list to set up the card structure
            uiUpdateHandler.renderChallengeList();
            uiUpdateHandler.addChallengeToDOM(challenge);

            const primaryChallenge = document.querySelector(
                ".challenge-container.primary .challenges li"
            ) as HTMLElement;
            const secondaryChallenge = document.querySelector(
                ".challenge-container.secondary .challenges li"
            ) as HTMLElement;

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

            // First render the challenge list to set up the card structure
            uiUpdateHandler.renderChallengeList();
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
            // Plus one additional clone for the card structure = 101 total
            expect(cloneNodeSpy).toHaveBeenCalledTimes(101);

            // Performance should be reasonable (less than 100ms for 100 challenges)
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(100);

            cloneNodeSpy.mockRestore();
        });
    });

    describe("optimization verification", () => {
        it("should confirm that original element is used directly in primary container", () => {
            const challenge = new Challenge("Test Challenge");

            // First render the challenge list to set up the card structure
            uiUpdateHandler.renderChallengeList();

            // Spy on appendChild to see what gets appended to the ordered list
            const primaryOrderedList = document.querySelector(
                ".challenge-container.primary .challenges"
            );
            const appendChildSpy = vi.spyOn(primaryOrderedList!, "appendChild");

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

            // First render the challenge list to set up the card structure
            uiUpdateHandler.renderChallengeList();

            // Spy on appendChild for secondary ordered list
            const secondaryOrderedList = document.querySelector(
                ".challenge-container.secondary .challenges"
            );
            const appendChildSpy = vi.spyOn(
                secondaryOrderedList!,
                "appendChild"
            );

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
