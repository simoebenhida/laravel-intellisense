import { TextDocument, Position } from 'vscode';

export default class Parser {
    cachedParseFunction: any = null;

    viewAliases: Array<string> = [
        'View',
        'view',
        'markdown',
        'links',
        '@extends',
        '@component',
        '@include',
        '@each'
    ]

    classes: Array<string> = [
        'Config',
        'Route',
        'Lang',
        'Validator',
        'View'
    ];

    document: TextDocument;

    position: Position;

    constructor(document: TextDocument, position: Position) {
        this.document = document;

        this.position = position;
    }

    hasView() {
        return this.viewAliases.some((alias: string) => {
            const text = this.document.lineAt(this.position).text;

            return text.includes(alias);
        });
    }
}
