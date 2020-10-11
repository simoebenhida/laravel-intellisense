import * as vscode from "vscode";
import Parser from "./parser/index";
import { getRouterNames } from "./php/router";
import { isNull } from "util";

export default class RouterItemProvider {
  private routes: any = null;

  constructor() {
    this.syncRoutes();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<Array<vscode.CompletionItem>> {
    let items: Array<vscode.CompletionItem> = [];

    let hasRoute = new Parser(document, position).hasRoute();

    if (!hasRoute) {
      return items;
    }

    if (isNull(this.routes)) {
      await this.syncRoutes();
    }

    for (let route of this.routes) {
      const item = new vscode.CompletionItem(
        route,
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

  async syncRoutes() {
    await getRouterNames().then((routes) => {
      if (!routes) {
        return;
      }

      this.routes = Object.values(JSON.parse(routes));
    });
  }
}
