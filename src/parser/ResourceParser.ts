import { getDefaultModelNamespace } from "../utils";

type Token = [string, string, number, number] | string;

export default class ResourceParser {
  tokens: Token[];

  aliasToken: Token[] = [];

  constructor(tokens: Token[], aliasToken: Token[]) {
    this.tokens = tokens;

    this.aliasToken = aliasToken;
  }

  getFullClassName(): string | null {
    if (this.aliasToken.length === 0) {
      return null;
    }

    const firstToken = this.aliasToken[0];
    if (!Array.isArray(firstToken)) {
      return null;
    }

    const modelNamespace = getDefaultModelNamespace();

    return modelNamespace + firstToken[1].replace("Resource", "");
  }
}
