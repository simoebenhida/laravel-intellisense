import {
  TextDocument,
  Position,
  EvaluatableExpressionProvider,
  Hover,
} from "vscode";
import ModelParser from "./parser/ModelParser";
import { isNull } from "util";

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

  queryAliases: Array<string> = ["->where", "::where"];

  document: TextDocument;

  position: Position;

  constructor(document: TextDocument, position: Position) {
    this.document = document;

    this.position = position;
  }

  hasView() {
    return this.viewAliases.some((alias: string) => {
      const text = this.document.lineAt(this.position).text;

      return text.includes(alias);
    });
  }

  hasModel() {
    const modelParser = new ModelParser(this.document, this.position);

    const className = modelParser.getFullClassName();

    if (isNull(className)) {
      return null;
    }

    return className;
  }

  getDocumentCode() {
    return new Promise((resolve, reject) => {
      if (this.document) {
        resolve(this.document.getText());
      }
    });
  }
}
