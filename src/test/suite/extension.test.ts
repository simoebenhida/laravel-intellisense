import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';
import ModelParser from "./../../parser/ModelParser";
import { phpParserTokens } from "../../utils";

suite("Model Parser Test", () => {
  test("it can get model from inline model", () => {
    const tokens = phpParserTokens(`
            <?php
            $user = App\\User::where('');
        `);

    const modelParser = new ModelParser(tokens, new vscode.Position(2, 39));

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model without namespace inline", () => {
    const tokens = phpParserTokens(`
            <?php
            use App\\User;

            $user = User::where('');
        `);

    const modelParser = new ModelParser(tokens, new vscode.Position(4, 34));

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model when multiple query conditions are before", () => {
    const tokens = phpParserTokens(`
            <?php
            use App\\User;

            $user = User::where('name', $name)->where('');
        `);

    const modelParser = new ModelParser(tokens, new vscode.Position(4, 56));

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

    const modelParser = new ModelParser(tokens, new vscode.Position(5, 31));

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

    const modelParser = new ModelParser(tokens, new vscode.Position(7, 34));

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });
});
