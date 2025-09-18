import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import UIUpdateHandler from "../../src/utils/UIUpdateHandler";

describe("UIUpdateHandler Performance", () => {
    let challengeList: ChallengeList;
    let uiUpdateHandler: UIUpdateHandler;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();
        challengeList = new ChallengeList();
        uiUpdateHandler = new UIUpdateHandler(challengeList);

        // Create DOM containers for testing
        document.body.innerHTML = `
            <div class="challenge-container primary"></div>
            <div class="challenge-container secondary"></div>
        `;
    });

    describe("updateTimerDisplays Performance Optimization", () => {
        it("should use Map-based lookup instead of Array.find for O(n) complexity", () => {
            // Create challenges with timers
            const challenges: Challenge[] = [];
            for (let i = 0; i < 10; i++) {
                const challenge = new Challenge(`Challenge ${i + 1}`, {
                    timer: "5m",
                });
                challenge.startTimer();
                challenges.push(challenge);
            }

            challengeList.addChallengeObjects(challenges);

            // Render challenges to create timer elements in DOM
            uiUpdateHandler.renderChallengeList();

            // Spy on Array.find to count how many times it's called
            const findSpy = vi.spyOn(Array.prototype, "find");

            // Call updateTimerDisplays
            uiUpdateHandler.updateTimerDisplays();

            // With the optimization, Array.find should not be called at all
            // because we use Map.get() instead
            expect(findSpy).not.toHaveBeenCalled();

            findSpy.mockRestore();
        });

        it("should execute efficiently with multiple challenges", () => {
            // Create challenges with timers
            const challengeCount = 20;
            const challenges: Challenge[] = [];

            for (let i = 0; i < challengeCount; i++) {
                const challenge = new Challenge(`Challenge ${i + 1}`, {
                    timer: "10m",
                });
                challenge.startTimer();
                challenges.push(challenge);
            }

            challengeList.addChallengeObjects(challenges);

            // Render challenges to create timer elements in DOM
            uiUpdateHandler.renderChallengeList();

            // Measure execution time
            const startTime = performance.now();
            uiUpdateHandler.updateTimerDisplays();
            const endTime = performance.now();

            const executionTime = endTime - startTime;

            // With O(n) complexity, this should complete quickly even with 20 challenges
            // Allow generous time limit for test environment variations
            expect(executionTime).toBeLessThan(50); // 50ms should be more than enough
        });

        it("should verify Map-based lookup optimization", () => {
            // Create challenges with timers
            const challenges: Challenge[] = [];
            for (let i = 0; i < 5; i++) {
                const challenge = new Challenge(`Challenge ${i + 1}`, {
                    timer: "5m",
                });
                challenge.startTimer();
                challenges.push(challenge);
            }

            challengeList.addChallengeObjects(challenges);

            // Render challenges to create timer elements in DOM
            uiUpdateHandler.renderChallengeList();

            // Spy on Array.find to ensure it's not used for challenge lookup
            const findSpy = vi.spyOn(challengeList.challenges, "find");

            // Call updateTimerDisplays
            uiUpdateHandler.updateTimerDisplays();

            // Array.find should not be called on the challenges array
            expect(findSpy).not.toHaveBeenCalled();

            findSpy.mockRestore();
        });

        it("should maintain functionality while improving performance", () => {
            // Use fake timers for this test
            vi.useFakeTimers();

            // Create a challenge with timer
            const challenge = new Challenge("Test Challenge", {
                timer: "30s",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge to create timer element in DOM
            uiUpdateHandler.renderChallengeList();

            // Get initial timer display
            const timerElement = document.querySelector(".challenge-timer");
            expect(timerElement).toBeTruthy();
            expect(timerElement?.textContent).toContain("30s");

            // Advance time by 5 seconds
            vi.advanceTimersByTime(5000);

            // Call updateTimerDisplays (this should use the optimized Map-based approach)
            uiUpdateHandler.updateTimerDisplays();

            // Check that timer display updated correctly
            expect(timerElement?.textContent).toContain("25s");

            // Restore real timers
            vi.useRealTimers();
        });
    });
});
