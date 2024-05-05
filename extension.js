// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "praxis-ide-vscode-community" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('praxis-ide-vscode-community.parseFile', function () {
		readCurrentFile();
	});

	context.subscriptions.push(disposable);

	// Registering a listener for text document changes
    let changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document === vscode.window.activeTextEditor?.document) {
            readCurrentFile();  // Call the function to read the file contents
        }
    });

    context.subscriptions.push(changeDisposable);
}


function readCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const content = document.getText();

        if (vscode.workspace.workspaceFolders) {
            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            const filePath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'tmp.pl'));

            const writeData = Buffer.from(content, 'utf8');

            vscode.workspace.fs.writeFile(filePath, writeData).then(() => {
                console.log('File successfully written to:', filePath.fsPath);
            }, (error) => {
                console.error('Failed to write file:', error);
            });
        } else {
            vscode.window.showInformationMessage('No workspace folder found!');
        }
    } else {
        vscode.window.showInformationMessage('No active editor!');
    }
}
// function readCurrentFile() {
//     const editor = vscode.window.activeTextEditor;
//     if (editor) {
//         const document = editor.document;
//         const content = document.getText();
//         // console.log(text);  // Log the content to the debug console
// 		const filePath = path.join(vscode.workspace.workspaceFolders[0].uri, 'tmp.pl');
// 		fs.writeFileSync(filePath, content, 'utf8');
// 		console.log('File written to: ' + filePath);
//     } else {
//         vscode.window.showInformationMessage('No active editor!');
//     }
// }

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
