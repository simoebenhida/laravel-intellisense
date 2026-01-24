import {
  TextDocument,
  CompletionItemProvider,
  Position,
  CompletionItem,
  CompletionItemKind,
  RelativePattern,
  workspace,
  FileSystemWatcher,
  Disposable,
  MarkdownString,
} from "vscode";
import { activeWorkspace } from "./utils";
import { getViews } from "./php/view";
import Parser from "./parser/index";

export default class ViewItemProvider implements CompletionItemProvider, Disposable {
  private views: string[] | null = null;

  private watcher: FileSystemWatcher | null = null;

  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.syncViews();

    this.watchViews();
  }

  dispose(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.views = null;
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position
  ): Promise<CompletionItem[]> {
    const items: CompletionItem[] = [];

    const hasView = new Parser(document, position).hasView();

    if (!hasView) {
      return items;
    }

    if (this.views === null) {
      await this.syncViews();
    }

    if (this.views === null) {
      return items;
    }

    for (const view of this.views) {
      const item = new CompletionItem(
        {
          label: view,
          description: "View",
        },
        CompletionItemKind.File
      );

      item.detail = `Blade: ${view}`;

      const docs = new MarkdownString();
      docs.appendMarkdown(`**${view}**\n\n`);
      docs.appendMarkdown(`Blade view template\n\n`);
      docs.appendCodeblock(`view('${view}')`, "php");
      item.documentation = docs;

      item.range = document.getWordRangeAtPosition(
        position,
        /[\w\d\-_\.\:\\\/]+/g
      );

      items.push(item);
    }

    return items;
  }

  syncViews(): Promise<void> {
    return getViews().then((views) => {
      if (views) {
        try {
          this.views = JSON.parse(views);
        } catch {
          // Silently fail on invalid JSON
          this.views = null;
        }
      }
    });
  }

  watchViews(): void {
    const workspaceFolder = activeWorkspace();
    if (!workspaceFolder) {
      return;
    }

    this.watcher = workspace.createFileSystemWatcher(
      new RelativePattern(workspaceFolder, "{,**/}{view,views}/{*,**/*}")
    );

    this.watcher.onDidCreate(() => this.onChange());
    this.watcher.onDidDelete(() => this.onChange());
    this.watcher.onDidChange(() => this.onChange());
  }

  onChange(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncViews();
      this.debounceTimer = null;
    }, 500);
  }
}
