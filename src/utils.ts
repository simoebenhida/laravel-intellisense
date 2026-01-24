import { workspace, WorkspaceFolder } from "vscode";

type Token = [string, string, number, number] | string;

export function activeWorkspace(): WorkspaceFolder | undefined {
  if (!Array.isArray(workspace.workspaceFolders)) {
    return undefined;
  }

  if (workspace.workspaceFolders.length === 0) {
    return undefined;
  }

  return workspace.workspaceFolders[0];
}

export function path(filePath: string): string {
  const workspaceFolder = activeWorkspace();

  if (workspaceFolder && "uri" in workspaceFolder) {
    return workspaceFolder.uri.fsPath + "/" + filePath;
  }

  return "";
}

export function phpParserTokens(document: string): Token[] {
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
    .filter((token: Token) => {
      if (!Array.isArray(token)) {
        return true;
      }
      return (
        token[0] !== "T_WHITESPACE" &&
        token[0] !== "T_COMMENT" &&
        token[0] !== "T_INLINE_HTML"
      );
    })
    .map((token: Token, index: number) => {
      if (Array.isArray(token)) {
        return [...token, index];
      }

      return token;
    });
}

export function getDefaultModelNamespace(): string | null {
  const modelNamespace: string | undefined = workspace
    .getConfiguration("LaravelIntellisense")
    .get("model");

  if (modelNamespace === undefined) {
    return null;
  }

  if (!modelNamespace.endsWith("\\")) {
    return modelNamespace + "\\";
  }

  return modelNamespace;
}
