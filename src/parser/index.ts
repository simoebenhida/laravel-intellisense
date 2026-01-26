import { TextDocument, Position } from "vscode";
import { phpParserTokens } from "../utils";
import Handler from "./Handler";
import AstParser from "./AstParser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Token = Array<any> | string;

export default class Parser {
  private static astParser: AstParser | null = null;

  viewAliases: string[] = [
    "view",
    "markdown",
    "links",
    "@extends",
    "@component",
    "@include",
    "@each",
  ];

  configAliases: string[] = ["config", "Config::get"];

  routeAliases: string[] = ["route"];

  translateAliases: string[] = ["__", "trans", "trans_choice"];

  document: TextDocument;

  position: Position;

  tokens: Token[] = [];

  constructor(document: TextDocument, position: Position) {
    this.document = document;
    this.position = position;

    // Lazy initialize shared AST parser
    if (!Parser.astParser) {
      Parser.astParser = new AstParser();
    }
  }

  // Only parse tokens when needed (for non-model contexts)
  private ensureTokens(): void {
    if (this.tokens.length === 0) {
      this.tokens = phpParserTokens(this.document.getText());
    }
  }

  /**
   * Get the model class name using AST-based parsing
   * This handles: User::where(', $user->where(', Resource $this->
   */
  getClassName(): string | null {
    const code = this.document.getText();

    // Try AST-based model detection first
    const modelContext = Parser.astParser!.getModelContext(code, this.position);
    if (modelContext?.className) {
      return modelContext.className;
    }

    // Try Resource context ($this->field in Resource classes)
    const resourceClass = Parser.astParser!.getResourceContext(code, this.position);
    if (resourceClass) {
      return resourceClass;
    }

    return null;
  }

  hasConfig(): boolean {
    this.ensureTokens();
    const handler = new Handler(this.tokens, this.position, this.configAliases);
    return handler.hasAlias();
  }

  hasRoute(): boolean {
    this.ensureTokens();
    const handler = new Handler(this.tokens, this.position, this.routeAliases);
    return handler.hasAlias();
  }

  hasView(): boolean {
    this.ensureTokens();
    const handler = new Handler(this.tokens, this.position, this.viewAliases);
    return handler.hasAlias();
  }

  hasTranslation(): boolean {
    this.ensureTokens();
    const handler = new Handler(
      this.tokens,
      this.position,
      this.translateAliases
    );
    return handler.hasAlias();
  }
}
