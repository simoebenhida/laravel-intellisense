import {
  HoverProvider as VSCodeHoverProvider,
  TextDocument,
  Position,
  Hover,
  MarkdownString,
  Disposable,
} from "vscode";
import ContextDetector from "./ContextDetector";
import { getRouteByName, RouteInfo } from "./php/routerDetails";
import { getModelDetails } from "./php/modelDetails";
import { path } from "./utils";
import * as fs from "fs";
import Parser from "./parser/index";

export default class HoverProvider implements VSCodeHoverProvider, Disposable {
  private routeCache: Map<string, RouteInfo | null> = new Map();

  dispose(): void {
    this.routeCache.clear();
  }

  async provideHover(
    document: TextDocument,
    position: Position
  ): Promise<Hover | null> {
    // First check for Laravel-specific context
    const context = ContextDetector.detect(document, position);

    if (context) {
      switch (context.type) {
        case "view":
          return this.getViewHover(context.value);
        case "route":
          return this.getRouteHover(context.value);
        case "config":
          return this.getConfigHover(context.value);
        case "translation":
          return this.getTranslationHover(context.value);
      }
    }

    // Check for model context (for showing model info on hover)
    const parser = new Parser(document, position);
    const modelClass = parser.getClassName();

    if (modelClass) {
      return this.getModelHover(modelClass);
    }

    return null;
  }

  /**
   * Show view file path and preview
   */
  private async getViewHover(viewName: string): Promise<Hover | null> {
    let basePath = "resources/views";
    let viewPath = viewName;

    if (viewName.includes("::")) {
      const [namespace, rest] = viewName.split("::");
      basePath = `resources/views/vendor/${namespace}`;
      viewPath = rest;
    }

    const relativePath = viewPath.replace(/\./g, "/");
    const extensions = [".blade.php", ".php"];

    for (const ext of extensions) {
      const fullPath = path(`${basePath}/${relativePath}${ext}`);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const preview = content.split("\n").slice(0, 10).join("\n");

        const md = new MarkdownString();
        md.appendMarkdown(`**Blade View:** \`${viewName}\`\n\n`);
        md.appendMarkdown(`**File:** \`${basePath}/${relativePath}${ext}\`\n\n`);
        md.appendMarkdown("---\n\n");
        md.appendMarkdown("**Preview:**\n");
        md.appendCodeblock(preview.length > 500 ? preview.substring(0, 500) + "..." : preview, "blade");

        return new Hover(md);
      }
    }

    const md = new MarkdownString();
    md.appendMarkdown(`**Blade View:** \`${viewName}\`\n\n`);
    md.appendMarkdown(`⚠️ View file not found`);

    return new Hover(md);
  }

  /**
   * Show route URL, methods, middleware, and controller
   */
  private async getRouteHover(routeName: string): Promise<Hover | null> {
    // Check cache first
    if (!this.routeCache.has(routeName)) {
      const route = await getRouteByName(routeName);
      this.routeCache.set(routeName, route);
    }

    const route = this.routeCache.get(routeName);

    const md = new MarkdownString();
    md.appendMarkdown(`**Route:** \`${routeName}\`\n\n`);

    if (!route) {
      md.appendMarkdown(`⚠️ Route not found`);
      return new Hover(md);
    }

    md.appendMarkdown(`**URL:** \`${route.methods.join("|")} /${route.uri}\`\n\n`);

    if (route.action && route.action !== "Closure") {
      md.appendMarkdown(`**Action:** \`${route.action}\`\n\n`);
    } else {
      md.appendMarkdown(`**Action:** Closure\n\n`);
    }

    if (route.middleware.length > 0) {
      md.appendMarkdown(`**Middleware:** ${route.middleware.map((m) => `\`${m}\``).join(", ")}\n\n`);
    }

    if (route.file) {
      const relativePath = route.file.replace(/.*\/(app|routes)\//, "$1/");
      md.appendMarkdown(`**File:** \`${relativePath}:${route.line}\`\n\n`);
    }

    // Show example usage
    md.appendMarkdown("---\n\n");
    md.appendMarkdown("**Usage:**\n");
    md.appendCodeblock(`route('${routeName}')`, "php");

    return new Hover(md);
  }

  /**
   * Show config value and file location
   */
  private async getConfigHover(configKey: string): Promise<Hover | null> {
    const parts = configKey.split(".");
    if (parts.length === 0) {
      return null;
    }

    const fileName = parts[0];
    const fullPath = path(`config/${fileName}.php`);

    const md = new MarkdownString();
    md.appendMarkdown(`**Config:** \`${configKey}\`\n\n`);

    if (!fs.existsSync(fullPath)) {
      md.appendMarkdown(`⚠️ Config file not found: \`config/${fileName}.php\``);
      return new Hover(md);
    }

    md.appendMarkdown(`**File:** \`config/${fileName}.php\`\n\n`);

    // Try to extract the actual value (simple parsing)
    if (parts.length > 1) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const keyToFind = parts[parts.length - 1];

        // Simple regex to find the value
        const patterns = [
          new RegExp(`['"]${keyToFind}['"]\\s*=>\\s*(.+?)(?:,|$)`, "m"),
          new RegExp(`['"]${keyToFind}['"]\\s*=>\\s*\\[`, "m"),
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            let value = match[1]?.trim() || "[array]";
            // Clean up the value
            value = value.replace(/,\s*$/, "");
            md.appendMarkdown(`**Value:** \`${value}\`\n\n`);
            break;
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }

    md.appendMarkdown("---\n\n");
    md.appendMarkdown("**Usage:**\n");
    md.appendCodeblock(`config('${configKey}')`, "php");

    return new Hover(md);
  }

  /**
   * Show translation value
   */
  private async getTranslationHover(translationKey: string): Promise<Hover | null> {
    const parts = translationKey.split(".");

    const md = new MarkdownString();
    md.appendMarkdown(`**Translation:** \`${translationKey}\`\n\n`);

    // Try to find and show the translation value
    if (parts.length === 1) {
      // JSON translation
      const jsonPath = path("resources/lang/en.json");
      if (fs.existsSync(jsonPath)) {
        try {
          const content = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
          if (content[translationKey]) {
            md.appendMarkdown(`**Value:** ${content[translationKey]}\n\n`);
          }
        } catch {
          // Ignore parsing errors
        }
      }
    } else {
      // PHP translation
      const fileName = parts[0];
      const keyToFind = parts.slice(1).join(".");

      const langPaths = [
        `resources/lang/en/${fileName}.php`,
        `lang/en/${fileName}.php`,
      ];

      for (const langPath of langPaths) {
        const fullPath = path(langPath);
        if (fs.existsSync(fullPath)) {
          md.appendMarkdown(`**File:** \`${langPath}\`\n\n`);
          break;
        }
      }
    }

    md.appendMarkdown("---\n\n");
    md.appendMarkdown("**Usage:**\n");
    md.appendCodeblock(`__('${translationKey}')`, "php");

    return new Hover(md);
  }

  /**
   * Show model attributes and relationships
   */
  private async getModelHover(modelClass: string): Promise<Hover | null> {
    const modelInfo = await getModelDetails(modelClass);

    const shortName = modelClass.split("\\").pop() || modelClass;
    const md = new MarkdownString();
    md.appendMarkdown(`**Model:** \`${shortName}\`\n\n`);
    md.appendMarkdown(`**Class:** \`${modelClass}\`\n\n`);

    if (!modelInfo) {
      return new Hover(md);
    }

    if (modelInfo.attributes.length > 0) {
      md.appendMarkdown("**Attributes:**\n");
      const attrList = modelInfo.attributes.slice(0, 15).map((a) => `\`${a}\``).join(", ");
      md.appendMarkdown(attrList);
      if (modelInfo.attributes.length > 15) {
        md.appendMarkdown(` ... and ${modelInfo.attributes.length - 15} more`);
      }
      md.appendMarkdown("\n\n");
    }

    if (modelInfo.relationships.length > 0) {
      md.appendMarkdown("**Relationships:**\n");
      for (const rel of modelInfo.relationships.slice(0, 10)) {
        const relatedShort = rel.related?.split("\\").pop() || "?";
        md.appendMarkdown(`- \`${rel.name}()\` → ${rel.type} → \`${relatedShort}\`\n`);
      }
      md.appendMarkdown("\n");
    }

    return new Hover(md);
  }
}
