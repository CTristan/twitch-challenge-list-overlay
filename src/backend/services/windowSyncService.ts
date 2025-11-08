import {
    BROADCAST_CHANNEL_NAMES,
    EVENT_NAMES,
    URL_HASH,
} from "@/types/DOMConstants";
import { WINDOW_SYNC_SERVICE_MESSAGES } from "@/types/MessageConstants";
import { MessageVariant } from "@/types/MessageVariant";
import { RefreshMessageType } from "@/types/RefreshMessageType";
import { WindowMode } from "@/types/WindowMode";

const DEFAULT_REFRESH_DELAY = 500;
const HEARTBEAT_INTERVAL = 5000;
const HEARTBEAT_TIMEOUT = 15000;
const CONNECTION_CHECK_INTERVAL = 2000;

type ConfigListener = (event: ConfigSavedEvent) => void;
type ChallengeListener = (event: ChallengeStateEvent) => void;
type ConnectionListener = (state: WindowConnectionState) => void;

type RefreshMessage = {
    type: RefreshMessageType;
    variant?: MessageVariant;
    timestamp: number;
    source: WindowMode;
};

export interface ConfigSavedEvent {
    type: RefreshMessageType.CONFIG_SAVED;
    variant: MessageVariant;
    source: WindowMode;
    timestamp: number;
}

export interface ChallengeStateEvent {
    type: RefreshMessageType.CHALLENGE_STATE_CHANGED;
    source: WindowMode;
    timestamp: number;
}

export interface WindowConnectionState {
    connected: boolean;
    lastHeartbeat: number | null;
    mode: WindowMode;
}

interface NotifyOptions {
    suppressSelfRefresh?: boolean;
}

class WindowSyncService {
    #channel: BroadcastChannel | null = null;
    #mode: WindowMode;
    #refreshDelay: number;
    #configListeners: Set<ConfigListener> = new Set();
    #challengeListeners: Set<ChallengeListener> = new Set();
    #connectionListeners: Set<ConnectionListener> = new Set();
    #lastHeartbeat: number | null = null;
    #heartbeatIntervalId: number | null = null;
    #connectionIntervalId: number | null = null;
    #initialLoadTimestamp = Date.now();
    #connectionState: WindowConnectionState;

    constructor(refreshDelay: number = DEFAULT_REFRESH_DELAY) {
        this.#mode = this.#detectMode();
        this.#refreshDelay = refreshDelay;
        this.#connectionState = {
            connected: this.#mode === WindowMode.ADMIN,
            lastHeartbeat: null,
            mode: this.#mode,
        };

        this.#initializeChannel();
        this.#initializeHeartbeat();
        this.#initializeConnectionMonitor();
    }

    subscribeToConfig(listener: ConfigListener): () => void {
        this.#configListeners.add(listener);
        return () => this.#configListeners.delete(listener);
    }

    subscribeToChallenge(listener: ChallengeListener): () => void {
        this.#challengeListeners.add(listener);
        return () => this.#challengeListeners.delete(listener);
    }

    subscribeToConnection(listener: ConnectionListener): () => void {
        this.#connectionListeners.add(listener);
        listener(this.#connectionState);
        return () => this.#connectionListeners.delete(listener);
    }

    notifyConfigurationSaved(options: NotifyOptions = {}): void {
        this.#dispatchConfigMessage(MessageVariant.ALL);
        this.#emitConfigEvent({
            type: RefreshMessageType.CONFIG_SAVED,
            variant: MessageVariant.ALL,
            source: this.#mode,
            timestamp: Date.now(),
        });

        if (!options.suppressSelfRefresh) {
            this.#scheduleRefresh();
        }
    }

    notifyConfigurationSavedViewerOnly(): void {
        this.#dispatchConfigMessage(MessageVariant.VIEWER_ONLY);
        this.#emitConfigEvent({
            type: RefreshMessageType.CONFIG_SAVED,
            variant: MessageVariant.VIEWER_ONLY,
            source: this.#mode,
            timestamp: Date.now(),
        });

        // Viewer windows rely on the broadcast message to trigger refresh when received.
        // The originating admin window explicitly skips self-refresh for viewer-only
        // notifications, so no additional action is required here.
    }

    notifyChallengeStateChanged(): void {
        this.#dispatchChallengeMessage();
        const source = this.#mode;
        this.#emitChallengeEvent({
            type: RefreshMessageType.CHALLENGE_STATE_CHANGED,
            source,
            timestamp: Date.now(),
        });
        this.#dispatchChallengeRefreshCustomEvent(source);
    }

    announceLocalConfigSaved(variant: MessageVariant): void {
        this.#emitConfigEvent({
            type: RefreshMessageType.CONFIG_SAVED,
            variant,
            source: this.#mode,
            timestamp: Date.now(),
        });
    }

    announceLocalChallengeStateChanged(): void {
        const source = this.#mode;
        this.#emitChallengeEvent({
            type: RefreshMessageType.CHALLENGE_STATE_CHANGED,
            source,
            timestamp: Date.now(),
        });
        this.#dispatchChallengeRefreshCustomEvent(source);
    }

    isConnected(): boolean {
        return this.#connectionState.connected;
    }

    getConnectionState(): WindowConnectionState {
        return this.#connectionState;
    }

    destroy(): void {
        if (this.#heartbeatIntervalId !== null) {
            window.clearInterval(this.#heartbeatIntervalId);
            this.#heartbeatIntervalId = null;
        }

        if (this.#connectionIntervalId !== null) {
            window.clearInterval(this.#connectionIntervalId);
            this.#connectionIntervalId = null;
        }

        if (this.#channel) {
            this.#channel.removeEventListener(
                EVENT_NAMES.MESSAGE,
                this.#handleMessage
            );
            this.#channel.close();
            this.#channel = null;
        }

        this.#configListeners.clear();
        this.#challengeListeners.clear();
        this.#connectionListeners.clear();
    }

    #initializeChannel(): void {
        if (typeof BroadcastChannel === "undefined") {
            console.warn(
                WINDOW_SYNC_SERVICE_MESSAGES.BROADCAST_CHANNEL_UNSUPPORTED
            );
            return;
        }

        try {
            this.#channel = new BroadcastChannel(
                BROADCAST_CHANNEL_NAMES.CONFIG_UPDATES
            );
            this.#channel.addEventListener(
                EVENT_NAMES.MESSAGE,
                this.#handleMessage
            );
        } catch (error) {
            console.error(
                WINDOW_SYNC_SERVICE_MESSAGES.INIT_BROADCAST_CHANNEL_FAILED,
                error
            );
            this.#channel = null;
        }
    }

    setRefreshDelay(delay: number): void {
        if (delay < 0) {
            throw new Error(WINDOW_SYNC_SERVICE_MESSAGES.INVALID_REFRESH_DELAY);
        }
        this.#refreshDelay = delay;
    }

    getRefreshDelay(): number {
        return this.#refreshDelay;
    }

    #initializeHeartbeat(): void {
        if (this.#channel === null) {
            return;
        }

        if (this.#mode === WindowMode.ADMIN) {
            this.#sendHeartbeat();
            this.#heartbeatIntervalId = window.setInterval(() => {
                this.#sendHeartbeat();
            }, HEARTBEAT_INTERVAL);
        }
    }

    #initializeConnectionMonitor(): void {
        if (this.#mode !== WindowMode.VIEWER) {
            return;
        }

        this.#connectionIntervalId = window.setInterval(() => {
            this.#updateConnectionState();
        }, CONNECTION_CHECK_INTERVAL);
    }

    #dispatchConfigMessage(variant: MessageVariant): void {
        if (this.#channel === null) {
            return;
        }

        const message: RefreshMessage = {
            type: RefreshMessageType.CONFIG_SAVED,
            variant,
            timestamp: Date.now(),
            source: this.#mode,
        };

        try {
            this.#channel.postMessage(message);
        } catch (error) {
            console.error(
                WINDOW_SYNC_SERVICE_MESSAGES.DISPATCH_CONFIG_FAILED,
                error
            );
        }
    }

    #dispatchChallengeMessage(): void {
        if (this.#channel === null) {
            return;
        }

        const message: RefreshMessage = {
            type: RefreshMessageType.CHALLENGE_STATE_CHANGED,
            timestamp: Date.now(),
            source: this.#mode,
        };

        try {
            this.#channel.postMessage(message);
        } catch (error) {
            console.error(
                WINDOW_SYNC_SERVICE_MESSAGES.DISPATCH_CHALLENGE_FAILED,
                error
            );
        }
    }

    #handleMessage = (event: MessageEvent<RefreshMessage>): void => {
        const { data } = event;
        if (!data || !data.type || !data.timestamp || !data.source) {
            return;
        }

        if (data.source === this.#mode) {
            // Ignore messages originating from the same window mode
            return;
        }

        if (data.type === RefreshMessageType.CONFIG_SAVED) {
            const configEvent: ConfigSavedEvent = {
                type: RefreshMessageType.CONFIG_SAVED,
                variant: data.variant ?? MessageVariant.ALL,
                source: data.source,
                timestamp: data.timestamp,
            };
            this.#emitConfigEvent(configEvent);

            const shouldRefresh =
                configEvent.variant !== MessageVariant.VIEWER_ONLY ||
                this.#mode === WindowMode.VIEWER;

            if (shouldRefresh) {
                this.#scheduleRefresh();
            }
        } else if (data.type === RefreshMessageType.CHALLENGE_STATE_CHANGED) {
            const challengeEvent: ChallengeStateEvent = {
                type: RefreshMessageType.CHALLENGE_STATE_CHANGED,
                source: data.source,
                timestamp: data.timestamp,
            };
            this.#emitChallengeEvent(challengeEvent);
            this.#dispatchChallengeRefreshCustomEvent();
        } else if (data.type === RefreshMessageType.HEARTBEAT) {
            if (this.#mode === WindowMode.VIEWER) {
                this.#lastHeartbeat = data.timestamp;
                this.#updateConnectionState();
            }
        }
    };

    #emitConfigEvent(event: ConfigSavedEvent): void {
        this.#configListeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error(
                    WINDOW_SYNC_SERVICE_MESSAGES.CONFIG_LISTENER_ERROR,
                    error
                );
            }
        });
    }

    #emitChallengeEvent(event: ChallengeStateEvent): void {
        this.#challengeListeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error(
                    WINDOW_SYNC_SERVICE_MESSAGES.CHALLENGE_LISTENER_ERROR,
                    error
                );
            }
        });
    }

    #dispatchChallengeRefreshCustomEvent(source?: WindowMode): void {
        try {
            const event = new CustomEvent(EVENT_NAMES.CHALLENGE_LIST_REFRESH, {
                detail: {
                    timestamp: Date.now(),
                    source: source ?? this.#mode,
                },
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error(
                WINDOW_SYNC_SERVICE_MESSAGES.CUSTOM_EVENT_DISPATCH_FAILED,
                error
            );
        }
    }

    #scheduleRefresh(): void {
        try {
            window.setTimeout(() => {
                window.location.reload();
            }, this.#refreshDelay);
        } catch (error) {
            console.error(
                WINDOW_SYNC_SERVICE_MESSAGES.REFRESH_SCHEDULE_FAILED,
                error
            );
        }
    }

    #sendHeartbeat(): void {
        if (this.#channel === null) {
            return;
        }

        const message: RefreshMessage = {
            type: RefreshMessageType.HEARTBEAT,
            timestamp: Date.now(),
            source: this.#mode,
        };

        try {
            this.#channel.postMessage(message);
        } catch (error) {
            console.error(WINDOW_SYNC_SERVICE_MESSAGES.HEARTBEAT_FAILED, error);
        }
    }

    #updateConnectionState(): void {
        const now = Date.now();
        let connected: boolean;

        if (this.#channel === null) {
            connected = false;
        } else if (this.#mode === WindowMode.ADMIN) {
            connected = true;
        } else if (this.#lastHeartbeat === null) {
            const elapsed = now - this.#initialLoadTimestamp;
            connected = elapsed < HEARTBEAT_TIMEOUT;
        } else {
            const elapsed = now - this.#lastHeartbeat;
            connected = elapsed < HEARTBEAT_TIMEOUT;
        }

        if (connected !== this.#connectionState.connected) {
            this.#connectionState = {
                connected,
                lastHeartbeat: this.#lastHeartbeat,
                mode: this.#mode,
            };
            this.#emitConnectionState();
        } else if (
            this.#connectionState.lastHeartbeat !== this.#lastHeartbeat
        ) {
            this.#connectionState = {
                connected,
                lastHeartbeat: this.#lastHeartbeat,
                mode: this.#mode,
            };
            this.#emitConnectionState();
        }
    }

    #emitConnectionState(): void {
        this.#connectionListeners.forEach((listener) => {
            try {
                listener(this.#connectionState);
            } catch (error) {
                console.error(
                    WINDOW_SYNC_SERVICE_MESSAGES.CONNECTION_LISTENER_ERROR,
                    error
                );
            }
        });
    }

    #detectMode(): WindowMode {
        return window.location.hash === URL_HASH.ADMIN
            ? WindowMode.ADMIN
            : WindowMode.VIEWER;
    }
}

let windowSyncServiceInstance: WindowSyncService | null = null;

export const getWindowSyncService = (): WindowSyncService => {
    if (!windowSyncServiceInstance) {
        windowSyncServiceInstance = new WindowSyncService();
    }
    return windowSyncServiceInstance;
};

export const resetWindowSyncServiceForTesting = (): void => {
    if (windowSyncServiceInstance) {
        windowSyncServiceInstance.destroy();
        windowSyncServiceInstance = null;
    }
};
