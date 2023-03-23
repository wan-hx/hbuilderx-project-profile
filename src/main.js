const fs = require("fs");
const os = require("os");
const path = require("path");
const hx = require("hbuilderx");

const {
    copy,
    compress,
    decompress,
    unicodeToChinese,
    jsUglifyjs,
    goToUrlEncode,
    goToUrlDecode
} = require('./utils.js');

const templateSelected = require("./template.js")

/**
 * @description 获取项目管理器的信息
 * @param {Object} param
 * @return {Object}
 *   - projectName 项目名称
 *   - projectPath 项目路径
 *   - selectedPath 选择的路径
 *   - selectedType dir|file
 */
function getSelectInfo(param) {
    var data = {
        "projectName": "",
        "projectPath": "",
        "selectedPath": "",
        "selectedType": "",
        "focusPosition": "",
        "selection": ""
    };
    return new Promise((resolve, reject) => {
        try{
            let {metaType} = param;
            if (metaType == "TextEditor") {
                let document = param.document;
                if ("workspaceFolder" in document) {
                    data.projectPath = param.document.workspaceFolder.uri.fsPath;
                    data.projectName = param.document.workspaceFolder.name;
                };
                data.selectedPath = param.document.uri.fsPath;
                data.focusPosition = "editor";
                data.selection = param.selection;
            } else {
                data.projectPath = param.workspaceFolder.uri.fsPath;
                data.projectName = param.workspaceFolder.name;
                data.selectedPath = param.fsPath;
                data.focusPosition = "projectExplorer"
            };
            if (fs.existsSync(data.selectedPath)) {
                let stats = fs.statSync(data.selectedPath);
                if (stats.isFile()) {
                    data.selectedType = "file";
                };
                if (stats.isDirectory()) {
                    data.selectedType = "dir";
                };
            };
            resolve(data);
        }catch(e){
            hx.window.setStatusBarMessage("错误：获取路径失败", 5000, "error");
            reject('error');
        };
    });
};

/**
 * @description 主入口
 * @param {Object} param
 */
async function main(param, action) {
    if (param == null) {
        return;
    };
    let selectInfo = await getSelectInfo(param);
    if (selectInfo == 'error') return;
    let {selectedPath, projectPath, selectedType} = selectInfo;

    switch (action){
        case "template":
            templateSelected(selectInfo);
            break;
        case "copy":
            copy(selectInfo)
            break;
        case "copyRelative":
            copy(selectInfo, "Relative")
            break;
        case "decompress":
            decompress(selectInfo);
            break;
        case "compress":
            compress(selectInfo);
            break;
        case "unicodeToChinese":
            unicodeToChinese(selectInfo);
            break;
        case "jsCompressed":
            jsUglifyjs(selectInfo, "Compressed");
            break;
        case "jsMangle":
            jsUglifyjs(selectInfo, "mangle");
            break;
        case "UrlEncode":
            goToUrlEncode();
            break;
        case "UrlDecode":
            goToUrlDecode();
            break;
        default:
            break;
    }
};

module.exports = main;
