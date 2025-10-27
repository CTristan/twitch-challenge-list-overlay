/**
 * Twitch Challenge List Overlay - Deployment Configuration
 * 
 * SUPABASE MULTI-STREAMER CONFIGURATION
 * 
 * This configuration enables real-time challenge synchronization
 * across multiple streamers using Supabase.
 */

window.OVERLAY_CONFIG = {
    storage: {
        mode: "supabase",
        supabaseRoomCode: "default-room",
    },

    maxChallenges: 10,

    auth: {
        twitch_oauth: "",
        twitch_username: "",
        twitch_channel: "",
    },

    appearance: {
        challengeRowColors: ["#000000"],
        challengeRowTextColors: ["#ffffff"],
        challengeRowColorsOpacity: 1.0,
        overlayBackgroundColor: "rgba(100, 100, 100, 0.6)",
        overlayBackgroundOpacity: 0.6,
    },
};
