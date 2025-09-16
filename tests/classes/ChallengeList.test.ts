import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";

describe("ChallengeList", () => {
    let challengeList: ChallengeList;

    beforeEach(() => {
        localStorage.clear();
        challengeList = new ChallengeList();
    });

    describe("constructor", () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it("should load an empty challenge list if localStorage does not contain challengeList", () => {
            challengeList = new ChallengeList();
            expect(challengeList.challenges).toEqual([]);
        });

        it("should load challenge list if localStorage contains challengeList", () => {
            localStorage.setItem(
                "challengeList",
                JSON.stringify([
                    {
                        title: "Challenge 1",
                        description: "Description for challenge 1",
                        amount: 1,
                        progress: 0,
                        completionStatus: false,
                        failureStatus: false,
                        createdAt: Date.now(),
                    },
                ])
            );
            challengeList = new ChallengeList();
            const challenge = challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");
            expect(challenge.title).toEqual("Challenge 1");
            expect(challenge.description).toEqual(
                "Description for challenge 1"
            );
            expect(challenge.completionStatus).toEqual(false);
        });
    });

    describe("getAllChallenges", () => {
        it("should return all challenges", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            const challenges = challengeList.getAllChallenges();
            expect(challenges).toHaveLength(2);
            if (!challenges[0] || !challenges[1])
                throw new Error("Challenges not found");
            expect(challenges[0].title).toEqual("Challenge 1");
            expect(challenges[1].title).toEqual("Challenge 2");
        });

        it("should return an empty array if there are no challenges", () => {
            expect(challengeList.getAllChallenges()).toEqual([]);
        });
    });

    describe("getChallenge", () => {
        it("should return challenge by index", () => {
            challengeList.addChallenges("Challenge 1");
            const challenge = challengeList.getChallenge(0);
            expect(challenge!.title).toEqual("Challenge 1");
            expect(challenge).toBeInstanceOf(Challenge);
        });

        it("should return null if challenge does not exist", () => {
            expect(challengeList.getChallenge(0)).toBeNull();
        });
    });

    describe("addChallenges", () => {
        it("should add a single challenge", () => {
            const challenges = challengeList.addChallenges("Challenge 1");
            expect(challenges).toHaveLength(1);
            if (!challenges[0]) throw new Error("Challenge not found");
            expect(challenges[0].title).toEqual("Challenge 1");
            expect(challenges[0]).toBeInstanceOf(Challenge);
            expect(challengeList.totalChallenges).toEqual(1);
        });

        it("should add multiple challenges", () => {
            const challenges = challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
            ]);
            expect(challenges).toHaveLength(2);
            if (!challenges[0] || !challenges[1])
                throw new Error("Challenges not found");
            expect(challenges[0].title).toEqual("Challenge 1");
            expect(challenges[1].title).toEqual("Challenge 2");
            expect(challengeList.totalChallenges).toEqual(2);
        });
    });

    describe("editChallenge", () => {
        it("should edit the challenge at the specified index", () => {
            challengeList.addChallenges("Challenge 1");
            const challenge = challengeList.editChallenge(
                0,
                "Updated Challenge 1"
            );
            expect(challenge.description).toEqual("Updated Challenge 1");
            expect(challenge).toBeInstanceOf(Challenge);
        });

        it("should throw an error if challenge does not exist", () => {
            expect(() =>
                challengeList.editChallenge(0, "Updated Challenge 1")
            ).toThrow("Challenge 0 not found");
        });
    });

    describe("completeChallenges", () => {
        it("should complete a single challenge", () => {
            challengeList.addChallenges("Challenge 1");
            const challenges = challengeList.completeChallenges(0);
            expect(challenges).toHaveLength(1);
            if (!challenges[0]) throw new Error("Challenge not found");
            expect(challenges[0].isComplete()).toBe(true);
            expect(challengeList.challengesCompleted).toEqual(1);
        });

        it("should complete multiple challenges", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            const challenges = challengeList.completeChallenges([0, 1]);
            expect(challenges).toHaveLength(2);
            if (!challenges[0] || !challenges[1])
                throw new Error("Challenges not found");
            expect(challenges[0].isComplete()).toBe(true);
            expect(challenges[1].isComplete()).toBe(true);
            expect(challengeList.challengesCompleted).toEqual(2);
        });

        it("should not complete already completed challenges", () => {
            challengeList.addChallenges("Challenge 1");
            challengeList.completeChallenges(0);
            const challenges = challengeList.completeChallenges(0);
            expect(challenges).toHaveLength(0);
            expect(challengeList.challengesCompleted).toEqual(1);
        });

        it("should return empty array for non-existent challenge indices", () => {
            challengeList.addChallenges("Challenge 1");
            const challenges = challengeList.completeChallenges(3);
            expect(challenges).toHaveLength(0);
        });
    });

    describe("deleteChallenges", () => {
        it("should delete a single challenge", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            const deletedChallenges = challengeList.deleteChallenges(0);
            expect(deletedChallenges).toHaveLength(1);
            if (!deletedChallenges[0])
                throw new Error("Deleted challenge not found");
            expect(deletedChallenges[0].title).toEqual("Challenge 1");
            expect(challengeList.challenges).toHaveLength(1);
            expect(challengeList.totalChallenges).toEqual(1);
        });

        it("should delete multiple challenges", () => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            const deletedChallenges = challengeList.deleteChallenges([0, 2]);
            expect(deletedChallenges).toHaveLength(2);
            if (!deletedChallenges[0] || !deletedChallenges[1])
                throw new Error("Deleted challenges not found");
            expect(deletedChallenges[0].title).toEqual("Challenge 1");
            expect(deletedChallenges[1].title).toEqual("Challenge 3");
            expect(challengeList.challenges).toHaveLength(1);
            if (!challengeList.challenges[0])
                throw new Error("Remaining challenge not found");
            expect(challengeList.challenges[0].title).toEqual("Challenge 2");
        });

        it("should return empty array if indices are out of bounds", () => {
            const deletedChallenges = challengeList.deleteChallenges(10);
            expect(deletedChallenges).toHaveLength(0);
        });

        it("should decrease completed count when deleting completed challenges", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            challengeList.completeChallenges(0);
            challengeList.deleteChallenges(0);
            expect(challengeList.challengesCompleted).toEqual(0);
            expect(challengeList.totalChallenges).toEqual(1);
        });
    });

    describe("checkChallenges", () => {
        it("should return incomplete challenges by default", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            challengeList.completeChallenges(0);
            const challengeMap = challengeList.checkChallenges();
            expect(challengeMap.size).toEqual(1);
            expect(challengeMap.get(1)!.title).toEqual("Challenge 2");
        });

        it("should return completed challenges when specified", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            challengeList.completeChallenges(0);
            const challengeMap = challengeList.checkChallenges("complete");
            expect(challengeMap.size).toEqual(1);
            expect(challengeMap.get(0)!.title).toEqual("Challenge 1");
        });

        it("should return empty map if no challenges match status", () => {
            const challengeMap = challengeList.checkChallenges();
            expect(challengeMap.size).toEqual(0);
            expect(challengeMap).toBeInstanceOf(Map);
        });
    });

    describe("clearChallengeList", () => {
        it("should clear all challenges", () => {
            challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            challengeList.completeChallenges(0);
            challengeList.clearChallengeList();
            expect(challengeList.challenges).toEqual([]);
            expect(challengeList.challengesCompleted).toEqual(0);
            expect(challengeList.totalChallenges).toEqual(0);
        });
    });

    describe("clearDoneChallenges", () => {
        it("should clear all completed challenges", () => {
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            challengeList.completeChallenges([0, 2]);
            const removedChallenges = challengeList.clearDoneChallenges();
            expect(removedChallenges).toHaveLength(2);
            expect(challengeList.challenges).toHaveLength(1);
            if (!challengeList.challenges[0])
                throw new Error("Remaining challenge not found");
            expect(challengeList.challenges[0].title).toEqual("Challenge 2");
            expect(challengeList.challengesCompleted).toEqual(0);
            expect(challengeList.totalChallenges).toEqual(1);
        });

        it("should return empty array if no completed challenges", () => {
            challengeList.addChallenges("Challenge 1");
            const removedChallenges = challengeList.clearDoneChallenges();
            expect(removedChallenges).toHaveLength(0);
            expect(challengeList.challenges).toHaveLength(1);
        });
    });
});
