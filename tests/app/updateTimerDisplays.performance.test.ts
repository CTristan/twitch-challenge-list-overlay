import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/app";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";

describe("updateTimerDisplays Performance", () => {
    let app: App;
    let challengeList: ChallengeList;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();

        // Reset DOM
        document.body.innerHTML = `
            <div class="challenge-container primary"></div>
            <div class="challenge-container secondary"></div>
        `;

        app = new App("test-performance");
        challengeList = app.challengeList;
    });

    describe("Performance Optimization", () => {
        it("should demonstrate O(n) complexity instead of O(n²)", () => {
            // Create multiple challenges with timers
            const challengeCount = 10;
            const challenges: Challenge[] = [];

            for (let i = 0; i < challengeCount; i++) {
                const challenge = new Challenge(`Challenge ${i + 1}`, {
                    timer: "5m",
                });
                challenge.startTimer();
                challenges.push(challenge);
            }

            challengeList.addChallengeObjects(challenges);
            app.renderChallengeList();

            // Spy on Array.find to count how many times it's called
            const findSpy = vi.spyOn(Array.prototype, "find");

            // Call updateTimerDisplays
            app.updateTimerDisplays();

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

            // Measure execution time
            const startTime = performance.now();
            app.updateTimerDisplays();
            const endTime = performance.now();

            const executionTime = endTime - startTime;

            // With O(n) complexity, this should complete quickly even with 20 challenges
            // Allow generous time limit for test environment variations
            expect(executionTime).toBeLessThan(50); // 50ms should be more than enough
        });

        it("should maintain existing timer update functionality", () => {
            // Create challenges with timers
            const challenge1 = new Challenge("Test Challenge 1", {
                timer: "5m",
            });
            const challenge2 = new Challenge("Test Challenge 2", {
                timer: "3m",
            });

            challenge1.startTimer();
            challenge2.startTimer();

            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Verify that updateTimerDisplays runs without errors
            expect(() => {
                app.updateTimerDisplays();
            }).not.toThrow();

            // Verify that the optimization doesn't break the timer update system
            expect(challenge1.timer?.isActive).toBe(true);
            expect(challenge2.timer?.isActive).toBe(true);
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

            // Spy on Array.find to ensure it's not used for challenge lookup
            const findSpy = vi.spyOn(challengeList.challenges, "find");

            // Call updateTimerDisplays
            app.updateTimerDisplays();

            // Array.find should not be called on the challenges array
            expect(findSpy).not.toHaveBeenCalled();

            findSpy.mockRestore();
        });
    });
});
