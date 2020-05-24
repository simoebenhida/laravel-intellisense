import { Position } from "vscode";
import { isUndefined, isNull, isString } from "util";

export default class ModelParser {
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

        uses.push(this.joinClassNameFromTokens(use));
      }
    }

    return uses;
  }

  getUsedVariableTokenOrClassName(
    aliasToken: Array<any> = []
  ): Array<any> | null | string {
    let classNameTokens: Array<any> = [];

    let hasVariable = true;

    let usedVariableToken: any = [];

    if (aliasToken.length === 0) {
      aliasToken = this.aliasToken;
    }

    if (isUndefined(aliasToken) || aliasToken.length < 3) {
      return null;
    }

    const tokens = this.tokens.slice(0, aliasToken[3]).reverse();

    for (let j = 0; j < tokens.length; j++) {
      if (
        tokens[j][0] === "T_VARIABLE" &&
        (tokens[j + 1] === "{" ||
          tokens[j + 1] === ";" ||
          tokens[j + 1] === ")" ||
          tokens[j + 1] === "=")
      ) {
        usedVariableToken = tokens[j];

        hasVariable = true;
        break;
      }

      if (tokens[j][0] === "T_DOUBLE_COLON") {
        const checkForDoubleColon = this.checkIfTheDoubleColonIsCorrect(
          j,
          tokens
        );

        if (checkForDoubleColon.isCorrectDoubleColon) {
          classNameTokens = checkForDoubleColon.classNameTokens;

          hasVariable = false;
          break;
        }
      }
    }

    if (!hasVariable) {
      return this.joinClassNameFromTokens(classNameTokens.reverse());
    }

    return usedVariableToken;
  }

  checkIfTheDoubleColonIsCorrect(
    indexForDoubleColon: number,
    tokens: Array<any>
  ) {
    let classNameTokens: Array<any> = [];

    let isCorrectDoubleColon: boolean = false;

    const tokensFromDoubleColon = tokens.slice(indexForDoubleColon + 1);

    for (let i = 0; i < tokensFromDoubleColon.length; i++) {
      if (
        tokensFromDoubleColon[i][0] === "T_STRING" ||
        tokensFromDoubleColon[i][0] === "T_NS_SEPARATOR"
      ) {
        classNameTokens.push(tokensFromDoubleColon[i]);
      }

      if (
        tokensFromDoubleColon[i][0] !== "T_STRING" &&
        tokensFromDoubleColon[i][0] !== "T_NS_SEPARATOR" &&
        ((tokensFromDoubleColon[i][0] === "(" &&
          tokensFromDoubleColon[i + 1][0] === "T_FUNCTION") ||
          tokensFromDoubleColon[i][0] === "=" ||
          tokensFromDoubleColon[i][0] === "{" ||
          tokensFromDoubleColon[i][0] === ")" ||
          tokensFromDoubleColon[i][0] === ";" ||
          tokensFromDoubleColon[i][0] === "T_OPEN_TAG")
      ) {
        isCorrectDoubleColon = true;
      }

      if (
        tokensFromDoubleColon[i][0] !== "T_STRING" &&
        tokensFromDoubleColon[i][0] !== "T_OBJECT_OPERATOR" &&
        tokensFromDoubleColon[i][0] !== "T_NS_SEPARATOR"
      ) {
        break;
      }
    }

    return {
      isCorrectDoubleColon,
      classNameTokens,
    };
  }

  getUsedVariableFirstIndexOrClassName(
    parentTokens: Array<any> = [],
    aliasToken: Array<any> = []
  ): any {
    if (parentTokens.length === 0) {
      parentTokens = this.tokens;
    }

    if (aliasToken.length === 0) {
      aliasToken = this.aliasToken;
    }

    const usedVariableTokenOrClassName = this.getUsedVariableTokenOrClassName(
      aliasToken
    );

    if (isNull(usedVariableTokenOrClassName)) {
      return null;
    }

    if (isString(usedVariableTokenOrClassName)) {
      return usedVariableTokenOrClassName;
    }

    let isInsideFunctionParams: boolean = false;

    const tokens: Array<any> = parentTokens.slice(0, aliasToken[3]).reverse();

    let variableToken: Array<any> | string = [];

    for (const token of tokens) {
      if (
        token[0] === "T_VARIABLE" &&
        token[1] === usedVariableTokenOrClassName[1]
      ) {
        const firstVariableToken = this.getFirstVariableToken(token);

        if (isString(firstVariableToken)) {
          variableToken = firstVariableToken;

          break;
        }

        if (firstVariableToken.variableToken.length > 0) {
          variableToken = firstVariableToken.variableToken;
          isInsideFunctionParams = firstVariableToken.isInsideFunctionParams;

          break;
        }
      }
    }

    if (isString(variableToken)) {
      return variableToken;
    }

    if (variableToken.length === 0) {
      return null;
    }

    return {
      variableToken,
      isInsideFunctionParams,
    };
  }

  getFirstVariableToken(variableToken: any): any {
    const tokens = this.tokens.slice(0, variableToken[3]).reverse();

    let hasDependency: boolean = false;

    let hasFunction: boolean = false;

    for (const token of tokens) {
      if (token[0] === "T_STRING") {
        hasDependency = true;
        break;
      }

      if (token[0] === "T_FUNCTION") {
        hasFunction = true;
        break;
      }

      if (token === ";" || token === "{" || token === ")") {
        break;
      }
    }

    if (hasDependency) {
      return {
        variableToken,
        isInsideFunctionParams: true,
      };
    }

    if (!hasFunction) {
      return {
        variableToken: [],
        isInsideFunctionParams: false,
      };
    }

    return this.getUsedVariableFirstIndexOrClassName(
      tokens.reverse(),
      variableToken
    );
  }

  getClassNameFromToken(
    parentTokens: Array<any> = [],
    aliasToken: Array<any> = []
  ): string | null {
    const variableFirstIndexOrClassName = this.getUsedVariableFirstIndexOrClassName(
      parentTokens,
      aliasToken
    );

    if (isString(variableFirstIndexOrClassName)) {
      return variableFirstIndexOrClassName;
    }

    if (isNull(variableFirstIndexOrClassName)) {
      return null;
    }

    const variableToken = variableFirstIndexOrClassName.variableToken;

    if (variableFirstIndexOrClassName.isInsideFunctionParams) {
      return this.getClassNameFromDependencyInjection(variableToken);
    }

    return this.getClassNameFromEquality(variableToken);
  }

  getClassNameFromEquality(variableToken: any): string | null {
    let classNameTokens: Array<any> = [];

    let equalityIndex = null;

    const tokens = this.tokens.slice(variableToken[3] + 1);

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
        tokensWithEquality[i][0] !== "T_STRING" &&
        tokensWithEquality[i][0] !== "T_NS_SEPARATOR"
      ) {
        break;
      }
    }

    return this.joinClassNameFromTokens(classNameTokens);
  }

  getClassNameFromDependencyInjection(variableToken: any): string | null {
    let classNameTokens: Array<any> = [];

    const tokens = this.tokens.slice(0, variableToken[3]).reverse();

    for (const token of tokens) {
      if (token[0] === "T_STRING" || token[0] === "T_NS_SEPARATOR") {
        classNameTokens.push(token);
      }

      if (token[0] !== "T_STRING" && token[0] !== "T_NS_SEPARATOR") {
        break;
      }
    }

    classNameTokens = classNameTokens.reverse();

    if (classNameTokens.length === 0) {
      return this.getClassNameFromToken(tokens, variableToken);
    }

    return this.joinClassNameFromTokens(classNameTokens);
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
