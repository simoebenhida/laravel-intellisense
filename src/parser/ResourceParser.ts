import { getDefaultModelNamespace } from "../utils";
export default class ResourceParser {
  tokens: Array<any>;

  aliasToken: Array<any> = [];

  constructor(tokens: Array<any>, aliasToken: Array<any>) {
    this.tokens = tokens;

    this.aliasToken = aliasToken;
  }

  getFullClassName() {
    if (this.aliasToken.length === 0) {
      return null;
    }

    const modelNamespace = getDefaultModelNamespace();

    return modelNamespace + this.aliasToken[1].replace("Resource", "");
  }
}
