const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

// 模板目录
const template_dir = path.join(path.resolve(__dirname), "template");

// 用于from窗口模板展示
let template_data = require('./config.json');
var template_file_list = [
    {"columns":[{"label": "空白文件" }, {"label": "空白文件" }]},
    {"columns":[{"label": "README.md" }, {"label": "README.md" }]}
];
for (let s of Object.values(template_data)) {
    let t = { "columns":[ {"label": s["label"] }, {"label": s["desc"] } ] };
    template_file_list.push(t);
};

/**
 * @description from视图内容项
 * @param {String} selectedDir
 */
function getFormItems(selectedDir="", templateID=0) {
    let filename = "";
    if (templateID != 0) {
        try{
            filename = template_file_list[templateID]["columns"][1]["label"];
            if (filename.includes("License")) {
                filename = "LICENSE"
            };
        }catch(e){};
    };
    return {
        title: "新建模板文件",
        formItems: [{
            "type": "input",
            "name": "filename",
            "placeholder": "文件名",
            "value": filename
        }, {
            "type": "fileSelectInput",
            "name": "createDir",
            "placeholder": "创建目录",
            "value": selectedDir
        }, {
            "type": "list",
            "title": "选择模板",
            "name": "template",
            "items": template_file_list,
            "multiSelection": false,
            "value": templateID,
            "searchable": true,
            "searchColumns":[1,2],
            "columnStretches": [1, 2]
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
 * @description 写入文件并打开
 * @param {String} fpath
 * @param {String} filecontent
 * @param {Boolean} isOpen
 */
async function FileWriteAndOpen(fpath, filecontent, isOpen=true){
    fs.writeFile(fpath, filecontent, function (err) {
       if (err) throw err;
       if (isOpen) {
           hx.workspace.openTextDocument(fpath);
       };
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
        onChanged: function(field, value) {
            console.log(field, value)
            if (field == "template") {
                let updateData = getFormItems(selectedDir, value);
                this.updateForm(updateData);
            };
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

        // 目标文件路径
        let target_path = path.join(createDir, filename);

        if (["README.md","空白文件"].includes(fileID)) {
            await FileWriteAndOpen(target_path, "", true);
        } else {
            let source_path = path.join(template_dir, selectedItem);
            await copyFile(source_path, target_path, true);
        };
    }catch(e){
        hx.window.showErrorMessage(`${filename} 创建失败!`, ["我知道了"]);
    };
};

module.exports = templateSelected;
