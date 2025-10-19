import App from "./app";
import AdminPanel from "./classes/AdminPanel";
import ConfigManager from "./classes/ConfigManager";
import { setupDualWindow } from "./dualWindow";
import { closeModal, openModal } from "./modal";
import { StorageInitializer } from "./storage/StorageInitializer";
import TwitchChat from "./twitch/TwitchChat";
import { loadTestUsers } from "./twitch/loadTestUsers";
import {
    AUTH_CONFIG,
    GLOBAL_PROPERTIES,
    NETWORK_URLS,
    TWITCH_EVENTS,
    URL_PARAMS,
} from "./types/ConfigConstants";
import {
    COMMAND_HANDLER_MESSAGES,
    TEST_MODE_MESSAGES,
    TWITCH_INTEGRATION_MESSAGES,
} from "./types/MessageConstants";
import { STORAGE_KEYS } from "./types/StorageConstants";
import { createConfigWithDeploymentSettings } from "./utils/DeploymentConfigLoader";
import { getWindowRefreshManager } from "./utils/windowRefresh";

// Initialize dual-window architecture
setupDualWindow();

// Initialize window refresh system for configuration updates
getWindowRefreshManager();

// Initialize configuration management system
// Configuration is loaded from localStorage with fallback to defaults
// Deployment config from config.js (if present) is merged with defaults
const configManager: ConfigManager = ConfigManager.getInstance(
    createConfigWithDeploymentSettings()
);

// Initialize storage adapter based on configuration
// This will use Supabase if configured in config.js, otherwise localStorage
StorageInitializer.initializeFromConfig(configManager);

/**
 * Check if Twitch credentials are configured
 * @returns {boolean} True if all Twitch auth fields are non-empty
 */
function hasTwitchCredentials(): boolean {
    const twitch_channel = configManager.get(AUTH_CONFIG.TWITCH_CHANNEL);
    const twitch_oauth = configManager.get(AUTH_CONFIG.TWITCH_OAUTH);
    const twitch_username = configManager.get(AUTH_CONFIG.TWITCH_USERNAME);

    return (
        typeof twitch_channel === "string" &&
        twitch_channel.trim().length > 0 &&
        typeof twitch_oauth === "string" &&
        twitch_oauth.trim().length > 0 &&
        typeof twitch_username === "string" &&
        twitch_username.trim().length > 0
    );
}

// Initialize TwitchChat only if credentials are configured
let client: TwitchChat | null = null;

if (hasTwitchCredentials()) {
    const twitch_channel = configManager.get(AUTH_CONFIG.TWITCH_CHANNEL);
    const twitch_oauth = configManager.get(AUTH_CONFIG.TWITCH_OAUTH);
    const twitch_username = configManager.get(AUTH_CONFIG.TWITCH_USERNAME);

    client = new TwitchChat(NETWORK_URLS.TWITCH_IRC, {
        username: twitch_username,
        authToken: twitch_oauth,
        channel: twitch_channel,
    });
    console.log(TWITCH_INTEGRATION_MESSAGES.ENABLED);
} else {
    console.log(TWITCH_INTEGRATION_MESSAGES.DISABLED);
    console.log(TWITCH_INTEGRATION_MESSAGES.ADMIN_PANEL_AVAILABLE);
}

window.addEventListener("load", () => {
    let storeName: string = STORAGE_KEYS.CHALLENGE_LIST;
    // Test mode can be enabled via URL parameter: ?test=true
    const urlParams = new URLSearchParams(window.location.search);
    const testMode =
        urlParams.get(URL_PARAMS.TEST_MODE_PARAM) ===
        URL_PARAMS.TEST_MODE_VALUE;

    if (testMode) {
        console.log(TEST_MODE_MESSAGES.ENABLED);
        storeName = STORAGE_KEYS.CHALLENGE_LIST_TEST;
    }

    const app = new App(storeName);
    app.render();

    // Initialize admin panel functionality with App instance for interactive features
    new AdminPanel(app);

    // Set up TwitchChat event handlers only if client is initialized
    if (client) {
        client.on(TWITCH_EVENTS.COMMAND, (data: CommandData) => {
            const { user, command, message, flags, extra } = data;

            const response = app.chatHandler(
                user,
                command,
                message,
                flags,
                extra
            );

            if (!response.error) {
                client!.say(response.message, extra.messageId);
            } else {
                // error logs also are added to OBS logs
                if (response.message) {
                    console.error(
                        `${COMMAND_HANDLER_MESSAGES.ERROR_PREFIX}${response.message}`
                    );
                }
                // Note: Silent ignores (empty error messages) are not logged here to avoid spam
            }
        });

        client.on(TWITCH_EVENTS.OAUTH_ERROR, () => {
            openModal();
        });

        client.on(TWITCH_EVENTS.OAUTH_SUCCESS, () => {
            closeModal();
        });

        client.connect();
        if (testMode) loadTestUsers(client);
    }

    // Expose components globally for debugging
    (window as any)[GLOBAL_PROPERTIES.CHALLENGE_BOT] = {
        [GLOBAL_PROPERTIES.APP]: app,
        [GLOBAL_PROPERTIES.CLIENT]: client ?? null, // Expose null if TwitchChat is not initialized
        [GLOBAL_PROPERTIES.CONFIG_MANAGER]: configManager,
        [GLOBAL_PROPERTIES.VERSION]: "1.0.0",
    };
});
