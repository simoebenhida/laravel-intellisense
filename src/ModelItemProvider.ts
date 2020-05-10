import * as vscode from "vscode";
import { getModelAttributes } from "./php/model";
import Parser from "./parser";
import { isNull } from "util";

export default class ModelItemProvider {
  private attributes: any = {};

  private line: any = null;

  constructor() {
    this.attributes = {};
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    let items: Array<vscode.CompletionItem> = [];

    let model = new Parser(document, position).hasModel();

    if (isNull(model)) {
      return items;
    }

    if (isNull(this.line) || this.line !== position.line) {
      this.line = position.line;

      await this.syncModel(model);
    }

    for (let attribute of this.attributes) {
      const item = new vscode.CompletionItem(
        attribute,
        vscode.CompletionItemKind.Constant
      );

      item.range = document.getWordRangeAtPosition(
        position,
        /[\w\d\-_\.\:\\\/]+/g
      );

      items.push(item);
    }

    return items;
  }

  async syncModel(model: string) {
    this.attributes = [];

    await getModelAttributes(model).then((attributes: any) => {
      this.attributes = JSON.parse(attributes);
    });
  }
}
