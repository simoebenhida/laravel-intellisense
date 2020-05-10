import { TextDocument, Position } from "vscode";
import { isUndefined, isNull } from "util";

export default class ClassParser {
  document: TextDocument;

  position: Position;

  tokens: Array<any>;

  constructor(document: TextDocument, position: Position) {
    this.document = document;

    this.position = position;

    this.tokens = this.retrieveTokensFromDocumentText();
  }

  getClass() {
    const classNameToken = this.getClassNameToken();

    console.log(classNameToken);
    // this.getNameSpaceFromClassNameToken();
  }

  getNameSpaceFromClassNameToken() {
    const classNameToken = this.getClassNameToken();

    if (! classNameToken.length) {
        return null;
    }

    const usedClass = this.getUseClasses().find(namespace => {
        const splitNamespace = namespace.split('\\');

        const classNameFromNamespace = splitNamespace[splitNamespace.length - 1];

        return classNameFromNamespace === classNameToken[1];
    });
  }

  getUseClasses() {
    let uses = [];

    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i][0] === "T_USE") {
        let use = [];
        for (let j = i + 1; j < this.tokens.length; j++) {
          if (this.tokens[j] === ";") {
            break;
          }

          use.push(this.tokens[j]);
        }

        uses.push(
          use
            .map((use) => {
              return use[1];
            })
            .join("")
            .trim()
        );
      }
    }

    return uses;
  }

  getClassNameToken() {
    const classNameTokenFromEquality = this.getClassNameTokenFromEquality();

    if (classNameTokenFromEquality.length) {
      return classNameTokenFromEquality;
    }

    const classNameTokenFromDependencyInjection = this.getClassNameTokenFromDependencyInjection();

    return classNameTokenFromDependencyInjection;
  }

  getCurrentLineTokens() {
    return this.tokens
      .filter((token: Array<any>) => {
        return token[2] === this.position.line + 1;
      })
      .reverse();
  }

  getAliasTokenIndex() {
    return this.getCurrentLineTokens().findIndex((token: Array<any>) => {
      return token[1].includes(["where"]);
    });
  }

  getUsedVariableToken() {
    const aliasTokenIndex = this.getAliasTokenIndex();

    return this.tokens.find((token: Array<any>, index: number) => {
      return token[0] === "T_VARIABLE" && index > aliasTokenIndex;
    });
  }

  getUsedVariableFirstIndex() {
    const usedVariable = this.getUsedVariableToken();

    return this.tokens.findIndex((token: Array<any>) => {
      return token[1] === usedVariable[1] && token[0] === "T_VARIABLE";
    });
  }

  getClassNameTokenFromEquality() {
    let classNameToken: Array<any> = [];

    let equalityIndex = null;

    const variableFirstIndex = this.getUsedVariableFirstIndex();

    const tokens = this.tokens.slice(variableFirstIndex + 1);

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === "=") {
        equalityIndex = i;

        break;
      }

      if (tokens[i][0] !== "T_WHITESPACE") {
        equalityIndex = null;

        break;
      }
    }

    if (isNull(equalityIndex)) {
      return classNameToken;
    }

    const tokensWithEquality = tokens.slice(equalityIndex + 1);

    for (let i = 0; i < tokensWithEquality.length; i++) {
      if (tokensWithEquality[i][0] === "T_STRING") {
        classNameToken = tokensWithEquality[i];

        break;
      }

      if (tokensWithEquality[i][0] !== "T_WHITESPACE") {
        classNameToken = [];

        break;
      }
    }

    return classNameToken;
  }

  getClassNameTokenFromDependencyInjection() {
    let classNameToken: Array<any> = [];

    const variableFirstIndex = this.getUsedVariableFirstIndex();

    const tokens = this.tokens.slice(0, variableFirstIndex).reverse();

    for (const token of tokens) {
      if (token[0] === "T_STRING") {
        classNameToken = token;

        break;
      }

      if (token[0] !== "T_WHITESPACE") {
        classNameToken = [];

        break;
      }
    }

    return classNameToken;
  }

  retrieveTokensFromDocumentText(): Array<any> {
    const engine = require("php-parser");

    const parser = new engine({
      parser: {
        extractDoc: true,
        php7: true,
      },
      ast: {
        withPositions: true,
      },
    });

    return parser.tokenGetAll(this.document.getText());
  }
}
