import * as vscode from "vscode";
import { getModelAttributes } from "./php/model";
import Parser from "./parser/index";
import { isNull } from "util";

export default class ModelItemProvider {
  private attributes: any = {};

  private model: string | null = null;

  constructor() {
    this.attributes = {};
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    let items: Array<vscode.CompletionItem> = [];

    let model = new Parser(document, position).getClassName();

    if (isNull(model)) {
      return items;
    }

    if (this.model !== model) {
      this.model = model;

      await this.syncModel();
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

  async syncModel() {
    this.attributes = [];

    if (isNull(this.model)) {
      return;
    }

    await getModelAttributes(this.model).then((attributes: any) => {
      this.attributes = JSON.parse(attributes);
    });
  }
}
