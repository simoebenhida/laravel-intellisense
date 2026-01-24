import { getDefaultModelNamespace } from "../utils";

type Token = [string, string, number, number] | string;

interface VariableTokenResult {
  variableToken: Token[];
  isInsideFunctionParams: boolean;
}

interface DoubleColonResult {
  isCorrectDoubleColon: boolean;
  classNameTokens: Token[];
}

export default class ModelParser {
  tokens: Token[];

  aliasToken: Token[] = [];

  constructor(tokens: Token[], aliasToken: Token[]) {
    this.tokens = tokens;

    this.aliasToken = aliasToken;
  }

  getFullClassName(): string | null {
    const className = this.getClassNameFromToken();

    if (className === null) {
      return null;
    }

    const namespace = this.getUseClasses().find((ns: string) => {
      return ns.endsWith(className);
    });

    if (className.includes("\\")) {
      return className;
    }

    if (namespace === undefined) {
      const modelDefaultNamespace = getDefaultModelNamespace();

      return modelDefaultNamespace + className;
    }

    return namespace;
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

  getUsedVariableTokenOrClassName(aliasToken: Token[] = []): Token[] | null | string {
    const classNameTokens: Token[] = [];

    let hasVariable = true;

    let usedVariableToken: Token[] = [];

    if (aliasToken.length === 0) {
      aliasToken = this.aliasToken;
    }

    const firstAliasToken = aliasToken[0];
    if (
      aliasToken === undefined ||
      aliasToken.length === 0 ||
      !Array.isArray(firstAliasToken) ||
      firstAliasToken.length < 4
    ) {
      return null;
    }

    const tokens = this.tokens.slice(0, firstAliasToken[3]).reverse();

    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j];
      const nextToken = tokens[j + 1];

      if (
        Array.isArray(token) &&
        token[0] === "T_VARIABLE" &&
        (nextToken === "{" ||
          nextToken === ";" ||
          nextToken === ")" ||
          nextToken === "=")
      ) {
        usedVariableToken = [token];

        hasVariable = true;
        break;
      }

      if (Array.isArray(token) && token[0] === "T_DOUBLE_COLON") {
        const checkForDoubleColon = this.checkIfTheDoubleColonIsCorrect(
          j,
          tokens
        );

        if (checkForDoubleColon.isCorrectDoubleColon) {
          return this.joinClassNameFromTokens(
            checkForDoubleColon.classNameTokens.reverse()
          );
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
    tokens: Token[]
  ): DoubleColonResult {
    const classNameTokens: Token[] = [];

    let isCorrectDoubleColon = false;

    const tokensFromDoubleColon = tokens.slice(indexForDoubleColon + 1);

    for (let i = 0; i < tokensFromDoubleColon.length; i++) {
      const token = tokensFromDoubleColon[i];
      const nextToken = tokensFromDoubleColon[i + 1];

      if (!Array.isArray(token)) {
        break;
      }

      if (token[0] === "T_STRING" || token[0] === "T_NS_SEPARATOR") {
        classNameTokens.push(token);
      }

      if (
        token[0] !== "T_STRING" &&
        token[0] !== "T_NS_SEPARATOR" &&
        ((token[0] === "(" && Array.isArray(nextToken) && nextToken[0] === "T_FUNCTION") ||
          token[0] === "=" ||
          token[0] === "{" ||
          token[0] === ")" ||
          token[0] === ";" ||
          token[0] === "T_OPEN_TAG")
      ) {
        isCorrectDoubleColon = true;
      }

      if (
        token[0] !== "T_STRING" &&
        token[0] !== "T_OBJECT_OPERATOR" &&
        token[0] !== "T_NS_SEPARATOR"
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
    parentTokens: Token[] = [],
    aliasToken: Token[] = []
  ): string | VariableTokenResult | null {
    if (parentTokens.length === 0) {
      parentTokens = this.tokens;
    }

    if (aliasToken.length === 0) {
      aliasToken = this.aliasToken;
    }

    const usedVariableTokenOrClassName =
      this.getUsedVariableTokenOrClassName(aliasToken);

    if (usedVariableTokenOrClassName === null) {
      return null;
    }

    if (typeof usedVariableTokenOrClassName === "string") {
      return usedVariableTokenOrClassName;
    }

    let isInsideFunctionParams = false;

    const firstAliasToken = aliasToken[0];
    if (!Array.isArray(firstAliasToken)) {
      return null;
    }

    const tokens: Token[] = parentTokens.slice(0, firstAliasToken[3]).reverse();

    let variableToken: Token[] | string = [];

    const firstUsedVar = usedVariableTokenOrClassName[0];
    if (!Array.isArray(firstUsedVar)) {
      return null;
    }

    for (const token of tokens) {
      if (
        Array.isArray(token) &&
        token[0] === "T_VARIABLE" &&
        token[1] === firstUsedVar[1]
      ) {
        const firstVariableToken = this.getFirstVariableToken(token);

        if (typeof firstVariableToken === "string") {
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

    if (typeof variableToken === "string") {
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

  getFirstVariableToken(
    variableToken: [string, string, number, number]
  ): string | VariableTokenResult {
    const tokens = this.tokens.slice(0, variableToken[3]).reverse();

    let hasDependency = false;

    let hasFunction = false;

    for (const token of tokens) {
      if (Array.isArray(token) && token[0] === "T_STRING") {
        hasDependency = true;
        break;
      }

      if (Array.isArray(token) && token[0] === "T_FUNCTION") {
        hasFunction = true;
        break;
      }

      if (token === ";" || token === "{" || token === ")") {
        break;
      }
    }

    if (hasDependency) {
      return {
        variableToken: [variableToken],
        isInsideFunctionParams: true,
      };
    }

    if (!hasFunction) {
      return {
        variableToken: [],
        isInsideFunctionParams: false,
      };
    }

    const result = this.getUsedVariableFirstIndexOrClassName(
      tokens.reverse(),
      [variableToken]
    );

    if (typeof result === "string") {
      return result;
    }

    return result ?? { variableToken: [], isInsideFunctionParams: false };
  }

  getClassNameFromToken(
    parentTokens: Token[] = [],
    aliasToken: Token[] = []
  ): string | null {
    const variableFirstIndexOrClassName =
      this.getUsedVariableFirstIndexOrClassName(parentTokens, aliasToken);

    if (typeof variableFirstIndexOrClassName === "string") {
      return variableFirstIndexOrClassName;
    }

    if (variableFirstIndexOrClassName === null) {
      return null;
    }

    const variableToken = variableFirstIndexOrClassName.variableToken;

    if (variableFirstIndexOrClassName.isInsideFunctionParams) {
      return this.getClassNameFromDependencyInjection(variableToken);
    }

    return this.getClassNameFromEquality(variableToken);
  }

  getClassNameFromEquality(variableToken: Token[]): string | null {
    const classNameTokens: Token[] = [];

    let equalityIndex: number | null = null;

    const firstVarToken = variableToken[0];
    if (!Array.isArray(firstVarToken)) {
      return null;
    }

    const tokens = this.tokens.slice(firstVarToken[3] + 1);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === "=") {
        equalityIndex = i;

        break;
      }

      if (Array.isArray(token) && token[0] !== "T_WHITESPACE") {
        equalityIndex = null;

        break;
      }
    }

    if (equalityIndex === null) {
      return null;
    }

    const tokensWithEquality = tokens.slice(equalityIndex + 1);

    for (let i = 0; i < tokensWithEquality.length; i++) {
      const token = tokensWithEquality[i];

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

  getClassNameFromDependencyInjection(variableToken: Token[]): string | null {
    let classNameTokens: Token[] = [];

    const firstVarToken = variableToken[0];
    if (!Array.isArray(firstVarToken)) {
      return null;
    }

    const tokens = this.tokens.slice(0, firstVarToken[3]).reverse();

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

    classNameTokens = classNameTokens.reverse();

    if (classNameTokens.length === 0) {
      return this.getClassNameFromToken(tokens, variableToken);
    }

    return this.joinClassNameFromTokens(classNameTokens);
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
