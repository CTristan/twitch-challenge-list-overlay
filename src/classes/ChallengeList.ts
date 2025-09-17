import { StorageManager } from "../utils/StorageManager";
import Challenge from "./Challenge";

/**
 * Interface for serialized challenge data in localStorage
 */
interface SerializedChallenge {
    title: string;
    description: string;
    amount: number;
    progress: number;
    completionStatus: boolean;
    failureStatus: boolean;
    createdAt: number;
    timer?: any;
}

/**
 * @class ChallengeList
 * Manages a single unified list of challenges for the streamer challenge overlay system.
 * Replaces the multi-user UserList architecture with a simplified single-list approach.
 */
export default class ChallengeList {
    #localStoreName: string;
    challenges: Challenge[];
    public challengesCompleted: number;
    public totalChallenges: number;

    /**
     * @constructor
     * @param localStoreName - The name of the local storage key
     */
    constructor(localStoreName: string = "challengeList") {
        this.#localStoreName = localStoreName;
        this.challengesCompleted = 0;
        this.totalChallenges = 0;
        this.challenges = this.#loadChallengeListFromLocalStorage();
    }

    /**
     * Load the challenge list from local storage
     * @returns The challenge list
     */
    #loadChallengeListFromLocalStorage(): Challenge[] {
        const challengeList: Challenge[] = [];

        const result = StorageManager.load<SerializedChallenge[]>(
            this.#localStoreName,
            [],
            (data): data is SerializedChallenge[] => Array.isArray(data)
        );

        if (result.success && result.data && Array.isArray(result.data)) {
            result.data.forEach((serializedChallenge) => {
                const challenge =
                    Challenge.fromSerializedData(serializedChallenge);
                this.totalChallenges++;

                challengeList.push(challenge);
            });
        } else {
            // Initialize empty storage if no data found
            this.#commitToLocalStorage();
        }

        return challengeList;
    }

    /**
     * Commit challenge list changes to local storage
     */
    #commitToLocalStorage(): void {
        const serializedChallenges = this.challenges.map((challenge) =>
            challenge.toSerializedData()
        );

        const result = StorageManager.save(
            this.#localStoreName,
            serializedChallenges
        );
        if (!result.success) {
            console.error("Failed to save challenge list:", result.error);
        }
    }

    /**
     * Get all challenges
     * @returns All challenges
     */
    getAllChallenges(): Challenge[] {
        return this.challenges;
    }

    /**
     * Get challenge by index
     * @param index - The index of the challenge
     * @returns The challenge at the specified index or null if not found
     */
    getChallenge(index: number): Challenge | null {
        return this.#validChallengeIndex(index)
            ? this.challenges[index] ?? null
            : null;
    }

    /**
     * Add challenges to the list
     * @param challengeTitles - The challenge titles to add
     * @returns The added challenges
     */
    addChallenges(challengeTitles: string | string[]): Challenge[] {
        const titles = Array.isArray(challengeTitles)
            ? challengeTitles
            : [challengeTitles];

        const addedChallenges: Challenge[] = [];

        titles.forEach((challengeTitle) => {
            const challenge = new Challenge(challengeTitle);
            this.challenges.push(challenge);
            addedChallenges.push(challenge);
            this.totalChallenges++;
        });

        this.#commitToLocalStorage();
        return addedChallenges;
    }

    /**
     * Add pre-constructed Challenge objects to the list
     * @param challengeObjects - The Challenge objects to add
     * @returns The added challenges
     */
    addChallengeObjects(
        challengeObjects: Challenge | Challenge[]
    ): Challenge[] {
        const challenges = Array.isArray(challengeObjects)
            ? challengeObjects
            : [challengeObjects];

        const addedChallenges: Challenge[] = [];

        challenges.forEach((challenge) => {
            this.challenges.push(challenge);
            addedChallenges.push(challenge);
            this.totalChallenges++;
        });

        this.#commitToLocalStorage();
        return addedChallenges;
    }

    /**
     * Edit the challenge at the specified index
     * @param challengeIndex - The index of the challenge to edit
     * @param challengeDescription - The new challenge description
     * @throws Error if challenge not found
     * @returns The edited challenge
     */
    editChallenge(
        challengeIndex: number,
        challengeDescription: string
    ): Challenge {
        const challenge = this.getChallenge(challengeIndex);
        if (!challenge) {
            throw new Error(`Challenge ${challengeIndex} not found`);
        }

        challenge.setDescription(challengeDescription);
        this.#commitToLocalStorage();
        return challenge;
    }

    /**
     * Mark challenges as complete
     * @param indices - The indices of the challenges to complete
     * @returns The completed challenges
     */
    completeChallenges(indices: number | number[]): Challenge[] {
        const indexArray = Array.isArray(indices) ? indices : [indices];
        const completedChallenges: Challenge[] = [];

        indexArray.forEach((index) => {
            const challenge = this.getChallenge(index);
            if (challenge && !challenge.isComplete()) {
                challenge.setCompletionStatus(true);
                this.challengesCompleted++;
                completedChallenges.push(challenge);
            }
        });

        this.#commitToLocalStorage();
        return completedChallenges;
    }

    /**
     * Delete challenges at specified indices
     * @param indices - The indices of the challenges to delete
     * @returns The deleted challenges
     */
    deleteChallenges(indices: number | number[]): Challenge[] {
        const indexArray = Array.isArray(indices) ? indices : [indices];
        const validIndices = indexArray.filter((i) =>
            this.#validChallengeIndex(i)
        );
        const deletedChallenges: Challenge[] = [];

        this.challenges = this.challenges.filter((challenge, i) => {
            if (validIndices.includes(i)) {
                deletedChallenges.push(challenge);
                return false;
            }
            return true;
        });

        this.#decreaseChallengeCount(deletedChallenges);
        this.#commitToLocalStorage();
        return deletedChallenges;
    }

    /**
     * Get challenges by completion status
     * @param status - The completion status to filter by
     * @returns Map of challenge indices to challenges
     */
    checkChallenges(
        status: "incomplete" | "complete" = "incomplete"
    ): Map<number, Challenge> {
        const map = new Map<number, Challenge>();

        this.challenges.forEach((challenge, i) => {
            if (status === "incomplete" && !challenge.isComplete()) {
                map.set(i, challenge);
            }
            if (status === "complete" && challenge.isComplete()) {
                map.set(i, challenge);
            }
        });

        return map;
    }

    /**
     * Clear all challenges
     */
    clearChallengeList(): void {
        this.challenges = [];
        this.challengesCompleted = 0;
        this.totalChallenges = 0;

        this.#commitToLocalStorage();
    }

    /**
     * Clear all completed challenges
     * @returns The deleted challenges
     */
    clearDoneChallenges(): Challenge[] {
        const removedChallenges: Challenge[] = [];

        this.challenges = this.challenges.filter((challenge) => {
            if (challenge.isComplete()) {
                removedChallenges.push(challenge);
                return false;
            }
            return true;
        });

        this.#decreaseChallengeCount(removedChallenges);
        this.#commitToLocalStorage();
        return removedChallenges;
    }

    /**
     * Validates the challenge index
     * @param index - The index to validate
     * @returns Whether the index is valid
     */
    #validChallengeIndex(index: number): boolean {
        return (
            typeof index === "number" &&
            !isNaN(index) &&
            index >= 0 &&
            index < this.challenges.length
        );
    }

    /**
     * Adjust the challenge count when challenges are removed
     * @param removedChallenges - The challenges that were removed
     */
    #decreaseChallengeCount(removedChallenges: Challenge[]): void {
        removedChallenges.forEach((challenge) => {
            if (challenge.isComplete()) {
                this.challengesCompleted--;
            }
            this.totalChallenges--;
        });
    }
}
