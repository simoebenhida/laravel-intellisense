import * as vscode from "vscode";
import Parser from "./parser/index";
import { getConfigElements } from "./php/config";
import { isNull } from "util";

export default class ConfigItemProvider {
  private elements: any = null;

  constructor() {
    this.syncConfig();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<Array<vscode.CompletionItem>> {
    let items: Array<vscode.CompletionItem> = [];

    let hasConfig = new Parser(document, position).hasConfig();

    if (!hasConfig) {
      return items;
    }

    if (isNull(this.elements)) {
      await this.syncConfig();
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
      this.elements = Object.values(JSON.parse(elements));
    });
  }
}
