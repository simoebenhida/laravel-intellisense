import * as vscode from "vscode";
import Parser from "./parser/index";
import { getConfigElements } from "./php/config";

export default class ConfigItemProvider implements vscode.Disposable {
  private elements: string[] | null = null;

  constructor() {
    this.syncConfig();
  }

  dispose(): void {
    this.elements = null;
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
      // Get the config file name (first part before the dot)
      const configFile = element.split(".")[0] || "config";

      const item = new vscode.CompletionItem(
        {
          label: element,
          description: configFile,
        },
        vscode.CompletionItemKind.Property
      );

      item.detail = `Config: ${element}`;

      const docs = new vscode.MarkdownString();
      docs.appendMarkdown(`**${element}**\n\n`);
      docs.appendMarkdown(`Configuration key from \`${configFile}.php\`\n\n`);
      docs.appendCodeblock(`config('${element}')`, "php");
      item.documentation = docs;

      item.sortText = element;

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
