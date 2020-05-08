import * as vscode from "vscode";
import * as fs from "fs";
import { path } from "../utils";
import { IDE_HELPER_CONTENT } from "./content/ide_helper";

export default class LaravelIdeHelper {
  static content: any = [];

  static workspaceEdit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();

  static generate() {
    if (this.exists()) {
      return;
    }

    const Uri = this.getFileUri();

    this.workspaceEdit.createFile(Uri, { ignoreIfExists: true });

    vscode.workspace.applyEdit(this.workspaceEdit).then(() => {
      this.InsertContent(Uri);
    });
  }

  static exists() {
    return fs.existsSync(this.getIdeHelperPath());
  }

  static InsertContent(Uri: vscode.Uri) {
    const startOfFile = new vscode.Position(0, 0);

    this.workspaceEdit.insert(Uri, startOfFile, IDE_HELPER_CONTENT);

    vscode.workspace.applyEdit(this.workspaceEdit).then((response) => {
      vscode.window.showInformationMessage("Ide helper file was created!");
    });

    vscode.workspace.openTextDocument(Uri).then((document) => {
      document.save();
    });

    // check if exists on .gitignore else add it to .gitignore
  }

  static getFileUri() {
    return vscode.Uri.file(this.getIdeHelperPath());
  }

  static getIdeHelperPath() {
    return path("_ide_helper.php");
  }
}
