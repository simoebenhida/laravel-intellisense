# Laravel Intellisense

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83813946-4fb8ef00-a6b6-11ea-8f96-332a693972a8.gif" alt="demo"></p>

## Features

### Autocompletion
- [Eloquent Model Attributes](#eloquent-autocompletion)
- [Model Relationships](#relationship-autocompletion)
- [Views](#view-autocompletion)
- [Config](#config-autocompletion)
- [Routes](#route-autocompletion)
- [Translations](#translate-autocompletion)
- [Validation Rules](#validation-rules-autocompletion)
- [Resources](#resource-autocompletion)
- [Factories](#factory-autocompletion)

### Navigation
- [Go to Definition](#go-to-definition)
- [Hover Documentation](#hover-documentation)

### Tools
- [Laravel Ide Helper](#laravel-ide-helper)
- [Docker Support](#docker)

---

## Eloquent Autocompletion

Get autocompletion for model attributes when using Eloquent query methods.

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811079-0c0fb680-a6b1-11ea-9432-8c54165fe771.png" alt="model"></p>

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811082-0dd97a00-a6b1-11ea-81b9-5b02f0d6d41f.png" alt="model"></p>

**Supported patterns:**
```php
// Static calls
User::where('|')

// Chained queries
User::query()->where('|')

// Variable tracking
$user = User::query();
$user->where('|')

// Multi-line queries
User::where(
    '|'
)
```

## Relationship Autocompletion

Model relationships are now included in autocomplete results, showing:
- Relationship type (HasMany, BelongsTo, etc.)
- Related model name
- Usage examples

```php
$user->posts()  // HasMany → Post
$post->author() // BelongsTo → User
```

## Validation Rules Autocompletion

Get autocompletion for Laravel validation rules with 100+ built-in rules.

```php
$request->validate([
    'email' => 'required|email|unique:users',
    'age' => 'required|integer|min:18',
]);
```

Rules are categorized by type with rich documentation and examples.

## View Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811421-abcd4480-a6b1-11ea-8af2-60132be872ca.png" alt="model"></p>

**Supported functions:**
- `view('...')`
- `View::make('...')`
- `@extends('...')`
- `@include('...')`
- `@component('...')`
- `@each('...')`

## Config Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811468-c7d0e600-a6b1-11ea-8cf1-bdeea1f93e9a.png" alt="model"></p>

**Supported functions:**
- `config('...')`
- `Config::get('...')`

## Route Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811472-cacbd680-a6b1-11ea-889d-8be00e465bc5.png" alt="model"></p>

## Translate Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/85328628-f67bf880-b4c8-11ea-8819-947f255b825c.png" alt="model"></p>

**Supported functions:**
- `__('...')`
- `trans('...')`
- `trans_choice('...')`
- `@lang('...')`

## Resource Autocompletion

Get autocompletion for `$this->` in API Resource classes.

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83809978-47a98100-a6af-11ea-905c-2ee360b43948.png" alt="resource"></p>

## Factory Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811281-6e68b700-a6b1-11ea-9bb5-1baf2b38079e.png" alt="model"></p>

---

## Go to Definition

**Cmd+Click** (Mac) or **Ctrl+Click** (Windows/Linux) to jump to definitions:

| Context | Destination |
|---------|-------------|
| `view('users.index')` | `resources/views/users/index.blade.php` |
| `route('users.show')` | Route definition in `routes/*.php` |
| `config('app.name')` | `config/app.php` at the `name` key |
| `__('messages.welcome')` | `resources/lang/en/messages.php` |

## Hover Documentation

Hover over Laravel code to see rich documentation:

- **Routes**: URL, HTTP methods, middleware, controller
- **Views**: File path and code preview
- **Config**: File location and current value
- **Models**: Attributes and relationships list

---

## Laravel Ide Helper

Generate IDE helper files for better autocompletion. Run the command:

```
Generate Ide Helper
```

Or use [laravel-ide-helper](https://github.com/barryvdh/laravel-ide-helper) directly for more customization.

---

## Configuration

### Model Namespace

Set your model namespace in **Settings > Extensions > Laravel Intellisense > Model**

Default: `App\Models`

### PHP Path

Set custom PHP executable path in **Settings > Extensions > Laravel Intellisense > PHP Path**

Default: `php`

Useful when PHP is not in your system PATH.

### Docker

If using Docker, set the container command in **Settings > Extensions > Laravel Intellisense > Docker**

Example:
```
docker exec app
```

Or for Laravel Sail:
```
sail
```

---

## Requirements

- Working database connection in your Laravel project
- PHP accessible from command line (or configure Docker/PHP Path)

## Issues & Contributions

Report issues or contribute at [GitHub](https://github.com/simoebenhida/laravel-intellisense)
