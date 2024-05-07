const vscode = require('vscode');
const path = require('path');
const { exec } = require('child_process');

let isFileLocked = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let parseFile = vscode.commands.registerCommand('praxis-ide-vscode-community.parseFile', function () {
		readCurrentFile();
	});

	context.subscriptions.push(parseFile);

	let openPreview = vscode.commands.registerCommand('praxis-ide-vscode-community.openPreview', function () {
		let livePreview = vscode.extensions.getExtension('ms-vscode.live-server')
		if (livePreview) {
			vscode.commands.executeCommand('livePreview.start.preview.atFileString', 'node_modules/praxis-ide-saviorand/index.html');
		} else {
			vscode.window.showInformationMessage('Live Preview extension not found!');
		}
	});

	context.subscriptions.push(openPreview);

	let startPreviewServer = vscode.commands.registerCommand('praxis-ide-vscode-community.startPreviewServer', function () {
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

    let stopPreviewServer = vscode.commands.registerCommand('praxis-ide-vscode-community.stopPreviewServer', function () {
        if (serverProcess) {
            serverProcess.kill();
            vscode.window.showInformationMessage('Server stopped.');
        } else {
            vscode.window.showErrorMessage('Server is not running.');
        }
    });

    context.subscriptions.push(startPreviewServer, stopPreviewServer);

    // let watchForEditorChanges = vscode.workspace.onDidChangeTextDocument((event) => {
    //     if (event.document === vscode.window.activeTextEditor?.document) {
    //         readCurrentFile();
    //     }
    // });

    // context.subscriptions.push(watchForEditorChanges);

    // const workspaceFolder = vscode.workspace.workspaceFolders[0];
    // const tmpFilePath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, '.vscode/praxis/tmp.pl'));
    // const watchForStorageChanges = vscode.workspace.createFileSystemWatcher(tmpFilePath.fsPath);
    
    // watchForStorageChanges.onDidChange(uri => updateOpenFileFromTmp(uri));
    // context.subscriptions.push(watchForStorageChanges);
    let watchForEditorChanges = vscode.workspace.onDidChangeTextDocument(debounce((event) => {
        if (event.document === vscode.window.activeTextEditor?.document) {
            readCurrentFile();
        }
    }, 300));

    context.subscriptions.push(watchForEditorChanges);

    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const tmpFilePath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, '.vscode/praxis/tmp.pl'));
    const watchForStorageChanges = vscode.workspace.createFileSystemWatcher(tmpFilePath.fsPath);

    watchForStorageChanges.onDidChange(uri => {
        if (!isFileLocked) {
            updateOpenFileFromAllEditors(uri);
        }
    });

    context.subscriptions.push(watchForStorageChanges);
}


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function readCurrentFile() {
    if (isFileLocked) return;
    isFileLocked = true;

    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const content = document.getText();

        const fileExtension = path.extname(document.fileName);
        if (fileExtension === '.pl') {
            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            const filePath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, '.vscode/praxis/tmp.pl'));

            vscode.workspace.fs.readFile(filePath).then(existingContent => {
                if (Buffer.from(content, 'utf8').compare(existingContent) !== 0) {
                    const writeData = Buffer.from(content, 'utf8');

                    vscode.workspace.fs.writeFile(filePath, writeData).then(() => {
                        console.log('File successfully written to:', filePath.fsPath);
                    }, (error) => {
                        console.error('Failed to write file:', error);
                    }).finally(() => {
                        isFileLocked = false;
                    });
                } else {
                    isFileLocked = false;
                }
            });
        } else {
            console.log('The open file does not have a .pl extension, not writing to tmp.pl');
            isFileLocked = false;
        }
    } else {
        vscode.window.showInformationMessage('No active editor!');
        isFileLocked = false;
    }
}


function updateOpenFileFromAllEditors(tmpUri) {
    console.log('Detected change in tmp.pl');
    if (isFileLocked) {
        console.log('File is locked, skipping update');
        return;
    }
    isFileLocked = true;

    vscode.window.visibleTextEditors.forEach(editor => {
        if (editor.document.fileName.endsWith('.pl')) {
            vscode.workspace.fs.readFile(tmpUri).then(fileContent => {
                const text = fileContent.toString();
                const editorDocument = editor.document;

                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    editorDocument.lineAt(0).range.start,
                    editorDocument.lineAt(editorDocument.lineCount - 1).range.end
                );

                edit.replace(editorDocument.uri, fullRange, text);
                vscode.workspace.applyEdit(edit).then(() => {
                    console.log('Update applied to document:', editorDocument.uri.path);
                }, err => {
                    console.error('Failed to apply edit:', err);
                }).finally(() => {
                    isFileLocked = false;
                });
            }, err => {
                console.error('Failed to read file:', err);
                isFileLocked = false;
            });
        }
    });
}

// function updateOpenFileFromTmp(tmpUri) {
//     if (isFileLocked) return;
//     isFileLocked = true;

//     const editor = vscode.window.activeTextEditor;
//     if (editor && editor.document.fileName.endsWith('.pl')) {
//         vscode.workspace.fs.readFile(tmpUri).then(fileContent => {
//             const text = fileContent.toString();
//             const editorDocument = editor.document;

//             const edit = new vscode.WorkspaceEdit();
//             const fullRange = new vscode.Range(
//                 editorDocument.lineAt(0).range.start,
//                 editorDocument.lineAt(editorDocument.lineCount - 1).range.end
//             );

//             edit.replace(editorDocument.uri, fullRange, text);
//             vscode.workspace.applyEdit(edit).finally(() => {
//                 isFileLocked = false;
//             });
//         });
//     }
// }

// function readCurrentFile() {
//     const editor = vscode.window.activeTextEditor;
//     if (editor) {
//         const document = editor.document;
//         const content = document.getText();

//         // Check if the file has a .pl extension
//         const fileExtension = path.extname(document.fileName);
//         if (fileExtension === '.pl') {
//             if (vscode.workspace.workspaceFolders) {
//                 const workspaceFolder = vscode.workspace.workspaceFolders[0];
//                 const filePath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, '.vscode/praxis/tmp.pl'));

//                 const writeData = Buffer.from(content, 'utf8');

//                 vscode.workspace.fs.writeFile(filePath, writeData).then(() => {
//                     console.log('File successfully written to:', filePath.fsPath);
//                 }, (error) => {
//                     console.error('Failed to write file:', error);
//                 });
//             } else {
//                 vscode.window.showInformationMessage('No workspace folder found!');
//             }
//         } else {
//             console.log('The open file does not have a .pl extension, not writing to tmp.pl');
//         }
//     } else {
//         vscode.window.showInformationMessage('No active editor!');
//     }
// }


// function updateOpenFileFromTmp(tmpUri) {
//     const editor = vscode.window.activeTextEditor;
//     if (editor && editor.document.fileName.endsWith('.pl')) {
//         vscode.workspace.fs.readFile(tmpUri).then(fileContent => {
//             const text = fileContent.toString();
//             const editorDocument = editor.document;

//             // Use a workspace edit to replace the content of the open document
//             const edit = new vscode.WorkspaceEdit();
//             const fullRange = new vscode.Range(
//                 editorDocument.lineAt(0).range.start,
//                 editorDocument.lineAt(editorDocument.lineCount - 1).range.end
//             );
//             edit.replace(editorDocument.uri, fullRange, text);
//             vscode.workspace.applyEdit(edit);
//         });
//     }
// }

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
