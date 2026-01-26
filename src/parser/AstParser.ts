import { Position } from "vscode";
import { getDefaultModelNamespace } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require("php-parser");

// AST Node types from php-parser
interface AstNode {
  kind: string;
  loc?: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  [key: string]: unknown;
}

interface CallNode extends AstNode {
  kind: "call";
  what: AstNode;
  arguments: AstNode[];
}

interface StaticLookupNode extends AstNode {
  kind: "staticlookup";
  what: { kind: string; name: string };
  offset: { kind: string; name: string };
}

interface PropertyLookupNode extends AstNode {
  kind: "propertylookup";
  what: AstNode;
  offset: { kind: string; name: string };
}

interface UseItem {
  kind: "useitem";
  name: string;
  alias: string | null;
}

interface AssignNode extends AstNode {
  kind: "assign";
  left: { kind: string; name: string };
  right: AstNode;
}

export interface ModelContext {
  className: string | null;
  methodName: string | null;
  argumentIndex: number;
}

export default class AstParser {
  private parser: ReturnType<typeof engine>;
  private ast: AstNode | null = null;
  private useStatements: Map<string, string> = new Map();
  private variableTypes: Map<string, string> = new Map();

  // Query methods that indicate we're working with a model
  private queryMethods = [
    "where",
    "orWhere",
    "whereIn",
    "whereNotIn",
    "whereBetween",
    "whereNull",
    "whereNotNull",
    "whereDate",
    "whereMonth",
    "whereDay",
    "whereYear",
    "whereTime",
    "whereColumn",
    "whereRaw",
    "get",
    "first",
    "firstWhere",
    "firstOrFail",
    "find",
    "findOrFail",
    "value",
    "pluck",
    "latest",
    "oldest",
    "orderBy",
    "groupBy",
    "having",
    "skip",
    "take",
    "limit",
    "offset",
    "select",
    "addSelect",
    "distinct",
    "join",
    "leftJoin",
    "rightJoin",
    "crossJoin",
    "increment",
    "decrement",
    "update",
    "delete",
    "create",
    "insert",
    "updateOrCreate",
    "firstOrCreate",
    "qualifyColumn",
  ];

  constructor() {
    this.parser = new engine({
      parser: { extractDoc: true, php7: true, suppressErrors: true },
      ast: { withPositions: true },
    });
  }

  /**
   * Parse the document and find the model context at the given position
   */
  getModelContext(code: string, position: Position): ModelContext | null {
    try {
      this.ast = this.parser.parseCode(code);
      this.extractUseStatements(this.ast);
      this.extractVariableAssignments(this.ast);

      // Convert position to offset for easier comparison
      const lines = code.split("\n");
      let offset = 0;
      for (let i = 0; i < position.line; i++) {
        offset += lines[i].length + 1; // +1 for newline
      }
      offset += position.character;

      // Find the call node that contains the cursor
      const callNode = this.findCallAtPosition(this.ast, offset);
      if (!callNode) {
        return null;
      }

      // Check if the method is a query method
      const methodName = this.getMethodName(callNode);
      if (!methodName || !this.queryMethods.includes(methodName)) {
        return null;
      }

      // Find which argument we're in
      const argumentIndex = this.findArgumentIndex(callNode, offset);

      // Get the class name
      const className = this.resolveClassName(callNode);

      return {
        className,
        methodName,
        argumentIndex,
      };
    } catch {
      // Parse error - return null
      return null;
    }
  }

  /**
   * Extract use statements for namespace resolution
   */
  private extractUseStatements(node: AstNode | null): void {
    if (!node) {return;}

    if (node.kind === "usegroup") {
      const items = node.items as UseItem[];
      for (const item of items) {
        const name = item.name;
        const alias = item.alias || name.split("\\").pop() || name;
        this.useStatements.set(alias, name);
      }
    }

    // Recursively process children
    for (const key of Object.keys(node)) {
      if (key === "loc") {continue;}
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && typeof c === "object") {
            this.extractUseStatements(c as AstNode);
          }
        }
      } else if (child && typeof child === "object") {
        this.extractUseStatements(child as AstNode);
      }
    }
  }

  /**
   * Extract variable assignments to track model types
   * e.g., $user = User::query() means $user is of type User
   */
  private extractVariableAssignments(node: AstNode | null): void {
    if (!node) {return;}

    if (node.kind === "assign") {
      const assign = node as AssignNode;
      if (assign.left?.kind === "variable") {
        const varName = assign.left.name;
        const className = this.getClassFromExpression(assign.right);
        if (className) {
          this.variableTypes.set(varName, className);
        }
      }
    }

    // Recursively process children
    for (const key of Object.keys(node)) {
      if (key === "loc") {continue;}
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && typeof c === "object") {
            this.extractVariableAssignments(c as AstNode);
          }
        }
      } else if (child && typeof child === "object") {
        this.extractVariableAssignments(child as AstNode);
      }
    }
  }

  /**
   * Get the class name from an expression like User::query() or new User()
   */
  private getClassFromExpression(node: AstNode): string | null {
    if (!node) {return null;}

    // User::query() or User::where()
    if (node.kind === "call") {
      const call = node as CallNode;
      if (call.what?.kind === "staticlookup") {
        const lookup = call.what as unknown as StaticLookupNode;
        if (lookup.what?.kind === "name") {
          return lookup.what.name;
        }
      }
    }

    // new User()
    if (node.kind === "new") {
      const what = (node as { what?: { kind: string; name: string } }).what;
      if (what?.kind === "name") {
        return what.name;
      }
    }

    return null;
  }

  /**
   * Find the call node that contains the given offset
   */
  private findCallAtPosition(
    node: AstNode | null,
    offset: number
  ): CallNode | null {
    if (!node) {return null;}

    // Check if this is a call node that contains the offset
    if (node.kind === "call" && node.loc) {
      const start = node.loc.start.offset;
      const end = node.loc.end.offset;
      if (offset >= start && offset <= end) {
        // Check children first for more specific match
        const childCall = this.findCallInChildren(node, offset);
        if (childCall) {
          return childCall;
        }
        return node as CallNode;
      }
    }

    // Recursively search children
    return this.findCallInChildren(node, offset);
  }

  private findCallInChildren(node: AstNode, offset: number): CallNode | null {
    for (const key of Object.keys(node)) {
      if (key === "loc") {continue;}
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && typeof c === "object") {
            const result = this.findCallAtPosition(c as AstNode, offset);
            if (result) {return result;}
          }
        }
      } else if (child && typeof child === "object") {
        const result = this.findCallAtPosition(child as AstNode, offset);
        if (result) {return result;}
      }
    }
    return null;
  }

  /**
   * Get the method name from a call node
   */
  private getMethodName(call: CallNode): string | null {
    const what = call.what;

    // User::where() - static lookup
    if (what?.kind === "staticlookup") {
      const lookup = what as unknown as StaticLookupNode;
      return lookup.offset?.name || null;
    }

    // $user->where() - property lookup
    if (what?.kind === "propertylookup") {
      const lookup = what as unknown as PropertyLookupNode;
      return lookup.offset?.name || null;
    }

    return null;
  }

  /**
   * Find which argument index the cursor is in (0-based)
   */
  private findArgumentIndex(call: CallNode, offset: number): number {
    const args = call.arguments || [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.loc && offset >= arg.loc.start.offset && offset <= arg.loc.end.offset) {
        return i;
      }
    }
    // If not inside any argument, assume we're typing a new one
    return args.length;
  }

  /**
   * Resolve the fully qualified class name from a call node
   */
  private resolveClassName(call: CallNode): string | null {
    const what = call.what;

    // User::where() - static lookup
    if (what?.kind === "staticlookup") {
      const lookup = what as unknown as StaticLookupNode;
      if (lookup.what?.kind === "name") {
        const shortName = lookup.what.name;
        return this.resolveFullClassName(shortName);
      }
    }

    // $user->where() - need to look up variable type
    if (what?.kind === "propertylookup") {
      const lookup = what as unknown as PropertyLookupNode;
      // Handle chained calls like $user->where()->get()
      let current: AstNode = lookup.what;
      while (current?.kind === "call") {
        const innerCall = current as CallNode;
        if (innerCall.what?.kind === "propertylookup") {
          current = (innerCall.what as unknown as PropertyLookupNode).what;
        } else if (innerCall.what?.kind === "staticlookup") {
          const staticLookup = innerCall.what as unknown as StaticLookupNode;
          if (staticLookup.what?.kind === "name") {
            return this.resolveFullClassName(staticLookup.what.name);
          }
          break;
        } else {
          break;
        }
      }

      // If we ended up at a variable, look up its type
      if (current?.kind === "variable") {
        const varName = (current as unknown as { name: string }).name;
        const className = this.variableTypes.get(varName);
        if (className) {
          return this.resolveFullClassName(className);
        }
      }
    }

    return null;
  }

  /**
   * Resolve a short class name to its full namespace
   */
  private resolveFullClassName(shortName: string): string {
    // Check if it's already a fully qualified name
    if (shortName.includes("\\")) {
      return shortName;
    }

    // Check use statements
    const fullName = this.useStatements.get(shortName);
    if (fullName) {
      return fullName;
    }

    // Fall back to default model namespace
    const defaultNamespace = getDefaultModelNamespace();
    if (defaultNamespace) {
      return defaultNamespace + shortName;
    }

    return shortName;
  }

  /**
   * Check if we're in a Resource class (for $this->field autocomplete)
   */
  getResourceContext(code: string, position: Position): string | null {
    try {
      this.ast = this.parser.parseCode(code);

      // Find the class declaration
      const classNode = this.findClassNode(this.ast);
      if (!classNode) {return null;}

      const className = (classNode as { name?: { name: string } }).name?.name;
      if (!className?.endsWith("Resource")) {return null;}

      // Check if cursor is in toArray method returning $this->field
      const lines = code.split("\n");
      let offset = 0;
      for (let i = 0; i < position.line; i++) {
        offset += lines[i].length + 1;
      }
      offset += position.character;

      // Simple check: are we after "$this->" on this line?
      const line = lines[position.line];
      const beforeCursor = line.substring(0, position.character);
      if (beforeCursor.includes("$this->")) {
        // Return the model name (Resource suffix removed)
        const modelName = className.replace("Resource", "");
        return this.resolveFullClassName(modelName);
      }

      return null;
    } catch {
      return null;
    }
  }

  private findClassNode(node: AstNode | null): AstNode | null {
    if (!node) {return null;}

    if (node.kind === "class") {
      return node;
    }

    for (const key of Object.keys(node)) {
      if (key === "loc") {continue;}
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && typeof c === "object") {
            const result = this.findClassNode(c as AstNode);
            if (result) {return result;}
          }
        }
      } else if (child && typeof child === "object") {
        const result = this.findClassNode(child as AstNode);
        if (result) {return result;}
      }
    }
    return null;
  }
}
