# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Laravel Intellisense is a VS Code extension that provides autocompletion for Laravel projects. It requires a working database connection in the Laravel project to retrieve model attributes.

## Build Commands

```bash
# Development watch mode (webpack)
yarn watch

# Production build
yarn vscode:prepublish

# TypeScript compilation (without webpack)
yarn compile

# Lint
yarn lint

# Run tests
yarn test
```

## Architecture

### Extension Entry Point
- `src/extension.ts` - Activates only when `artisan` file exists (Laravel project detection). Registers completion providers and the "Generate Ide Helper" command.

### Completion Item Providers
Each provider implements VS Code's `CompletionItemProvider` interface for different Laravel features:
- `ModelItemProvider.ts` - Eloquent model attributes (queries database via PHP)
- `ViewItemProvider.ts` - Blade view names
- `ConfigItemProvider.ts` - Config keys
- `RouterItemProvider.ts` - Route names
- `TranslationItemProvider.ts` - Translation keys

### Parser System (`src/parser/`)
Parses PHP code using `php-parser` to detect context:
- `Parser` (index.ts) - Main parser that tokenizes PHP and detects aliases (view, config, route, query methods)
- `Handler.ts` - Token analysis for detecting Eloquent, Resource, and Factory contexts
- `ModelParser.ts`, `ResourceParser.ts`, `FactoryParser.ts` - Extract fully-qualified class names

### PHP Execution (`src/php/`)
- `index.ts` - `PHP` class that executes PHP code in the Laravel project context (bootstraps Laravel app)
- Supports Docker execution via `LaravelIntellisense.docker` config setting
- `model.ts`, `view.ts`, `config.ts`, `router.ts`, `translation.ts` - Generate PHP scripts that extract Laravel data
- `laravelIdeHelper.ts` - Generates IDE helper file

### Key Utilities (`src/utils.ts`)
- `path()` - Resolves paths relative to workspace
- `phpParserTokens()` - Tokenizes PHP code, filters whitespace/comments
- `getDefaultModelNamespace()` - Gets model namespace from extension config

## Configuration Settings
- `LaravelIntellisense.model` - Model namespace (default: `App\Models`)
- `LaravelIntellisense.docker` - Docker command prefix (e.g., `docker exec app`)
