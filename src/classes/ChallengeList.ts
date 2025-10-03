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
    #challengesCompleted: number;
    #totalChallenges: number;
    #challengeMap: Map<string, Challenge>;
    challenges: Challenge[];

    /**
     * @constructor
     * @param localStoreName - The name of the local storage key
     */
    constructor(localStoreName: string = "challengeList") {
        this.#localStoreName = localStoreName;
        this.#challengesCompleted = 0;
        this.#totalChallenges = 0;
        this.#challengeMap = new Map<string, Challenge>();
        this.challenges = this.#loadChallengeListFromLocalStorage();
    }

    /**
     * Get the number of completed challenges
     * @returns The number of completed challenges
     */
    get challengesCompleted(): number {
        return this.#challengesCompleted;
    }

    /**
     * Get the total number of challenges
     * @returns The total number of challenges
     */
    get totalChallenges(): number {
        return this.#totalChallenges;
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
                this.#totalChallenges++;

                // Count completed challenges during loading
                if (challenge.isComplete()) {
                    this.#challengesCompleted++;
                }

                challengeList.push(challenge);
                // Populate the challenge map for O(1) lookups
                this.#challengeMap.set(challenge.id, challenge);
            });
        } else {
            // Initialize empty storage if no data found
            this.#commitToLocalStorage();
        }

        return challengeList;
    }

    /**
     * Reload the challenge list from local storage
     * This is used to synchronize state when changes are made in another window
     * @returns {void}
     */
    loadFromLocalStorage(): void {
        // Reset counters and map
        this.#challengesCompleted = 0;
        this.#totalChallenges = 0;
        this.#challengeMap.clear();

        // Reload challenges from localStorage
        this.challenges = this.#loadChallengeListFromLocalStorage();
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
     * Get challenge by ID using the internal challenge map for O(1) lookup
     * @param id - The ID of the challenge
     * @returns The challenge with the specified ID or undefined if not found
     */
    getChallengeById(id: string): Challenge | undefined {
        return this.#challengeMap.get(id);
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
            this.#totalChallenges++;
            // Add to challenge map for O(1) lookups
            this.#challengeMap.set(challenge.id, challenge);
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
            this.#totalChallenges++;
            // Add to challenge map for O(1) lookups
            this.#challengeMap.set(challenge.id, challenge);
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
                this.#challengesCompleted++;
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
        const validIndexSet = new Set(validIndices);
        const deletedChallenges: Challenge[] = [];

        this.challenges = this.challenges.filter((challenge, i) => {
            if (validIndexSet.has(i)) {
                deletedChallenges.push(challenge);
                // Remove from challenge map
                this.#challengeMap.delete(challenge.id);
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
        this.#challengesCompleted = 0;
        this.#totalChallenges = 0;
        // Clear the challenge map
        this.#challengeMap.clear();

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
                // Remove from challenge map
                this.#challengeMap.delete(challenge.id);
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
     * Toggle the completion status of a challenge by ID
     * Handles timer start/stop logic and automatically updates counters and persists
     * @param challengeId - The ID of the challenge to toggle
     * @returns The toggled challenge or null if not found
     */
    toggleChallengeCompletion(challengeId: string): Challenge | null {
        const challenge = this.#challengeMap.get(challengeId);
        if (!challenge) {
            return null;
        }

        const wasComplete = challenge.isComplete();

        if (wasComplete) {
            // Revert to active status
            challenge.setCompletionStatus(false);
            this.#challengesCompleted--;

            // Restart timer if it exists and has remaining time
            if (
                challenge.timer &&
                !challenge.timer.isActive &&
                challenge.timer.getRemainingTime() > 0
            ) {
                challenge.timer.start();
            }
        } else {
            // Mark as complete
            challenge.setCompletionStatus(true);
            this.#challengesCompleted++;

            // Stop timer if running
            if (challenge.timer && challenge.timer.isActive) {
                challenge.timer.stop();
            }
        }

        this.#commitToLocalStorage();
        return challenge;
    }

    /**
     * Increment the progress of a challenge by ID
     * @param challengeId - The ID of the challenge
     * @param amount - The amount to increment (default: 1)
     * @returns The updated challenge or null if not found
     */
    incrementChallengeProgress(
        challengeId: string,
        amount: number = 1
    ): Challenge | null {
        const challenge = this.#challengeMap.get(challengeId);
        if (!challenge) {
            return null;
        }

        const wasComplete = challenge.isComplete();
        challenge.incrementProgress(amount);
        const isNowComplete = challenge.isComplete();

        // Update counter if completion status changed
        if (!wasComplete && isNowComplete) {
            this.#challengesCompleted++;
        }

        this.#commitToLocalStorage();
        return challenge;
    }

    /**
     * Decrement the progress of a challenge by ID
     * @param challengeId - The ID of the challenge
     * @param amount - The amount to decrement (default: 1)
     * @returns The updated challenge or null if not found
     */
    decrementChallengeProgress(
        challengeId: string,
        amount: number = 1
    ): Challenge | null {
        const challenge = this.#challengeMap.get(challengeId);
        if (!challenge) {
            return null;
        }

        const wasComplete = challenge.isComplete();
        challenge.decrementProgress(amount);
        const isNowComplete = challenge.isComplete();

        // Update counter if completion status changed
        if (wasComplete && !isNowComplete) {
            this.#challengesCompleted--;
        }

        this.#commitToLocalStorage();
        return challenge;
    }

    /**
     * Set the progress of a challenge by ID
     * @param challengeId - The ID of the challenge
     * @param progress - The new progress value
     * @returns The updated challenge or null if not found
     */
    setChallengeProgress(
        challengeId: string,
        progress: number
    ): Challenge | null {
        const challenge = this.#challengeMap.get(challengeId);
        if (!challenge) {
            return null;
        }

        const wasComplete = challenge.isComplete();
        challenge.setProgress(progress);
        const isNowComplete = challenge.isComplete();

        // Update counter if completion status changed
        if (wasComplete && !isNowComplete) {
            this.#challengesCompleted--;
        } else if (!wasComplete && isNowComplete) {
            this.#challengesCompleted++;
        }

        this.#commitToLocalStorage();
        return challenge;
    }

    /**
     * Adjust the challenge count when challenges are removed
     * @param removedChallenges - The challenges that were removed
     */
    #decreaseChallengeCount(removedChallenges: Challenge[]): void {
        removedChallenges.forEach((challenge) => {
            if (challenge.isComplete()) {
                this.#challengesCompleted--;
            }
            this.#totalChallenges--;
        });
    }

    /**
     * Add a challenge directly to the list for testing purposes
     * This bypasses normal validation and directly manipulates internal state
     * @param challenge - The challenge to add
     * @internal This method is intended for testing only
     */
    addChallengeForTesting(challenge: Challenge): void {
        this.challenges.push(challenge);
        this.#totalChallenges++;
        if (challenge.isComplete()) {
            this.#challengesCompleted++;
        }
        // Add to challenge map for O(1) lookups
        this.#challengeMap.set(challenge.id, challenge);
    }
}
