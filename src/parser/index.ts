import { TextDocument, Position } from "vscode";
import ModelParser from "./ModelParser";
import ResourceParser from "./ResourceParser";
import {
  phpParserTokens,
  getResourceAliasToken,
  getEloquentAliasToken,
  getFactoryAliasToken
} from "../utils";

export default class Parser {
  cachedParseFunction: any = null;

  viewAliases: Array<string> = [
    "View",
    "view",
    "markdown",
    "links",
    "@extends",
    "@component",
    "@include",
    "@each",
  ];

  queryAliases: Array<string> = [
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

  classes: Array<string> = ["Config", "Route", "Lang", "Validator", "View"];

  configAliases: Array<string> = ["config("];

  document: TextDocument;

  position: Position;

  tokens: Array<any> = [];

  constructor(document: TextDocument, position: Position) {
    this.document = document;

    this.position = position;

    this.tokens = this.parseTokens();
  }

  parseTokens() {
    return phpParserTokens(this.document.getText());
  }

  hasView() {
    return this.viewAliases.some((alias: string) => {
      const text = this.document.lineAt(this.position).text;

      return text.includes(alias);
    });
  }

  getClassName() {
    console.log(getFactoryAliasToken(this.tokens, this.position));

    return null;
    // let aliasToken = getResourceAliasToken(this.tokens, this.position);

    // if (aliasToken.length) {
    //   return this.hasResource(aliasToken);
    // }

    // aliasToken = getEloquentAliasToken(
    //   this.tokens,
    //   this.queryAliases,
    //   this.position
    // );

    // return this.hasModel(aliasToken);
  }

  hasModel(aliasToken: Array<any>) {
    const modelParser = new ModelParser(this.tokens, aliasToken);

    const className = modelParser.getFullClassName();

    return className;
  }

  hasResource(aliasToken: Array<any>) {
    const modelParser = new ResourceParser(this.tokens, aliasToken);

    const className = modelParser.getFullClassName();

    return className;
  }

  hasConfig() {
    return this.configAliases.some((alias) => {
      const text = this.document.lineAt(this.position).text;

      return text.includes(alias);
    });
  }
}
