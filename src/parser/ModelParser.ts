import { TextDocument, Position } from "vscode";
import { isUndefined, isNull, isArray, isString } from "util";

export default class ModelParser {
  tokens: Array<any>;

  position: Position;

  aliasToken: Array<any> = [];

  constructor(tokens: Array<any>, position: Position) {
    this.tokens = tokens;

    this.position = position;
  }

  getFullClassName() {
    this.aliasToken = this.getAliasToken();

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

    let usedVariableToken: any = [];

    if (isUndefined(this.aliasToken) || this.aliasToken.length < 3) {
      return null;
    }

    const tokens = this.tokens
      .slice(0, this.aliasToken[3])
      .filter((token) => {
        return token[0] !== "T_WHITESPACE" && token[0] !== "T_COMMENT";
      })
      .reverse();

    //   console.log('start');
    for (let j = 0; j < tokens.length; j++) {
        // console.log(tokens[j]);
      if (
        tokens[j][0] === "T_VARIABLE" &&
        (tokens[j + 1] === "{" ||
          tokens[j + 1] === ";" ||
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

    console.log('used', usedVariableToken, this.aliasToken);

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

  getUsedVariableFirstIndexOrClassName() {
    const usedVariableTokenOrClassName = this.getUsedVariableTokenOrClassName();

    if (isNull(usedVariableTokenOrClassName)) {
      return null;
    }

    if (isString(usedVariableTokenOrClassName)) {
      return usedVariableTokenOrClassName;
    }

    let isInsideFunctionParams: boolean = false;

    const variableToken = this.tokens.find((token: Array<any>) => {
      if (
        token[0] === "T_VARIABLE" &&
        token[1] === usedVariableTokenOrClassName[1]
      ) {
        if (this.tokenLineHaveFunction(token)) {
          isInsideFunctionParams = true;

          return true;
        }

        if (this.tokenLineHasEquality(token)) {
          return true;
        }
      }

      return false;
    });

    return {
      variableToken,
      isInsideFunctionParams,
    };
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

  getClassNameFromToken(): any {
    const variableFirstIndexOrClassName = this.getUsedVariableFirstIndexOrClassName();

    console.log(variableFirstIndexOrClassName);

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

  getClassNameFromEquality(variableToken: any) {
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
        tokensWithEquality[i][0] !== "T_WHITESPACE" &&
        tokensWithEquality[i][0] !== "T_STRING" &&
        tokensWithEquality[i][0] !== "T_NS_SEPARATOR"
      ) {
        break;
      }
    }

    return this.joinClassNameFromTokens(classNameTokens);
  }

  getClassNameFromDependencyInjection(variableToken: any): any {
    let classNameTokens: Array<any> = [];

    const tokens = this.tokens.slice(0, variableToken[3]).reverse();

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

    if (classNameTokens.length === 0) {
      this.aliasToken = variableToken;
    console.log(variableToken);
      return this.getClassNameFromToken();
    }

    return this.joinClassNameFromTokens(classNameTokens);
  }

  joinClassNameFromTokens(tokens: Array<any>) {
    return tokens
      .map((token) => {
        return token[1];
      })
      .join("")
      .trim();
  }
}
