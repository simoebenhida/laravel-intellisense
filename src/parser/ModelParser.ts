import { TextDocument, Position } from "vscode";
import { isUndefined, isNull, isArray, isString } from "util";

export default class ModelParser {
  document: TextDocument;

  position: Position;

  tokens: Array<any>;

  constructor(document: TextDocument, position: Position) {
    this.document = document;

    this.position = position;

    this.tokens = this.retrieveTokensFromDocumentText();
  }

  getFullClassName() {
    const className = this.getClassName();

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

  getUseClasses() {
    let uses = [];

    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i][0] === "T_USE") {
        let use = [];
        for (let j = i + 1; j < this.tokens.length; j++) {
          if (this.tokens[j] === ";") {
            break;
          }

          use.push(this.tokens[j]);
        }

        uses.push(this.getClassNameFromTokens(use));
      }
    }

    return uses;
  }

  getClassName() {
    const classNameFromEquality = this.getClassNameFromEquality();

    if (!isNull(classNameFromEquality)) {
      return classNameFromEquality;
    }

    const classNameFromDependencyInjection = this.getClassNameFromDependencyInjection();

    return classNameFromDependencyInjection;
  }

  getCurrentLineTokens() {
    return this.tokens
      .filter((token: Array<any>) => {
        return token[2] === this.position.line + 1;
      })
      .reverse();
  }

  getAliasToken() {
    const queryAliases = [
      "where",
      "get",
      "firstWhere",
      "value",
      "orWhere",
      "latest",
      "oldest",
      "firstWhere",
      "firstOrFail",
      "pluck",
      "increment",
      "decrement",
      "qualifyColumn",
    ];

    return this.getCurrentLineTokens().find((token: Array<any>) => {
      return queryAliases.includes(token[1]);
    });
  }

  getUsedVariableTokenOrClassName() {
    let classNameTokens: Array<any> = [];

    let hasVariable = true;

    const aliasToken = this.getAliasToken();

    if (isUndefined(aliasToken) || aliasToken.length < 3) {
      return null;
    }

    const tokens = this.tokens
      .slice(0, aliasToken[3])
      .filter((token) => {
        return token[0] !== "T_WHITESPACE" && token[0] !== "T_COMMENT";
      })
      .reverse();

    for (const token of tokens) {
      if (token[0] === "T_DOUBLE_COLON") {
        hasVariable = false;
      }

      if (token[0] === "T_STRING") {
        classNameTokens.push(token);
      }

      if (token[0] !== "T_STRING" && token[0] !== "T_DOUBLE_COLON") {
        break;
      }
    }

    if (!hasVariable) {
      return this.getClassNameFromTokens(classNameTokens);
    }

    let usedVariableToken: any = [];

    for (let i = 0; i < tokens.length; i++) {
      if (
        tokens[i][0] === "T_VARIABLE" &&
        (tokens[i + 1] === "{" ||
          tokens[i + 1] === ";" ||
          tokens[i + 1] === "=")
      ) {
        usedVariableToken = tokens[i];
        break;
      }
    }

    console.log(usedVariableToken);

    return usedVariableToken;
  }

  getUsedVariableFirstIndexOrClassName() {
    const usedVariableTokenOrClassName = this.getUsedVariableTokenOrClassName();

    if (isNull(usedVariableTokenOrClassName)) {
      return null;
    }

    if (isString(usedVariableTokenOrClassName)) {
      return usedVariableTokenOrClassName;
    }

    return this.tokens.findIndex((token: Array<any>) => {
      if (
        token[0] === "T_VARIABLE" &&
        token[1] === usedVariableTokenOrClassName[1]
      ) {
        if (this.tokenLineHaveFunction(token)) {
          return true;
        }

        if (this.tokenLineHasEquality(token)) {
          return true;
        }
      }

      return false;
    });
  }

  tokenLineHaveFunction(currentLineToken: any) {
    return this.tokens
      .filter((token) => {
        return token[2] === currentLineToken[2];
      })
      .some((token) => {
        return token[0] === "T_FUNCTION";
      });
  }

  tokenLineHasEquality(currentLineToken: any) {
    return this.tokens
      .filter((token) => {
        return token[2] === currentLineToken[2];
      })
      .some((token) => {
        return token === "=";
      });
  }

  getClassNameFromEquality() {
    let classNameTokens: Array<any> = [];

    let equalityIndex = null;

    const variableFirstIndexOrClassName = this.getUsedVariableFirstIndexOrClassName();

    if (isString(variableFirstIndexOrClassName)) {
      return variableFirstIndexOrClassName;
    }

    if (isNull(variableFirstIndexOrClassName)) {
      return null;
    }

    const tokens = this.tokens.slice(variableFirstIndexOrClassName + 1);

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === "=") {
        equalityIndex = i;

        break;
      }

      if (tokens[i][0] !== "T_WHITESPACE") {
        equalityIndex = null;

        break;
      }
    }

    if (isNull(equalityIndex)) {
      return null;
    }

    const tokensWithEquality = tokens.slice(equalityIndex + 1);

    for (let i = 0; i < tokensWithEquality.length; i++) {
      if (
        tokensWithEquality[i][0] === "T_STRING" ||
        tokensWithEquality[i][0] === "T_NS_SEPARATOR"
      ) {
        classNameTokens.push(tokensWithEquality[i]);
      }

      if (
        tokensWithEquality[i][0] !== "T_WHITESPACE" &&
        tokensWithEquality[i][0] !== "T_STRING" &&
        tokensWithEquality[i][0] !== "T_NS_SEPARATOR"
      ) {
        break;
      }
    }

    return this.getClassNameFromTokens(classNameTokens);
  }

  getClassNameFromDependencyInjection() {
    let classNameTokens: Array<any> = [];

    const variableFirstIndexOrClassName = this.getUsedVariableFirstIndexOrClassName();

    if (isString(variableFirstIndexOrClassName)) {
      return variableFirstIndexOrClassName;
    }

    if (isNull(variableFirstIndexOrClassName)) {
      return null;
    }

    const tokens = this.tokens
      .slice(0, variableFirstIndexOrClassName)
      .reverse();

    for (const token of tokens) {
      if (token[0] === "T_STRING" || token[0] === "T_NS_SEPARATOR") {
        classNameTokens.push(token);
      }

      if (
        token[0] !== "T_WHITESPACE" &&
        token[0] !== "T_STRING" &&
        token[0] !== "T_NS_SEPARATOR"
      ) {
        break;
      }
    }

    classNameTokens = classNameTokens.reverse();

    return this.getClassNameFromTokens(classNameTokens);
  }

  getClassNameFromTokens(tokens: Array<any>) {
    return tokens
      .map((token) => {
        return token[1];
      })
      .join("")
      .trim();
  }

  retrieveTokensFromDocumentText(): Array<any> {
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
      .tokenGetAll(this.document.getText())
      .map((token: Array<any>, index: number) => {
        if (isArray(token)) {
          return [...token, index];
        }

        return token;
      });
  }
}
