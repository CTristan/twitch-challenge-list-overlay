import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/app";

describe("App.chatHandler", () => {
  describe("chatHandler", () => {
    const app = new App("TestStore");
    const challengeList = app.challengeList;

    app.renderCommandTips = vi.fn();
    app.renderCustomText = vi.fn();
    app.clearListFromDOM = vi.fn();
    app.addChallengeToDOM = vi.fn();
    app.editChallengeFromDOM = vi.fn();
    app.completeChallengeFromDOM = vi.fn();
    app.deleteChallengeFromDOM = vi.fn();

    const adminUser = {
      username: "bobTheAdmin",
      flags: {
        broadcaster: true,
        mod: false,
      },
      extra: {
        userColor: "#FF0000",
      },
      command: {
        CLEARLIST: "clearList",
        CLEARDONE: "clearDone",
        CLEARUSER: "clearUser",
      },
    };
    const chatUser = {
      username: "joeTheUser",
      flags: {
        broadcaster: false,
        mod: false,
      },
      extra: { userColor: "#00FFFF" },
      command: {
        ADDCHALLENGE: "challenge",
        EDITCHALLENGE: "edit",
        DONECHALLENGE: "done",
        DELETECHALLENGE: "delete",
        CHECKCHALLENGE: "check",
        HELP: "help",
      },
    };
    const modUser = {
      username: "modUser",
      flags: {
        broadcaster: false,
        mod: true,
      },
      extra: { userColor: "#00FF00" },
      command: {
        ADDCHALLENGE: "challenge",
        EDITCHALLENGE: "edit",
        DONECHALLENGE: "done",
        DELETECHALLENGE: "delete",
        CHECKCHALLENGE: "check",
        HELP: "help",
      },
    };
    const botResponsePrefix = "";

    beforeEach(() => {
      challengeList.clearChallengeList();
      challengeList.addChallenges([
        "challenge1",
        "challenge2",
        "challenge3",
        "admin challenge1",
        "admin challenge2",
      ]);
      challengeList.completeChallenges(1); // Complete challenge2
    });

    describe("Admin commands", () => {
      describe("!clearList command", () => {
        it("should return a success message when an Admin user submits !clearList ", () => {
          const response = app.chatHandler(
            adminUser.username,
            adminUser.command.CLEARLIST,
            "",
            adminUser.flags,
            adminUser.extra
          );
          expect(challengeList.challenges.length).toBe(0);
          expect(response.message).toBe(
            botResponsePrefix + "All challenges have been cleared"
          );
        });

        it("should return a error when an non-Admin user submits !clearList ", () => {
          const response = app.chatHandler(
            chatUser.username,
            adminUser.command.CLEARLIST,
            "",
            chatUser.flags,
            chatUser.extra
          );
          expect(challengeList.challenges.length).toBe(5); // Should remain unchanged
          expect(response.message).toBe(
            botResponsePrefix + "Invalid command: command not found. Try !help"
          );
        });
      });

      it("!clearDone command", () => {
        const response = app.chatHandler(
          adminUser.username,
          adminUser.command.CLEARDONE,
          "",
          adminUser.flags,
          adminUser.extra
        );
        expect(challengeList.challenges.length).toBe(4); // Should remove 1 completed challenge
        expect(response.error).toBe(false);
        expect(response.message).toBe(
          botResponsePrefix + "All done challenges have been cleared"
        );
      });

      it("!clearUser command", () => {
        const response = app.chatHandler(
          adminUser.username,
          adminUser.command.CLEARUSER,
          "anyuser", // In single-streamer mode, this clears all challenges
          adminUser.flags,
          adminUser.extra
        );
        expect(challengeList.challenges.length).toBe(0);
        expect(response.message).toBe(
          botResponsePrefix +
            "All challenges for all challenges have been cleared"
        );
      });
    });

    describe("User commands", () => {
      describe("Invalid command", () => {
        it("should error if the command is empty", () => {
          const response = app.chatHandler(
            chatUser.username,
            "",
            "",
            chatUser.flags,
            chatUser.extra
          );
          expect(response.error).toBe(true);
          expect(response.message).toBe(
            botResponsePrefix + "Invalid command: command not found. Try !help"
          );
        });

        it("should error if the command is not found", () => {
          const response = app.chatHandler(
            chatUser.username,
            "invalidCommand",
            "",
            chatUser.flags,
            chatUser.extra
          );
          expect(response.message).toBe(
            botResponsePrefix + "Invalid command: command not found. Try !help"
          );
        });
      });

      describe("!challenge command", () => {
        it("should add challenge when moderator uses command", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.ADDCHALLENGE,
            "newChallenge",
            modUser.flags,
            modUser.extra
          );

          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix + 'Challenge(s) 📝 "newChallenge" added!'
          );
        });

        it("should return a success message showing the added challenges", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.ADDCHALLENGE,
            "newChallenge",
            modUser.flags,
            modUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix + 'Challenge(s) 📝 "newChallenge" added!'
          );
        });

        it("should accept multiple, comma separated, challenges", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.ADDCHALLENGE,
            "newChallenge, newChallenge2",
            modUser.flags,
            modUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix +
              'Challenge(s) 📝 "newChallenge" & 📝 "newChallenge2" added!'
          );
        });

        it("should letting the user know they reached max challenge limit", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.ADDCHALLENGE,
            "newChallenge4, newChallenge5, newChallenge6, newChallenge7, newChallenge8, newChallenge9, newChallenge10, newChallenge11",
            modUser.flags,
            modUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix +
              "Maximum number of challenges reached, try deleting old challenges."
          );
        });

        it("should error if regular user tries to add challenge", () => {
          const response = app.chatHandler(
            chatUser.username,
            chatUser.command.ADDCHALLENGE,
            "newChallenge",
            chatUser.flags,
            chatUser.extra
          );
          expect(response.error).toBe(true);
          expect(response.message).toBe(
            botResponsePrefix +
              "Invalid command: Only moderators and the broadcaster can add challenges. Try !help"
          );
        });
      });

      describe("!edit command", () => {
        it("should edit challenge when moderator uses command", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.EDITCHALLENGE,
            "2 editedChallenge",
            modUser.flags,
            modUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix + "Challenge 2 updated!"
          );
        });

        it("should error if regular user tries to edit challenge", () => {
          const response = app.chatHandler(
            chatUser.username,
            chatUser.command.EDITCHALLENGE,
            "2 editedChallenge",
            chatUser.flags,
            chatUser.extra
          );
          expect(response.error).toBe(true);
          expect(response.message).toBe(
            botResponsePrefix +
              "Invalid command: Only moderators and the broadcaster can edit challenges. Try !help"
          );
        });
      });

      describe("!done command", () => {
        it("returns a success message when moderator marks challenge as done", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.DONECHALLENGE,
            "1",
            modUser.flags,
            modUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix +
              'Good job on completing challenge(s) ✅ "challenge1"!'
          );
        });

        it("returns a success message when moderator marks multiple challenge as done", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.DONECHALLENGE,
            "1, 3",
            modUser.flags,
            modUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix +
              'Good job on completing challenge(s) ✅ "challenge1" & ✅ "challenge3"!'
          );
        });

        it("should error if regular user tries to complete challenge", () => {
          const response = app.chatHandler(
            chatUser.username,
            chatUser.command.DONECHALLENGE,
            "1",
            chatUser.flags,
            chatUser.extra
          );

          expect(response.error).toBe(true);
          expect(response.message).toBe(
            botResponsePrefix +
              "Invalid command: Only moderators and the broadcaster can complete challenges. Try !help"
          );
        });
      });

      describe("!delete command", () => {
        it("should delete challenge when moderator uses command", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.DELETECHALLENGE,
            "1",
            modUser.flags,
            modUser.extra
          );

          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix + "Challenge(s) 1 has been deleted!"
          );
        });

        it("should delete all challenges when moderator uses 'all'", () => {
          const response = app.chatHandler(
            modUser.username,
            modUser.command.DELETECHALLENGE,
            "all",
            modUser.flags,
            modUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix + "All of your challenges have been deleted!"
          );
        });

        it("should error if regular user tries to delete challenge", () => {
          const response = app.chatHandler(
            chatUser.username,
            chatUser.command.DELETECHALLENGE,
            "1",
            chatUser.flags,
            chatUser.extra
          );
          expect(response.error).toBe(true);
          expect(response.message).toBe(
            botResponsePrefix +
              "Invalid command: Only moderators and the broadcaster can delete challenges. Try !help"
          );
        });
      });

      describe("!check command", () => {
        it("should list all uncompleted challenges", () => {
          const response = app.chatHandler(
            chatUser.username,
            chatUser.command.CHECKCHALLENGE,
            "",
            chatUser.flags,
            chatUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix +
              "Your current challenge(s) are: 📝 1. challenge1 📝 3. challenge3 📝 4. admin challenge1 📝 5. admin challenge2"
          );
        });

        it("should if no challenges are found", () => {
          challengeList.completeChallenges([0, 2, 3, 4]); // Complete all remaining challenges
          const response = app.chatHandler(
            chatUser.username,
            chatUser.command.CHECKCHALLENGE,
            "",
            chatUser.flags,
            chatUser.extra
          );
          expect(response.error).toBe(false);
          expect(response.message).toBe(
            botResponsePrefix +
              "That challenge doesn't seem to exist, try adding one!"
          );
        });
      });

      describe("!help command", () => {
        it("should return a helpful message", () => {
          const response = app.chatHandler(
            chatUser.username,
            chatUser.command.HELP,
            "",
            chatUser.flags,
            chatUser.extra
          );
          expect(response.message).toBe(
            botResponsePrefix +
              "Try these commands - !challenge !edit !done !delete !check"
          );
        });
      });
    });
  });
});
