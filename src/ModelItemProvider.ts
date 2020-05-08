import * as vscode from "vscode";
import { getModelAttributes } from "./php/model";
import Parser from "./parser";

export default class ModelItemProvider {
  private timer: any = null;

  private attributes: any = {};

  private watcher: any = null;

  constructor() {
    this.timer = null;
    this.attributes = {};
    this.watcher = null;
    this.syncModel();
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Array<vscode.CompletionItem> {
    let items: Array<vscode.CompletionItem> = [];

    let hasModel = new Parser(document, position).hasModel();

    if (!hasModel) {
      return items;
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

  syncModel() {
    getModelAttributes().then((attributes) => {
      this.attributes = JSON.parse(attributes);
    });
  }
}
