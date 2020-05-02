import * as vscode from 'vscode';

export function projectPath(path:string): string {
    console.log(vscode.workspace.workspaceFolders)
    if (path[0] !== '/') {
        path = '/' + path;
    }
    if (vscode.workspace.workspaceFolders instanceof Array && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath+path;
    }
    return "";
}
