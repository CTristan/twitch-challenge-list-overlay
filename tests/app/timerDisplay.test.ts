import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/app";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";

describe("Timer Display in Challenge Rows", () => {
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

        app = new App("test-store");
        challengeList = app.challengeList;

        // Clear any existing challenges
        challengeList.clearChallengeList();

        // Use fake timers for timer testing
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Timer Display Creation", () => {
        it("should display timer when challenge has active timer", () => {
            // Add a challenge with timer
            const challenge = new Challenge("Test Challenge", {
                timer: "5m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Check that timer elements are created
            const timerElements = document.querySelectorAll(".challenge-timer");
            expect(timerElements).toHaveLength(1); // Single container

            // Check timer content
            timerElements.forEach((timerElement) => {
                expect(timerElement.textContent).toContain("Timer:");
                expect(timerElement.textContent).toContain("5m");
                expect(timerElement.textContent).toContain("⏱️");
            });
        });

        it("should not display timer when challenge has no timer", () => {
            // Add a challenge without timer
            challengeList.addChallenges("Test Challenge");

            // Render the challenge list
            app.renderChallengeList();

            // Check that no timer elements are created
            const timerElements = document.querySelectorAll(".challenge-timer");
            expect(timerElements).toHaveLength(0);
        });

        it("should not display timer when timer is inactive", () => {
            // Add a challenge with timer but don't start it
            const challenge = new Challenge("Test Challenge", {
                timer: "5m",
            });
            // Don't start the timer
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Check that no timer elements are created
            const timerElements = document.querySelectorAll(".challenge-timer");
            expect(timerElements).toHaveLength(0);
        });
    });

    describe("Timer Display Updates", () => {
        it("should update timer display every second", () => {
            // Add a challenge with timer
            const challenge = new Challenge("Test Challenge", {
                timer: "5m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Get initial timer display
            const timerElement = document.querySelector(".challenge-timer");
            expect(timerElement?.textContent).toContain("5m");

            // Advance time by 1 minute
            vi.advanceTimersByTime(60000);

            // Manually trigger timer display update
            app.updateTimerDisplays();

            // Check that timer display updated
            expect(timerElement?.textContent).toContain("4m");
        });

        it("should apply warning class when timer is low", () => {
            // Add a challenge with short timer
            const challenge = new Challenge("Test Challenge", {
                timer: "2m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Advance time to warning threshold (≤120s)
            vi.advanceTimersByTime(60000); // 1 minute passed, 1 minute remaining

            // Manually trigger timer display update
            app.updateTimerDisplays();

            const timerElement = document.querySelector(".challenge-timer");
            expect(timerElement?.classList.contains("warning")).toBe(true);
        });

        it("should apply critical class when timer is very low", () => {
            // Add a challenge with short timer
            const challenge = new Challenge("Test Challenge", {
                timer: "1m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Advance time to critical threshold (≤30s)
            vi.advanceTimersByTime(40000); // 40 seconds passed, 20 seconds remaining

            // Manually trigger timer display update
            app.updateTimerDisplays();

            const timerElement = document.querySelector(".challenge-timer");
            expect(timerElement?.classList.contains("critical")).toBe(true);
        });

        it("should apply expired class when timer expires", () => {
            // Add a challenge with short timer
            const challenge = new Challenge("Test Challenge", {
                timer: "30s",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Advance time past expiration
            vi.advanceTimersByTime(35000); // 35 seconds passed, timer expired

            // Manually trigger timer display update
            app.updateTimerDisplays();

            const timerElement = document.querySelector(".challenge-timer");
            expect(timerElement?.classList.contains("expired")).toBe(true);
            expect(timerElement?.textContent).toContain("⏰");
        });
    });

    describe("Timer Display Integration", () => {
        it("should include timer display when adding challenges with timer", () => {
            // Add a challenge with timer using addChallengeToDOM
            const challenge = new Challenge("Test Challenge", {
                timer: "3m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Add to DOM
            app.addChallengeToDOM(challenge);

            // Check that timer elements are created
            const timerElements = document.querySelectorAll(".challenge-timer");
            expect(timerElements).toHaveLength(1); // Single container
        });

        it("should update timer display when editing challenges", () => {
            // Add a challenge with timer
            const challenge = new Challenge("Test Challenge", {
                timer: "5m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Edit the challenge to add description
            challenge.setDescription("Updated description");

            // Update DOM
            app.editChallengeFromDOM(challenge);

            // Check that timer is still displayed
            const timerElements = document.querySelectorAll(".challenge-timer");
            expect(timerElements).toHaveLength(1);
        });

        it("should remove timer display when challenge is completed", () => {
            // Add a challenge with timer
            const challenge = new Challenge("Test Challenge", {
                timer: "5m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Complete the challenge
            challenge.setCompletionStatus(true);

            // Update DOM
            app.completeChallengeFromDOM(challenge.id);

            // Timer should be stopped and display should be updated
            expect(challenge.timer?.isActive).toBe(false);
        });
    });

    describe("Timer Update System", () => {
        it("should start timer updates when there are active timers", () => {
            // Spy on setInterval
            const setIntervalSpy = vi.spyOn(window, "setInterval");

            // Add a challenge with timer
            const challenge = new Challenge("Test Challenge", {
                timer: "5m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Check that setInterval was called
            expect(setIntervalSpy).toHaveBeenCalledWith(
                expect.any(Function),
                1000
            );
        });

        it("should stop timer updates when challenge is completed", () => {
            // Spy on clearInterval
            const clearIntervalSpy = vi.spyOn(window, "clearInterval");

            // Add a challenge with timer
            const challenge = new Challenge("Test Challenge", {
                timer: "5m",
            });
            challenge.startTimer();
            challengeList.addChallengeObjects(challenge);

            // Render the challenge list
            app.renderChallengeList();

            // Complete the challenge (this stops the timer)
            challenge.setCompletionStatus(true);

            // Update timer displays
            app.updateTimerDisplays();

            // Check that clearInterval was called since no active timers remain
            expect(clearIntervalSpy).toHaveBeenCalled();
        });
    });
});
