import * as vscode from "vscode";
import Parser from "./parser/index";
import { getRouterNames } from "./php/router";

export default class RouterItemProvider {
  private routes: any = null;

  constructor() {
    this.syncRoutes();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    let items: Array<vscode.CompletionItem> = [];

    let hasRoute = new Parser(document, position).hasRoute();

    if (!hasRoute) {
      return items;
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
      this.routes = Object.values(JSON.parse(routes));
    });
  }
}
