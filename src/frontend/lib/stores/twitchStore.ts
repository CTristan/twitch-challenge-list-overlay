import {
    getTwitchChatService,
    type TwitchConnectionState,
} from "@backend/services/twitchChatService";
import { readable } from "svelte/store";

const createTwitchStore = () => {
    const service = getTwitchChatService();
    const { subscribe } = readable<TwitchConnectionState>(
        service.getConnectionState(),
        (set) => {
            const unsubscribe = service.subscribeToConnection((state) => {
                set(state);
            });
            return () => unsubscribe();
        }
    );

    return {
        subscribe,
        updateAuthConfig: (
            auth: Config["auth"],
            options?: { autoConnect?: boolean }
        ): void => service.updateAuthConfig(auth, options),
        connect: (auth: Config["auth"]): void => service.connect(auth),
        reconnect: (): void => service.reconnect(),
        disconnect: (): void => service.disconnect(),
        sendMessage: (message: string, messageId?: string): void =>
            service.sendMessage(message, messageId),
        subscribeToCommands: (
            listener: (data: CommandData) => void
        ): (() => void) => service.subscribeToCommands(listener),
        getConnectionState: (): TwitchConnectionState =>
            service.getConnectionState(),
        isConnected: (): boolean => service.isConnected(),
    };
};

export const twitchStore = createTwitchStore();
