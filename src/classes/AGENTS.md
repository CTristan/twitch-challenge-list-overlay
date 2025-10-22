# src/classes/ - Core Classes

Business logic classes implementing the application's main functionality.

## Key Classes

### App (`app.ts`)
- **Main controller**: Orchestrates entire application
- **DOM rendering**: Challenge list display and updates
- **Chat command handling**: Routes commands from TwitchChat
- **Cross-window sync**: BroadcastChannel communication
- **Connection warning**: Manages viewer mode warning indicator
- **Mode detection**: Admin vs viewer based on URL hash

### ChallengeList (`ChallengeList.ts`)
- **Challenge persistence**: localStorage save/load operations
- **Auto-save methods**: `addChallengeObjects()`, `toggleChallengeCompletion()`
- **Manual save methods**: `saveToLocalStorage()` (required after challenge setters)
- **Reload capability**: `loadFromLocalStorage()` for cross-window sync
- **Challenge map**: Internal Map structure with numeric ID tracking

### Challenge (`Challenge.ts`)
- **Immutable ID**: UUID generated on creation
- **Properties**: title, description, amount, isDone, timer
- **Validation**: Input validation in constructor and setters
- **Setters**: `setTitle()`, `setDescription()`, `setAmount()`, `setTimer()`, `setIsDone()`
- **No auto-save**: Must call `ChallengeList.saveToLocalStorage()` after setters

### AdminPanel (`AdminPanel.ts`)
- **Template-based UI**: Uses AdminPanelTemplates for HTML generation
- **Delegates to utilities**: ColorManager, BackgroundManager, ConfigValidator, DOMBuilder, EventSetup
- **Auto-save**: All config changes immediately saved to localStorage
- **Collapsible sections**: 4 sections with localStorage state persistence
- **Slider synchronization**: Immediate admin UI update, debounced viewer notification

### ConfigManager (`ConfigManager.ts`)
- **Singleton pattern**: `getInstance()` for global access
- **localStorage persistence**: Automatic save on every `set()` call
- **Type-safe access**: `get()` and `set()` with ConfigConstants keys
- **Default fallback**: Uses ConfigDefaults if localStorage empty
- **Validation**: Ensures all required properties exist

### ConfigExporter (`ConfigExporter.ts`)
- **Backup/restore**: JSON export/import with metadata
- **Validation**: Schema validation on import
- **Error handling**: User-friendly error messages
- **Metadata**: Includes version, timestamp, application info
