import * as vscode from "vscode";
import Parser from "./parser/index";
import { getRouterNames } from "./php/router";

export default class RouterItemProvider implements vscode.Disposable {
  private routes: string[] | null = null;

  constructor() {
    this.syncRoutes();
  }

  dispose(): void {
    this.routes = null;
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
      // Get route prefix (e.g., "admin" from "admin.users.index")
      const routePrefix = route.split(".")[0] || "route";

      const item = new vscode.CompletionItem(
        {
          label: route,
          description: "Route",
        },
        vscode.CompletionItemKind.Reference
      );

      item.detail = `Route: ${route}`;

      const docs = new vscode.MarkdownString();
      docs.appendMarkdown(`**${route}**\n\n`);
      docs.appendMarkdown(`Named route\n\n`);
      docs.appendCodeblock(`route('${route}')`, "php");
      item.documentation = docs;

      // Sort by prefix then name
      item.sortText = `${routePrefix}_${route}`;

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
