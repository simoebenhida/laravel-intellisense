import * as vscode from "vscode";

type RuleCategory =
  | "required"
  | "type"
  | "format"
  | "size"
  | "comparison"
  | "database"
  | "date"
  | "file"
  | "array"
  | "other";

interface ValidationRule {
  rule: string;
  description: string;
  category: RuleCategory;
  example?: string;
}

// Category metadata for sorting and display
const CATEGORY_INFO: Record<RuleCategory, { order: string; label: string }> = {
  required: { order: "1", label: "Required" },
  type: { order: "2", label: "Type" },
  format: { order: "3", label: "Format" },
  size: { order: "4", label: "Size" },
  comparison: { order: "5", label: "Comparison" },
  database: { order: "6", label: "Database" },
  date: { order: "7", label: "Date" },
  file: { order: "8", label: "File" },
  array: { order: "9", label: "Array" },
  other: { order: "a", label: "Other" },
};

// Laravel validation rules with categories
const VALIDATION_RULES: ValidationRule[] = [
  // Required rules
  { rule: "required", description: "Field must be present and not empty", category: "required" },
  { rule: "required_if:", description: "Required if another field equals value", category: "required", example: "required_if:field,value" },
  { rule: "required_unless:", description: "Required unless another field equals value", category: "required", example: "required_unless:field,value" },
  { rule: "required_with:", description: "Required if any of the fields are present", category: "required", example: "required_with:foo,bar" },
  { rule: "required_with_all:", description: "Required if all fields are present", category: "required", example: "required_with_all:foo,bar" },
  { rule: "required_without:", description: "Required if any of the fields are not present", category: "required", example: "required_without:foo,bar" },
  { rule: "required_without_all:", description: "Required if all fields are not present", category: "required", example: "required_without_all:foo,bar" },
  { rule: "required_array_keys:", description: "Array must contain specified keys", category: "required", example: "required_array_keys:foo,bar" },
  { rule: "present", description: "Field must be present (can be empty)", category: "required" },
  { rule: "filled", description: "Field must not be empty when present", category: "required" },
  { rule: "nullable", description: "Field can be null", category: "required" },
  { rule: "sometimes", description: "Only validate if field is present", category: "required" },

  // Type rules
  { rule: "string", description: "Field must be a string", category: "type" },
  { rule: "integer", description: "Field must be an integer", category: "type" },
  { rule: "numeric", description: "Field must be numeric", category: "type" },
  { rule: "boolean", description: "Field must be boolean (true, false, 1, 0)", category: "type" },
  { rule: "array", description: "Field must be an array", category: "type" },
  { rule: "json", description: "Field must be a valid JSON string", category: "type" },
  { rule: "file", description: "Field must be a file upload", category: "type" },
  { rule: "image", description: "Field must be an image (jpg, png, gif, etc)", category: "type" },
  { rule: "date", description: "Field must be a valid date", category: "type" },
  { rule: "list", description: "Field must be a list (0-indexed array)", category: "type" },

  // Format rules
  { rule: "email", description: "Field must be a valid email address", category: "format" },
  { rule: "url", description: "Field must be a valid URL", category: "format" },
  { rule: "active_url", description: "Field must be a URL with valid DNS", category: "format" },
  { rule: "ip", description: "Field must be a valid IP address", category: "format" },
  { rule: "ipv4", description: "Field must be a valid IPv4 address", category: "format" },
  { rule: "ipv6", description: "Field must be a valid IPv6 address", category: "format" },
  { rule: "mac_address", description: "Field must be a valid MAC address", category: "format" },
  { rule: "uuid", description: "Field must be a valid UUID", category: "format" },
  { rule: "ulid", description: "Field must be a valid ULID", category: "format" },
  { rule: "alpha", description: "Field must contain only letters", category: "format" },
  { rule: "alpha_dash", description: "Letters, numbers, dashes, underscores", category: "format" },
  { rule: "alpha_num", description: "Field must contain only letters and numbers", category: "format" },
  { rule: "ascii", description: "Field must contain only ASCII characters", category: "format" },
  { rule: "regex:", description: "Field must match the regex pattern", category: "format", example: "regex:/^[a-z]+$/" },
  { rule: "not_regex:", description: "Field must not match the regex", category: "format", example: "not_regex:/^[0-9]+$/" },
  { rule: "lowercase", description: "Field must be lowercase", category: "format" },
  { rule: "uppercase", description: "Field must be uppercase", category: "format" },
  { rule: "hex_color", description: "Field must be a valid hex color", category: "format" },

  // Size rules
  { rule: "min:", description: "Minimum value/length/size", category: "size", example: "min:3" },
  { rule: "max:", description: "Maximum value/length/size", category: "size", example: "max:255" },
  { rule: "size:", description: "Exact value/length/size", category: "size", example: "size:10" },
  { rule: "between:", description: "Value must be between min and max", category: "size", example: "between:1,100" },
  { rule: "digits:", description: "Must have exact number of digits", category: "size", example: "digits:5" },
  { rule: "digits_between:", description: "Digits must be between min and max", category: "size", example: "digits_between:3,5" },
  { rule: "max_digits:", description: "Maximum number of digits", category: "size", example: "max_digits:10" },
  { rule: "min_digits:", description: "Minimum number of digits", category: "size", example: "min_digits:3" },
  { rule: "decimal:", description: "Must have specified decimal places", category: "size", example: "decimal:2" },

  // Comparison rules
  { rule: "gt:", description: "Greater than another field", category: "comparison", example: "gt:min_value" },
  { rule: "gte:", description: "Greater than or equal to field", category: "comparison", example: "gte:min_value" },
  { rule: "lt:", description: "Less than another field", category: "comparison", example: "lt:max_value" },
  { rule: "lte:", description: "Less than or equal to field", category: "comparison", example: "lte:max_value" },
  { rule: "same:", description: "Field must match another field", category: "comparison", example: "same:password" },
  { rule: "different:", description: "Field must differ from another field", category: "comparison", example: "different:old_email" },
  { rule: "confirmed", description: "Must have matching {field}_confirmation", category: "comparison" },
  { rule: "in:", description: "Field must be in list of values", category: "comparison", example: "in:foo,bar,baz" },
  { rule: "not_in:", description: "Field must not be in list", category: "comparison", example: "not_in:foo,bar" },
  { rule: "in_array:", description: "Must exist in another array field", category: "comparison", example: "in_array:other_field.*" },
  { rule: "starts_with:", description: "Field must start with value", category: "comparison", example: "starts_with:hello" },
  { rule: "doesnt_start_with:", description: "Field must not start with value", category: "comparison", example: "doesnt_start_with:test" },
  { rule: "ends_with:", description: "Field must end with value", category: "comparison", example: "ends_with:.com" },
  { rule: "doesnt_end_with:", description: "Field must not end with value", category: "comparison", example: "doesnt_end_with:.exe" },
  { rule: "contains:", description: "Field must contain value", category: "comparison", example: "contains:@" },
  { rule: "doesnt_contain:", description: "Field must not contain value", category: "comparison", example: "doesnt_contain:spam" },
  { rule: "multiple_of:", description: "Field must be multiple of value", category: "comparison", example: "multiple_of:5" },

  // Database rules
  { rule: "exists:", description: "Value must exist in database", category: "database", example: "exists:users,id" },
  { rule: "unique:", description: "Value must be unique in database", category: "database", example: "unique:users,email" },

  // Date rules
  { rule: "date_format:", description: "Date must match format", category: "date", example: "date_format:Y-m-d" },
  { rule: "date_equals:", description: "Date must equal specified date", category: "date", example: "date_equals:2024-01-01" },
  { rule: "after:", description: "Date must be after date/field", category: "date", example: "after:start_date" },
  { rule: "after_or_equal:", description: "Date must be after or equal", category: "date", example: "after_or_equal:today" },
  { rule: "before:", description: "Date must be before date/field", category: "date", example: "before:end_date" },
  { rule: "before_or_equal:", description: "Date must be before or equal", category: "date", example: "before_or_equal:today" },
  { rule: "timezone", description: "Field must be a valid timezone", category: "date" },

  // File rules
  { rule: "mimes:", description: "File must have specified mime type", category: "file", example: "mimes:pdf,doc,docx" },
  { rule: "mimetypes:", description: "File must have specified mime type", category: "file", example: "mimetypes:video/mp4" },
  { rule: "extensions:", description: "File must have specified extension", category: "file", example: "extensions:jpg,png" },
  { rule: "dimensions:", description: "Image dimension constraints", category: "file", example: "dimensions:min_width=100" },

  // Array rules
  { rule: "distinct", description: "Array must not have duplicates", category: "array" },
  { rule: "distinct:strict", description: "No duplicates (strict comparison)", category: "array" },

  // Other rules
  { rule: "accepted", description: "Must be yes, on, 1, or true", category: "other" },
  { rule: "accepted_if:", description: "Must be accepted if condition", category: "other", example: "accepted_if:terms,true" },
  { rule: "declined", description: "Must be no, off, 0, or false", category: "other" },
  { rule: "declined_if:", description: "Must be declined if condition", category: "other", example: "declined_if:newsletter,false" },
  { rule: "prohibited", description: "Field must be empty/not present", category: "other" },
  { rule: "prohibited_if:", description: "Prohibited if condition", category: "other", example: "prohibited_if:role,guest" },
  { rule: "prohibited_unless:", description: "Prohibited unless condition", category: "other", example: "prohibited_unless:role,admin" },
  { rule: "exclude", description: "Exclude from validated data", category: "other" },
  { rule: "exclude_if:", description: "Exclude if condition", category: "other", example: "exclude_if:type,guest" },
  { rule: "exclude_unless:", description: "Exclude unless condition", category: "other", example: "exclude_unless:type,admin" },
  { rule: "exclude_with:", description: "Exclude if other field present", category: "other", example: "exclude_with:other_field" },
  { rule: "exclude_without:", description: "Exclude if other field absent", category: "other", example: "exclude_without:required_field" },
  { rule: "bail", description: "Stop validation on first failure", category: "other" },
  { rule: "current_password", description: "Must match user's password", category: "other" },
  { rule: "password", description: "Must meet password requirements", category: "other" },
  { rule: "enum:", description: "Must be valid enum value", category: "other", example: "enum:App\\Enums\\Status" },
];

export default class ValidationItemProvider implements vscode.Disposable {
  private completionItems: vscode.CompletionItem[] = [];

  constructor() {
    this.buildCompletionItems();
  }

  dispose(): void {
    this.completionItems = [];
  }

  private buildCompletionItems(): void {
    this.completionItems = VALIDATION_RULES.map(
      ({ rule, description, category, example }) => {
        const categoryInfo = CATEGORY_INFO[category];

        // Use label object for better display
        const item = new vscode.CompletionItem(
          {
            label: rule,
            description: categoryInfo.label,
          },
          vscode.CompletionItemKind.EnumMember
        );

        // Sort by category then rule name
        item.sortText = `${categoryInfo.order}_${rule}`;

        // Filter text for searching
        item.filterText = rule;

        // Build rich markdown documentation
        const docs = new vscode.MarkdownString();
        docs.appendMarkdown(`**${rule}**\n\n`);
        docs.appendMarkdown(`${description}\n\n`);
        if (example) {
          docs.appendMarkdown(`---\n`);
          docs.appendCodeblock(example, "php");
        }
        docs.isTrusted = true;
        item.documentation = docs;

        // Short detail shown inline
        item.detail = description;

        // If rule ends with :, it needs a parameter - use snippet
        if (rule.endsWith(":")) {
          item.insertText = new vscode.SnippetString(rule + "${1}");
        }

        return item;
      }
    );
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    if (!this.isValidationContext(document, position)) {
      return [];
    }

    return this.completionItems;
  }

  private isValidationContext(
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    // Get text from start of document to cursor
    const textBeforeCursor = document.getText(
      new vscode.Range(new vscode.Position(0, 0), position)
    );

    // Get the current line
    const lineText = document.lineAt(position.line).text;
    const textBeforePosition = lineText.substring(0, position.character);

    // Check if we're inside a string (single or double quotes)
    const inString = this.isInsideString(textBeforePosition);
    if (!inString) {
      return false;
    }

    // Look for validation patterns in recent context (last 50 lines or so)
    const startLine = Math.max(0, position.line - 50);
    const contextText = document.getText(
      new vscode.Range(new vscode.Position(startLine, 0), position)
    );

    // Patterns that indicate validation context
    const validationPatterns = [
      /->validate\s*\(\s*\[/,
      /Validator::make\s*\([^,]+,\s*\[/,
      /\$rules\s*=\s*\[/,
      /public\s+function\s+rules\s*\(\s*\).*\[/s,
      /'rules'\s*=>\s*\[/,
      /"rules"\s*=>\s*\[/,
      /Rule::forEach/,
    ];

    const hasValidationContext = validationPatterns.some((pattern) =>
      pattern.test(contextText)
    );

    if (!hasValidationContext) {
      return false;
    }

    // Check if cursor is after => or after |
    // Valid: 'field' => 'required|
    // Valid: 'field' => '
    const ruleValuePattern = /=>\s*['"][^'"]*$/;
    const afterPipePattern = /\|[^|'"]*$/;

    return (
      ruleValuePattern.test(textBeforePosition) ||
      afterPipePattern.test(textBeforePosition)
    );
  }

  private isInsideString(text: string): boolean {
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prevChar = i > 0 ? text[i - 1] : "";

      if (char === "'" && prevChar !== "\\" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && prevChar !== "\\" && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      }
    }

    return inSingleQuote || inDoubleQuote;
  }
}
