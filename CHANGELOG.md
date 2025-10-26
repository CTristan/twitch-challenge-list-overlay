# Changelog

All notable changes to this project will be documented in this file.

## [v0.2] - 2025-10-22

### Added

-   New options added to Admin Panel Settings:
    -   "Text-Only Mode in Admin View" option for the Admin dock to make viewing challenges easier.
    -   "Viewer Font Size" option that only affects the Viewer Overlay.
-   New buttons added to Admin dock:
    -   "Refresh Page" button in the Admin panel to make it easier to refresh when docked.
    -   "Delete" button for each challenge, with a confirmation step to prevent accidental deletions.
    -   "Clear Failed" button to remove only failed challenges from the list.

### Changed

-   Viewer overlay hides the "Challenges 0/0" and should appear invisible when there are no challenges (Admin mode still shows it for management).
-   Renamed "Clear Finished" action to "Clear Completed" for clarity and added a separate "Clear Failed" action.

### Fixed

-   Admin dock challenge rows should now be smaller when docked in OBS.
-   Challenges in the Admin view would sometimes not auto-refresh.

## [v0.1] - 2025-10-12

-   Initial release.

[v0.2]: https://github.com/CTristan/twitch-challenge-list-overlay/releases/tag/v0.2
[v0.1]: https://github.com/CTristan/twitch-challenge-list-overlay/releases/tag/v0.1
