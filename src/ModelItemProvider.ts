import * as vscode from "vscode";
import { getModelDetails, ModelInfo, RelationshipInfo } from "./php/modelDetails";
import Parser from "./parser/index";

interface ModelCache {
  [key: string]: ModelInfo;
}

export default class ModelItemProvider implements vscode.Disposable {
  private modelCache: ModelCache = {};

  private model: string | null = "";

  dispose(): void {
    this.modelCache = {};
    this.model = null;
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    this.model = new Parser(document, position).getClassName();

    if (this.model === null) {
      return items;
    }

    if (!Object.prototype.hasOwnProperty.call(this.modelCache, this.model)) {
      await this.syncModel();
    }

    if (this.model === null || !this.modelCache[this.model]) {
      return items;
    }

    const modelInfo = this.modelCache[this.model];
    const modelShortName = this.model.split("\\").pop() || this.model;

    // Add attribute completions
    for (const attribute of modelInfo.attributes) {
      const item = new vscode.CompletionItem(
        {
          label: attribute,
          description: "column",
        },
        vscode.CompletionItemKind.Field
      );

      item.detail = `${modelShortName}::${attribute}`;

      const docs = new vscode.MarkdownString();
      docs.appendMarkdown(`**${attribute}**\n\n`);
      docs.appendMarkdown(`Database column from \`${modelShortName}\` model\n\n`);
      docs.appendCodeblock(`$${modelShortName.toLowerCase()}->${attribute}`, "php");
      item.documentation = docs;

      // Sort attributes before relationships
      item.sortText = `0_${attribute}`;

      item.range = document.getWordRangeAtPosition(
        position,
        /[\w\d\-_\.\:\\\/]+/g
      );

      items.push(item);
    }

    // Add relationship completions
    for (const relationship of modelInfo.relationships) {
      const item = this.createRelationshipItem(relationship, modelShortName);
      item.range = document.getWordRangeAtPosition(
        position,
        /[\w\d\-_\.\:\\\/]+/g
      );
      items.push(item);
    }

    return items;
  }

  private createRelationshipItem(
    relationship: RelationshipInfo,
    modelShortName: string
  ): vscode.CompletionItem {
    const relatedShortName = relationship.related?.split("\\").pop() || "Model";

    const item = new vscode.CompletionItem(
      {
        label: relationship.name,
        description: relationship.type,
      },
      vscode.CompletionItemKind.Method
    );

    item.detail = `${modelShortName}::${relationship.name}() → ${relatedShortName}`;

    // Insert with () for method calls
    item.insertText = new vscode.SnippetString(`${relationship.name}()`);

    const docs = new vscode.MarkdownString();
    docs.appendMarkdown(`**${relationship.name}()**\n\n`);
    docs.appendMarkdown(`**Type:** ${relationship.type}\n\n`);
    docs.appendMarkdown(`**Related Model:** \`${relationship.related || "Unknown"}\`\n\n`);

    // Show relationship-specific examples
    switch (relationship.type) {
      case "HasMany":
      case "BelongsToMany":
      case "MorphMany":
      case "HasManyThrough":
        docs.appendMarkdown("**Usage:**\n");
        docs.appendCodeblock(
          `// Get all related ${relatedShortName}s\n` +
          `$${modelShortName.toLowerCase()}->${relationship.name}\n\n` +
          `// Query the relationship\n` +
          `$${modelShortName.toLowerCase()}->${relationship.name}()->where('...')->get()`,
          "php"
        );
        break;
      case "HasOne":
      case "BelongsTo":
      case "MorphOne":
      case "HasOneThrough":
        docs.appendMarkdown("**Usage:**\n");
        docs.appendCodeblock(
          `// Get the related ${relatedShortName}\n` +
          `$${modelShortName.toLowerCase()}->${relationship.name}\n\n` +
          `// Associate a new ${relatedShortName}\n` +
          `$${modelShortName.toLowerCase()}->${relationship.name}()->associate($${relatedShortName.toLowerCase()})`,
          "php"
        );
        break;
      default:
        docs.appendCodeblock(
          `$${modelShortName.toLowerCase()}->${relationship.name}()`,
          "php"
        );
    }

    item.documentation = docs;

    // Sort relationships after attributes
    item.sortText = `1_${relationship.name}`;

    return item;
  }

  async syncModel(): Promise<void> {
    if (this.model === null) {
      return;
    }

    const modelInfo = await getModelDetails(this.model);

    if (modelInfo) {
      this.modelCache[this.model] = modelInfo;
    }
  }
}
