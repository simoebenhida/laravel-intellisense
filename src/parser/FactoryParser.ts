import { isUndefined, isNull } from "util";

export default class FactoryParser {
  tokens: Array<any>;

  aliasToken: Array<any> = [];

  constructor(tokens: Array<any>, aliasToken: Array<any>) {
    this.tokens = tokens;

    this.aliasToken = aliasToken;
  }

  getFullClassName() {
    const className = this.getClassNameFromToken();

    if (isNull(className)) {
      return null;
    }

    const namespace = this.getUseClasses().find((namespace) => {
      return namespace.endsWith(className);
    });

    if (isUndefined(namespace)) {
      return className;
    }

    return namespace;
  }

  getClassNameFromToken() {
    const tokens = this.tokens.slice(this.aliasToken[3]);

    let classNameTokens: Array<string> = [];

    for (const token of tokens) {
      if (token[0] === "T_STRING" || token[0] === "T_NS_SEPARATOR") {
        classNameTokens.push(token);
      }

      if (token[0] !== "T_STRING" && token[0] !== "T_NS_SEPARATOR") {
        break;
      }
    }

    return this.joinClassNameFromTokens(classNameTokens);
  }

  getUseClasses() {
    let uses: Array<any> = [];

    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i][0] === "T_USE") {
        let use: Array<any> = [];
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

  joinClassNameFromTokens(tokens: Array<any>): string {
    return tokens
      .map((token) => {
        return token[1];
      })
      .join("")
      .trim();
  }
}
