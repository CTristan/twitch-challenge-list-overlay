import TwitchChat from "@/twitch/TwitchChat";
import { NETWORK_URLS, TWITCH_EVENTS } from "@/types/ConfigConstants";
import { TWITCH_CHAT_SERVICE_MESSAGES } from "@/types/MessageConstants";
import type { TwitchConnectionStatusValue } from "@/types/TwitchConnectionConstants";
import { TWITCH_CONNECTION_STATUS } from "@/types/TwitchConnectionConstants";

const { COMMAND, OAUTH_ERROR, OAUTH_SUCCESS } = TWITCH_EVENTS;

type TwitchChatLike = Pick<
    InstanceType<typeof TwitchChat>,
    "connect" | "disconnect" | "say" | "on" | "off"
>;

type TwitchChatFactory = (
    url: string,
    options: { username: string; authToken: string; channel: string }
) => TwitchChatLike;

export type TwitchConnectionStatus = TwitchConnectionStatusValue;

export interface TwitchConnectionState {
    status: TwitchConnectionStatus;
    lastConnectedAt: number | null;
    lastDisconnectedAt: number | null;
    error: string | null;
}

export interface TwitchServiceSnapshot {
    connection: TwitchConnectionState;
    active: boolean;
}

type CommandListener = (data: CommandData) => void;

type ConnectionListener = (state: TwitchConnectionState) => void;

class TwitchChatService {
    #chatFactory: TwitchChatFactory;
    #url: string;
    #client: TwitchChatLike | null = null;
    #commandListeners: Set<CommandListener> = new Set();
    #connectionListeners: Set<ConnectionListener> = new Set();
    #connectionState: TwitchConnectionState = {
        status: TWITCH_CONNECTION_STATUS.IDLE,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        error: null,
    };
    #authConfig: Config["auth"] | null = null;

    #commandHandler = (data: CommandData): void => {
        this.#emitCommand(data);
    };

    #oauthSuccessHandler = (): void => {
        this.#updateConnectionState({
            status: TWITCH_CONNECTION_STATUS.CONNECTED,
            lastConnectedAt: Date.now(),
            error: null,
        });
    };

    #oauthErrorHandler = (): void => {
        this.#updateConnectionState({
            status: TWITCH_CONNECTION_STATUS.ERROR,
            error: TWITCH_CHAT_SERVICE_MESSAGES.OAUTH_AUTHENTICATION_FAILED,
            lastDisconnectedAt: Date.now(),
        });
    };

    constructor(
        url: string = NETWORK_URLS.TWITCH_IRC,
        chatFactory: TwitchChatFactory = (connectUrl, options) =>
            new TwitchChat(connectUrl, options)
    ) {
        this.#url = url;
        this.#chatFactory = chatFactory;
    }

    subscribeToCommands(listener: CommandListener): () => void {
        this.#commandListeners.add(listener);
        return () => {
            this.#commandListeners.delete(listener);
        };
    }

    subscribeToConnection(listener: ConnectionListener): () => void {
        this.#connectionListeners.add(listener);
        listener(this.#connectionState);
        return () => {
            this.#connectionListeners.delete(listener);
        };
    }

    getSnapshot(): TwitchServiceSnapshot {
        return {
            connection: this.#connectionState,
            active: this.isConnected(),
        };
    }

    updateAuthConfig(
        authConfig: Config["auth"],
        options: { autoConnect?: boolean } = { autoConnect: true }
    ): void {
        this.#authConfig = this.#normalizeAuthConfig(authConfig);
        if (options.autoConnect !== false) {
            this.reconnect();
        }
    }

    connect(authConfig: Config["auth"]): void {
        this.#authConfig = this.#normalizeAuthConfig(authConfig);
        this.reconnect();
    }

    reconnect(): void {
        if (!this.#authConfig) {
            console.warn(TWITCH_CHAT_SERVICE_MESSAGES.RECONNECT_WITHOUT_AUTH);
            return;
        }

        const previousAuth = this.#authConfig;
        const normalized = this.#normalizeAuthConfig(previousAuth);
        this.#authConfig = normalized;

        if (!this.#hasValidCredentials(normalized)) {
            this.disconnect();
            this.#updateConnectionState({
                status: TWITCH_CONNECTION_STATUS.ERROR,
                error: TWITCH_CHAT_SERVICE_MESSAGES.MISSING_CREDENTIALS,
                lastDisconnectedAt: Date.now(),
            });
            return;
        }

        if (
            this.#client &&
            this.isConnected() &&
            this.#credentialsMatch(normalized, previousAuth)
        ) {
            return;
        }

        this.disconnect();
        this.#client = this.#chatFactory(this.#url, {
            username: normalized.twitch_username,
            authToken: normalized.twitch_oauth,
            channel: normalized.twitch_channel,
        });
        this.#bindClientEvents(this.#client);
        this.#updateConnectionState({
            status: TWITCH_CONNECTION_STATUS.CONNECTING,
            error: null,
        });
        this.#client.connect();
    }

    disconnect(): void {
        if (!this.#client) {
            return;
        }

        this.#client.off(COMMAND, this.#commandHandler);
        this.#client.off(OAUTH_SUCCESS, this.#oauthSuccessHandler);
        this.#client.off(OAUTH_ERROR, this.#oauthErrorHandler);

        try {
            this.#client.disconnect();
        } catch (error) {
            console.error(TWITCH_CHAT_SERVICE_MESSAGES.DISCONNECT_ERROR, error);
        }

        this.#client = null;
        this.#updateConnectionState({
            status: TWITCH_CONNECTION_STATUS.DISCONNECTED,
            lastDisconnectedAt: Date.now(),
        });
    }

    sendMessage(message: string, messageId?: string): void {
        if (!this.#client) {
            console.warn(
                TWITCH_CHAT_SERVICE_MESSAGES.SEND_MESSAGE_WITHOUT_CLIENT
            );
            return;
        }

        try {
            this.#client.say(message, messageId ?? "");
        } catch (error) {
            console.error(
                TWITCH_CHAT_SERVICE_MESSAGES.SEND_MESSAGE_FAILED,
                error
            );
        }
    }

    isConnected(): boolean {
        return (
            this.#connectionState.status === TWITCH_CONNECTION_STATUS.CONNECTED
        );
    }

    getConnectionState(): TwitchConnectionState {
        return this.#connectionState;
    }

    destroy(): void {
        this.disconnect();
        this.#commandListeners.clear();
        this.#connectionListeners.clear();
        this.#connectionState = {
            status: TWITCH_CONNECTION_STATUS.IDLE,
            lastConnectedAt: null,
            lastDisconnectedAt: null,
            error: null,
        };
        this.#authConfig = null;
    }

    resetForTesting(): void {
        this.destroy();
    }

    #bindClientEvents(client: TwitchChatLike): void {
        client.on(COMMAND, this.#commandHandler);
        client.on(OAUTH_SUCCESS, this.#oauthSuccessHandler);
        client.on(OAUTH_ERROR, this.#oauthErrorHandler);
    }

    #emitCommand(data: CommandData): void {
        this.#commandListeners.forEach((listener) => {
            try {
                listener(data);
            } catch (error) {
                console.error(
                    TWITCH_CHAT_SERVICE_MESSAGES.COMMAND_LISTENER_ERROR,
                    error
                );
            }
        });
    }

    #emitConnection(): void {
        this.#connectionListeners.forEach((listener) => {
            try {
                listener(this.#connectionState);
            } catch (error) {
                console.error(
                    TWITCH_CHAT_SERVICE_MESSAGES.CONNECTION_LISTENER_ERROR,
                    error
                );
            }
        });
    }

    #updateConnectionState(partial: Partial<TwitchConnectionState>): void {
        this.#connectionState = {
            ...this.#connectionState,
            ...partial,
        };
        this.#emitConnection();
    }

    #normalizeAuthConfig(auth: Config["auth"]): Config["auth"] {
        return {
            twitch_oauth: auth.twitch_oauth?.trim() ?? "",
            twitch_username: auth.twitch_username?.trim() ?? "",
            twitch_channel: auth.twitch_channel?.trim() ?? "",
        };
    }

    #hasValidCredentials(auth: Config["auth"]): boolean {
        return [
            auth.twitch_oauth,
            auth.twitch_username,
            auth.twitch_channel,
        ].every((value) => typeof value === "string" && value.length > 0);
    }

    #credentialsMatch(
        left: Config["auth"],
        right: Config["auth"] | null
    ): boolean {
        if (!right) {
            return false;
        }

        return (
            left.twitch_oauth === right.twitch_oauth &&
            left.twitch_username === right.twitch_username &&
            left.twitch_channel === right.twitch_channel
        );
    }
}

let twitchChatServiceInstance: TwitchChatService | null = null;

export const getTwitchChatService = (
    url: string = NETWORK_URLS.TWITCH_IRC,
    chatFactory?: TwitchChatFactory
): TwitchChatService => {
    if (!twitchChatServiceInstance) {
        twitchChatServiceInstance = new TwitchChatService(
            url,
            chatFactory ??
                ((connectUrl, options) => new TwitchChat(connectUrl, options))
        );
    }
    return twitchChatServiceInstance;
};

export const resetTwitchChatServiceForTesting = (): void => {
    if (twitchChatServiceInstance) {
        twitchChatServiceInstance.resetForTesting();
        twitchChatServiceInstance = null;
    }
};
