// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "cpppp" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.sayHello', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        // vscode.window.showInformationMessage('Hello World!');
        // console.log(vscode.window.activeTextEditor.selections);
        let editor = vscode.window.activeTextEditor;
        for (var index = editor.selection.start.line; index < editor.selection.end.line; index++) {
            var element = editor.document.lineAt(index);
            console.log(index, element);
        }
        console.log(vscode.window.activeTextEditor.document.uri)
        console.log(vscode.window.activeTextEditor.document.fileName)
        let currentPath = vscode.window.activeTextEditor.document.uri;
        let relativePath = vscode.workspace.asRelativePath(currentPath);
        let guard = relativePath.toUpperCase().replace(/[\/\.]/g, '_');
        let startGuard = '#ifndef ' + guard + '\n#define ' + guard + '\n\n\n';
        let endGuard = '\n#endif // ' + guard;
        console.log(guard)
        let start = new vscode.Position(0, 0);
        let end = new vscode.Position(editor.document.lineCount, 0)
        vscode.window.activeTextEditor.edit(function(editBuilder) {
            editBuilder.insert(start, startGuard);
            editBuilder.insert(end, endGuard)
        })


    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;