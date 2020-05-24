import { WorkspaceFolder, workspace, Position } from "vscode";
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
      return (
        token[0] !== "T_WHITESPACE" &&
        token[0] !== "T_COMMENT" &&
        token[0] !== "T_INLINE_HTML"
      );
    })
    .map((token: Array<any>, index: number) => {
      if (isArray(token)) {
        return [...token, index];
      }

      return token;
    });
}

export function tokenByAlias(
  tokens: Array<any>,
  aliases: Array<string>,
  position: Position
) {
  let aliasToken: Array<any> = [];

  const lineTokens = tokens
    .filter((token: Array<any>) => {
      return token[2] === position.line + 1;
    })
    .reverse();

  for (const token of lineTokens) {
    if (token[0] === "T_STRING" && aliases.includes(token[1])) {
      aliasToken = token;

      break;
    }

    if (token[0] !== "T_STRING" && token[0] !== "T_CONSTANT_ENCAPSED_STRING") {
      break;
    }
  }

  return aliasToken;
}
