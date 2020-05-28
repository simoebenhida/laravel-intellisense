import { WorkspaceFolder, workspace, Position } from "vscode";

export default class Existence {
  getFactoryAliasToken(tokens: Array<any>, position: Position) {
    console.log(tokens);
    // T_VARIABLE - $factory
    // T_OBJECT_OPERATOR - ->
    // T_STRING - define

    for (let i = 0; i < tokens.length; i++) {
      // if (tokens[i][0] === 'T_VARIABLE' && )
    }
  }
}
