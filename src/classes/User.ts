type Challenge = import("./Challenge").default;
/**
 * @class User
 * @property {string} username - The username of the user
 * @property {string} userColor - The color of the username
 * @property {Challenge[]} challenges - The challenges of the user
 * @method validateUsername - Validate the username of the user
 * @method addChallenge - Add challenges to the user
 * @method editChallenge - Edit the challenge at the specified index
 * @method completeChallenge - Mark the challenge at index as complete
 * @method deleteChallenge - Delete the challenge at the specified index
 * @method removeCompletedChallenges - Remove all completed challenges
 * @method getChallenge - Get the challenge at the specified index
 * @method getChallenges - Get all challenges of the user
 * @method validChallengeIndex - Validates the challenge index
 */
export default class User {
  username: string;
  userColor: string;
  challenges: Challenge[];

  /**
   * @constructor
   * @param {string} username - The username of the user
   * @param {{userColor: string}} options - The username of the user
   */
  constructor(username: string, options: { userColor: string }) {
    this.username = this.validateUsername(username);
    this.userColor = options?.userColor || "";
    this.challenges = [];
  }

  /**
   * Validate the username of the user
   * @param {string} username - The username of the user
   * @returns {string} The username of the user
   * @throws {Error} If the username is invalid
   */
  validateUsername(username: string): string {
    if (typeof username !== "string") {
      throw new Error("Username must be of type string");
    }
    username = username.trim();
    if (username.length === 0) {
      throw new Error("Username invalid");
    }
    return username;
  }

  /**
   * Add a challenge to the user
   * @param {Challenge} challenge - The Challenge to add
   * @returns {Challenge} The Challenge that was added
   */
  addChallenge(challenge: Challenge): Challenge {
    this.challenges.push(challenge);
    return challenge;
  }

  /**
   * Edit the challenge at the specified index
   * @param {number} index - The index of the challenge to get
   * @param {string} description - The new challenge description
   * @returns {Challenge | null} The challenge that was edited
   */
  editChallenge(index: number, description: string): Challenge | null {
    let challenge = this.getChallenge(index);
    if (challenge) {
      challenge.setDescription(description);
      return challenge;
    }
    return null;
  }

  /**
   * Mark the challenge at the specified index as complete
   * @param {number} index - The index of the challenge to complete
   * @returns {Challenge | null} The challenge that was completed
   */
  completeChallenge(index: number): Challenge | null {
    let challenge = this.getChallenge(index);
    if (challenge) {
      challenge.setCompletionStatus(true);
      return challenge;
    }
    return null;
  }

  /**
   * Delete the challenge at the specified index
   * @param {number | number[]} indices - The indices of the challenges to delete
   * @returns {Challenge[]}	The challenge that was deleted
   */
  deleteChallenge(indices: number | number[]): Challenge[] {
    const items = (Array.isArray(indices) ? indices : [indices]).filter((i) => {
      return this.validChallengeIndex(i);
    });
    const challengeForDeletion: Challenge[] = [];

    this.challenges = this.challenges.filter((challenge, i) => {
      if (items.includes(i)) {
        challengeForDeletion.push(challenge);
        return false;
      } else {
        return true;
      }
    });

    return challengeForDeletion;
  }

  /**
   * Remove all completed challenges
   * @returns {Challenge[]} The challenges that were removed
   */
  removeCompletedChallenges(): Challenge[] {
    const removedChallenges: Challenge[] = [];

    this.challenges = this.challenges.filter((challenge) => {
      if (challenge.isComplete()) {
        removedChallenges.push(challenge);

        return false;
      }

      return true;
    });

    return removedChallenges;
  }

  /**
   * Get the challenge at the specified index
   * @param {number} index - The index of the challenge to get
   * @returns {Challenge | null} The challenge at the specified index
   */
  getChallenge(index: number): Challenge | null {
    return this.validChallengeIndex(index) ? this.challenges[index] : null;
  }

  /**
   * Get the challenges of the user
   * @returns {Challenge[]} The challenges of the user
   */
  getChallenges(): Challenge[] {
    return this.challenges;
  }

  /**
   * Validates the challenge index.
   * @param {number} index - The index of the challenge.
   * @returns {boolean}
   */
  validChallengeIndex(index: number): boolean {
    if (
      typeof index !== "number" ||
      isNaN(index) ||
      index < 0 ||
      index >= this.challenges.length
    ) {
      return false;
    }
    return true;
  }
}
