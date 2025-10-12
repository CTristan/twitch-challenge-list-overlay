import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import { CHALLENGE_STATES } from "../../src/types/DOMConstants";

describe("Challenge", () => {
    let challenge: Challenge;

    beforeEach(() => {
        challenge = new Challenge("Buy groceries", {
            description: "Buy groceries from the store",
        });
    });

    describe("constructor", () => {
        it("should see that all properties are assigned correctly", () => {
            expect(challenge.description).toBeTypeOf("string");
            expect(challenge.id).toBeTypeOf("string");
            expect(challenge.completionStatus).toBeTypeOf("boolean");
        });
    });

    describe("getDescription", () => {
        it("should return the description of the challenge", () => {
            expect(challenge.description).toBe("Buy groceries from the store");
        });
    });

    describe("setDescription", () => {
        it("should set the description of the challenge", () => {
            challenge.setDescription("Clean the house");
            expect(challenge.description).toBe("Clean the house");
        });
    });

    describe("isComplete", () => {
        it("should return the completion status of the challenge", () => {
            expect(challenge.isComplete()).toBe(false);
        });
    });

    describe("setCompletionStatus", () => {
        it("should set the challenge status to complete", () => {
            challenge.setCompletionStatus(true);
            expect(challenge.isComplete()).toBe(true);
            challenge.setCompletionStatus(false);
            expect(challenge.isComplete()).toBe(false);
        });

        it("should return Error if status is not a boolean", () => {
            expect(() => challenge.setCompletionStatus("true" as any)).toThrow(
                "Completion status must be of type boolean"
            );
        });
    });

    describe("isFailed", () => {
        it("should return the failure status of the challenge", () => {
            expect(challenge.isFailed()).toBe(false);
        });
    });

    describe("setFailureStatus", () => {
        it("should set the challenge status to failed", () => {
            challenge.setFailureStatus(true);
            expect(challenge.isFailed()).toBe(true);
            challenge.setFailureStatus(false);
            expect(challenge.isFailed()).toBe(false);
        });

        it("should clear completion status when setting failure status", () => {
            challenge.setCompletionStatus(true);
            expect(challenge.isComplete()).toBe(true);
            challenge.setFailureStatus(true);
            expect(challenge.isFailed()).toBe(true);
            expect(challenge.isComplete()).toBe(false);
        });

        it("should return Error if status is not a boolean", () => {
            expect(() => challenge.setFailureStatus("true" as any)).toThrow(
                "Failure status must be of type boolean"
            );
        });
    });

    describe("getState", () => {
        it("should return 'in-progress' for a new challenge", () => {
            expect(challenge.getState()).toBe(CHALLENGE_STATES.IN_PROGRESS);
        });

        it("should return 'done' for a completed challenge", () => {
            challenge.setCompletionStatus(true);
            expect(challenge.getState()).toBe(CHALLENGE_STATES.DONE);
        });

        it("should return 'failed' for a failed challenge", () => {
            challenge.setFailureStatus(true);
            expect(challenge.getState()).toBe(CHALLENGE_STATES.FAILED);
        });
    });

    describe("cycleState", () => {
        it("should cycle from in-progress to done", () => {
            expect(challenge.getState()).toBe(CHALLENGE_STATES.IN_PROGRESS);
            const newState = challenge.cycleState();
            expect(newState).toBe(CHALLENGE_STATES.DONE);
            expect(challenge.getState()).toBe(CHALLENGE_STATES.DONE);
            expect(challenge.isComplete()).toBe(true);
            expect(challenge.isFailed()).toBe(false);
        });

        it("should cycle from done to failed", () => {
            challenge.setCompletionStatus(true);
            expect(challenge.getState()).toBe(CHALLENGE_STATES.DONE);
            const newState = challenge.cycleState();
            expect(newState).toBe(CHALLENGE_STATES.FAILED);
            expect(challenge.getState()).toBe(CHALLENGE_STATES.FAILED);
            expect(challenge.isComplete()).toBe(false);
            expect(challenge.isFailed()).toBe(true);
        });

        it("should cycle from failed to in-progress", () => {
            challenge.setFailureStatus(true);
            expect(challenge.getState()).toBe(CHALLENGE_STATES.FAILED);
            const newState = challenge.cycleState();
            expect(newState).toBe(CHALLENGE_STATES.IN_PROGRESS);
            expect(challenge.getState()).toBe(CHALLENGE_STATES.IN_PROGRESS);
            expect(challenge.isComplete()).toBe(false);
            expect(challenge.isFailed()).toBe(false);
        });

        it("should complete a full cycle: in-progress → done → failed → in-progress", () => {
            expect(challenge.getState()).toBe(CHALLENGE_STATES.IN_PROGRESS);

            challenge.cycleState();
            expect(challenge.getState()).toBe(CHALLENGE_STATES.DONE);

            challenge.cycleState();
            expect(challenge.getState()).toBe(CHALLENGE_STATES.FAILED);

            challenge.cycleState();
            expect(challenge.getState()).toBe(CHALLENGE_STATES.IN_PROGRESS);
        });
    });
});
