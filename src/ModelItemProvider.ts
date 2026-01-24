import * as vscode from "vscode";
import { getModelAttributes } from "./php/model";
import Parser from "./parser/index";

interface Attributes {
  [key: string]: string[];
}

export default class ModelItemProvider {
  private attributes: Attributes = {};

  private model: string | null = "";

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    this.model = new Parser(document, position).getClassName();

    if (this.model === null) {
      return items;
    }

    if (!Object.prototype.hasOwnProperty.call(this.attributes, this.model)) {
      await this.syncModel();
    }

    if (this.model === null || !this.attributes[this.model]) {
      return items;
    }

    for (const attribute of this.attributes[this.model]) {
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

  async syncModel(): Promise<void> {
    if (this.model === null) {
      return;
    }

    const attributes = await getModelAttributes(this.model);

    if (attributes) {
      try {
        this.attributes[this.model] = JSON.parse(attributes);
      } catch {
        // Silently fail on invalid JSON
      }
    }
  }
}
