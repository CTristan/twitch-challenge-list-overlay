interface ParsedCommand {
    command: string;
    channel?: string;
    isCapRequestEnabled?: boolean;
    botCommand?: string;
    botCommandParams?: string;
}

interface ParsedSource {
    nick: string | null;
    host: string;
}

interface ParsedMessage {
    command: ParsedCommand | null;
    source: ParsedSource | null;
    tags: Record<string, any> | null;
    parameters: string | null;
}

/**
 * Parses an IRC message and returns a parsed object containing the message's component parts.
 * @param {string} message
 * @returns {parsedMessage | null}
 */
export function parseIRCMessage(message: string): ParsedMessage | null {
    const parsedMessage: ParsedMessage = {
        command: null,
        parameters: null,
        source: null,
        tags: null,
    };
    let idx = 0;
    let rawTagsComponent = null;
    let rawSourceComponent = null;
    let rawCommandComponent = null;
    let rawParametersComponent = null;

    // Get the raw tags component of the IRC message.
    // example: "@badge-info=;badges=broadcaster/1;color=#0000FF;"
    if (message[idx] === "@") {
        let endIdx = message.indexOf(" ");
        rawTagsComponent = message.slice(1, endIdx);
        idx = endIdx + 1; // Should now point to source colon (:).
    }

    // Get the raw source component of the IRC message (otherwise it's a PING command).
    // example: ":username1!username1@username1.tmi.twitch.tv"
    if (message[idx] === ":") {
        idx += 1;
        let endIdx = message.indexOf(" ", idx);
        rawSourceComponent = message.slice(idx, endIdx);
        idx = endIdx + 1;
    }

    // Get the raw command component of the IRC message.
    // example: "PRIVMSG #jujococs"
    let endIdx = message.indexOf(":", idx); // Looking for the parameters part of the message.
    if (-1 === endIdx) {
        // But not all messages include the parameters part.
        endIdx = message.length;
    }
    rawCommandComponent = message.slice(idx, endIdx).trim();
    // Get the raw parameters component of the IRC message.
    // example: ":!challengeAdd walk the dog"
    if (endIdx !== message.length) {
        idx = endIdx + 1; // skip the colon (:)
        rawParametersComponent = message.slice(idx);
    }

    // Parse the command component of the IRC message.
    parsedMessage.command = parseCommand(rawCommandComponent);

    // Only parse the rest of the components if it's a command we recognize.
    if (parsedMessage.command === null) {
        return null;
    } else {
        if (rawTagsComponent !== null) {
            parsedMessage.tags = parseTags(rawTagsComponent);
        }

        parsedMessage.source = parseSource(rawSourceComponent);
        parsedMessage.parameters = rawParametersComponent;
        if (rawParametersComponent && rawParametersComponent[0] === "!") {
            parsedMessage.command = parseParameters(
                rawParametersComponent,
                parsedMessage.command
            );
        }
    }

    return parsedMessage;
}

/**
 * Parses the command component of the IRC message.
 * @param {string} rawCommandComponent
 * @returns {ParsedCommand | null}
 */
function parseCommand(rawCommandComponent: string): ParsedCommand | null {
    let parsedCommand = null;
    const commandParts = rawCommandComponent.split(" ");
    switch (commandParts[0]) {
        case "JOIN":
        case "PART":
        case "NOTICE":
        case "CLEARCHAT":
        case "HOSTTARGET":
        case "PRIVMSG":
            parsedCommand = {
                command: commandParts[0],
                ...(commandParts[1] && { channel: commandParts[1] }),
            };
            break;
        case "PING":
            parsedCommand = {
                command: commandParts[0],
            };
            break;
        case "CAP":
            parsedCommand = {
                command: commandParts[0],
                isCapRequestEnabled: commandParts[2] === "ACK",
            };
            break;
        case "GLOBALUSERSTATE":
            parsedCommand = {
                command: commandParts[0],
            };
            break;
        case "USERSTATE":
        case "ROOMSTATE":
            parsedCommand = {
                command: commandParts[0],
                ...(commandParts[1] && { channel: commandParts[1] }),
            };
            break;
        case "RECONNECT":
            // "The Twitch server is about to terminate the connection for maintenance."
            parsedCommand = {
                command: commandParts[0],
            };
            break;
        case "421":
            console.error(`Unsupported IRC command: ${commandParts[2]}`);
            return null;
        case "001":
            parsedCommand = {
                command: commandParts[0],
            };
            break;
        case "002":
        case "003":
        case "004":
        case "353":
        case "366":
        case "372":
        case "375":
        case "376":
            // console.log(`numeric message: ${commandParts[0]}`);
            return null;
        default:
            console.log(`Unexpected command: ${commandParts[0]}`);
            return null;
    }

    return parsedCommand;
}

/**
 * Raw tags are semicolon-separated key/value pairs.
 * @param {string} tags
 * @returns {Record<string, any>}
 */
function parseTags(tags: string): Record<string, any> {
    // badge-info=;badges=broadcaster/1;color=#0000FF;...

    const tagsToIgnore = {
        // List of tags to ignore.
        "client-nonce": null,
        flags: null,
    };

    let dictParsedTags: Record<string, any> = {};
    let parsedTags = tags.split(";");
    parsedTags.forEach((tag) => {
        let parsedTag = tag.split("=");
        let tagValue = parsedTag[1] === "" ? null : parsedTag[1];

        switch (parsedTag[0]) {
            case "badges":
            case "badge-info":
                // badges=staff/1,broadcaster/1,turbo/1;

                if (tagValue) {
                    let dict: Record<string, string> = {};
                    // The key is the badge's name (e.g., subscriber).
                    let badges = tagValue.split(",");
                    badges.forEach((pair) => {
                        let badgeParts = pair.split("/");
                        if (badgeParts[0] && badgeParts[1]) {
                            dict[badgeParts[0]] = badgeParts[1];
                        }
                    });
                    if (parsedTag[0]) {
                        dictParsedTags[parsedTag[0]] = dict;
                    }
                } else {
                    dictParsedTags[parsedTag[0]] = null;
                }
                break;
            case "emotes":
                // emotes=25:0-4,12-16/1902:6-10
                if (tagValue) {
                    let dictEmotes: {
                        [key: string]: {
                            startPosition: string;
                            endPosition: string;
                        }[];
                    } = {}; // Holds a list of emote objects.
                    // The key is the emote's ID.
                    let emotes = tagValue.split("/");
                    emotes.forEach((emote) => {
                        let emoteParts = emote.split(":");

                        let textPositions: {
                            startPosition: string;
                            endPosition: string;
                        }[] = []; // The list of position objects that identify

                        // the location of the emote in the chat message.
                        if (emoteParts[1]) {
                            let positions = emoteParts[1].split(",");
                            positions.forEach((position) => {
                                let positionParts = position.split("-");
                                if (positionParts[0] && positionParts[1]) {
                                    textPositions.push({
                                        startPosition: positionParts[0],
                                        endPosition: positionParts[1],
                                    });
                                }
                            });
                        }

                        if (emoteParts[0]) {
                            dictEmotes[emoteParts[0]] = textPositions;
                        }
                    });

                    dictParsedTags[parsedTag[0]] = dictEmotes;
                } else {
                    dictParsedTags[parsedTag[0]] = null;
                }

                break;
            case "emote-sets":
                // emote-sets=0,33,50,237
                if (tagValue && parsedTag[0]) {
                    let emoteSetIds = tagValue.split(","); // Array of emote set IDs.
                    dictParsedTags[parsedTag[0]] = emoteSetIds;
                } else if (parsedTag[0]) {
                    dictParsedTags[parsedTag[0]] = null;
                }
                break;
            default:
                // If the tag is in the list of tags to ignore, ignore
                // it; otherwise, add it.

                if (parsedTag[0] && tagsToIgnore.hasOwnProperty(parsedTag[0])) {
                } else if (parsedTag[0]) {
                    dictParsedTags[parsedTag[0]] = tagValue;
                }
        }
    });

    return dictParsedTags;
}

/**
 * Parses the source (nick and host) components of the IRC message.
 * @param {string | null} rawSourceComponent
 * @returns {ParsedSource | null}
 */
function parseSource(rawSourceComponent: string | null): ParsedSource | null {
    if (null == rawSourceComponent) {
        // Not all messages contain a source
        return null;
    } else {
        let sourceParts = rawSourceComponent.split("!");
        return {
            nick: sourceParts.length == 2 ? sourceParts[0] || null : null,
            host:
                sourceParts.length == 2
                    ? sourceParts[1] || ""
                    : sourceParts[0] || "",
        };
    }
}

/**
 * Parsing the IRC parameters component if it contains a command (e.g., !challengeAdd).
 * @param {string} rawParametersComponent
 * @param {ParsedCommand} command
 * @returns {ParsedCommand}
 */
function parseParameters(
    rawParametersComponent: string,
    command: ParsedCommand
): ParsedCommand {
    let idx = 0;
    let commandParts = rawParametersComponent.slice(idx + 1).trim(); // remove the leading "!"
    let paramsIdx = commandParts.indexOf(" ");

    if (paramsIdx === -1) {
        command.botCommand = commandParts.slice(0);
        command.botCommandParams = "";
    } else {
        command.botCommand = commandParts.slice(0, paramsIdx);
        command.botCommandParams = commandParts.slice(paramsIdx).trim();
    }

    return command;
}
