import { Position } from "vscode";

type Token = [string, string, number, number] | string;

export default class Handler {
  tokens: Token[];

  position: Position;

  aliases: string[];

  constructor(tokens: Token[], position: Position, aliases: string[]) {
    this.tokens = tokens;

    this.position = position;

    this.aliases = aliases;
  }

  getEloquentAliasToken(): Token[] {
    return this.getAliasToken();
  }

  getResourceAliasToken(): Token[] {
    let aliasToken: Token[] = [];

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      const prevToken = this.tokens[i - 1];

      if (
        i > 0 &&
        Array.isArray(prevToken) &&
        prevToken[0] === "T_CLASS" &&
        Array.isArray(token) &&
        token[0] === "T_STRING" &&
        token[1].endsWith("Resource")
      ) {
        aliasToken = [token];
      }

      if (
        token === "{" &&
        Array.isArray(token) &&
        token[0] !== "T_CONSTANT_ENCAPSED_STRING"
      ) {
        break;
      }
    }

    const lineTokens = this.tokens
      .filter((token): token is [string, string, number, number] => {
        return Array.isArray(token) && token[2] === this.position.line + 1;
      })
      .reverse();

    for (let j = 0; j < lineTokens.length; j++) {
      if (!lineTokens[j][1].includes(">")) {
        break;
      }

      if (
        lineTokens[j][0] === "T_OBJECT_OPERATOR" &&
        lineTokens[j + 1][1] === "$this" &&
        lineTokens.length > j + 1
      ) {
        break;
      }

      if (
        lineTokens[j][0] !== "T_OBJECT_OPERATOR" ||
        (lineTokens[j + 1][1] !== "T_VARIABLE" && lineTokens.length > j + 1)
      ) {
        return [];
      }
    }

    return aliasToken;
  }

  getFactoryAliasToken(): Token[] {
    let aliasToken: Token[] = [];

    const lineTokens = this.tokens
      .filter((token): token is [string, string, number, number] => {
        return Array.isArray(token) && token[2] === this.position.line + 1;
      })
      .reverse();

    for (let j = 0; j < lineTokens.length; j++) {
      if (
        lineTokens[j][0] === "T_OBJECT_OPERATOR" ||
        lineTokens[j][0] === "T_DOUBLE_ARROW"
      ) {
        return [];
      }

      if (j >= 1 && lineTokens[j][0] !== "T_RETURN") {
        return [];
      }
    }

    if (lineTokens.length === 0) {
      return aliasToken;
    }

    const beforeTokens = this.tokens
      .slice(0, lineTokens[0][3])
      .filter((token): token is [string, string, number, number] =>
        Array.isArray(token)
      )
      .reverse();

    for (let i = 0; i < beforeTokens.length; i++) {
      if (
        beforeTokens.length > i + 3 &&
        beforeTokens[i + 1][0] === "T_STRING" &&
        beforeTokens[i + 1][1] === "define" &&
        beforeTokens[i + 2][0] === "T_OBJECT_OPERATOR" &&
        beforeTokens[i + 2][1] === "->" &&
        beforeTokens[i + 3][0] === "T_VARIABLE" &&
        beforeTokens[i + 3][1] === "$factory"
      ) {
        aliasToken = [beforeTokens[i]];
        break;
      }
    }

    return aliasToken;
  }

  hasAlias(): boolean {
    return this.checkForAlias();
  }

  checkForAlias(): boolean {
    const tokens = this.tokensOnTheSameLine();

    // Remove TRIGGER_CHARACTERS
    tokens.shift();

    if (tokens.length === 0) {
      return false;
    }

    const firstToken = tokens[0];
    if (Array.isArray(firstToken) && this.aliases.includes(firstToken[1])) {
      return true;
    }

    if (this.aliases.includes(this.tokensToString(tokens))) {
      return true;
    }

    return false;
  }

  getAliasToken(): Token[] {
    let aliasToken: Token[] = [];

    const tokens = this.tokensOnTheSameLine();

    // Remove TRIGGER_CHARACTERS
    tokens.shift();

    const alias = tokens.shift();

    if (Array.isArray(alias) && this.aliases.includes(alias[1])) {
      aliasToken = [alias];
    }

    return aliasToken;
  }

  tokensOnTheSameLine(): Token[] {
    return this.tokens
      .filter((token): token is [string, string, number, number] => {
        return Array.isArray(token) && token[2] === this.position.line + 1;
      })
      .reverse();
  }

  tokensToString(tokens: Token[]): string {
    return tokens
      .map((token) => {
        return Array.isArray(token) ? token[1] : token;
      })
      .reverse()
      .join("")
      .trim();
  }
}
