import * as vscode from "vscode";
import Parser from "./parser/index";
import { getTranslations } from "./php/translation";

export default class TranslationItemProvider implements vscode.Disposable {
  private translations: string[] | null = null;

  constructor() {
    this.syncTranslations();
  }

  dispose(): void {
    this.translations = null;
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    const hasTranslation = new Parser(document, position).hasTranslation();

    if (!hasTranslation) {
      return items;
    }

    if (this.translations === null) {
      await this.syncTranslations();
    }

    if (this.translations === null) {
      return items;
    }

    for (const translation of this.translations) {
      // Get the translation file name (first part before the dot)
      const transFile = translation.split(".")[0] || "lang";

      const item = new vscode.CompletionItem(
        {
          label: translation,
          description: transFile,
        },
        vscode.CompletionItemKind.Text
      );

      item.detail = `Translation: ${translation}`;

      const docs = new vscode.MarkdownString();
      docs.appendMarkdown(`**${translation}**\n\n`);
      docs.appendMarkdown(`Translation key from \`${transFile}.php\`\n\n`);
      docs.appendCodeblock(`__('${translation}')`, "php");
      item.documentation = docs;

      item.sortText = translation;

      item.range = document.getWordRangeAtPosition(
        position,
        /[\w\d\-_\.\:\\\/]+/g
      );

      items.push(item);
    }

    return items;
  }

  async syncTranslations(): Promise<void> {
    const translations = await getTranslations();

    if (translations) {
      try {
        this.translations = Object.values(
          JSON.parse(translations)
        ) as string[];
      } catch {
        // Silently fail on invalid JSON
        this.translations = null;
      }
    }
  }
}
