/**
 * Twitch Challenge List Overlay - Deployment Configuration
 * 
 * This file allows you to pre-configure the overlay before deployment.
 * Copy this file to `config.js` and customize the values below.
 * 
 * USAGE:
 * 1. Copy this file: cp config.example.js config.js
 * 2. Edit config.js with your desired settings
 * 3. Deploy both index.html and config.js to your web server
 * 
 * The application will automatically detect and use config.js if present.
 */

window.OVERLAY_CONFIG = {
    /**
     * Storage Configuration
     * 
     * mode: "local" | "supabase"
     *   - "local": Use browser localStorage (single computer, default)
     *   - "supabase": Use Supabase for real-time multi-streamer sync
     * 
     * supabaseRoomCode: string
     *   - Required when mode is "supabase"
     *   - Share this code with other streamers to sync challenges
     *   - Example: "mario-party-jan2025", "speedrun-collab", etc.
     */
    storage: {
        mode: "local",
        supabaseRoomCode: "",
    },

    /**
     * Behavior Configuration
     * 
     * maxChallenges: number
     *   - Maximum number of active challenges allowed
     *   - Default: 10
     */
    maxChallenges: 10,

    /**
     * Twitch Chat Integration (Optional)
     * 
     * Pre-configure Twitch credentials for easier deployment.
     * Leave empty to configure via admin panel.
     * 
     * SECURITY WARNING: Only use this for server deployments where
     * the config.js file is not publicly accessible, or use environment
     * variables to inject these values during build/deployment.
     */
    auth: {
        twitch_oauth: "",      // OAuth token from https://twitchtokengenerator.com
        twitch_username: "",   // Bot username
        twitch_channel: "",    // Channel to connect to
    },

    /**
     * Visual Configuration (Optional)
     * 
     * Pre-configure colors and styling for consistent branding.
     */
    appearance: {
        // Challenge row background colors (array of 1-3 colors for cycling)
        challengeRowColors: ["#000000"],
        
        // Challenge row text colors (should match challengeRowColors length)
        challengeRowTextColors: ["#ffffff"],
        
        // Opacity for challenge row colors (0.0 to 1.0)
        challengeRowColorsOpacity: 1.0,
        
        // Overlay background color
        overlayBackgroundColor: "rgba(100, 100, 100, 0.6)",
        
        // Overlay background opacity (0.0 to 1.0)
        overlayBackgroundOpacity: 0.6,
    },
};
