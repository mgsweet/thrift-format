import * as vscode from 'vscode';
import * as fs from 'fs';
import * as ferryParser from '@byte-ferry/parser';
import * as handler from './handler';

let thriftParser = require('thrift-parser');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Thrift Formatter is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('thriftfmt.fmt', () => {
		let thriftFilePath = vscode.window.activeTextEditor?.document.fileName;
		if (thriftFilePath === null || thriftFilePath === "") {
			vscode.window.showErrorMessage('format fail, no thrift file selected');
			return;
		}
		
		const thriftFileContent = fs.readFileSync(thriftFilePath!, 'utf8');

		let thriftContentArr = thriftFileContent.split("\n");
		
		let contentArr: string[] = new Array();

		// parse thrift
		const document = ferryParser.parse(thriftFileContent);

		let contentData = new handler.ContentData();

		document.body.forEach(item => {
			switch (item.type) {
				case ferryParser.SyntaxType.StructDefinition:
					let nodeData = new handler.NodeData()
					nodeData.ContentArr = handler.StructHandler(item)
					contentData.Structs.push(nodeData)
					break;
				case ferryParser.SyntaxType.NamespaceDefinition:
					let nodeDatan = new handler.NodeData()
					nodeDatan.ContentArr = handler.namespaceHandler(item)
					contentData.NameSpaces.push(nodeDatan)
					break
				case ferryParser.SyntaxType.EnumDefinition:
					let nodeDatae = new handler.NodeData()
					nodeDatae.ContentArr = handler.enumHandler(item)
					contentData.Enums.push(nodeDatae)
					break;
				case ferryParser.SyntaxType.IncludeDefinition:
					let nodeDataI = new handler.NodeData()
					nodeDataI.ContentArr = handler.includeHandler(item)
					contentData.Includes.push(nodeDataI)
					break
				case ferryParser.SyntaxType.ServiceDefinition:
					let nodeDataS = new handler.NodeData()
					nodeDataS.ContentArr = handler.ServiceHandler(item)
					contentData.Structs.push(nodeDataS)
					break;
				default:
					let others = new Array()
					for (let index = item.loc.start.line; index <= item.loc.end.line + 1; index++) {
						others.push(thriftContentArr[index - 1])
					}
					others.push("")
					let nodeDataO = new handler.NodeData()
					nodeDataO.ContentArr = others
					contentData.Others.push(nodeDataO)
			}
		})
		contentArr = concatAllData(contentData)
		console.log(contentArr)
		// 拼接所有的类型
		replace(0, vscode_1.window.activeTextEditor.document.lineCount + 1, contentArr.join("\n"))
	});

	context.subscriptions.push(disposable);
}

function concatAllData(data: handler.ContentData): string[] {
	let contentArr: string[] = new Array()
	data.NameSpaces.forEach(item => {
		contentArr = contentArr.concat(item.ContentArr)
	})
	contentArr.push("")
	data.Includes.forEach(item => {
		contentArr = contentArr.concat(item.ContentArr)
	})
	contentArr.push("")
	data.Enums.forEach(item => {
		contentArr = contentArr.concat(item.ContentArr)
	})
	contentArr.push("")
	data.Structs.forEach(item => {
		contentArr = contentArr.concat(item.ContentArr)
	})
	contentArr.push("")
	data.Services.forEach(item => {
		contentArr = contentArr.concat(item.ContentArr)
	})
	contentArr.push("")
	data.Others.forEach(item => {
		contentArr = contentArr.concat(item.ContentArr)
	})
	return contentArr
}


function replace(startLine: number, endLine: number, content: string) {
	if (startLine > 0) {
		startLine = startLine - 1
	}
	//核心代码
	vscode_1.window.activeTextEditor.edit((editBuilder: string) => {
		// 从开始到结束，全量替换
		const end = new vscode_1.Position(endLine, 0);
		editBuilder.replace(new vscode_1.Range(new vscode_1.Position(startLine, 0), end), content);
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }
