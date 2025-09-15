import Challenge from "./Challenge";

/**
 * Interface for serialized challenge data in localStorage
 */
interface SerializedChallenge {
  description: string;
  completionStatus: boolean;
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
    const lStore = localStorage.getItem(this.#localStoreName);

    if (lStore) {
      const serializedChallenges: SerializedChallenge[] = JSON.parse(lStore);
      serializedChallenges.forEach((serializedChallenge) => {
        const challenge = new Challenge(serializedChallenge.description);
        this.totalChallenges++;

        if (serializedChallenge.completionStatus) {
          challenge.setCompletionStatus(serializedChallenge.completionStatus);
          this.challengesCompleted++;
        }

        challengeList.push(challenge);
      });
    } else {
      localStorage.setItem(this.#localStoreName, JSON.stringify(challengeList));
    }

    return challengeList;
  }

  /**
   * Commit challenge list changes to local storage
   */
  #commitToLocalStorage(): void {
    const serializedChallenges: SerializedChallenge[] = this.challenges.map(
      (challenge) => ({
        description: challenge.description,
        completionStatus: challenge.completionStatus,
      })
    );
    localStorage.setItem(
      this.#localStoreName,
      JSON.stringify(serializedChallenges)
    );
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
    return this.#validChallengeIndex(index) ? this.challenges[index] : null;
  }

  /**
   * Add challenges to the list
   * @param challengeDescriptions - The challenge descriptions to add
   * @returns The added challenges
   */
  addChallenges(challengeDescriptions: string | string[]): Challenge[] {
    const descriptions = Array.isArray(challengeDescriptions)
      ? challengeDescriptions
      : [challengeDescriptions];

    const addedChallenges: Challenge[] = [];

    descriptions.forEach((challengeDesc) => {
      const challenge = new Challenge(challengeDesc);
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
  addChallengeObjects(challengeObjects: Challenge | Challenge[]): Challenge[] {
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
    const validIndices = indexArray.filter((i) => this.#validChallengeIndex(i));
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
