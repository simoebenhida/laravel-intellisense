import * as vscode from "vscode";
import Parser from "./parser/index";
import { getTranslations } from "./php/translation";
import { isNull } from "util";

export default class TranslationItemProvider {
  private translations: any = null;

  constructor() {
    this.syncTranslations();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<Array<vscode.CompletionItem>> {
    let items: Array<vscode.CompletionItem> = [];

    let hasTranslation = new Parser(document, position).hasTranslation();

    if (!hasTranslation) {
      return items;
    }

    if (isNull(this.translations)) {
      await this.syncTranslations();
    }

    for (let translation of this.translations) {
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

  async syncTranslations() {
    const translations = await getTranslations();
    if (!translations) {
      return;
    }

    this.translations = Object.values(JSON.parse(translations));
  }
}
