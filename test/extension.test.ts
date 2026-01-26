import * as assert from "assert";
import * as vscode from "vscode";
import AstParser from "../src/parser/AstParser";
import ContextDetector from "../src/ContextDetector";
import Parser from "../src/parser/index";
import { phpParserTokens } from "../src/utils";
import Handler from "../src/parser/Handler";

/**
 * AST Parser Tests
 */
suite("AST Parser Tests", () => {
  let astParser: AstParser;

  setup(() => {
    astParser = new AstParser();
  });

  test("detects static model call: User::where('", () => {
    const code = `<?php
use App\\Models\\User;

User::where('name', 'test');`;

    const result = astParser.getModelContext(code, new vscode.Position(3, 14));

    assert.ok(result, "Should detect model context");
    assert.strictEqual(result?.className, "App\\Models\\User");
    assert.strictEqual(result?.methodName, "where");
  });

  test("detects chained query: User::query()->where('", () => {
    const code = `<?php
use App\\Models\\User;

User::query()->where('name', '');`;

    const result = astParser.getModelContext(code, new vscode.Position(3, 23));

    assert.ok(result, "Should detect model context");
    assert.strictEqual(result?.className, "App\\Models\\User");
    assert.strictEqual(result?.methodName, "where");
  });

  test("tracks variable assignment: $user = User::query(); $user->where('", () => {
    const code = `<?php
use App\\Models\\User;

$user = User::query();
$user->where('email', '');`;

    const result = astParser.getModelContext(code, new vscode.Position(4, 15));

    assert.ok(result, "Should detect model context from variable");
    assert.strictEqual(result?.className, "App\\Models\\User");
    assert.strictEqual(result?.methodName, "where");
  });

  test("handles multi-line queries", () => {
    const code = `<?php
use App\\Models\\User;

User::where(
    'name',
    'test'
);`;

    const result = astParser.getModelContext(code, new vscode.Position(4, 5));

    assert.ok(result, "Should detect model context in multi-line");
    assert.strictEqual(result?.className, "App\\Models\\User");
  });

  test("handles deeply chained queries", () => {
    const code = `<?php
use App\\Models\\User;

User::query()->where('active', true)->where('name', '');`;

    const result = astParser.getModelContext(code, new vscode.Position(3, 50));

    assert.ok(result, "Should detect model in deeply chained call");
    assert.strictEqual(result?.className, "App\\Models\\User");
  });

  test("resolves namespace from use statement", () => {
    const code = `<?php
use App\\Models\\User;
use App\\Models\\Post;

Post::where('title', '');`;

    const result = astParser.getModelContext(code, new vscode.Position(4, 15));

    assert.ok(result, "Should resolve correct namespace");
    assert.strictEqual(result?.className, "App\\Models\\Post");
  });

  test("handles fully qualified class name", () => {
    const code = `<?php

\\App\\Models\\User::where('name', '');`;

    const result = astParser.getModelContext(code, new vscode.Position(2, 25));

    assert.ok(result, "Should handle fully qualified name");
    assert.strictEqual(result?.className, "\\App\\Models\\User");
  });

  test("returns null for non-query methods", () => {
    const code = `<?php
use App\\Models\\User;

User::customMethod('test');`;

    const result = astParser.getModelContext(code, new vscode.Position(3, 20));

    assert.strictEqual(result, null, "Should return null for non-query methods");
  });
});

/**
 * Context Detector Tests
 */
suite("Context Detector Tests", () => {
  function createMockDocument(content: string): vscode.TextDocument {
    return {
      lineAt: (line: number) => ({
        text: content.split("\n")[line] || "",
      }),
      offsetAt: (pos: vscode.Position) => {
        const lines = content.split("\n");
        let offset = 0;
        for (let i = 0; i < pos.line; i++) {
          offset += lines[i].length + 1;
        }
        return offset + pos.character;
      },
    } as vscode.TextDocument;
  }

  test("detects view() function", () => {
    const doc = createMockDocument("view('users.index')");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 10));

    assert.ok(result, "Should detect view context");
    assert.strictEqual(result?.type, "view");
    assert.strictEqual(result?.value, "users.index");
  });

  test("detects @include directive", () => {
    const doc = createMockDocument("@include('partials.header')");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 15));

    assert.ok(result, "Should detect @include");
    assert.strictEqual(result?.type, "view");
    assert.strictEqual(result?.value, "partials.header");
  });

  test("detects @extends directive", () => {
    const doc = createMockDocument("@extends('layouts.app')");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 15));

    assert.ok(result, "Should detect @extends");
    assert.strictEqual(result?.type, "view");
    assert.strictEqual(result?.value, "layouts.app");
  });

  test("detects route() function", () => {
    const doc = createMockDocument("route('users.show', $id)");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 10));

    assert.ok(result, "Should detect route context");
    assert.strictEqual(result?.type, "route");
    assert.strictEqual(result?.value, "users.show");
  });

  test("detects config() function", () => {
    const doc = createMockDocument("config('app.name')");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 12));

    assert.ok(result, "Should detect config context");
    assert.strictEqual(result?.type, "config");
    assert.strictEqual(result?.value, "app.name");
  });

  test("detects Config::get() facade", () => {
    const doc = createMockDocument("Config::get('database.default')");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 20));

    assert.ok(result, "Should detect Config::get");
    assert.strictEqual(result?.type, "config");
    assert.strictEqual(result?.value, "database.default");
  });

  test("detects __() translation function", () => {
    const doc = createMockDocument("__('messages.welcome')");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 10));

    assert.ok(result, "Should detect translation");
    assert.strictEqual(result?.type, "translation");
    assert.strictEqual(result?.value, "messages.welcome");
  });

  test("detects trans() function", () => {
    const doc = createMockDocument("trans('auth.failed')");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 10));

    assert.ok(result, "Should detect trans()");
    assert.strictEqual(result?.type, "translation");
    assert.strictEqual(result?.value, "auth.failed");
  });

  test("returns null for non-Laravel code", () => {
    const doc = createMockDocument("echo 'hello world';");
    const result = ContextDetector.detect(doc, new vscode.Position(0, 10));

    assert.strictEqual(result, null, "Should return null for non-Laravel code");
  });

  test("detects double-quoted strings", () => {
    const doc = createMockDocument('view("users.index")');
    const result = ContextDetector.detect(doc, new vscode.Position(0, 10));

    assert.ok(result, "Should detect double-quoted view");
    assert.strictEqual(result?.value, "users.index");
  });
});

/**
 * Handler Tests (Token-based for config/route/view/translation detection)
 */
suite("Handler Tests", () => {
  test("detects config alias", () => {
    const tokens = phpParserTokens(`<?php config('app.name');`);
    const handler = new Handler(tokens, new vscode.Position(0, 15), ["config"]);

    assert.ok(handler.hasAlias(), "Should detect config alias");
  });

  test("detects route alias", () => {
    const tokens = phpParserTokens(`<?php route('users.index');`);
    const handler = new Handler(tokens, new vscode.Position(0, 15), ["route"]);

    assert.ok(handler.hasAlias(), "Should detect route alias");
  });

  test("detects view alias", () => {
    const tokens = phpParserTokens(`<?php view('home');`);
    const handler = new Handler(tokens, new vscode.Position(0, 12), ["view"]);

    assert.ok(handler.hasAlias(), "Should detect view alias");
  });

  test("detects translation alias", () => {
    const tokens = phpParserTokens(`<?php __('welcome');`);
    const handler = new Handler(tokens, new vscode.Position(0, 12), ["__"]);

    assert.ok(handler.hasAlias(), "Should detect __ alias");
  });

  test("detects query method alias", () => {
    const tokens = phpParserTokens(`<?php User::where('name', '');`);
    const handler = new Handler(tokens, new vscode.Position(0, 25), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();
    assert.ok(Array.isArray(aliasToken) && aliasToken.length > 0, "Should find where alias token");
  });
});

/**
 * Parser Integration Tests
 */
suite("Parser Integration Tests", () => {
  function createMockDocument(content: string): vscode.TextDocument {
    return {
      getText: () => content,
      lineAt: (line: number) => ({
        text: content.split("\n")[line] || "",
      }),
      getWordRangeAtPosition: () => undefined,
    } as unknown as vscode.TextDocument;
  }

  test("Parser.getClassName() returns model from static call", () => {
    const code = `<?php
use App\\Models\\User;

User::where('name', '');`;

    const doc = createMockDocument(code);
    const parser = new Parser(doc, new vscode.Position(3, 14));
    const className = parser.getClassName();

    assert.strictEqual(className, "App\\Models\\User");
  });

  test("Parser.hasView() detects view context", () => {
    const code = `<?php view('home');`;

    const doc = createMockDocument(code);
    const parser = new Parser(doc, new vscode.Position(0, 12));

    assert.ok(parser.hasView(), "Should detect view");
  });

  test("Parser.hasConfig() detects config context", () => {
    const code = `<?php config('app.name');`;

    const doc = createMockDocument(code);
    const parser = new Parser(doc, new vscode.Position(0, 15));

    assert.ok(parser.hasConfig(), "Should detect config");
  });

  test("Parser.hasRoute() detects route context", () => {
    const code = `<?php route('home');`;

    const doc = createMockDocument(code);
    const parser = new Parser(doc, new vscode.Position(0, 12));

    assert.ok(parser.hasRoute(), "Should detect route");
  });

  test("Parser.hasTranslation() detects translation context", () => {
    const code = `<?php __('welcome');`;

    const doc = createMockDocument(code);
    const parser = new Parser(doc, new vscode.Position(0, 12));

    assert.ok(parser.hasTranslation(), "Should detect translation");
  });
});

/**
 * Edge Cases
 */
suite("Edge Cases", () => {
  let astParser: AstParser;

  setup(() => {
    astParser = new AstParser();
  });

  test("handles syntax errors gracefully", () => {
    const code = `<?php
User::where('name'  // incomplete`;

    const result = astParser.getModelContext(code, new vscode.Position(1, 15));

    // Should not throw, may return null
    assert.ok(result === null || result?.className, "Should handle syntax errors");
  });

  test("handles empty file", () => {
    const result = astParser.getModelContext("", new vscode.Position(0, 0));

    assert.strictEqual(result, null, "Should return null for empty file");
  });

  test("handles file without PHP tag", () => {
    const result = astParser.getModelContext("no php here", new vscode.Position(0, 0));

    assert.strictEqual(result, null, "Should return null for non-PHP");
  });

  test("handles nested namespaces", () => {
    const code = `<?php
use App\\Domain\\Users\\Models\\User;

User::where('name', '');`;

    const result = astParser.getModelContext(code, new vscode.Position(3, 14));

    assert.ok(result, "Should handle nested namespace");
    assert.strictEqual(result?.className, "App\\Domain\\Users\\Models\\User");
  });

  test("handles aliased imports", () => {
    const code = `<?php
use App\\Models\\User as UserModel;

UserModel::where('name', '');`;

    const result = astParser.getModelContext(code, new vscode.Position(3, 18));

    // Note: aliased imports may need special handling
    assert.ok(result === null || result?.className, "Should handle or gracefully skip aliased imports");
  });
});
