import * as vscode from "vscode";
import Parser from "./parser/index";
import { getTranslations } from "./php/translation";

export default class TranslationItemProvider {
  private translations: string[] | null = null;

  constructor() {
    this.syncTranslations();
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
      const item = new vscode.CompletionItem(
        translation,
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
