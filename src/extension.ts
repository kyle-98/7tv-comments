import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let imageFilenames: { [key: string]: string[] } = {};
let imageDirectory: string = '';
let activeResources: vscode.Disposable[] = [];
let isEnabled = false;

export function activate(context: vscode.ExtensionContext) {

    const startCommand = vscode.commands.registerCommand('7tv-comments.start', () => {
        startExtension(context);
    });

    context.subscriptions.push(startCommand);

    const stopCommand = vscode.commands.registerCommand('7tv-comments.stop', () => {
        stopExtension();
    });
    context.subscriptions.push(stopCommand);

    startExtension(context);
}

export function deactivate() { stopExtension(); }



function isInComment(line: string): boolean {
    const commentPatterns = [
        /\/\/.*/,   // JavaScript, C#, Java, Javascript, Typescript, something else idk
        /#.*$/,     // Python
        /--.*/,      // SQL, anyone else hate this language? mainly oracle thumbsup
        /\/\*.*\*\//
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

function startExtension(context: vscode.ExtensionContext) {
    if(!isEnabled){
        imageDirectory = path.join(context.extensionPath, 'images');
        loadImageFilenames(imageDirectory);
    
        const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file', language: '*' }, {
            provideHover(document, position) {
                const range = document.getWordRangeAtPosition(position);
                if (!range) return;
    
                const word = document.getText(range).toLowerCase();
    
                const lineText = document.lineAt(position.line).text;
                if (isInComment(lineText)) {
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
        activeResources.push(hoverProvider);
        context.subscriptions.push(hoverProvider);
        vscode.window.showInformationMessage('7TV Comments started :pepelaugh:');
        isEnabled = true;
    }
    else {
        vscode.window.showErrorMessage('Failed to start 7TV Comments, extension already running');
    }
}

function stopExtension() {
    if(isEnabled){
        while (activeResources.length > 0) {
            const resource = activeResources.pop();
            resource?.dispose();
        }
        isEnabled = false;
        vscode.window.showInformationMessage('7TV Comments disabled :sadge:')
    }
    else {
        vscode.window.showErrorMessage('Failed to stop 7TV Comments, extension is not running')
    }
}
