import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import UIUpdateHandler from "../../src/utils/UIUpdateHandler";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("UIUpdateHandler", () => {
    let challengeList: ChallengeList;
    let uiUpdateHandler: UIUpdateHandler;

    beforeEach(() => {
        ensureTestIsolation();
        challengeList = new ChallengeList("test-store");
        uiUpdateHandler = new UIUpdateHandler(challengeList);
    });

    describe("handleCommandResult", () => {
        it("should handle add command result", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
            });
            challengeList.addChallengeObjects(challenge);

            const response: CommandResponse = {
                message: "Challenge added",
                error: false,
                uiUpdate: {
                    action: "add" as UIUpdateAction,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: true,
                    updateCount: true,
                },
            };

            // Should not throw error even without DOM containers
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle complete command result", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
            });
            challengeList.addChallengeObjects(challenge);

            const response: CommandResponse = {
                message: "Challenge completed",
                error: false,
                uiUpdate: {
                    action: "complete" as UIUpdateAction,
                    challengeIndices: [0],
                    challenges: [challenge],
                    updateTimers: true,
                    updateCount: true,
                },
            };

            // Should not throw error even without DOM containers
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should handle clearAll command result", () => {
            const response: CommandResponse = {
                message: "All challenges cleared",
                error: false,
                uiUpdate: {
                    action: "clearAll" as UIUpdateAction,
                    updateTimers: true,
                    updateCount: true,
                },
            };

            // Should not throw error even without DOM containers
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should ignore error responses", () => {
            const response: CommandResponse = {
                message: "Error occurred",
                error: true,
            };

            // Should not throw error and should not process UI updates
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });

        it("should ignore responses without UI update data", () => {
            const response: CommandResponse = {
                message: "Success",
                error: false,
            };

            // Should not throw error and should not process UI updates
            expect(() => {
                uiUpdateHandler.handleCommandResult(response);
            }).not.toThrow();
        });
    });

    describe("createChallengeTextElement", () => {
        it("should create proper DOM structure for challenge with title only", () => {
            const challenge = new Challenge("Test Title");
            const textElement = (
                uiUpdateHandler as any
            ).createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeNull();

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeNull();
        });

        it("should create proper DOM structure for challenge with title and description", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
            });
            const textElement = (
                uiUpdateHandler as any
            ).createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe("Test Description");

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeNull();
        });

        it("should create proper DOM structure for challenge with progress", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
                amount: 5,
            });
            const textElement = (
                uiUpdateHandler as any
            ).createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe("Test Description");

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeTruthy();
            expect(progressElement?.textContent).toBe("Progress: 0/5");
        });
    });

    describe("cleanup", () => {
        it("should clean up resources when destroyed", () => {
            // Should not throw error
            expect(() => {
                uiUpdateHandler.destroy();
            }).not.toThrow();
        });
    });
});
