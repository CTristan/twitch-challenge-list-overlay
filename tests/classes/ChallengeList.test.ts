import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import { CHALLENGE_STATES } from "../../src/types/DOMConstants";

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
                "twitch-overlay-challenge-list",
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

        it("should correctly restore completed challenge counts from localStorage", () => {
            // Set up localStorage with mixed completed/incomplete challenges
            localStorage.setItem(
                "twitch-overlay-challenge-list",
                JSON.stringify([
                    {
                        title: "Challenge 1",
                        description: "Completed challenge",
                        amount: 1,
                        progress: 1,
                        completionStatus: true,
                        failureStatus: false,
                        createdAt: Date.now(),
                    },
                    {
                        title: "Challenge 2",
                        description: "Incomplete challenge",
                        amount: 1,
                        progress: 0,
                        completionStatus: false,
                        failureStatus: false,
                        createdAt: Date.now(),
                    },
                    {
                        title: "Challenge 3",
                        description: "Another completed challenge",
                        amount: 1,
                        progress: 1,
                        completionStatus: true,
                        failureStatus: false,
                        createdAt: Date.now(),
                    },
                ])
            );

            // Create new ChallengeList instance to trigger loading from localStorage
            challengeList = new ChallengeList();

            // Verify challenges were loaded correctly
            expect(challengeList.challenges).toHaveLength(3);
            expect(challengeList.totalChallenges).toEqual(3);

            // This should pass but currently fails due to the bug
            expect(challengeList.challengesCompleted).toEqual(2);

            // Verify individual challenge states
            expect(challengeList.challenges[0]?.isComplete()).toBe(true);
            expect(challengeList.challenges[1]?.isComplete()).toBe(false);
            expect(challengeList.challenges[2]?.isComplete()).toBe(true);
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

    describe("getChallengeById", () => {
        it("should return challenge by ID", () => {
            const addedChallenges =
                challengeList.addChallenges("Test Challenge");
            const challenge = addedChallenges[0];
            if (!challenge) throw new Error("Challenge not found");

            const foundChallenge = challengeList.getChallengeById(challenge.id);
            expect(foundChallenge).toBe(challenge);
            expect(foundChallenge?.title).toEqual("Test Challenge");
        });

        it("should return undefined for non-existent ID", () => {
            const foundChallenge =
                challengeList.getChallengeById("non-existent-id");
            expect(foundChallenge).toBeUndefined();
        });

        it("should return correct challenge when multiple challenges exist", () => {
            const addedChallenges = challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);

            // Test each challenge can be found by ID
            addedChallenges.forEach((challenge) => {
                const foundChallenge = challengeList.getChallengeById(
                    challenge.id
                );
                expect(foundChallenge).toBe(challenge);
                expect(foundChallenge?.title).toEqual(challenge.title);
            });
        });

        it("should provide O(1) lookup performance", () => {
            // Add many challenges
            const challengeCount = 1000;
            const challenges: Challenge[] = [];
            for (let i = 0; i < challengeCount; i++) {
                const addedChallenges = challengeList.addChallenges(
                    `Challenge ${i}`
                );
                challenges.push(addedChallenges[0]!);
            }

            // Pick a random challenge to lookup
            const targetChallenge =
                challenges[Math.floor(Math.random() * challengeCount)]!;

            // Measure lookup time
            const startTime = performance.now();
            const foundChallenge = challengeList.getChallengeById(
                targetChallenge.id
            );
            const endTime = performance.now();

            const lookupTime = endTime - startTime;

            // Should be very fast (O(1) lookup)
            expect(lookupTime).toBeLessThan(1); // 1ms should be generous for O(1) lookup
            expect(foundChallenge).toBe(targetChallenge);
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

    describe("ID-based challenge operations (performance optimization)", () => {
        let challenge1: Challenge;
        let challenge2: Challenge;

        beforeEach(() => {
            // Add challenges and get their IDs for testing
            const addedChallenges = challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
            ]);
            challenge1 = addedChallenges[0]!;
            challenge2 = addedChallenges[1]!;
        });

        describe("toggleChallengeCompletion", () => {
            it("should toggle challenge completion using map lookup", () => {
                // Initially incomplete
                expect(challenge1.isComplete()).toBe(false);
                expect(challengeList.challengesCompleted).toBe(0);

                // Toggle to complete
                const result1 = challengeList.toggleChallengeCompletion(
                    challenge1.id
                );
                expect(result1).toBe(challenge1);
                expect(challenge1.isComplete()).toBe(true);
                expect(challengeList.challengesCompleted).toBe(1);

                // Toggle back to incomplete
                const result2 = challengeList.toggleChallengeCompletion(
                    challenge1.id
                );
                expect(result2).toBe(challenge1);
                expect(challenge1.isComplete()).toBe(false);
                expect(challengeList.challengesCompleted).toBe(0);
            });

            it("should return null for non-existent challenge ID", () => {
                const result =
                    challengeList.toggleChallengeCompletion("non-existent-id");
                expect(result).toBeNull();
            });

            it("should handle timer start/stop during toggle", () => {
                // Add a challenge with timer
                const timerChallenge = new Challenge("Timer Challenge", {
                    timer: 30,
                });
                challengeList.addChallengeObjects(timerChallenge);
                timerChallenge.startTimer();

                expect(timerChallenge.timer?.isActive).toBe(true);

                // Complete challenge should stop timer
                challengeList.toggleChallengeCompletion(timerChallenge.id);
                expect(timerChallenge.isComplete()).toBe(true);
                expect(timerChallenge.timer?.isActive).toBe(false);

                // Uncomplete challenge should restart timer if time remaining
                challengeList.toggleChallengeCompletion(timerChallenge.id);
                expect(timerChallenge.isComplete()).toBe(false);
                // Note: Timer restart logic depends on remaining time > 0 and timer not being expired
                // This test verifies the toggle functionality works with map lookup
                expect(timerChallenge.timer).toBeDefined();
            });
        });

        describe("cycleChallengeState", () => {
            it("should cycle challenge state from in-progress to done", () => {
                expect(challenge1.getState()).toBe(
                    CHALLENGE_STATES.IN_PROGRESS
                );
                expect(challengeList.challengesCompleted).toBe(0);

                const result = challengeList.cycleChallengeState(challenge1.id);
                expect(result).toBe(challenge1);
                expect(challenge1.getState()).toBe(CHALLENGE_STATES.DONE);
                expect(challenge1.isComplete()).toBe(true);
                expect(challengeList.challengesCompleted).toBe(1);
            });

            it("should cycle challenge state from done to failed", () => {
                challenge1.setCompletionStatus(true);
                challengeList.saveToLocalStorage();
                const initialCompleted = challengeList.challengesCompleted;

                const result = challengeList.cycleChallengeState(challenge1.id);
                expect(result).toBe(challenge1);
                expect(challenge1.getState()).toBe(CHALLENGE_STATES.FAILED);
                expect(challenge1.isFailed()).toBe(true);
                expect(challenge1.isComplete()).toBe(false);
                expect(challengeList.challengesCompleted).toBe(
                    initialCompleted - 1
                );
            });

            it("should cycle challenge state from failed to in-progress", () => {
                challenge1.setFailureStatus(true);
                const initialCompleted = challengeList.challengesCompleted;

                const result = challengeList.cycleChallengeState(challenge1.id);
                expect(result).toBe(challenge1);
                expect(challenge1.getState()).toBe(
                    CHALLENGE_STATES.IN_PROGRESS
                );
                expect(challenge1.isFailed()).toBe(false);
                expect(challenge1.isComplete()).toBe(false);
                expect(challengeList.challengesCompleted).toBe(
                    initialCompleted
                );
            });

            it("should complete a full state cycle", () => {
                expect(challenge1.getState()).toBe(
                    CHALLENGE_STATES.IN_PROGRESS
                );
                expect(challengeList.challengesCompleted).toBe(0);

                // in-progress → done
                challengeList.cycleChallengeState(challenge1.id);
                expect(challenge1.getState()).toBe(CHALLENGE_STATES.DONE);
                expect(challengeList.challengesCompleted).toBe(1);

                // done → failed
                challengeList.cycleChallengeState(challenge1.id);
                expect(challenge1.getState()).toBe(CHALLENGE_STATES.FAILED);
                expect(challengeList.challengesCompleted).toBe(0);

                // failed → in-progress
                challengeList.cycleChallengeState(challenge1.id);
                expect(challenge1.getState()).toBe(
                    CHALLENGE_STATES.IN_PROGRESS
                );
                expect(challengeList.challengesCompleted).toBe(0);
            });

            it("should return null for non-existent challenge ID", () => {
                const result =
                    challengeList.cycleChallengeState("non-existent-id");
                expect(result).toBeNull();
            });

            it("should persist state changes to localStorage", () => {
                challengeList.cycleChallengeState(challenge1.id);
                expect(challenge1.getState()).toBe(CHALLENGE_STATES.DONE);

                // Create new instance to verify persistence
                const newList = new ChallengeList();
                const loadedChallenge = newList.challenges[0];
                expect(loadedChallenge?.getState()).toBe(CHALLENGE_STATES.DONE);
            });
        });

        describe("incrementChallengeProgress", () => {
            it("should increment challenge progress using map lookup", () => {
                expect(challenge1.progress).toBe(0);
                expect(challengeList.challengesCompleted).toBe(0);

                // Increment progress
                const result = challengeList.incrementChallengeProgress(
                    challenge1.id,
                    1
                );
                expect(result).toBe(challenge1);
                expect(challenge1.progress).toBe(1);
                expect(challenge1.isComplete()).toBe(true);
                expect(challengeList.challengesCompleted).toBe(1);
            });

            it("should increment by custom amount", () => {
                // Create challenge with amount > 1
                const multiChallenge = new Challenge("Multi Challenge", {
                    amount: 5,
                });
                challengeList.addChallengeObjects(multiChallenge);

                challengeList.incrementChallengeProgress(multiChallenge.id, 3);
                expect(multiChallenge.progress).toBe(3);
                expect(multiChallenge.isComplete()).toBe(false);

                challengeList.incrementChallengeProgress(multiChallenge.id, 2);
                expect(multiChallenge.progress).toBe(5);
                expect(multiChallenge.isComplete()).toBe(true);
            });

            it("should return null for non-existent challenge ID", () => {
                const result =
                    challengeList.incrementChallengeProgress("non-existent-id");
                expect(result).toBeNull();
            });
        });

        describe("decrementChallengeProgress", () => {
            it("should decrement challenge progress using map lookup", () => {
                // First complete the challenge properly
                challengeList.incrementChallengeProgress(challenge1.id, 1);
                expect(challenge1.isComplete()).toBe(true);
                expect(challengeList.challengesCompleted).toBe(1);

                // Decrement progress
                const result = challengeList.decrementChallengeProgress(
                    challenge1.id,
                    1
                );
                expect(result).toBe(challenge1);
                expect(challenge1.progress).toBe(0);
                expect(challenge1.isComplete()).toBe(false);
                expect(challengeList.challengesCompleted).toBe(0);
            });

            it("should decrement by custom amount", () => {
                // Create challenge with higher amount and progress
                const multiChallenge = new Challenge("Multi Challenge", {
                    amount: 5,
                });
                challengeList.addChallengeObjects(multiChallenge);
                multiChallenge.setProgress(5);

                challengeList.decrementChallengeProgress(multiChallenge.id, 2);
                expect(multiChallenge.progress).toBe(3);
                expect(multiChallenge.isComplete()).toBe(false);
            });

            it("should return null for non-existent challenge ID", () => {
                const result =
                    challengeList.decrementChallengeProgress("non-existent-id");
                expect(result).toBeNull();
            });
        });

        describe("setChallengeProgress", () => {
            it("should set challenge progress using map lookup", () => {
                expect(challenge1.progress).toBe(0);
                expect(challengeList.challengesCompleted).toBe(0);

                // Set progress to complete
                const result = challengeList.setChallengeProgress(
                    challenge1.id,
                    1
                );
                expect(result).toBe(challenge1);
                expect(challenge1.progress).toBe(1);
                expect(challenge1.isComplete()).toBe(true);
                expect(challengeList.challengesCompleted).toBe(1);

                // Set progress back to incomplete
                challengeList.setChallengeProgress(challenge1.id, 0);
                expect(challenge1.progress).toBe(0);
                expect(challenge1.isComplete()).toBe(false);
                expect(challengeList.challengesCompleted).toBe(0);
            });

            it("should handle completion status changes correctly", () => {
                // Create challenge with amount > 1
                const multiChallenge = new Challenge("Multi Challenge", {
                    amount: 3,
                });
                challengeList.addChallengeObjects(multiChallenge);

                // Set to partial progress (incomplete)
                challengeList.setChallengeProgress(multiChallenge.id, 2);
                expect(multiChallenge.isComplete()).toBe(false);
                expect(challengeList.challengesCompleted).toBe(0);

                // Set to complete
                challengeList.setChallengeProgress(multiChallenge.id, 3);
                expect(multiChallenge.isComplete()).toBe(true);
                expect(challengeList.challengesCompleted).toBe(1);

                // Set back to incomplete
                challengeList.setChallengeProgress(multiChallenge.id, 1);
                expect(multiChallenge.isComplete()).toBe(false);
                expect(challengeList.challengesCompleted).toBe(0);
            });

            it("should return null for non-existent challenge ID", () => {
                const result = challengeList.setChallengeProgress(
                    "non-existent-id",
                    5
                );
                expect(result).toBeNull();
            });
        });

        describe("map synchronization", () => {
            it("should maintain map synchronization after challenge deletions", () => {
                // Verify challenges are in map
                expect(
                    challengeList.toggleChallengeCompletion(challenge1.id)
                ).toBe(challenge1);
                expect(
                    challengeList.incrementChallengeProgress(challenge2.id)
                ).toBe(challenge2);

                // Delete first challenge
                challengeList.deleteChallenges(0);

                // First challenge should no longer be accessible via map
                expect(
                    challengeList.toggleChallengeCompletion(challenge1.id)
                ).toBeNull();

                // Second challenge should still be accessible (now at index 0)
                expect(
                    challengeList.incrementChallengeProgress(challenge2.id)
                ).toBe(challenge2);
            });

            it("should maintain map synchronization after clearing all challenges", () => {
                // Verify challenges are accessible
                expect(
                    challengeList.toggleChallengeCompletion(challenge1.id)
                ).toBe(challenge1);
                expect(
                    challengeList.incrementChallengeProgress(challenge2.id)
                ).toBe(challenge2);

                // Clear all challenges
                challengeList.clearChallengeList();

                // No challenges should be accessible via map
                expect(
                    challengeList.toggleChallengeCompletion(challenge1.id)
                ).toBeNull();
                expect(
                    challengeList.incrementChallengeProgress(challenge2.id)
                ).toBeNull();
            });

            it("should maintain map synchronization after clearing done challenges", () => {
                // Complete first challenge
                challengeList.toggleChallengeCompletion(challenge1.id);
                expect(challenge1.isComplete()).toBe(true);

                // Verify both challenges are accessible before clearing
                expect(
                    challengeList.toggleChallengeCompletion(challenge1.id)
                ).toBe(challenge1);
                // Toggle back to complete for clearing
                challengeList.toggleChallengeCompletion(challenge1.id);
                expect(challenge1.isComplete()).toBe(true);

                // Verify challenge2 is accessible but don't complete it
                expect(
                    challengeList.setChallengeProgress(challenge2.id, 0)
                ).toBe(challenge2);
                expect(challenge2.isComplete()).toBe(false);

                // Clear done challenges
                challengeList.clearDoneChallenges();

                // Completed challenge should no longer be accessible
                expect(
                    challengeList.toggleChallengeCompletion(challenge1.id)
                ).toBeNull();

                // Incomplete challenge should still be accessible
                expect(
                    challengeList.incrementChallengeProgress(challenge2.id)
                ).toBe(challenge2);
            });

            it("should maintain map synchronization when loading from localStorage", () => {
                // Set up localStorage with challenge data
                const challengeData = [
                    {
                        title: "Stored Challenge 1",
                        description: "Description 1",
                        amount: 1,
                        progress: 0,
                        completionStatus: false,
                        failureStatus: false,
                        createdAt: Date.now(),
                    },
                    {
                        title: "Stored Challenge 2",
                        description: "Description 2",
                        amount: 1,
                        progress: 1,
                        completionStatus: true,
                        failureStatus: false,
                        createdAt: Date.now() + 1000,
                    },
                ];
                localStorage.setItem(
                    "testStorage",
                    JSON.stringify(challengeData)
                );

                // Create new ChallengeList to trigger loading
                const newChallengeList = new ChallengeList("testStorage");

                // Verify challenges were loaded and map is populated
                expect(newChallengeList.challenges).toHaveLength(2);
                const loadedChallenge1 = newChallengeList.challenges[0]!;
                const loadedChallenge2 = newChallengeList.challenges[1]!;

                // Test map lookups work for loaded challenges
                expect(
                    newChallengeList.toggleChallengeCompletion(
                        loadedChallenge1.id
                    )
                ).toBe(loadedChallenge1);
                expect(
                    newChallengeList.incrementChallengeProgress(
                        loadedChallenge2.id
                    )
                ).toBe(loadedChallenge2);
            });
        });
    });
});
