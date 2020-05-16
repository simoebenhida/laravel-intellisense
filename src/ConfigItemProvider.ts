import * as vscode from "vscode";
import { getModelAttributes } from "./php/model";
import Parser from "./parser";
import { isNull } from "util";
import { getConfigElements } from "./php/config";

export default class ConfigItemProvider {
  private elements: any = null;

  constructor() {
      this.syncConfig();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    let items: Array<vscode.CompletionItem> = [];

    let hasConfig = new Parser(document, position).hasConfig();

    if (!hasConfig) {
      return items;
    }

    for (let element of this.elements) {
      const item = new vscode.CompletionItem(
        element,
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

  async syncConfig() {
    await getConfigElements().then((elements) => {
      this.elements = JSON.parse(elements);
    });
  }
}
