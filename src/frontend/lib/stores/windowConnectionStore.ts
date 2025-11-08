import {
    getWindowSyncService,
    type WindowConnectionState,
} from "@backend/services/windowSyncService";
import { readable } from "svelte/store";

const createWindowConnectionStore = () => {
    const service = getWindowSyncService();
    const { subscribe } = readable<WindowConnectionState>(
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
        isConnected: (): boolean => service.isConnected(),
    };
};

export const windowConnectionStore = createWindowConnectionStore();
