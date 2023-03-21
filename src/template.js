const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

// 模板目录
const template_dir = path.join(path.resolve(__dirname), "template");

// 用于from窗口模板展示
var template_file_list = [
    {"columns":[{"label": "空白文件" }, {"label": "空白文件" }]}
];


/**
 * @description from视图内容项
 * @param {String} selectedDir
 */
function getFormItems(selectedDir="") {
    let template_data = require('./config.json');
    for (let s of Object.values(template_data)) {
        let t = {"columns":[{"label": s["label"] }, {"label": s["desc"] }]}
        template_file_list.push(t)
    }
    let templates = [...template_file_list];

    return {
        formItems: [{
            "type": "input",
            "name": "filename",
            "placeholder": "文件名",
            "value": ""
        }, {
            "type": "fileSelectInput",
            "name": "createDir",
            "placeholder": "创建目录",
            "value": selectedDir
        }, {
            "type": "list",
            "title": "选择模板",
            "name": "template",
            "columnStretches": [1, 2],
            "items": templates,
            "value": 0,
            "searchable": true,
            "searchColumns":[1,2]
        }]
    }
};

/**
 * @description 复制文件
 */
function copyFile(template_path, target_path, isOpenFile) {
    return new Promise((resolve, reject) => {
        fs.copyFile(template_path, target_path, (err) => {
            if (err) {
                hx.window.setStatusBarMessage('创建失败!');
                reject('fail');
            } else {
                if (isOpenFile) {
                    hx.workspace.openTextDocument(target_path);
                };
                hx.window.setStatusBarMessage('创建成功!');
                resolve('success');
            };
        });
    });
};

/**
 * @description 验证窗口输入项
 * @param {String} param
 */
function goValidate(formData, that) {
    let {createDir, filename} = formData;

    let target_path = path.join(createDir, filename);
    let isExist = fs.existsSync(target_path);
    if (isExist) {
        that.showError("当前选择的目录下，已存在此文件");
        return false;
    };

    let stat = fs.statSync(createDir);
    if (!stat.isDirectory()) {
        that.showError("请选择或输入正确的目录路径");
        return false;
    };
    return true;
};

/**
 * @description 创建模板程序
 * @param {*} param
 */
async function templateSelected(param) {
    let {selectedPath} = param;
    let selectedDir = "";
    if (selectedPath != undefined) {
        let stat = fs.statSync(selectedPath);
        if (stat.isDirectory()) {
            selectedDir = selectedPath;
        };
        if (stat.isFile()) {
            selectedDir = path.dirname(selectedPath);
        };
    };

    let formInfo = await hx.window.showFormDialog({
        title: "新建模板文件",
        width: 640,
        height: 480,
        submitButtonText: "创建(&S)",
        cancelButtonText: "取消(&C)",
        validate: function(formData) {
            let checkResult = goValidate(formData, this);
            return checkResult;
        },
        ...getFormItems(selectedDir)
    }).then((res) => {
        return res;
    }).catch(error => {
        console.log(error);
    });
    if (formInfo == undefined) return;

    try{
        let {createDir, template, filename} = formInfo;
        let fileID = template_file_list[template]["columns"][0]["label"];
        let selectedItem = fileID.substr(0, 1) == '.' ? fileID.slice('1') : fileID;

        if (fileID == "空白文件") {

        } else {
            let source_path = path.join(template_dir, selectedItem);
            let target_path = path.join(createDir, filename);
            await copyFile(source_path, target_path, true);
        };
    }catch(e){
        hx.window.showErrorMessage(`${filename} 创建失败!`, ["我知道了"]);
    };
};

module.exports = templateSelected;
