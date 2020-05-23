import { WorkspaceFolder, workspace } from "vscode";
import { isArray } from "util";

export function activeWorkspace(): any {
  if (!(workspace.workspaceFolders instanceof Array)) {
    return;
  }

  if (workspace.workspaceFolders.length === 0) {
    return;
  }

  return workspace.workspaceFolders[0];
}

export function path(path: string): string {
  let workspace = activeWorkspace();

  if ("uri" in workspace) {
    return workspace.uri.path + "/" + path;
  }

  return "";
}

export function phpParserTokens(document: string) {
  const engine = require("php-parser");

  const parser = new engine({
    parser: {
      extractDoc: true,
      php7: true,
    },
    ast: {
      withPositions: true,
    },
  });

  return parser
    .tokenGetAll(document)
    .filter((token: Array<any>) => {
        return token[0] !== "T_WHITESPACE" && token[0] !== "T_COMMENT" && token[0] !== "T_INLINE_HTML";
    })
    .map((token: Array<any>, index: number) => {
      if (isArray(token)) {
        return [...token, index];
      }

      return token;
    });
}

// <?php

// use App\User;
// use App\Post;

// Route::get('/', function (User $user, Post $post) {
//     $user->where('')->where('')

//     $user->firstWhere('name', 'John');

//     $post->where('')
// });

// Route::get('/', function () {
//     $user = User::where('');

//     $user->when(true, function ($query) {
//         $query->where('')
//     });
// });

