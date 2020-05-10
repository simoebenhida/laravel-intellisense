import { TextDocument, Position } from "vscode";
import { isUndefined, isNull, isArray } from "util";

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
    return this.getCurrentLineTokens().find((token: Array<any>) => {
      return token[1].includes(["where"]);
    });
  }

  getUsedVariableToken() {
    const aliasToken = this.getAliasToken();

    if (aliasToken.length < 3) {
      return null;
    }

    const tokens = this.tokens.slice(0, aliasToken[3]).reverse();

    const usedVariableToken = tokens.find((token: Array<any>) => {
      return token[0] === "T_VARIABLE";
    });

    return usedVariableToken;
  }

  getUsedVariableFirstIndex() {
    const usedVariableToken = this.getUsedVariableToken();

    if (isNull(usedVariableToken)) {
      return null;
    }

    return this.tokens.findIndex((token: Array<any>) => {
      return token[1] === usedVariableToken[1] && token[0] === "T_VARIABLE";
    });
  }

  getClassNameFromEquality() {
    let classNameTokens: Array<any> = [];

    let equalityIndex = null;

    const variableFirstIndex = this.getUsedVariableFirstIndex();

    if (isNull(variableFirstIndex)) {
      return null;
    }

    const tokens = this.tokens.slice(variableFirstIndex + 1);

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

    const variableFirstIndex = this.getUsedVariableFirstIndex();

    if (isNull(variableFirstIndex)) {
      return null;
    }

    const tokens = this.tokens.slice(0, variableFirstIndex).reverse();

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
