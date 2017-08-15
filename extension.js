// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "cpppp" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand('extension.addHeaderGuard', addHeaderGuard));
    context.subscriptions.push(vscode.commands.registerCommand('extension.genGet', genGetSet(['get'])));
    context.subscriptions.push(vscode.commands.registerCommand('extension.genSet', genGetSet(['set'])));
    context.subscriptions.push(vscode.commands.registerCommand('extension.genGetAndSet', genGetSet(['get', 'set'])));

}


function addHeaderGuard() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    let headerPath = editor.document.fileName;
    if (!headerPath.endsWith('.h')) {
        vscode.window.showInformationMessage('Not a cpp header file.');
        return;
    }
    const relativePath = vscode.workspace.asRelativePath(headerPath);
    const guard = relativePath.toUpperCase().replace(/[^\w]/g, '_');
    const startGuard = [
        '#ifndef ', guard, '\n',
        '#define ', guard, '\n',
        '\n', '\n', '\n'
    ].join('');
    const endGuard = [
        '\n',
        '#endif ', '// ', guard
    ].join('');
    const startPosition = new vscode.Position(0, 0),
        endPosition = new vscode.Position(editor.document.lineCount, 0);
    editor.edit(function (editBuilder) {
        editBuilder.insert(startPosition, startGuard);
        editBuilder.insert(endPosition, endGuard);
    })
}

function parseLine(line_) {
    let line = line_.trim()
    if (line.startsWith('//')) {
        return null;
    }
    let index = 0;
    let code = {}
    let brackets = 0
    while (index < line.length) {
        if (line[index] === ' ') {
            if (brackets === 0) {
                code.type = line.substring(0, index).replace(/\s/g, '');
                break;
            } else {
                // pass
            }
        } else if (line[index] === '<') {
            brackets++;
        } else if (line[index] === '>') {
            brackets--;
        } else {
            // pass
        }
        index++;
    }
    if (index  === line.length) {
        return null;
    }
    line = line.substring(index).trimLeft()
    index = 0;
    while (index < line.length) {
        if (line[index] === ';') {
            code.var = line.substring(0, index).replace(/\s/g, '');
            if (code.var && (code.var[0] === '*' || code.var[0] === '&')) {
                // pointer or reference
                code.type += code.var[0];
                code.var = code.var.substring(1);
            }
            break;
        } else {
            // pass
        }
        index++;
    }
    if (index != line.length) {
        code.comment = line.substring(index).trimLeft();
    }
    code.varLite = code.var.substring(0, code.var.length - 1)
    return code;
}

const PRIMARY_TYPE = [
    'bool',
    'double', 'float',
    'int', 'uint', 'int32_t', 'uint32_t', 'int64_t', 'uint64_t',
]

function isPrimaryType(varType) {
    return PRIMARY_TYPE.indexOf(varType) !== -1;
}

function genSet(variable, primaryType) {
    if (primaryType === undefined) {
        primaryType = isPrimaryType(variable.type);
    }
    let code;
    if (primaryType) {
        code = [
            'void set_', variable.varLite, '(', variable.type, ' ', variable.varLite, ')',
            ' { ', variable.var, ' = ', variable.varLite, '; }',
        ]
    } else {
        code = [
            'void set_', variable.varLite, '(const ', variable.type, ' &', variable.varLite, ')',
            ' { ', variable.var, ' = ', variable.varLite, '; }',
        ]
    }
    return code.join('');
}

function genGet(variable, primaryType) {
    if (primaryType === undefined) {
        primaryType = isPrimaryType(variable.type);
    }
    if (primaryType) {
        return [
            variable.type, ' ', variable.varLite, '() const ',
            '{ return ', variable.var, '; }',
        ].join('');
    } else {
        return [
            [
                variable.type, '& ', variable.varLite, '() const ',
                '{ return ', variable.var, '; }',
            ],
            [
                'const ', variable.type, '& ', variable.varLite, '() const ',
                '{ return ', variable.var, '; }',
            ]].map(function (code) {
                return code.join('');
            }).join('\n');
    }
}

function genGetSet(props) {
    return function () {
        let editor = vscode.window.activeTextEditor;
        let selection = editor.selection;
        if (!selection) {
            vscode.window.showInformationMessage('No variables selected.');
            return;
        }
        let codes = [
            '',
            '// getters and setters',
        ];
        for (let index = selection.start.line; index <= selection.end.line; index++) {
            let line = editor.document.lineAt(index).text;
            let variable = parseLine(line);
            if (!variable) {
                continue;
            }
            let code = '// ' + variable.var;
            let primaryType = isPrimaryType(variable.type);
            if (props.indexOf('get') >= 0) {
                code += '\n' + genGet(variable, primaryType)
            }
            if (props.indexOf('set') >= 0) {
                code += '\n' + genSet(variable, primaryType)
            }
            codes.push(code);
        }
        codes.push('')
        const content = codes.join('\n\n');
        const insertPosition = new vscode.Position(selection.end.line + 1, 0);
        editor.edit(function(editBuilder) {
            editBuilder.insert(insertPosition, content);
        })
    }
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;