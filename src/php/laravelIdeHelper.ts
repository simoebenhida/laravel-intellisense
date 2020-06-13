import * as vscode from "vscode";
import * as fs from "fs";
import { path } from "../utils";
import { IDE_HELPER_CONTENT } from "./content/ide_helper";

export default class LaravelIdeHelper {
  static content: any = [];

  static workspaceEdit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();

  static fileName: string = "_ide_helper.php";

  static generate() {
    if (this.exists()) {
      return;
    }

    const Uri = this.getFileUri();

    this.workspaceEdit.createFile(Uri, { ignoreIfExists: true });

    vscode.workspace.applyEdit(this.workspaceEdit).then(() => {
      this.InsertContent(Uri);
    });

    this.insertToGitignore();
  }

  static exists() {
    return fs.existsSync(this.getIdeHelperPath());
  }

  static InsertContent(Uri: vscode.Uri) {
    const startOfFile = new vscode.Position(0, 0);

    this.workspaceEdit.insert(Uri, startOfFile, IDE_HELPER_CONTENT);

    vscode.workspace.applyEdit(this.workspaceEdit).then(() => {
      vscode.window.showInformationMessage("Ide helper file was created!");
    });

    vscode.workspace.openTextDocument(Uri).then((document) => {
      document.save();
    });
  }

  static insertToGitignore() {
    const Uri = this.getGitignoreUri();

    let lastLineIndex = 0;

    vscode.workspace.openTextDocument(Uri).then((document) => {
      if (document.getText().includes(this.fileName)) {
        return;
      }

      lastLineIndex = document.lineCount - 1;

      this.workspaceEdit.insert(
        Uri,
        new vscode.Position(lastLineIndex, 0),
        this.fileName
      );

      vscode.workspace.applyEdit(this.workspaceEdit).then(() => {
        document.save();
      });
    });
  }

  static getFileUri() {
    return vscode.Uri.file(this.getIdeHelperPath());
  }

  static getGitignoreUri() {
    return vscode.Uri.file(path(".gitignore"));
  }

  static getIdeHelperPath() {
    return path(this.fileName);
  }
}
