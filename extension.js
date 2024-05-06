const vscode = require('vscode');
const path = require('path');
const { exec } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('praxis-ide-vscode-community.parseFile', function () {
		readCurrentFile();
	});

	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('praxis-ide-vscode-community.openPreview', function () {
		let livePreview = vscode.extensions.getExtension('ms-vscode.live-server')
		if (livePreview) {
			vscode.commands.executeCommand('livePreview.start.preview.atFileString', 'node_modules/praxis-ide-saviorand/index.html');
		} else {
			vscode.window.showInformationMessage('Live Preview extension not found!');
		}
	});

	context.subscriptions.push(disposable2);

	let disposableRun = vscode.commands.registerCommand('praxis-ide-vscode-community.startPreviewServer', function () {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace is opened.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath; // Get the root of the first workspace folder
        const nodeCommand = 'node';
        const scriptPath = path.join(workspaceRoot, 'node_modules/praxis-ide-saviorand/app.js');
        const command = `${nodeCommand} "${scriptPath}"`;

        serverProcess = exec(command, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Failed to run script: ${error.message}`);
                return;
            }
            if (stderr) {
                vscode.window.showErrorMessage(`Script execution error: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage(`Script output: ${stdout}`);
        });

        vscode.window.showInformationMessage('Server started.');
    });

    let disposableStop = vscode.commands.registerCommand('praxis-ide-vscode-community.stopPreviewServer', function () {
        if (serverProcess) {
            serverProcess.kill();
            vscode.window.showInformationMessage('Server stopped.');
        } else {
            vscode.window.showErrorMessage('Server is not running.');
        }
    });

    context.subscriptions.push(disposableRun, disposableStop);

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

        // Check if the file has a .pl extension
        const fileExtension = path.extname(document.fileName);
        if (fileExtension === '.pl') {
            if (vscode.workspace.workspaceFolders) {
                const workspaceFolder = vscode.workspace.workspaceFolders[0];
                const filePath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, '.vscode/praxis/tmp.pl'));

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
            console.log('The open file does not have a .pl extension, not writing to tmp.pl');
        }
    } else {
        vscode.window.showInformationMessage('No active editor!');
    }
}

// This method is called when your extension is deactivated
function deactivate() {
	if (serverProcess) {
        serverProcess.kill();
    }
}

module.exports = {
	activate,
	deactivate
}
