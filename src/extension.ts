import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let imageFilenames: { [key: string]: string[] } = {};
let imageDirectory: string = '';

export function activate(context: vscode.ExtensionContext) {
    imageDirectory = path.join(context.extensionPath, 'images');
    loadImageFilenames(imageDirectory);

    const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file', language: '*' }, {
        provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position);
            if (!range) return;

            const word = document.getText(range);

            const lineText = document.lineAt(position.line).text;
            if (isInComment(lineText, position.character)) {
                if (imageFilenames.hasOwnProperty(word)) {
                    const extensions = imageFilenames[word];

                    if (extensions.length > 0) {
                        const imageUri = vscode.Uri.joinPath(context.extensionUri, 'images', `${word}.${extensions[0]}`);
                        
                        const markdown = new vscode.MarkdownString(`![${word}](${imageUri})`);
                        return new vscode.Hover(markdown);
                    }
                }
            }
        }
    });

    context.subscriptions.push(hoverProvider);

    const startCommand = vscode.commands.registerCommand('7tv-comments.start', () => {
        vscode.window.showInformationMessage('7TV Comments started :pepelaugh:');
    });

    context.subscriptions.push(startCommand);
}

function isInComment(line: string, character: number): boolean {
    const commentPatterns = [
        /\/\/.*/,   // JavaScript, C#, Java, Javascript, Typescript, something else idk
        /#.*$/,     // Python
        /--.*/      // SQL, anyone else hate this language? mainly oracle :thumbsupemoji:
    ];

    return commentPatterns.some(pattern => pattern.test(line));
}

function loadImageFilenames(directory: string) {
    imageFilenames = {};
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) {
            const filenameWithoutExt = path.basename(file, ext);

            if (!imageFilenames[filenameWithoutExt]) {
                imageFilenames[filenameWithoutExt] = [];
            }
            imageFilenames[filenameWithoutExt].push(ext.slice(1));
        }
    });
}

export function deactivate() {}
