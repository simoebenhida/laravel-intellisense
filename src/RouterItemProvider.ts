import * as vscode from "vscode";
import Parser from "./parser/index";
import { getRouterNames } from "./php/router";

export default class RouterItemProvider {
  private routes: string[] | null = null;

  constructor() {
    this.syncRoutes();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    const hasRoute = new Parser(document, position).hasRoute();

    if (!hasRoute) {
      return items;
    }

    if (this.routes === null) {
      await this.syncRoutes();
    }

    if (this.routes === null) {
      return items;
    }

    for (const route of this.routes) {
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

  async syncRoutes(): Promise<void> {
    const routes = await getRouterNames();

    if (routes) {
      try {
        this.routes = Object.values(JSON.parse(routes)) as string[];
      } catch {
        // Silently fail on invalid JSON
        this.routes = null;
      }
    }
  }
}
