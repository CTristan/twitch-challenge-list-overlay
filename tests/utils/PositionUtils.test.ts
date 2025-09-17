import { describe, expect, it } from "vitest";
import {
    formatDisplayPosition,
    getChallengeByPosition,
    getChallengesByPositions,
    isValidUserPosition,
    parsePositionList,
    parseUserPosition,
} from "../../src/utils/PositionUtils";

describe("PositionUtils", () => {
    describe("parseUserPosition", () => {
        it("should parse valid positive integers", () => {
            expect(parseUserPosition("1")).toBe(0);
            expect(parseUserPosition("2")).toBe(1);
            expect(parseUserPosition("10")).toBe(9);
            expect(parseUserPosition("100")).toBe(99);
        });

        it("should handle whitespace", () => {
            expect(parseUserPosition(" 1 ")).toBe(0);
            expect(parseUserPosition("  5  ")).toBe(4);
        });

        it("should reject invalid inputs", () => {
            expect(parseUserPosition("0")).toBeNull();
            expect(parseUserPosition("-1")).toBeNull();
            expect(parseUserPosition("1.5")).toBeNull();
            expect(parseUserPosition("abc")).toBeNull();
            expect(parseUserPosition("")).toBeNull();
            expect(parseUserPosition(" ")).toBeNull();
            expect(parseUserPosition("1a")).toBeNull();
            expect(parseUserPosition("a1")).toBeNull();
        });
    });

    describe("isValidUserPosition", () => {
        it("should validate positive integers", () => {
            expect(isValidUserPosition("1")).toBe(true);
            expect(isValidUserPosition("5")).toBe(true);
            expect(isValidUserPosition("100")).toBe(true);
        });

        it("should reject invalid inputs", () => {
            expect(isValidUserPosition("0")).toBe(false);
            expect(isValidUserPosition("-1")).toBe(false);
            expect(isValidUserPosition("1.5")).toBe(false);
            expect(isValidUserPosition("abc")).toBe(false);
            expect(isValidUserPosition("")).toBe(false);
        });
    });

    describe("getChallengeByPosition", () => {
        const testArray = ["first", "second", "third", "fourth"];

        it("should return correct elements", () => {
            expect(getChallengeByPosition(testArray, "1")).toBe("first");
            expect(getChallengeByPosition(testArray, "2")).toBe("second");
            expect(getChallengeByPosition(testArray, "4")).toBe("fourth");
        });

        it("should return null for out of bounds", () => {
            expect(getChallengeByPosition(testArray, "5")).toBeNull();
            expect(getChallengeByPosition(testArray, "10")).toBeNull();
        });

        it("should return null for invalid positions", () => {
            expect(getChallengeByPosition(testArray, "0")).toBeNull();
            expect(getChallengeByPosition(testArray, "-1")).toBeNull();
            expect(getChallengeByPosition(testArray, "abc")).toBeNull();
        });

        it("should handle empty arrays", () => {
            expect(getChallengeByPosition([], "1")).toBeNull();
        });
    });

    describe("formatDisplayPosition", () => {
        it("should format indices correctly", () => {
            expect(formatDisplayPosition(0)).toBe("1");
            expect(formatDisplayPosition(1)).toBe("2");
            expect(formatDisplayPosition(9)).toBe("10");
            expect(formatDisplayPosition(99)).toBe("100");
        });

        it("should throw for invalid indices", () => {
            expect(() => formatDisplayPosition(-1)).toThrow(
                "Index must be a non-negative integer"
            );
            expect(() => formatDisplayPosition(1.5)).toThrow(
                "Index must be a non-negative integer"
            );
        });
    });

    describe("parsePositionList", () => {
        it("should parse comma-separated positions", () => {
            expect(parsePositionList("1,2,3")).toEqual([0, 1, 2]);
            expect(parsePositionList("1,3,5")).toEqual([0, 2, 4]);
            expect(parsePositionList("10,20,30")).toEqual([9, 19, 29]);
        });

        it("should handle whitespace", () => {
            expect(parsePositionList(" 1 , 2 , 3 ")).toEqual([0, 1, 2]);
            expect(parsePositionList("1,  2,   3")).toEqual([0, 1, 2]);
        });

        it("should filter invalid positions", () => {
            expect(parsePositionList("1,abc,3")).toEqual([0, 2]);
            expect(parsePositionList("1,0,3")).toEqual([0, 2]);
            expect(parsePositionList("1,-1,3")).toEqual([0, 2]);
        });

        it("should handle empty input", () => {
            expect(parsePositionList("")).toEqual([]);
            expect(parsePositionList(" ")).toEqual([]);
        });

        it("should handle single positions", () => {
            expect(parsePositionList("5")).toEqual([4]);
        });
    });

    describe("getChallengesByPositions", () => {
        const testArray = ["first", "second", "third", "fourth", "fifth"];

        it("should return multiple challenges", () => {
            expect(getChallengesByPositions(testArray, "1,3,5")).toEqual([
                "first",
                "third",
                "fifth",
            ]);
            expect(getChallengesByPositions(testArray, "2,4")).toEqual([
                "second",
                "fourth",
            ]);
        });

        it("should handle out of bounds positions", () => {
            expect(getChallengesByPositions(testArray, "1,10,3")).toEqual([
                "first",
                "third",
            ]);
            expect(getChallengesByPositions(testArray, "6,7,8")).toEqual([]);
        });

        it("should handle invalid positions", () => {
            expect(getChallengesByPositions(testArray, "1,abc,3")).toEqual([
                "first",
                "third",
            ]);
            expect(getChallengesByPositions(testArray, "1,0,3")).toEqual([
                "first",
                "third",
            ]);
        });

        it("should handle empty input", () => {
            expect(getChallengesByPositions(testArray, "")).toEqual([]);
        });

        it("should handle single positions", () => {
            expect(getChallengesByPositions(testArray, "3")).toEqual(["third"]);
        });
    });
});
