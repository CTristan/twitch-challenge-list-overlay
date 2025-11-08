import { getChallengeService } from "@backend/services/challengeService";
import { getConfigService } from "@backend/services/configService";
import { getTimerService } from "@backend/services/timerService";
import { getWindowSyncService } from "@backend/services/windowSyncService";

/**
 * Initialize backend services to support the Svelte migration bridge.
 * Optionally provide a default configuration for ConfigManager bootstrapping.
 */
export const initializeBackendServices = (defaultConfig?: Config): void => {
    getWindowSyncService();
    getChallengeService();
    getTimerService();
    if (defaultConfig) {
        getConfigService(defaultConfig);
    } else {
        getConfigService();
    }
};
