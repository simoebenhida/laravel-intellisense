import { TextDocument, Position } from "vscode";
import ModelParser from "./ModelParser";
import { isNull } from "util";
import { phpParserTokens } from "../utils";

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

  classes: Array<string> = ["Config", "Route", "Lang", "Validator", "View"];

  configAliases: Array<string> = ["config("];

  document: TextDocument;

  position: Position;

  constructor(document: TextDocument, position: Position) {
    this.document = document;

    this.position = position;
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

  hasModel() {
    const modelParser = new ModelParser(this.parseTokens(), this.position);

    const className = modelParser.getFullClassName();

    console.log(className);

    if (isNull(className)) {
      return null;
    }

    return className;
  }

  hasConfig() {
    return this.configAliases.some((alias) => {
      const text = this.document.lineAt(this.position).text;

      return text.includes(alias);
    });
  }
}
