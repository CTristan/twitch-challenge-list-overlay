import ConfigManager from "@/classes/ConfigManager";
import type {
    ConfigUpdateOriginValue,
    ConfigUpdateTypeValue,
} from "@/types/ConfigUpdateConstants";
import {
    CONFIG_UPDATE_ORIGINS,
    CONFIG_UPDATE_TYPES,
} from "@/types/ConfigUpdateConstants";
import { URL_HASH } from "@/types/DOMConstants";
import { CONFIG_SERVICE_MESSAGES } from "@/types/MessageConstants";
import { MessageVariant } from "@/types/MessageVariant";
import { WindowMode } from "@/types/WindowMode";
import { createFallbackConfig } from "@/utils/ConfigDefaults";
import { getWindowSyncService } from "@backend/services/windowSyncService";

export interface ConfigSnapshot {
    config: Config;
    status: ConfigSystemStatus;
    timestamp: number;
}

export type ConfigSystemStatus = ReturnType<ConfigManager["getSystemStatus"]>;

export type ConfigUpdateType = ConfigUpdateTypeValue;

export type ConfigUpdateOrigin = ConfigUpdateOriginValue;

export interface ConfigUpdateEvent {
    type: ConfigUpdateType;
    origin: ConfigUpdateOrigin;
    snapshot: ConfigSnapshot;
    changedPaths?: string[];
    variant?: MessageVariant;
}

export interface ConfigBroadcastOptions {
    variant?: MessageVariant;
    suppressSelfRefresh?: boolean;
}

type ConfigListener = (event: ConfigUpdateEvent) => void;

type WindowSyncUnsubscribe = () => void;

interface EmitOptions {
    type: ConfigUpdateType;
    origin: ConfigUpdateOrigin;
    changedPaths?: string[];
    variant?: MessageVariant;
}

class ConfigService {
    #configManager: ConfigManager;
    #listeners: Set<ConfigListener> = new Set();
    #snapshot: ConfigSnapshot;
    #mode: WindowMode;
    #unsubscribeWindowSync: WindowSyncUnsubscribe | null = null;
    #ignoreNextLocalSync = false;
    #defaultConfig: Config;

    constructor(defaultConfig: Config = createFallbackConfig()) {
        this.#configManager = ConfigManager.getInstance(defaultConfig);
        this.#defaultConfig = this.#configManager.getAll();
        this.#mode =
            window.location.hash === URL_HASH.ADMIN
                ? WindowMode.ADMIN
                : WindowMode.VIEWER;
        this.#snapshot = this.#buildSnapshot();
        this.#connectWindowSync();
    }

    subscribe(listener: ConfigListener): () => void {
        this.#listeners.add(listener);
        listener({
            type: CONFIG_UPDATE_TYPES.INIT,
            origin: CONFIG_UPDATE_ORIGINS.LOCAL,
            snapshot: this.#snapshot,
        });
        return () => {
            this.#listeners.delete(listener);
        };
    }

    getSnapshot(): ConfigSnapshot {
        return this.#snapshot;
    }

    setValue(
        path: string,
        value: unknown,
        options: ConfigBroadcastOptions = {}
    ): boolean {
        if (value === undefined) {
            console.error(
                CONFIG_SERVICE_MESSAGES.UNDEFINED_VALUE_FOR_PATH,
                path
            );
            return false;
        }

        const success = this.#configManager.set(path, value);
        if (success) {
            this.#emit({
                type: CONFIG_UPDATE_TYPES.SET,
                origin: CONFIG_UPDATE_ORIGINS.LOCAL,
                changedPaths: [path],
                ...(options.variant !== undefined && {
                    variant: options.variant,
                }),
            });
            this.#broadcastLocalChange(options);
        }
        return success;
    }

    setAll(newConfig: Config, options: ConfigBroadcastOptions = {}): boolean {
        const success = this.#configManager.setAll(newConfig);
        if (success) {
            this.#emit({
                type: CONFIG_UPDATE_TYPES.SET_ALL,
                origin: CONFIG_UPDATE_ORIGINS.LOCAL,
                ...(options.variant !== undefined && {
                    variant: options.variant,
                }),
            });
            this.#broadcastLocalChange(options);
        }
        return success;
    }

    reset(options: ConfigBroadcastOptions = {}): boolean {
        const success = this.#configManager.reset();
        if (success) {
            this.#emit({
                type: CONFIG_UPDATE_TYPES.RESET,
                origin: CONFIG_UPDATE_ORIGINS.LOCAL,
                ...(options.variant !== undefined && {
                    variant: options.variant,
                }),
            });
            this.#broadcastLocalChange(options);
        }
        return success;
    }

    importConfig(
        importedConfig: Config,
        options: ConfigBroadcastOptions = {}
    ): boolean {
        const success = this.#configManager.import(importedConfig);
        if (success) {
            this.#emit({
                type: CONFIG_UPDATE_TYPES.IMPORT,
                origin: CONFIG_UPDATE_ORIGINS.LOCAL,
                ...(options.variant !== undefined && {
                    variant: options.variant,
                }),
            });
            this.#broadcastLocalChange(options);
        }
        return success;
    }

    reloadFromStorage(): ConfigSnapshot {
        this.#configManager.reloadFromStorage();
        this.#snapshot = this.#buildSnapshot();
        return this.#snapshot;
    }

    destroy(): void {
        this.#listeners.clear();
        if (this.#unsubscribeWindowSync) {
            this.#unsubscribeWindowSync();
            this.#unsubscribeWindowSync = null;
        }
    }

    resetForTesting(): void {
        this.destroy();
        this.#configManager.setAll(this.#defaultConfig);
        this.#snapshot = this.#buildSnapshot();
        this.#connectWindowSync();
    }

    #connectWindowSync(): void {
        const windowSync = getWindowSyncService();
        if (this.#unsubscribeWindowSync) {
            this.#unsubscribeWindowSync();
            this.#unsubscribeWindowSync = null;
        }
        this.#unsubscribeWindowSync = windowSync.subscribeToConfig((event) => {
            const origin: ConfigUpdateOrigin =
                event.source === this.#mode
                    ? CONFIG_UPDATE_ORIGINS.LOCAL
                    : CONFIG_UPDATE_ORIGINS.EXTERNAL;

            if (
                origin === CONFIG_UPDATE_ORIGINS.LOCAL &&
                this.#ignoreNextLocalSync
            ) {
                this.#ignoreNextLocalSync = false;
                return;
            }

            try {
                this.#configManager.reloadFromStorage();
            } catch (error) {
                console.error(CONFIG_SERVICE_MESSAGES.RELOAD_FAILED, error);
            }

            this.#emit({
                type: CONFIG_UPDATE_TYPES.SYNC,
                origin,
                ...(event.variant !== undefined && {
                    variant: event.variant,
                }),
            });
        });
    }

    #broadcastLocalChange(options: ConfigBroadcastOptions): void {
        const windowSync = getWindowSyncService();
        const variant = options.variant ?? MessageVariant.ALL;
        const suppressSelfRefresh = options.suppressSelfRefresh ?? false;

        try {
            this.#ignoreNextLocalSync = true;
            if (variant === MessageVariant.VIEWER_ONLY) {
                windowSync.notifyConfigurationSavedViewerOnly();
            } else {
                windowSync.notifyConfigurationSaved({
                    suppressSelfRefresh,
                });
            }
        } catch (error) {
            this.#ignoreNextLocalSync = false;
            console.error(CONFIG_SERVICE_MESSAGES.BROADCAST_FAILED, error);
        }
    }

    #emit({ type, origin, changedPaths, variant }: EmitOptions): void {
        this.#snapshot = this.#buildSnapshot();
        const event: ConfigUpdateEvent = {
            type,
            origin,
            snapshot: this.#snapshot,
        };

        if (changedPaths !== undefined) {
            event.changedPaths = changedPaths;
        }

        if (variant !== undefined) {
            event.variant = variant;
        }

        this.#listeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error(CONFIG_SERVICE_MESSAGES.LISTENER_ERROR, error);
            }
        });
    }

    #buildSnapshot(): ConfigSnapshot {
        return {
            config: this.#configManager.getAll(),
            status: this.#configManager.getSystemStatus(),
            timestamp: Date.now(),
        };
    }
}

let configServiceInstance: ConfigService | null = null;

export const getConfigService = (
    defaultConfig: Config = createFallbackConfig()
): ConfigService => {
    if (!configServiceInstance) {
        configServiceInstance = new ConfigService(defaultConfig);
    }
    return configServiceInstance;
};

export const resetConfigServiceForTesting = (): void => {
    if (configServiceInstance) {
        configServiceInstance.resetForTesting();
        configServiceInstance = null;
    }
};
