import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import UIUpdateHandler from "../../src/utils/UIUpdateHandler";

describe("UIUpdateHandler Performance", () => {
    let challengeList: ChallengeList;
    let uiUpdateHandler: UIUpdateHandler;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();
        challengeList = new ChallengeList();
        const configManager = ConfigManager.getInstance();
        uiUpdateHandler = new UIUpdateHandler(challengeList, configManager);

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

    describe("Timer Interval Optimization", () => {
        it("should not create interval when no active timers exist", () => {
            // Create challenge without timer
            const challenge = new Challenge("No Timer Challenge");
            challengeList.addChallengeObjects(challenge);

            // Spy on setInterval to verify it's not called
            const setIntervalSpy = vi.spyOn(window, "setInterval");

            // Call startTimerUpdates
            uiUpdateHandler.startTimerUpdates();

            // Verify setInterval was not called since no active timers
            expect(setIntervalSpy).not.toHaveBeenCalled();

            setIntervalSpy.mockRestore();
        });

        it("should create interval only when active timers exist", () => {
            // Create challenge with active timer
            const challenge = new Challenge("Timer Challenge", {
                timer: "30s",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Spy on setInterval to verify it's called
            const setIntervalSpy = vi.spyOn(window, "setInterval");

            // Call startTimerUpdates
            uiUpdateHandler.startTimerUpdates();

            // Verify setInterval was called since active timer exists
            expect(setIntervalSpy).toHaveBeenCalledWith(
                expect.any(Function),
                1000
            );

            setIntervalSpy.mockRestore();
        });

        it("should stop interval when no active timers remain", () => {
            // Create challenge with timer
            const challenge = new Challenge("Timer Challenge", {
                timer: "30s",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Start timer updates
            uiUpdateHandler.startTimerUpdates();

            // Verify interval is running
            expect(uiUpdateHandler["timerUpdateInterval"]).not.toBeNull();

            // Stop the timer (making it inactive)
            challenge.stopTimer();

            // Call updateTimerDisplays which should detect no active timers and stop interval
            uiUpdateHandler.updateTimerDisplays();

            // Verify interval was stopped
            expect(uiUpdateHandler["timerUpdateInterval"]).toBeNull();
        });

        it("should restart interval when new active timer is added", () => {
            // Start with no timers
            uiUpdateHandler.startTimerUpdates();
            expect(uiUpdateHandler["timerUpdateInterval"]).toBeNull();

            // Add challenge with active timer
            const challenge = new Challenge("New Timer Challenge", {
                timer: "60s",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Call startTimerUpdates again (simulating what happens when new timer is added)
            uiUpdateHandler.startTimerUpdates();

            // Verify interval is now running
            expect(uiUpdateHandler["timerUpdateInterval"]).not.toBeNull();
        });
    });
});
