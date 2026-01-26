import {
  DefinitionProvider as VSCodeDefinitionProvider,
  TextDocument,
  Position,
  Location,
  Uri,
  workspace,
  Disposable,
} from "vscode";
import ContextDetector from "./ContextDetector";
import { getRouteByName } from "./php/routerDetails";
import { path } from "./utils";
import * as fs from "fs";
import * as nodePath from "path";

export default class DefinitionProvider implements VSCodeDefinitionProvider, Disposable {
  dispose(): void {
    // Nothing to dispose
  }

  async provideDefinition(
    document: TextDocument,
    position: Position
  ): Promise<Location | null> {
    const context = ContextDetector.detect(document, position);

    if (!context) {
      return null;
    }

    switch (context.type) {
      case "view":
        return this.findViewDefinition(context.value);
      case "route":
        return this.findRouteDefinition(context.value);
      case "config":
        return this.findConfigDefinition(context.value);
      case "translation":
        return this.findTranslationDefinition(context.value);
      default:
        return null;
    }
  }

  /**
   * Find the Blade view file
   * view('users.index') -> resources/views/users/index.blade.php
   */
  private async findViewDefinition(viewName: string): Promise<Location | null> {
    // Handle namespaced views (package::view.name)
    let basePath = "resources/views";
    let viewPath = viewName;

    if (viewName.includes("::")) {
      const [namespace, rest] = viewName.split("::");
      // For vendor packages, views are usually in resources/views/vendor/namespace
      basePath = `resources/views/vendor/${namespace}`;
      viewPath = rest;
    }

    // Convert dots to path separators
    const relativePath = viewPath.replace(/\./g, "/");

    // Try different extensions
    const extensions = [".blade.php", ".php"];
    for (const ext of extensions) {
      const fullPath = path(`${basePath}/${relativePath}${ext}`);
      if (fs.existsSync(fullPath)) {
        return new Location(Uri.file(fullPath), new Position(0, 0));
      }
    }

    // Also check for directory with index
    for (const ext of extensions) {
      const fullPath = path(`${basePath}/${relativePath}/index${ext}`);
      if (fs.existsSync(fullPath)) {
        return new Location(Uri.file(fullPath), new Position(0, 0));
      }
    }

    return null;
  }

  /**
   * Find the route definition (controller method or closure)
   */
  private async findRouteDefinition(routeName: string): Promise<Location | null> {
    const route = await getRouteByName(routeName);

    if (!route) {
      return null;
    }

    // If we have a file and line, use those
    if (route.file && route.line) {
      return new Location(
        Uri.file(route.file),
        new Position(route.line - 1, 0) // Lines are 0-indexed in VS Code
      );
    }

    // Fallback: try to find the route in route files
    const routeFiles = [
      "routes/web.php",
      "routes/api.php",
      "routes/channels.php",
      "routes/console.php",
    ];

    for (const routeFile of routeFiles) {
      const fullPath = path(routeFile);
      if (!fs.existsSync(fullPath)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      // Look for the route name in the file
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`'${routeName}'`) || lines[i].includes(`"${routeName}"`)) {
          return new Location(Uri.file(fullPath), new Position(i, 0));
        }
      }

      // Also try to find by ->name('routeName')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`->name('${routeName}')`)) {
          // Go back to find the Route:: declaration
          for (let j = i; j >= 0 && j > i - 10; j--) {
            if (lines[j].includes("Route::")) {
              return new Location(Uri.file(fullPath), new Position(j, 0));
            }
          }
          return new Location(Uri.file(fullPath), new Position(i, 0));
        }
      }
    }

    return null;
  }

  /**
   * Find the config file and key
   * config('app.name') -> config/app.php at 'name' key
   */
  private async findConfigDefinition(configKey: string): Promise<Location | null> {
    const parts = configKey.split(".");
    if (parts.length === 0) {
      return null;
    }

    const fileName = parts[0];
    const fullPath = path(`config/${fileName}.php`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    // If there's only the file name, go to start
    if (parts.length === 1) {
      return new Location(Uri.file(fullPath), new Position(0, 0));
    }

    // Try to find the key in the config file
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");
    const keyToFind = parts[parts.length - 1];

    for (let i = 0; i < lines.length; i++) {
      // Look for 'key' => or "key" =>
      const patterns = [
        `'${keyToFind}'\\s*=>`,
        `"${keyToFind}"\\s*=>`,
      ];

      for (const pattern of patterns) {
        if (new RegExp(pattern).test(lines[i])) {
          return new Location(Uri.file(fullPath), new Position(i, 0));
        }
      }
    }

    // Fallback to file start
    return new Location(Uri.file(fullPath), new Position(0, 0));
  }

  /**
   * Find the translation file and key
   * __('messages.welcome') -> resources/lang/en/messages.php at 'welcome' key
   */
  private async findTranslationDefinition(translationKey: string): Promise<Location | null> {
    const parts = translationKey.split(".");
    if (parts.length === 0) {
      return null;
    }

    // Handle JSON translations first (single key)
    if (parts.length === 1) {
      const jsonPath = path("resources/lang/en.json");
      if (fs.existsSync(jsonPath)) {
        const content = fs.readFileSync(jsonPath, "utf-8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`"${translationKey}"`)) {
            return new Location(Uri.file(jsonPath), new Position(i, 0));
          }
        }
      }
      // Also try lang directory
      const altJsonPath = path("lang/en.json");
      if (fs.existsSync(altJsonPath)) {
        return new Location(Uri.file(altJsonPath), new Position(0, 0));
      }
      return null;
    }

    // Handle PHP translation files
    const fileName = parts[0];
    const keyToFind = parts[parts.length - 1];

    // Try different lang directory structures
    const langPaths = [
      `resources/lang/en/${fileName}.php`,
      `lang/en/${fileName}.php`,
    ];

    for (const langPath of langPaths) {
      const fullPath = path(langPath);
      if (!fs.existsSync(fullPath)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes(`'${keyToFind}'`) ||
          lines[i].includes(`"${keyToFind}"`)
        ) {
          return new Location(Uri.file(fullPath), new Position(i, 0));
        }
      }

      // Fallback to file start
      return new Location(Uri.file(fullPath), new Position(0, 0));
    }

    return null;
  }
}
