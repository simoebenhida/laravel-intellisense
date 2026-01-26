# Change Log

All notable changes to the "laravel-intellisense" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.4.0] - 2026-01-26

### Added
- **Go to Definition** - Cmd/Ctrl+Click to jump to definitions
  - Views: Jump to Blade template files
  - Routes: Jump to route definition or controller method
  - Config: Jump to config file and key
  - Translations: Jump to language file and key

- **Hover Documentation** - Rich documentation on hover
  - Routes: Shows URL, HTTP methods, middleware, controller
  - Views: Shows file path and preview
  - Config: Shows file location and current value
  - Models: Shows attributes and relationships

- **Relationship Autocomplete** - Model relationships now appear in autocomplete
  - Shows relationship type (HasMany, BelongsTo, etc.)
  - Shows related model name
  - Includes usage examples

- **Validation Rules Autocomplete** - 100+ Laravel validation rules
  - Categorized by type (String, Numeric, Date, File, etc.)
  - Rich documentation with examples

- **PHP Path Configuration** - New `LaravelIntellisense.phpPath` setting
  - Configure custom PHP executable path
  - Useful when PHP is not in PATH

### Changed
- **AST-based Parser** - Complete rewrite of model detection
  - More accurate detection of Eloquent contexts
  - Supports multi-line queries
  - Better handling of chained methods
  - Tracks variable assignments (`$user = User::query()`)

- **Improved Error Handling**
  - Silent failures for PHP execution errors (no more log spam)
  - 30-second timeout for PHP commands
  - Graceful handling of missing database connections

- **Performance Improvements**
  - Lazy loading of PHP tokens
  - Cached AST parser instance
  - Debounced file watchers

### Fixed
- Fixed high CPU usage from setInterval bug
- Fixed "Unexpected end of JSON" errors
- Fixed memory leaks from undisposed file watchers
- Fixed model detection for `User::where('` pattern
- Fixed namespace resolution from use statements

### Dependencies
- Updated TypeScript to 5.3
- Updated ESLint to 8.x
- Updated Webpack to 5.x
- Updated all dev dependencies to latest versions

## [0.3.1] - Previous Release

- Bug fixes and maintenance updates

## [0.1.0] - Initial Release

- Eloquent model attribute autocompletion
- View autocompletion
- Config autocompletion
- Route autocompletion
- Translation autocompletion
- Docker support
