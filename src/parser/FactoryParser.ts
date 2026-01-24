type Token = [string, string, number, number] | string;

export default class FactoryParser {
  tokens: Token[];

  aliasToken: Token[] = [];

  constructor(tokens: Token[], aliasToken: Token[]) {
    this.tokens = tokens;

    this.aliasToken = aliasToken;
  }

  getFullClassName(): string | null {
    const className = this.getClassNameFromToken();

    if (className === null || className === "") {
      return null;
    }

    const namespace = this.getUseClasses().find((ns) => {
      return ns.endsWith(className);
    });

    if (namespace === undefined) {
      return className;
    }

    return namespace;
  }

  getClassNameFromToken(): string | null {
    const firstToken = this.aliasToken[0];
    if (!Array.isArray(firstToken)) {
      return null;
    }

    const tokens = this.tokens.slice(firstToken[3]);

    const classNameTokens: Token[] = [];

    for (const token of tokens) {
      if (!Array.isArray(token)) {
        break;
      }

      if (token[0] === "T_STRING" || token[0] === "T_NS_SEPARATOR") {
        classNameTokens.push(token);
      }

      if (token[0] !== "T_STRING" && token[0] !== "T_NS_SEPARATOR") {
        break;
      }
    }

    return this.joinClassNameFromTokens(classNameTokens);
  }

  getUseClasses(): string[] {
    const uses: string[] = [];

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];

      if (Array.isArray(token) && token[0] === "T_USE") {
        const use: Token[] = [];
        for (let j = i + 1; j < this.tokens.length; j++) {
          if (this.tokens[j] === ";") {
            break;
          }

          use.push(this.tokens[j]);
        }

        uses.push(this.joinClassNameFromTokens(use));
      }
    }

    return uses;
  }

  joinClassNameFromTokens(tokens: Token[]): string {
    return tokens
      .map((token) => {
        return Array.isArray(token) ? token[1] : token;
      })
      .join("")
      .trim();
  }
}
