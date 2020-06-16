import {
  TextDocument,
  CompletionItemProvider,
  Position,
  CompletionItem,
  CompletionItemKind,
  RelativePattern,
  workspace,
} from "vscode";
import { activeWorkspace } from "./utils";
import { getViews } from "./php/view";
import Parser from "./parser/index";
import { isNull } from "util";

export default class ViewItemProvider implements CompletionItemProvider {
  private views: any = null;

  private watcher: any = null;

  constructor() {
    this.syncViews();

    this.watchViews();
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position
  ): Promise<Array<CompletionItem>> {
    let items: Array<CompletionItem> = [];

    let hasView = new Parser(document, position).hasView();

    if (!hasView) {
      return items;
    }

    if (isNull(this.views)) {
      await this.syncViews();
    }

    for (let view of this.views) {
      const item = new CompletionItem(view, CompletionItemKind.Constant);

      item.range = document.getWordRangeAtPosition(
        position,
        /[\w\d\-_\.\:\\\/]+/g
      );

      items.push(item);
    }

    return items;
  }

  syncViews() {
    getViews().then((views) => {
      this.views = JSON.parse(views);
    });
  }

  watchViews() {
    this.watcher = workspace.createFileSystemWatcher(
      new RelativePattern(activeWorkspace(), "{,**/}{view,views}/{*,**/*}")
    );

    this.watcher.onDidCreate(() => this.onChange());
    this.watcher.onDidDelete(() => this.onChange());
    this.watcher.onDidChange(() => this.onChange());
  }

  onChange() {
    setInterval(() => {
      this.syncViews();
    }, 5000);
  }
}
