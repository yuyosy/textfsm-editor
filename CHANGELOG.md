# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
Refer to the GitHub main branch for the latest changes after release.


## [2.0.1] - 2026-11-14

### Changed

- Updated status badge colors and action icon styling. ([#9](https://github.com/yuyosy/textfsm-editor/pull/9))

### Fixed

- Prevented stale editor content from overwriting the current input or template. ([#10](https://github.com/yuyosy/textfsm-editor/pull/10))

## [2.0.0] - 2026-11-13

### Added

- Added a static build that runs Python TextFSM in a browser worker using Pyodide. Pyodide can be preloaded, and its loading notification shows progress and lets users cancel.
- Added an option to exclude failed parses from automatic history saves and a confirmation prompt for clearing local storage.

### Changed

- Split the frontend into Backend and Pyodide builds. Both include the JavaScript compatibility parser.
- Preserved preset search inputs and improved search controls, result panels, and parse status feedback.

### Fixed

- Improved empty-input handling and preserved Python TextFSM results and errors in the editor.
- Fixed JSON highlighting in environments without WebAssembly and static asset serving through FastAPI.

## [1.2.0] - 2026-10-26

### Added

- Added cancellable TextFSM parsing in a browser worker and a toolbar setting for switching between browser and backend processing. The setting persists across sessions.
- Loaded preset templates from verified static assets and exposed third-party license notices in the About dialog.

### Changed

- Updated Python and frontend dependencies and migrated the resizable panels to the current API.

## [1.1.0] - 2026-10-26

### Added

- Added Shiki syntax highlighting and a setting for the number of history entries per page.

### Changed

- Updated Docker and nginx configuration and added a frontend deployment script.

### Fixed

- Fixed loading saved data from the history dialog and corrected panel scrolling issues.

## [1.0.0] - 2025-02-27

### Added

- Added parsing history with automatic saves, template tags, and Docker Compose support.

### Changed

- Migrated from Yarn to npm and upgraded Mantine to v7.

### Removed

- Removed the AWS Lambda implementation.

## [0.1.1] - 2023-10-12

### Added

- Displayed the app version in the editor.

### Fixed

- Fixed an error when importing an invalid template file.

## [0.1] - 2023-10-03

- Initial test release.


[2.0.1]: https://github.com/yuyosy/textfsm-editor/releases/tag/v2.0.1
[2.0.0]: https://github.com/yuyosy/textfsm-editor/releases/tag/v2.0.0
[1.2.0]: https://github.com/yuyosy/textfsm-editor/releases/tag/v1.2.0
[1.1.0]: https://github.com/yuyosy/textfsm-editor/releases/tag/v1.1.0
[1.0.0]: https://github.com/yuyosy/textfsm-editor/releases/tag/v1.0.0
[0.1.1]: https://github.com/yuyosy/textfsm-editor/releases/tag/v0.1.1
[0.1]: https://github.com/yuyosy/textfsm-editor/releases/tag/v0.1
