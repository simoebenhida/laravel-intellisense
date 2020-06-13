import { ExtensionContext, languages, commands } from "vscode";
import { hasArtisan, DOCUMENT_SELECTOR, TRIGGER_CHARACTERS } from "./laravel";
import ViewItemProvider from "./ViewItemProvider";
import ModelItemProvider from "./ModelItemProvider";
import LaravelIdeHelper from "./php/laravelIdeHelper";
import ConfigItemProvider from "./ConfigItemProvider";
import RouterItemProvider from "./RouterItemProvider";

export function activate(context: ExtensionContext) {
  if (!hasArtisan()) {
    return;
  }

  context.subscriptions.push(
    commands.registerCommand(`generate_ide_helper`, () =>
      LaravelIdeHelper.generate()
    )
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      new ModelItemProvider(),
      ...TRIGGER_CHARACTERS
    )
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      new ViewItemProvider(),
      ...TRIGGER_CHARACTERS
    )
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      new ConfigItemProvider(),
      ...TRIGGER_CHARACTERS
    )
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      new RouterItemProvider(),
      ...TRIGGER_CHARACTERS
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
