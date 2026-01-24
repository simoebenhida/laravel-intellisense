import * as vscode from "vscode";
import Parser from "./parser/index";
import { getConfigElements } from "./php/config";

export default class ConfigItemProvider {
  private elements: string[] | null = null;

  constructor() {
    this.syncConfig();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    const hasConfig = new Parser(document, position).hasConfig();

    if (!hasConfig) {
      return items;
    }

    if (this.elements === null) {
      await this.syncConfig();
    }

    if (this.elements === null) {
      return items;
    }

    for (const element of this.elements) {
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

  async syncConfig(): Promise<void> {
    const elements = await getConfigElements();

    if (elements) {
      try {
        this.elements = Object.values(JSON.parse(elements)) as string[];
      } catch {
        // Silently fail on invalid JSON
        this.elements = null;
      }
    }
  }
}
