import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseIRCMessage } from "../../src/twitch/message-parsers";

describe("message-parsers", () => {
    let consoleLogSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Spy on console methods to test logging behavior
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
    });

    describe("parseIRCMessage", () => {
        describe("complete IRC messages", () => {
            it("should parse a complete PRIVMSG with tags, source, and bot command", () => {
                const message =
                    "@badge-info=;badges=broadcaster/1;color=#0000FF;display-name=TestUser :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :!ch add Test Challenge";

                const result = parseIRCMessage(message);

                expect(result).not.toBeNull();
                expect(result?.command?.command).toBe("PRIVMSG");
                expect(result?.command?.channel).toBe("#testchannel");
                expect(result?.command?.botCommand).toBe("ch");
                expect(result?.command?.botCommandParams).toBe(
                    "add Test Challenge"
                );
                expect(result?.source?.nick).toBe("testuser");
                expect(result?.source?.host).toBe(
                    "testuser@testuser.tmi.twitch.tv"
                );
                expect(result?.tags).toBeDefined();
                expect(result?.tags?.["badges"]).toBeDefined();
                expect(result?.parameters).toBe("!ch add Test Challenge");
            });

            it("should parse PRIVMSG with tags but no bot command", () => {
                const message =
                    "@badge-info=;badges=moderator/1;color=#FF0000 :moduser!moduser@moduser.tmi.twitch.tv PRIVMSG #testchannel :Hello chat!";

                const result = parseIRCMessage(message);

                expect(result).not.toBeNull();
                expect(result?.command?.command).toBe("PRIVMSG");
                expect(result?.command?.botCommand).toBeUndefined();
                expect(result?.parameters).toBe("Hello chat!");
            });
        });

        describe("messages without tags", () => {
            it("should parse PRIVMSG without tags", () => {
                const message =
                    ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :!ch help";

                const result = parseIRCMessage(message);

                expect(result).not.toBeNull();
                expect(result?.command?.command).toBe("PRIVMSG");
                expect(result?.command?.botCommand).toBe("ch");
                expect(result?.command?.botCommandParams).toBe("help");
                expect(result?.tags).toBeNull();
            });
        });

        describe("messages without source", () => {
            it("should parse PING message without source", () => {
                const message = "PING :tmi.twitch.tv";

                const result = parseIRCMessage(message);

                expect(result).not.toBeNull();
                expect(result?.command?.command).toBe("PING");
                expect(result?.source).toBeNull();
                expect(result?.parameters).toBe("tmi.twitch.tv");
            });
        });

        describe("messages without parameters", () => {
            it("should parse JOIN message without parameters", () => {
                const message =
                    ":testuser!testuser@testuser.tmi.twitch.tv JOIN #testchannel";

                const result = parseIRCMessage(message);

                expect(result).not.toBeNull();
                expect(result?.command?.command).toBe("JOIN");
                expect(result?.command?.channel).toBe("#testchannel");
                expect(result?.parameters).toBeNull();
            });
        });

        describe("unrecognized commands", () => {
            it("should return null for numeric command 002", () => {
                const message = ":tmi.twitch.tv 002 testuser :message";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
            });

            it("should return null for numeric command 003", () => {
                const message = ":tmi.twitch.tv 003 testuser :message";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
            });

            it("should return null for numeric command 004", () => {
                const message = ":tmi.twitch.tv 004 testuser :message";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
            });

            it("should return null for numeric command 353", () => {
                const message = ":tmi.twitch.tv 353 testuser :message";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
            });

            it("should return null for numeric command 366", () => {
                const message = ":tmi.twitch.tv 366 testuser :message";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
            });

            it("should return null for numeric command 372", () => {
                const message = ":tmi.twitch.tv 372 testuser :message";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
            });

            it("should return null for numeric command 375", () => {
                const message = ":tmi.twitch.tv 375 testuser :message";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
            });

            it("should return null for numeric command 376", () => {
                const message = ":tmi.twitch.tv 376 testuser :message";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
            });

            it("should return null and log error for 421 unsupported command", () => {
                const message = ":tmi.twitch.tv 421 testuser UNSUPPORTED";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Unsupported IRC command: UNSUPPORTED"
                );
            });

            it("should return null and log for unexpected command", () => {
                const message = "UNKNOWN command";

                const result = parseIRCMessage(message);

                expect(result).toBeNull();
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    "Unexpected command: UNKNOWN"
                );
            });
        });
    });

    describe("parseCommand - all command types", () => {
        it("should parse JOIN command with channel", () => {
            const message =
                ":testuser!testuser@testuser.tmi.twitch.tv JOIN #testchannel";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("JOIN");
            expect(result?.command?.channel).toBe("#testchannel");
        });

        it("should parse PART command with channel", () => {
            const message =
                ":testuser!testuser@testuser.tmi.twitch.tv PART #testchannel";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("PART");
            expect(result?.command?.channel).toBe("#testchannel");
        });

        it("should parse NOTICE command with channel", () => {
            const message = ":tmi.twitch.tv NOTICE #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("NOTICE");
            expect(result?.command?.channel).toBe("#testchannel");
        });

        it("should parse CLEARCHAT command with channel", () => {
            const message = ":tmi.twitch.tv CLEARCHAT #testchannel";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("CLEARCHAT");
            expect(result?.command?.channel).toBe("#testchannel");
        });

        it("should parse HOSTTARGET command with channel", () => {
            const message = ":tmi.twitch.tv HOSTTARGET #testchannel :target -";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("HOSTTARGET");
            expect(result?.command?.channel).toBe("#testchannel");
        });

        it("should parse PING command without channel", () => {
            const message = "PING :tmi.twitch.tv";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("PING");
            expect(result?.command?.channel).toBeUndefined();
        });

        it("should parse CAP command with ACK", () => {
            const message = ":tmi.twitch.tv CAP * ACK :twitch.tv/tags";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("CAP");
            expect(result?.command?.isCapRequestEnabled).toBe(true);
        });

        it("should parse CAP command with NAK", () => {
            const message = ":tmi.twitch.tv CAP * NAK :twitch.tv/tags";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("CAP");
            expect(result?.command?.isCapRequestEnabled).toBe(false);
        });

        it("should parse GLOBALUSERSTATE command", () => {
            const message = ":tmi.twitch.tv GLOBALUSERSTATE";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("GLOBALUSERSTATE");
        });

        it("should parse USERSTATE command with channel", () => {
            const message = ":tmi.twitch.tv USERSTATE #testchannel";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("USERSTATE");
            expect(result?.command?.channel).toBe("#testchannel");
        });

        it("should parse ROOMSTATE command with channel", () => {
            const message = ":tmi.twitch.tv ROOMSTATE #testchannel";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("ROOMSTATE");
            expect(result?.command?.channel).toBe("#testchannel");
        });

        it("should parse RECONNECT command", () => {
            const message = ":tmi.twitch.tv RECONNECT";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("RECONNECT");
        });

        it("should parse 001 welcome message", () => {
            const message = ":tmi.twitch.tv 001 testuser :Welcome!";

            const result = parseIRCMessage(message);

            expect(result?.command?.command).toBe("001");
        });
    });

    describe("parseTags - tag parsing", () => {
        it("should parse badges tag with multiple badges", () => {
            const message =
                "@badges=staff/1,broadcaster/1,turbo/1 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["badges"]).toBeDefined();
            expect(result?.tags?.["badges"]?.["staff"]).toBe("1");
            expect(result?.tags?.["badges"]?.["broadcaster"]).toBe("1");
            expect(result?.tags?.["badges"]?.["turbo"]).toBe("1");
        });

        it("should parse badges tag with empty value as null", () => {
            const message =
                "@badges= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["badges"]).toBeNull();
        });

        it("should parse badge-info tag with values", () => {
            const message =
                "@badge-info=subscriber/12 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["badge-info"]).toBeDefined();
            expect(result?.tags?.["badge-info"]?.subscriber).toBe("12");
        });

        it("should parse badge-info tag with empty value as null", () => {
            const message =
                "@badge-info= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["badge-info"]).toBeNull();
        });

        it("should parse emotes tag with multiple emotes and positions", () => {
            const message =
                "@emotes=25:0-4,12-16/1902:6-10 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["emotes"]).toBeDefined();
            expect(result?.tags?.["emotes"]?.["25"]).toBeDefined();
            expect(result?.tags?.["emotes"]?.["25"]?.length).toBe(2);
            expect(result?.tags?.["emotes"]?.["25"]?.[0]?.startPosition).toBe(
                "0"
            );
            expect(result?.tags?.["emotes"]?.["25"]?.[0]?.endPosition).toBe(
                "4"
            );
            expect(result?.tags?.["emotes"]?.["25"]?.[1]?.startPosition).toBe(
                "12"
            );
            expect(result?.tags?.["emotes"]?.["25"]?.[1]?.endPosition).toBe(
                "16"
            );
            expect(result?.tags?.["emotes"]?.["1902"]).toBeDefined();
            expect(result?.tags?.["emotes"]?.["1902"]?.length).toBe(1);
        });

        it("should parse emotes tag with empty value as null", () => {
            const message =
                "@emotes= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["emotes"]).toBeNull();
        });

        it("should parse emote-sets tag with multiple sets", () => {
            const message =
                "@emote-sets=0,33,50,237 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["emote-sets"]).toBeDefined();
            expect(result?.tags?.["emote-sets"]).toEqual([
                "0",
                "33",
                "50",
                "237",
            ]);
        });

        it("should parse emote-sets tag with empty value as null", () => {
            const message =
                "@emote-sets= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["emote-sets"]).toBeNull();
        });

        it("should ignore client-nonce tag", () => {
            const message =
                "@client-nonce=abc123 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["client-nonce"]).toBeUndefined();
        });

        it("should ignore flags tag", () => {
            const message =
                "@flags=0-7:A.6/P.6 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["flags"]).toBeUndefined();
        });

        it("should parse default tags (color, display-name, etc.)", () => {
            const message =
                "@color=#0000FF;display-name=TestUser;user-id=12345 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["color"]).toBe("#0000FF");
            expect(result?.tags?.["display-name"]).toBe("TestUser");
            expect(result?.tags?.["user-id"]).toBe("12345");
        });

        it("should parse tags with empty values as null", () => {
            const message =
                "@color=;display-name= :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.tags?.["color"]).toBeNull();
            expect(result?.tags?.["display-name"]).toBeNull();
        });
    });

    describe("parseSource - source parsing", () => {
        it("should parse source with nick and host", () => {
            const message =
                ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.source?.nick).toBe("testuser");
            expect(result?.source?.host).toBe(
                "testuser@testuser.tmi.twitch.tv"
            );
        });

        it("should parse source with only host (no exclamation mark)", () => {
            const message = ":tmi.twitch.tv NOTICE #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.source?.nick).toBeNull();
            expect(result?.source?.host).toBe("tmi.twitch.tv");
        });

        it("should handle null source for PING messages", () => {
            const message = "PING :tmi.twitch.tv";

            const result = parseIRCMessage(message);

            expect(result?.source).toBeNull();
        });

        it("should handle empty nick when source has exclamation but empty nick", () => {
            const message =
                ":!host.tmi.twitch.tv PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.source?.nick).toBeNull();
            expect(result?.source?.host).toBe("host.tmi.twitch.tv");
        });

        it("should handle empty host when source has exclamation but empty host", () => {
            const message = ":testuser! PRIVMSG #testchannel :message";

            const result = parseIRCMessage(message);

            expect(result?.source?.nick).toBe("testuser");
            expect(result?.source?.host).toBe("");
        });
    });

    describe("parseParameters - bot command parsing", () => {
        it("should parse bot command with parameters", () => {
            const message =
                ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :!ch add Test Challenge";

            const result = parseIRCMessage(message);

            expect(result?.command?.botCommand).toBe("ch");
            expect(result?.command?.botCommandParams).toBe(
                "add Test Challenge"
            );
        });

        it("should parse bot command without parameters", () => {
            const message =
                ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :!help";

            const result = parseIRCMessage(message);

            expect(result?.command?.botCommand).toBe("help");
            expect(result?.command?.botCommandParams).toBe("");
        });

        it("should not parse parameters that don't start with !", () => {
            const message =
                ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :Hello chat";

            const result = parseIRCMessage(message);

            expect(result?.command?.botCommand).toBeUndefined();
            expect(result?.command?.botCommandParams).toBeUndefined();
        });

        it("should handle bot command with multiple spaces", () => {
            const message =
                ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :!ch   add   Test";

            const result = parseIRCMessage(message);

            expect(result?.command?.botCommand).toBe("ch");
            expect(result?.command?.botCommandParams).toBe("add   Test");
        });
    });

    describe("edge cases and integration", () => {
        it("should handle message with all components", () => {
            const message =
                "@badge-info=;badges=broadcaster/1;color=#0000FF;display-name=TestUser;emotes=25:0-4;user-id=12345 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :!ch list";

            const result = parseIRCMessage(message);

            expect(result).not.toBeNull();
            expect(result?.command?.command).toBe("PRIVMSG");
            expect(result?.command?.channel).toBe("#testchannel");
            expect(result?.command?.botCommand).toBe("ch");
            expect(result?.command?.botCommandParams).toBe("list");
            expect(result?.source?.nick).toBe("testuser");
            expect(result?.tags?.["badges"]?.["broadcaster"]).toBe("1");
            expect(result?.tags?.["color"]).toBe("#0000FF");
            expect(result?.parameters).toBe("!ch list");
        });

        it("should handle minimal valid message", () => {
            const message = "PING";

            const result = parseIRCMessage(message);

            expect(result).not.toBeNull();
            expect(result?.command?.command).toBe("PING");
            expect(result?.source).toBeNull();
            expect(result?.tags).toBeNull();
            expect(result?.parameters).toBeNull();
        });

        it("should handle PRIVMSG without channel", () => {
            const message = ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG";

            const result = parseIRCMessage(message);

            expect(result).not.toBeNull();
            expect(result?.command?.command).toBe("PRIVMSG");
            expect(result?.command?.channel).toBeUndefined();
        });
    });
});
