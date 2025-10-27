import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";
import { setupChallengeTestDOM } from "../utils/domTestUtils";

describe("Admin Panel Challenge Refresh", () => {
    let app: App;

    beforeEach(() => {
        ensureTestIsolation();
        setupChallengeTestDOM();

        // Set window location hash to admin mode
        window.location.hash = "#admin";

        // Create app instance
        app = new App("challenge-list-test");

        // Render the app
        app.render();
    });

    describe("Challenge List Display After Add", () => {
        it("should display correct numeric ID prefix for single challenge", () => {
            // Add a challenge via the app method (simulating modal form submission)
            const challengeData = {
                title: "First Challenge",
                description: "Test description",
            };

            // Access private method via type assertion for testing
            (app as any).createChallengeFromForm(challengeData);

            // Get the challenge element
            const challengeElement = document.querySelector(".challenge");
            expect(challengeElement).toBeTruthy();

            // Check that the title includes the numeric ID prefix
            const titleElement = challengeElement?.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            expect(titleElement).toBeTruthy();
            expect(titleElement.textContent).toContain("1. First Challenge");
        });

        it("should display correct numeric ID prefixes for multiple challenges", () => {
            // Add three challenges
            const challenges = [
                { title: "First Challenge" },
                { title: "Second Challenge" },
                { title: "Third Challenge" },
            ];

            challenges.forEach((data) => {
                (app as any).createChallengeFromForm(data);
            });

            // Get all challenge elements
            const challengeElements =
                document.querySelectorAll(".challenge");
            expect(challengeElements.length).toBe(3);

            // Verify each challenge has the correct numeric ID prefix
            challengeElements.forEach((element, index) => {
                const titleElement = element.querySelector(
                    ".challenge-title"
                ) as HTMLElement;
                expect(titleElement.textContent).toContain(
                    `${index + 1}. ${challenges[index]!.title}`
                );
            });
        });

        it("should maintain correct numeric ID prefixes when adding challenges incrementally", () => {
            // Add first challenge
            (app as any).createChallengeFromForm({
                title: "Challenge One",
            });

            // Verify first challenge ID
            let challengeElements =
                document.querySelectorAll(".challenge");
            expect(challengeElements.length).toBe(1);
            let firstTitle = challengeElements[0]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            expect(firstTitle.textContent).toContain("1. Challenge One");

            // Add second challenge
            (app as any).createChallengeFromForm({
                title: "Challenge Two",
            });

            // Verify both challenge IDs are still correct
            challengeElements = document.querySelectorAll(".challenge");
            expect(challengeElements.length).toBe(2);

            firstTitle = challengeElements[0]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const secondTitle = challengeElements[1]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;

            expect(firstTitle.textContent).toContain("1. Challenge One");
            expect(secondTitle.textContent).toContain("2. Challenge Two");

            // Add third challenge
            (app as any).createChallengeFromForm({
                title: "Challenge Three",
            });

            // Verify all three challenge IDs are still correct
            challengeElements = document.querySelectorAll(".challenge");
            expect(challengeElements.length).toBe(3);

            firstTitle = challengeElements[0]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const secondTitleAgain = challengeElements[1]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const thirdTitle = challengeElements[2]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;

            expect(firstTitle.textContent).toContain("1. Challenge One");
            expect(secondTitleAgain.textContent).toContain(
                "2. Challenge Two"
            );
            expect(thirdTitle.textContent).toContain("3. Challenge Three");
        });

        it("should update all numeric ID prefixes after deleting a challenge", () => {
            // Add three challenges
            (app as any).createChallengeFromForm({
                title: "Challenge One",
            });
            (app as any).createChallengeFromForm({
                title: "Challenge Two",
            });
            (app as any).createChallengeFromForm({
                title: "Challenge Three",
            });

            // Get all challenges
            let challengeElements =
                document.querySelectorAll(".challenge");
            expect(challengeElements.length).toBe(3);

            // Get the ID of the second challenge
            const secondChallengeId =
                challengeElements[1]!.getAttribute("data-challenge-id");
            expect(secondChallengeId).toBeTruthy();

            // Delete the second challenge (index 1)
            app.challengeList.deleteChallenges(1);
            app.deleteChallengeFromDOM(secondChallengeId!);

            // Verify only 2 challenges remain but IDs are NOT updated (incremental delete doesn't re-render)
            challengeElements = document.querySelectorAll(".challenge");
            expect(challengeElements.length).toBe(2);

            // After incremental delete, the display positions are NOT automatically updated
            // This is a known limitation - positions are only updated on full re-render
            // The remaining challenges will still show their original positions (1 and 3)
            const firstTitle = challengeElements[0]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const thirdTitle = challengeElements[1]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;

            expect(firstTitle.textContent).toContain("1. Challenge One");
            expect(thirdTitle.textContent).toContain("3. Challenge Three");

            // However, if we trigger a full re-render, the positions SHOULD update
            app.renderChallengeList();

            // After full re-render, positions should be correct
            challengeElements = document.querySelectorAll(".challenge");
            const firstTitleAfterRender = challengeElements[0]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const secondTitleAfterRender = challengeElements[1]!.querySelector(
                ".challenge-title"
            ) as HTMLElement;

            expect(firstTitleAfterRender.textContent).toContain(
                "1. Challenge One"
            );
            expect(secondTitleAfterRender.textContent).toContain(
                "2. Challenge Three"
            );
        });
    });

    describe("Full Re-render vs Incremental Add", () => {
        it("should show identical results whether using full re-render or incremental add for appended challenges", () => {
            // Approach 1: Add challenges and use full re-render
            (app as any).createChallengeFromForm({
                title: "Challenge A",
            });
            (app as any).createChallengeFromForm({
                title: "Challenge B",
            });

            // Trigger full re-render
            app.renderChallengeList();

            const challengesAfterFullRender =
                document.querySelectorAll(".challenge");
            const titlesAfterFullRender = Array.from(
                challengesAfterFullRender
            ).map(
                (el) =>
                    el.querySelector(".challenge-title")?.textContent || ""
            );

            expect(titlesAfterFullRender).toEqual([
                "1. Challenge A",
                "2. Challenge B",
            ]);

            // Clear all challenges and re-render
            app.challengeList.deleteChallenges(
                app.challengeList.challenges.map((_, i) => i)
            );
            app.renderChallengeList();

            (app as any).createChallengeFromForm({
                title: "Challenge A",
            });
            
            (app as any).createChallengeFromForm({
                title: "Challenge B",
            });

            const challengesAfterIncrementalAdd =
                document.querySelectorAll(".challenge");
            const titlesAfterIncrementalAdd = Array.from(
                challengesAfterIncrementalAdd
            ).map(
                (el) =>
                    el.querySelector(".challenge-title")?.textContent || ""
            );

            expect(titlesAfterIncrementalAdd).toEqual([
                "1. Challenge A",
                "2. Challenge B",
            ]);

            // Both approaches should yield identical results
            expect(titlesAfterFullRender).toEqual(
                titlesAfterIncrementalAdd
            );
        });
    });
});
