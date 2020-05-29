import { TextDocument, Position } from "vscode";
import ModelParser from "./ModelParser";
import ResourceParser from "./ResourceParser";
import {
  phpParserTokens,
  getResourceAliasToken,
  getEloquentAliasToken,
  getFactoryAliasToken,
} from "../utils";
import Handler from "./Handler";
import FactoryParser from "./FactoryParser";

export default class Parser {
  cachedParseFunction: any = null;

  viewAliases: Array<string> = [
    "View::",
    "view(",
    "markdown(",
    "links(",
    "@extends(",
    "@component(",
    "@include(",
    "@each(",
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

  configAliases: Array<string> = ["config("];

  routeAliases: Array<string> = ["route("];

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
    const handler = new Handler(this.tokens, this.position, this.queryAliases);

    const eloquentAliasToken = handler.getEloquentAliasToken();

    if (eloquentAliasToken.length > 0) {
        console.log('eloquent')
      return this.hasModel(eloquentAliasToken);
    }

    let resourceAliasToken = handler.getResourceAliasToken();

    if (resourceAliasToken.length) {
        console.log('resource')

      return this.hasResource(resourceAliasToken);
    }

    const factoryAliasToken = handler.getFactoryAliasToken();

    if (factoryAliasToken.length > 0) {
        console.log('factory')

      return this.hasFactory(factoryAliasToken);
    }

    return null;
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

  hasFactory(aliasToken: Array<any>) {
    const modelParser = new FactoryParser(this.tokens, aliasToken);

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
