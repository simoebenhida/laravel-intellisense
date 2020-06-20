import * as vscode from "vscode";
import { getModelAttributes } from "./php/model";
import Parser from "./parser/index";
import { isNull } from "util";

interface Attributes {
  [key: string]: Array<string>;
}

export default class ModelItemProvider {
  private attributes: Attributes = {};

  private model: string | null = "";

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    let items: Array<vscode.CompletionItem> = [];

    this.model = new Parser(document, position).getClassName();

    if (isNull(this.model)) {
      return items;
    }

    if (!this.attributes.hasOwnProperty(this.model)) {
      await this.syncModel();
    }

    for (let attribute of this.attributes[this.model]) {
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
    if (isNull(this.model)) {
      return;
    }

    const attributes = await getModelAttributes(this.model);

    this.attributes[this.model] = JSON.parse(attributes);
  }
}
