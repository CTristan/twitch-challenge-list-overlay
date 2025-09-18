import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import Timer from "../../src/utils/Timer";
import TimerDisplayUtils from "../../src/utils/TimerDisplayUtils";

describe("TimerDisplayUtils", () => {
    let challengeList: ChallengeList;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();
        challengeList = new ChallengeList();

        // Set up fake timers for time-based tests
        vi.useFakeTimers();

        // Set up DOM structure for testing
        document.body.innerHTML = `
            <div id="primary-container"></div>
            <div id="secondary-container"></div>
        `;
    });

    describe("createTimerElement", () => {
        it("should create timer element with correct structure", () => {
            const timer = new Timer(300); // 5 minutes
            timer.start();

            const element = TimerDisplayUtils.createTimerElement(
                timer,
                "test-id"
            );

            expect(element.tagName).toBe("DIV");
            expect(element.classList.contains("challenge-timer")).toBe(true);
            expect(element.dataset["challengeId"]).toBe("test-id");
            expect(element.textContent).toContain("Timer:");
            expect(element.textContent).toContain("5m");
        });
    });

    describe("updateTimerElement", () => {
        it("should update timer element content and CSS classes", () => {
            const timer = new Timer(30); // 30 seconds
            timer.start();

            const element = document.createElement("div");
            element.classList.add("challenge-timer");

            TimerDisplayUtils.updateTimerElement(element, timer);

            expect(element.textContent).toContain("Timer:");
            expect(element.textContent).toContain("30s");
            expect(element.classList.contains("critical")).toBe(true);
        });

        it("should apply expired class for expired timers", () => {
            const timer = new Timer(30);
            timer.start();

            // Advance time to expire the timer
            vi.advanceTimersByTime(35000);

            const element = document.createElement("div");
            element.classList.add("challenge-timer");

            TimerDisplayUtils.updateTimerElement(element, timer);

            expect(element.classList.contains("expired")).toBe(true);
        });
    });

    describe("updateAllTimerDisplays", () => {
        it("should update all timer displays and return active timer status", () => {
            // Create challenges with timers
            const challenge1 = new Challenge("Test 1", { timer: "5m" });
            const challenge2 = new Challenge("Test 2", { timer: "3m" });
            challenge1.startTimer();
            challenge2.startTimer();

            challengeList.addChallengeObjects([challenge1, challenge2]);

            // Create timer elements in DOM
            document.body.innerHTML = `
                <div class="challenge-timer" data-challenge-id="${challenge1.id}"></div>
                <div class="challenge-timer" data-challenge-id="${challenge2.id}"></div>
            `;

            const hasActiveTimers =
                TimerDisplayUtils.updateAllTimerDisplays(challengeList);

            expect(hasActiveTimers).toBe(true);

            const timerElements = document.querySelectorAll(".challenge-timer");
            timerElements.forEach((element) => {
                expect(element.textContent).toContain("Timer:");
            });
        });

        it("should return false when no active timers remain", () => {
            const challenge = new Challenge("Test", { timer: "5m" });
            challenge.startTimer();
            challenge.stopTimer(); // Stop the timer

            challengeList.addChallengeObjects([challenge]);

            document.body.innerHTML = `
                <div class="challenge-timer" data-challenge-id="${challenge.id}"></div>
            `;

            const hasActiveTimers =
                TimerDisplayUtils.updateAllTimerDisplays(challengeList);

            expect(hasActiveTimers).toBe(false);
        });
    });

    describe("hasActiveTimers", () => {
        it("should return true when challenges have active timers", () => {
            const challenge = new Challenge("Test", { timer: "5m" });
            challenge.startTimer();
            challengeList.addChallengeObjects([challenge]);

            const result = TimerDisplayUtils.hasActiveTimers(challengeList);

            expect(result).toBe(true);
        });

        it("should return false when no challenges have active timers", () => {
            const challenge = new Challenge("Test", { timer: "5m" });
            // Don't start the timer
            challengeList.addChallengeObjects([challenge]);

            const result = TimerDisplayUtils.hasActiveTimers(challengeList);

            expect(result).toBe(false);
        });

        it("should return false when challenge list is empty", () => {
            const result = TimerDisplayUtils.hasActiveTimers(challengeList);

            expect(result).toBe(false);
        });
    });
});
