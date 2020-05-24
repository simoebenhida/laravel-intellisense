import { getResourceAliasToken } from "../utils";
import { workspace } from "vscode";
import { strict } from "assert";
import { isUndefined } from "util";

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

    let modelNamespace: string | undefined = workspace
      .getConfiguration("LaravelIntellisense")
      .get("model");

    if (isUndefined(modelNamespace)) {
      return null;
    }

    if (!modelNamespace.endsWith("\\")) {
      modelNamespace += "\\";
    }

    return modelNamespace + this.aliasToken[1].replace("Resource", "");
  }
}
