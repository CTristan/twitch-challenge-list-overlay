# Twitch Challenge List Overlay

A browser-based challenge management overlay for Twitch streamers with real-time chat integration and zero-server deployment. Perfect for OBS Browser Sources.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)

## 📋 Overview

Twitch Challenge List Overlay is a frontend-only application that allows streamers to manage viewer challenges directly from Twitch chat. It features a dual-mode architecture with a viewer overlay for on-stream display and an admin panel for configuration and management.

**Key Highlights:**

-   🎯 **Zero-Server Deployment** - No backend required, runs entirely in the browser
-   🔄 **Real-Time Sync** - Cross-window synchronization using BroadcastChannel API
-   💬 **Twitch Chat Integration** - Unified `!ch` command system with WebSocket IRC
-   ⏱️ **Countdown Timers** - Visual countdown timers with warning states
-   🎨 **Customizable Styling** - Configurable colors, opacity, and backgrounds
-   📦 **LocalStorage Persistence** - All data stored locally, no database needed

## ✨ Features

### Dual-Mode Architecture

-   **Viewer Mode** (`file:///path/to/index.html`) - Read-only overlay for on-stream display
-   **Admin Mode** (`file:///path/to/index.html#admin`) - Interactive panel for configuration and management
-   **URL Fragment Routing** - Single HTML file with mode switching via URL hash

### Challenge Management

-   **Numeric ID Prefixes** - Each challenge displays with position number (1., 2., 3., etc.)
-   **Multi-Step Challenges** - Track progress with amount counters (e.g., "3/10 completed")
-   **Countdown Timers** - Real-time countdown with visual warning states (normal, warning ≤2min, critical ≤30s)
-   **Interactive Checkboxes** - Click to toggle completion in admin mode
-   **Edit Modal** - In-place editing with modal interface

### Twitch Chat Commands

All commands require moderator or broadcaster permissions and use the unified `!ch` prefix:

**Challenge Management:**

```
!ch add d=Description [a=Amount] [t=Minutes]
!ch done <ID>
!ch edit <ID> [d=New Description] [a=New Amount] [t=New Minutes]
!ch delete <ID>
```

**Progress Commands:**

```
!ch + <ID>        - Increment progress
!ch - <ID>        - Decrement progress
!ch set <ID> <N>  - Set progress to N
!ch fail <ID>     - Mark as failed
```

**List Commands:**

```
!ch list          - Show all challenges
!ch show <ID>     - Show specific challenge
!ch check         - Show completion status
```

**Admin Commands:**

```
!ch clearall      - Remove all challenges
!ch cleardone     - Remove completed challenges
```

### Admin Panel Features

-   **Auto-Save Configuration** - All changes automatically saved to localStorage
-   **Color Configuration** - Customizable challenge row colors with opacity control
-   **Background Opacity** - Separate opacity controls for overlay and challenge rows
-   **Backup/Restore** - Export and import configuration as JSON
-   **Clear All Data** - Reset all application data with confirmation dialog
-   **Collapsible Sections** - Organized settings with persistent state

### Cross-Window Synchronization

-   **Configuration Changes** - Trigger full page reload in viewer window
-   **Challenge State Changes** - Trigger DOM-only updates for instant sync
-   **Connection Warning** - Visual indicator when sync is unavailable (viewer mode only)

## 🛠️ Technology Stack

-   **TypeScript** - Type-safe development with strict configuration
-   **Vite** - Fast build tool with IIFE bundle output
-   **Vitest** - Unit testing with jsdom environment (80%+ coverage)
-   **CSS Custom Properties** - Dynamic theming and styling
-   **WebSocket** - Twitch IRC chat integration
-   **LocalStorage** - Client-side data persistence
-   **BroadcastChannel API** - Cross-window communication

## 📦 Installation & Setup

### Prerequisites

-   **Node.js** ≥20.0.0
-   **pnpm** (recommended) or npm

### Installation Steps

1. **Clone the repository:**

```bash
git clone https://github.com/CTristan/twitch-challenge-list-overlay.git
cd twitch-challenge-list-overlay
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Build the application:**

```bash
pnpm run build
```

This creates `dist/challengeBot.iife.js` which is loaded by `index.html`.

### Development Workflow

```bash
pnpm vite       # Start development server
pnpm vitest     # Run tests
pnpm run build  # Production build
```

## 🚀 Usage

### Step 1: Add Viewer Overlay to OBS

1. In OBS, click **Sources** → **+** → **Browser**
2. Name it "Challenge List Overlay"
3. In the URL field, enter:
    ```
    file:///FULL/PATH/TO/twitch-challenge-list-overlay/index.html
    ```
    Replace `FULL/PATH/TO` with the actual path to your project directory.
4. Set dimensions (e.g., 800x600)
5. Click **OK**

⚠️ **DO NOT** use the "Local file" checkbox - it breaks URL fragment routing!

### Step 2: Add Admin Panel to OBS

1. In OBS, go to **View** → **Docks** → **Custom Browser Docks**
2. Add a new dock:
    - **Dock Name:** Challenge Admin Panel
    - **URL:**
        ```
        file:///FULL/PATH/TO/twitch-challenge-list-overlay/index.html#admin
        ```
        Note the `#admin` at the end!
3. Click **Apply**

The admin panel will appear as a dock in OBS.

### Step 3 (optional): Configure Twitch Integration

#### Generate Twitch OAuth Token

1. Visit [https://twitchtokengenerator.com](https://twitchtokengenerator.com)
2. Click **"Custom Scope Token"**
3. Select scopes:
    - `chat:read`
    - `chat:edit`
4. Click **"Generate Token"**
5. Click **"Authorize"** on the Twitch authorization page
6. Copy the **"Access Token"** (starts with `oauth:`)

#### Set up Twitch Integration in Admin Panel

⚠️ **IMPORTANT:** Keep this token private! Do not share it with anyone.

1. In the admin panel, expand **"Twitch Chat Integration"**
2. Paste your OAuth token in the **"OAuth Token"** field
3. Enter your Twitch channel name in the **"Channel Name"** field
4. Settings are automatically saved

The bot will now connect to your Twitch chat and respond to `!ch` commands.

## ⚙️ Configuration

The admin panel provides comprehensive configuration options:

### General Settings

-   **Max Challenges** - Maximum number of active challenges (default: 10)
-   **Command Mappings** - Customize command aliases

### Challenge Row Styling

-   **Primary/Secondary/Tertiary Colors** - Background and text colors for challenge rows
-   **Row Colors Opacity** - Transparency control for challenge containers (0-100%)

### Overlay Background

-   **Background Color** - Main overlay background color
-   **Background Opacity** - Transparency control for main container (0-100%, default: 60%)

### Twitch Chat Integration

-   **OAuth Token** - Twitch authentication token
-   **Channel Name** - Your Twitch channel name

### Backup & Restore

-   **Backup Configuration** - Export settings as JSON
-   **Restore Configuration** - Import settings from JSON
-   **Reset to Defaults** - Restore factory settings
-   **Clear All Data** - Remove all application data (with confirmation)

## 🧪 Testing

The project maintains 80%+ test coverage across all metrics:

```bash
# Run all tests
pnpm run test

# Generate coverage report
pnpm run test:coverage
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
