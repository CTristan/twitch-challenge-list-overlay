import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";

describe("Challenge", () => {
    let challenge: Challenge;

    beforeEach(() => {
        challenge = new Challenge("Buy groceries");
    });

    describe("constructor", () => {
        it("should see that all properties are assigned correctly", () => {
            expect(challenge.description).toBeTypeOf("string");
            expect(challenge.id).toBeTypeOf("string");
            expect(challenge.completionStatus).toBeTypeOf("boolean");
        });
    });

    describe("validateDescription", () => {
        it("should return the description if it is valid", () => {
            expect(challenge.validateDescription("Buy groceries")).toBe(
                "Buy groceries"
            );
        });

        it("should throw an error if the description is invalid", () => {
            expect(() => challenge.validateDescription("")).toThrow(
                "Challenge description cannot be empty"
            );
        });

        it("should throw Error if description is not a string", () => {
            expect(() => challenge.validateDescription(123 as any)).toThrow(
                "Challenge description must be of type string"
            );
            expect(() => challenge.validateDescription(true as any)).toThrow(
                "Challenge description must be of type string"
            );
            expect(() => challenge.validateDescription([] as any)).toThrow(
                "Challenge description must be of type string"
            );
            expect(() => challenge.validateDescription({} as any)).toThrow(
                "Challenge description must be of type string"
            );
        });
    });

    describe("getDescription", () => {
        it("should return the description of the challenge", () => {
            expect(challenge.description).toBe("Buy groceries");
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
});
