import { TextDocument, Position, Range } from "vscode";

export type ContextType = "view" | "route" | "config" | "translation" | "model" | null;

export interface DetectedContext {
  type: ContextType;
  value: string;
  range: Range;
}

/**
 * Detects Laravel context at a given position in a document
 * Used by DefinitionProvider and HoverProvider
 */
export default class ContextDetector {
  private static patterns: { type: ContextType; regex: RegExp }[] = [
    // Views: view('name'), View::make('name'), @extends('name'), @include('name'), etc.
    {
      type: "view",
      regex: /(?:view|View::make|@extends|@include|@component|@each|@section)\s*\(\s*['"]([^'"]+)['"]/g,
    },
    // Routes: route('name'), Route::has('name'), URL::route('name')
    {
      type: "route",
      regex: /(?:route|Route::has|URL::route)\s*\(\s*['"]([^'"]+)['"]/g,
    },
    // Config: config('key'), Config::get('key')
    {
      type: "config",
      regex: /(?:config|Config::get)\s*\(\s*['"]([^'"]+)['"]/g,
    },
    // Translations: __('key'), trans('key'), @lang('key'), trans_choice('key')
    {
      type: "translation",
      regex: /(?:__|trans|trans_choice|@lang)\s*\(\s*['"]([^'"]+)['"]/g,
    },
  ];

  /**
   * Detect the Laravel context at the given position
   */
  static detect(document: TextDocument, position: Position): DetectedContext | null {
    const line = document.lineAt(position.line).text;
    const lineStart = document.offsetAt(position.with(position.line, 0));

    for (const { type, regex } of this.patterns) {
      // Reset regex state
      regex.lastIndex = 0;

      let match;
      while ((match = regex.exec(line)) !== null) {
        const valueStart = match.index + match[0].lastIndexOf(match[1]);
        const valueEnd = valueStart + match[1].length;

        // Check if position is within the value
        if (position.character >= valueStart && position.character <= valueEnd) {
          const startPos = position.with(position.line, valueStart);
          const endPos = position.with(position.line, valueEnd);

          return {
            type,
            value: match[1],
            range: new Range(startPos, endPos),
          };
        }
      }
    }

    return null;
  }

  /**
   * Get the word/string at position (for cases not covered by patterns)
   */
  static getStringAtPosition(document: TextDocument, position: Position): string | null {
    const line = document.lineAt(position.line).text;

    // Find string boundaries (single or double quotes)
    let start = position.character;
    let end = position.character;
    let quoteChar: string | null = null;

    // Search backwards for opening quote
    while (start > 0) {
      const char = line[start - 1];
      if (char === "'" || char === '"') {
        quoteChar = char;
        break;
      }
      if (char === "(" || char === "," || char === " ") {
        break;
      }
      start--;
    }

    if (!quoteChar) {
      return null;
    }

    // Search forwards for closing quote
    while (end < line.length) {
      if (line[end] === quoteChar) {
        break;
      }
      end++;
    }

    return line.substring(start, end);
  }
}
