
import { ExtensionContext, languages } from 'vscode';
import { hasArtisan, DOCUMENT_SELECTOR, TRIGGER_CHARACTERS } from './laravel';
import ViewItemProvider from "./ViewItemProvider";

export function activate(context: ExtensionContext) {
    if (hasArtisan()) {
        context.subscriptions.push(languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, new ViewItemProvider, ...TRIGGER_CHARACTERS));
    }
}

// this method is called when your extension is deactivated
export function deactivate() {}
