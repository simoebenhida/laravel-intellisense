import { TextDocument, Position, EvaluatableExpressionProvider, Hover } from "vscode";
import ClassParser from './parser/ClassParser';

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

  async hasModel() {
    const classParser = new ClassParser(this.document, this.position);

    console.log(classParser.getClass());

    return this.queryAliases.some((alias) => {
      const text = this.document.lineAt(this.position).text;
      return text.includes(alias);
    });
  }

  getDocumentCode() {
    return new Promise((resolve, reject) => {
      if (this.document) {
        resolve(this.document.getText());
      }
    });
  }
}
