import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import User from "../../src/classes/User";

describe("User", () => {
  /** @type User */
  let user: User;

  beforeEach(() => {
    user = new User("Bob", { userColor: "red" });
  });

  describe("validateUsername", () => {
    it("should return the username if it is valid", () => {
      expect(user.validateUsername("Bob")).toBe("Bob");
    });

    it("should throw an error if the username is invalid", () => {
      expect(() => user.validateUsername("")).toThrow("Username invalid");
    });
  });

  describe("addChallenge", () => {
    it("should accept a string as its value and return the Challenge object", () => {
      const challenge = new Challenge("challenge 1");
      const addedChallenge = user.addChallenge(challenge);
      expect(addedChallenge).toBeInstanceOf(Challenge);
      expect(addedChallenge.description).toBe("challenge 1");
    });
  });

  describe("editChallenge", () => {
    it("should update the challenge description at the specified index", () => {
      user.addChallenge(new Challenge("test challenge 1"));
      user.addChallenge(new Challenge("test challenge 2"));
      user.addChallenge(new Challenge("test challenge 3"));
      const updatedChallenge = user.editChallenge(2, "challenge 3 updated");
      expect(updatedChallenge).toBeInstanceOf(Challenge);
      expect(updatedChallenge!.description).toBe("challenge 3 updated");
    });

    it("should return null if the challenge index is out of bounds", () => {
      user.addChallenge(new Challenge("test challenge 1"));
      const updatedChallenge = user.editChallenge(3, "challenge 3 updated");
      expect(updatedChallenge).toBeNull();
    });
  });

  describe("completeChallenge", () => {
    it("should mark the challenge at the specified index as complete", () => {
      user.addChallenge(new Challenge("test challenge 1"));
      user.completeChallenge(0);
      expect(user.getChallenges()[0].isComplete()).toBe(true);
    });

    it("should return null if the challenge index is out of bounds", () => {
      user.addChallenge(new Challenge("test challenge 1"));
      const challenge = user.completeChallenge(3);
      expect(challenge).toBeNull();
    });
  });

  describe("deleteChallenge", () => {
    it("should be able to delete a single challenge given a single index number", () => {
      user.addChallenge(new Challenge("test challenge 0"));
      user.addChallenge(new Challenge("test challenge 1"));
      const deletedChallenges = user.deleteChallenge(1);
      expect(deletedChallenges.length).toBe(1);
    });

    it("should be able to delete multiple challenges if given an array of numbers", () => {
      user.addChallenge(new Challenge("test challenge 0"));
      user.addChallenge(new Challenge("test challenge 1"));
      user.addChallenge(new Challenge("test challenge 2"));
      const deletedChallenges = user.deleteChallenge([1, 2]);
      expect(deletedChallenges.length).toBe(2);
      expect(deletedChallenges[0].description).toBe("test challenge 1");
      expect(deletedChallenges[1].description).toBe("test challenge 2");
    });

    it("returns empty array if the index is out of bounds", () => {
      const deletedChallenges = user.deleteChallenge(10);
      expect(deletedChallenges).toHaveLength(0);
      expect(Array.isArray(deletedChallenges)).toBe(true);
    });
  });

  describe("removeCompletedChallenges", () => {
    it("should remove all completed challenges", () => {
      user.addChallenge(new Challenge("test challenge 1"));
      user.addChallenge(new Challenge("test challenge 2"));
      user.addChallenge(new Challenge("test challenge 3"));
      user.completeChallenge(0);
      user.completeChallenge(2);
      const deletedChallenges = user.removeCompletedChallenges();
      expect(user.getChallenges().length).toBe(1);
      expect(deletedChallenges.length).toBe(2);
    });
  });

  describe("getChallenge", () => {
    it("should return the challenge at the specified index", () => {
      user.addChallenge(new Challenge("test challenge 1"));
      const challenge = user.getChallenge(0);
      expect(challenge).toBeInstanceOf(Challenge);
      expect(challenge!.description).toBe("test challenge 1");
    });

    it("return Null if the index is out of bounds", () => {
      const challenge = user.getChallenge(3);
      expect(challenge).toBeNull;
    });
  });

  describe("getChallenges", () => {
    it("should return the challenges of the user", () => {
      user.addChallenge(new Challenge("test challenge 1"));
      user.addChallenge(new Challenge("test challenge 2"));
      expect(user.getChallenges().length).toBe(2);
    });
  });

  describe("validChallengeIndex", () => {
    it("returns false if index is not of type Number", () => {
      expect(user.validChallengeIndex(0)).toBe(false);
    });

    it("returns false if index is out of bounds", () => {
      expect(user.validChallengeIndex(4)).toBe(false);
    });

    it("returns true if index is within bounds", () => {
      user.addChallenge(new Challenge("test challenge 1"));
      expect(user.validChallengeIndex(0)).toBe(true);
    });
  });
});
