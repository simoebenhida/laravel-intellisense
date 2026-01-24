import { TextDocument, Position } from "vscode";
import ModelParser from "./ModelParser";
import ResourceParser from "./ResourceParser";
import { phpParserTokens } from "../utils";
import Handler from "./Handler";
import FactoryParser from "./FactoryParser";

type Token = [string, string, number, number] | string;

export default class Parser {
  viewAliases: string[] = [
    "view",
    "markdown",
    "links",
    "@extends",
    "@component",
    "@include",
    "@each",
  ];

  queryAliases: string[] = [
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

  configAliases: string[] = ["config", "Config::get"];

  routeAliases: string[] = ["route"];

  translateAliases: string[] = ["__", "trans", "trans_choice"];

  document: TextDocument;

  position: Position;

  tokens: Token[] = [];

  constructor(document: TextDocument, position: Position) {
    this.document = document;

    this.position = position;

    this.tokens = this.parseTokens();
  }

  parseTokens(): Token[] {
    return phpParserTokens(this.document.getText());
  }

  getClassName(): string | null {
    const handler = new Handler(this.tokens, this.position, this.queryAliases);

    const eloquentAliasToken = handler.getEloquentAliasToken();

    if (eloquentAliasToken.length > 0) {
      return this.hasModel(eloquentAliasToken);
    }

    const resourceAliasToken = handler.getResourceAliasToken();

    if (resourceAliasToken.length) {
      return this.hasResource(resourceAliasToken);
    }

    const factoryAliasToken = handler.getFactoryAliasToken();

    if (factoryAliasToken.length > 0) {
      return this.hasFactory(factoryAliasToken);
    }

    return null;
  }

  hasModel(aliasToken: Token[]): string | null {
    const modelParser = new ModelParser(this.tokens, aliasToken);

    return modelParser.getFullClassName();
  }

  hasResource(aliasToken: Token[]): string | null {
    const modelParser = new ResourceParser(this.tokens, aliasToken);

    return modelParser.getFullClassName();
  }

  hasFactory(aliasToken: Token[]): string | null {
    const modelParser = new FactoryParser(this.tokens, aliasToken);

    return modelParser.getFullClassName();
  }

  hasConfig(): boolean {
    const handler = new Handler(this.tokens, this.position, this.configAliases);

    return handler.hasAlias();
  }

  hasRoute(): boolean {
    const handler = new Handler(this.tokens, this.position, this.routeAliases);

    return handler.hasAlias();
  }

  hasView(): boolean {
    const handler = new Handler(this.tokens, this.position, this.viewAliases);

    return handler.hasAlias();
  }

  hasTranslation(): boolean {
    const handler = new Handler(
      this.tokens,
      this.position,
      this.translateAliases
    );

    return handler.hasAlias();
  }
}
