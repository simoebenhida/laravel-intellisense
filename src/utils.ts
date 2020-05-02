import { WorkspaceFolder, workspace } from 'vscode';

export function activeWorkspace(): any {
    if (!(workspace.workspaceFolders instanceof Array)) {
        return;
    }

    if (workspace.workspaceFolders.length === 0) {
        return;
    }

    return workspace.workspaceFolders[0];
}

export function path(path: string): string {
    let workspace = activeWorkspace();

    if ('uri' in workspace) {
        return workspace.uri.path + '/' + path;
    }

    return "";
}
