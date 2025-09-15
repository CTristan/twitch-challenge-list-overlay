import { vi } from "vitest";
import ConfigManager from "../src/classes/ConfigManager";

// Mock WebFont for all tests
Object.defineProperty(window, "WebFont", {
  value: {
    load: vi.fn(),
  },
  writable: true,
});

/** @type {Config} */
const testConfig: Config = {
  // Authentication Settings
  auth: {
    twitch_oauth: "test_oauth_token",
    twitch_username: "test_user",
    twitch_channel: "test_channel",
  },

  // Basic Behavior Settings
  maxChallenges: 10,

  // Chat Commands Configuration
  commands: {
    // Admin commands
    clearList: ["!clearlist"],
    clearDone: ["!cleardone"],
    clearUser: ["!clearuser"],

    // User commands
    addChallenge: ["!challenge", "!add"],
    editChallenge: ["!edit"],
    finishChallenge: ["!done"],
    deleteChallenge: ["!delete"],
    check: ["!check"],
    help: ["!help"],
  },

  // Bot Response Messages
  responses: {
    // Admin responses
    clearList: "All challenges have been cleared",
    clearDone: "All done challenges have been cleared",
    clearUser: "All challenges for {message} have been cleared",

    // User responses
    addChallenge: "Challenge(s) {message} added!",
    editChallenge: "Challenge {message} updated!",
    finishChallenge: "Good job on completing challenge(s) {message}!",
    deleteChallenge: "Challenge(s) {message} has been deleted!",
    deleteAll: "All of your challenges have been deleted!",
    check: "Your current challenge(s) are: {message}",
    help: "Try these commands - !challenge !edit !done !delete !check",
    maxChallengesAdded:
      "Maximum number of challenges reached, try deleting old challenges.",
    noChallengeFound: "That challenge doesn't seem to exist, try adding one!",
    invalidCommand: "Invalid command: {message}. Try !help",
  },
};

// Initialize ConfigManager with test configuration for all tests
ConfigManager.getInstance(testConfig);

// Keep the global _config for backward compatibility with any remaining legacy tests
vi.stubGlobal("_config", testConfig);
