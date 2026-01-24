import { ExtensionContext, languages, commands, Disposable } from "vscode";
import { hasArtisan, DOCUMENT_SELECTOR, TRIGGER_CHARACTERS } from "./laravel";
import ViewItemProvider from "./ViewItemProvider";
import ModelItemProvider from "./ModelItemProvider";
import LaravelIdeHelper from "./php/laravelIdeHelper";
import ConfigItemProvider from "./ConfigItemProvider";
import RouterItemProvider from "./RouterItemProvider";
import TranslationItemProvider from "./TranslationItemProvider";
import ValidationItemProvider from "./ValidationItemProvider";

// Store providers for proper disposal
const providers: Disposable[] = [];

export function activate(context: ExtensionContext) {
  if (!hasArtisan()) {
    return;
  }

  context.subscriptions.push(
    commands.registerCommand(`generate_ide_helper`, () =>
      LaravelIdeHelper.generate()
    )
  );

  const modelProvider = new ModelItemProvider();
  const viewProvider = new ViewItemProvider();
  const configProvider = new ConfigItemProvider();
  const routerProvider = new RouterItemProvider();
  const translationProvider = new TranslationItemProvider();
  const validationProvider = new ValidationItemProvider();

  // Store providers for disposal
  providers.push(
    modelProvider,
    viewProvider,
    configProvider,
    routerProvider,
    translationProvider,
    validationProvider
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      modelProvider,
      ...TRIGGER_CHARACTERS
    )
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      viewProvider,
      ...TRIGGER_CHARACTERS
    )
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      configProvider,
      ...TRIGGER_CHARACTERS
    )
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      routerProvider,
      ...TRIGGER_CHARACTERS
    )
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      translationProvider,
      ...TRIGGER_CHARACTERS
    )
  );

  // Validation rules - trigger on | and quotes
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      validationProvider,
      "|",
      "'",
      '"'
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  // Dispose all providers to prevent memory leaks
  for (const provider of providers) {
    provider.dispose();
  }
  providers.length = 0;
}
