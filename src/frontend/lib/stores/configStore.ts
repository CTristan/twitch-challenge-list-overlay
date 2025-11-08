import {
    getConfigService,
    type ConfigBroadcastOptions,
    type ConfigSnapshot,
} from "@backend/services/configService";
import { readable } from "svelte/store";

const createConfigStore = () => {
    const service = getConfigService();
    const { subscribe } = readable<ConfigSnapshot>(
        service.getSnapshot(),
        (set) => {
            const unsubscribe = service.subscribe((event) => {
                set(event.snapshot);
            });
            return () => unsubscribe();
        }
    );

    return {
        subscribe,
        getSnapshot: (): ConfigSnapshot => service.getSnapshot(),
        setValue: (
            path: string,
            value: unknown,
            options?: ConfigBroadcastOptions
        ): boolean => {
            if (value === undefined) {
                throw new Error(
                    "configStore.setValue requires a defined value"
                );
            }
            return service.setValue(path, value, options ?? {});
        },
        setAll: (config: Config, options?: ConfigBroadcastOptions): boolean =>
            service.setAll(config, options ?? {}),
        reset: (options?: ConfigBroadcastOptions): boolean =>
            service.reset(options ?? {}),
        importConfig: (
            config: Config,
            options?: ConfigBroadcastOptions
        ): boolean => service.importConfig(config, options ?? {}),
        update: (
            updater: (current: Config) => Config,
            options?: ConfigBroadcastOptions
        ): boolean => {
            const current = service.getSnapshot().config;
            const next = updater(current);
            return service.setAll(next, options ?? {});
        },
        reloadFromStorage: (): ConfigSnapshot => service.reloadFromStorage(),
    };
};

export const configStore = createConfigStore();
