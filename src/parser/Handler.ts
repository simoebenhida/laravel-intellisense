import { Position } from "vscode";

// Token can be [type, value, line, index] or a single character like "(" or ";"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Token = Array<any> | string;

export default class Handler {
  tokens: Token[];

  position: Position;

  aliases: string[];

  constructor(tokens: Token[], position: Position, aliases: string[]) {
    this.tokens = tokens;

    this.position = position;

    this.aliases = aliases;
  }

  getEloquentAliasToken(): Token {
    return this.getAliasToken();
  }

  getResourceAliasToken(): Token {
    let aliasToken: Token = [];

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
        aliasToken = token;
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
      .filter((token): token is Array<any> => {
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

  getFactoryAliasToken(): Token {
    let aliasToken: Token = [];

    const lineTokens = this.tokens
      .filter((token): token is Array<any> => {
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
      .filter((token): token is Array<any> => Array.isArray(token))
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
        aliasToken = beforeTokens[i];
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

    if (Array.isArray(tokens[0]) && this.aliases.includes(tokens[0][1])) {
      return true;
    }

    if (this.aliases.includes(this.tokensToString(tokens))) {
      return true;
    }

    return false;
  }

  getAliasToken(): Token {
    let aliasToken: Token = [];

    const tokens = this.tokensOnTheSameLine();

    // Walk backwards through tokens to find the method name
    // Skip: trigger characters, strings, punctuation like ( ) ,
    for (const token of tokens) {
      // Skip non-array tokens (punctuation like '(', ')', ',', etc.)
      if (!Array.isArray(token)) {
        continue;
      }

      // Skip string literals (the trigger character context)
      if (
        token[0] === "T_CONSTANT_ENCAPSED_STRING" ||
        token[0] === "T_ENCAPSED_AND_WHITESPACE"
      ) {
        continue;
      }

      // Found a potential method name - check if it's an alias
      if (token[0] === "T_STRING" && this.aliases.includes(token[1])) {
        aliasToken = token;
        break;
      }

      // If we hit something else (variable, operator, etc.), stop looking
      break;
    }

    return aliasToken;
  }

  tokensOnTheSameLine(): Token[] {
    return this.tokens
      .filter((token): token is Array<any> => {
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
