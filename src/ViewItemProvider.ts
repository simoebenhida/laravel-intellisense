import {
    TextDocument,
    CompletionItemProvider,
    Position,
    CompletionContext,
    CompletionItem,
    CompletionItemKind,
    Uri,
    CancellationToken,
    RelativePattern,
    workspace
} from 'vscode';
import { activeWorkspace } from "./utils";
import { getViews } from "./php/view";
import Parser from "./parser";

export default class ViewItemProvider implements CompletionItemProvider {

    private timer: any = null;

    private views: any = {};

    private watcher: any = null;

    constructor() {
        this.syncViews();

        this.watchViews();
    }

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Array<CompletionItem> {
        let items: Array<CompletionItem> = [];

        let hasView = new Parser(document, position).hasView();

        if (!hasView) {
            return items;
        }

        for (let view of this.views) {
            const item = new CompletionItem(view, CompletionItemKind.Constant);

            item.range = document.getWordRangeAtPosition(position, /[\w\d\-_\.\:\\\/]+/g);

            items.push(item);
        }

        return items;
    }

    syncViews() {
        getViews().then(views => {
            this.views = JSON.parse(views);
        });
    }

    watchViews() {
        this.watcher = workspace.createFileSystemWatcher(new RelativePattern(activeWorkspace(), "{,**/}{view,views}/{*,**/*}"));

        this.watcher.onDidCreate((e: Uri) => this.onChange());
        this.watcher.onDidDelete((e: Uri) => this.onChange());
        this.watcher.onDidChange((e: Uri) => this.onChange());
    }

    onChange() {
        this.timer = setInterval(() => {
            this.syncViews();
        }, 5000);
    }
}
