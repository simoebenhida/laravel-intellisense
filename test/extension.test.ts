import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';
import ModelParser from "./../src/parser/ModelParser";
import { phpParserTokens } from "../src/utils";
import Handler from "../src/parser/Handler";

suite("Model Parser Test", () => {
  test("it can get model from inline model", () => {
    const tokens = phpParserTokens(`
            <?php
            App\\User::where('');
        `);

    const handler = new Handler(tokens, new vscode.Position(2, 39), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model without namespace inline", () => {
    const tokens = phpParserTokens(`
            <?php
            use App\\User;

            $user = User::where('');
        `);

    const handler = new Handler(tokens, new vscode.Position(4, 34), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model when multiple query conditions are before", () => {
    const tokens = phpParserTokens(`
            <?php
            use App\\User;

            $user = User::where('name', $name)->where('');
        `);

    const handler = new Handler(tokens, new vscode.Position(4, 56), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from dependency injection", () => {
    const tokens = phpParserTokens(`
        <?php
            use App\\User;

            Route::get('/', function (User $user) {
                $user->where('')
            });
    `);

    const handler = new Handler(tokens, new vscode.Position(5, 31), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from closure", () => {
    const tokens = phpParserTokens(`
        <?php
            use App\\User;

            Route::get('/', function (User $user) {
                $user->when(true, function ($query) {
                    $query->where($example, '')
                        ->where('')
                });
            });
    `);

    const handler = new Handler(tokens, new vscode.Position(7, 34), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from closure that has a static call", () => {
    const tokens = phpParserTokens(`
        <?php
            use App\\User;

            Route::get('/', function (User $user) {
                $user->when(Arr::get($data, 'example'), function ($query) {
                    $query->where($example, '')
                        ->where('')
                });
            });
    `);

    const handler = new Handler(tokens, new vscode.Position(7, 34), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from complex closure", () => {
    const tokens = phpParserTokens(`
        <?php
        use App\\User;
        use App\\Post;

        $query = Post::query();

        $query = User::query()
            ->when($this->term, function ($query) {
                $query->where('');
            })
    `);

    const handler = new Handler(tokens, new vscode.Position(9, 32), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from multiple closure", () => {
    const tokens = phpParserTokens(`
        <?php
        use App\\User;
        use App\\Post;

        $query = Post::query();

        $query = User::query()
            ->when($this->term, function ($query) {
                $query->where('name', 'John');
            })
            ->when($this->term, function ($query) {
                $query->where('');
            })
    `);

    const handler = new Handler(tokens, new vscode.Position(12, 32), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get multiple models", () => {
    const tokens = phpParserTokens(`
        <?php
        use App\\User;
        use App\\Post;

        Route::get('/', function (User $user, Post $post) {
            $user->where('name', 'name')->where('email', 'email')->get();

            $post->where('')
        });
    `);

    const handler = new Handler(tokens, new vscode.Position(8, 27), ["where"]);

    const aliasToken = handler.getEloquentAliasToken();

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\Post", className);
  });
});
