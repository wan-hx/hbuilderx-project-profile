const fs = require('fs');
const os = require('os');
const path = require('path');
const hx = require('hbuilderx');
let profileList = require('./config.json');

/**
 * @description 获取用户自定义模板
 */
class UserCustom {

    // 遍历目录
    static walkDir(TemplateDir) {
        let customList = [];
        fs.readdirSync(TemplateDir).forEach(function(name) {
            let filePath = path.join(TemplateDir, name);
            let stat = fs.statSync(filePath);
            if (stat.isFile()) {
                customList.push({
                    "label": name,
                    "fname": name,
                    "fpath": filePath,
                    "source": "user",
                    "description": "我的模板"
                });
            };
        });
        return customList;
    };

    // 获取用户自定义模板
    static async get() {
        let config = await hx.workspace.getConfiguration();
        let TemplateDir = config.get("pt.CustomTemplatePath");

        if (TemplateDir == undefined) return;
        if ((TemplateDir.trim()).length < 2) return 'error';

        try {
            let stat = fs.statSync(TemplateDir);
            if (stat.isDirectory()) {
                let templateList = this.walkDir(TemplateDir);
                if (templateList.length == 0) return 'error';
                return templateList;
            };
            return 'error';
        } catch (e) {
            console.log(e);
            return 'error';
        };
    };
};


class Profile {
    constructor(param) {
        this.profileList = profileList;
        this.param = param;
        this.projectInfo = {};
    };

    /**
     * @description 获取选择的目录
     */
    async getSelectedDirName() {
        if (this.param == null) {
            hx.window.showErrorMessage('提示：项目管理器没有选择目录，或编辑器不存在打开的文件。', ['我知道了']);
            return null;
        };

        try {
            let { document } = this.param;
            if (document == undefined) {
                this.projectInfo.projectName = this.param.workspaceFolder.name;
                this.projectInfo.projectPath = this.param.workspaceFolder.uri.fsPath;
            } else {
                let { workspaceFolder } = document;
                if (workspaceFolder == undefined) {
                    hx.window.showErrorMessage('提示：无法获取到项目路径。<br/>备注：仅支持对`项目管理器`中的项目进行操作。', ['我知道了']);
                    return null;
                };
                this.projectInfo.projectName = this.param.document.workspaceFolder.name;
                this.projectInfo.projectPath = this.param.document.workspaceFolder.uri.fsPath;
            };
        } catch (e) {
            return null;
        };

        let {projectName,projectPath} = this.projectInfo;
        return projectName == undefined || projectPath == undefined ? null : this.projectInfo;
    };

    /**
     * @description 复制文件
     * @param {Object} template_path
     * @param {Object} target_path
     * @param {Object} cfgfilename
     */
    cofyfile(template_path, target_path, cfgfilename) {
        fs.copyFile(template_path, target_path, (err) => {
            if (err) {
                console.log(err)
                hx.window.showErrorMessage(cfgfilename + '创建失败!');
            } else {
                hx.window.setStatusBarMessage(`${cfgfilename} 文件创建成功。`);
                hx.workspace.openTextDocument(target_path);
            };
        });
    };

    /**
     * @description 编辑配置文件
     * @param {Object} filename
     */
    async handleFile(selectedResult) {
        let { projectName, projectPath } = this.projectInfo;
        let { fname, source, fpath } = selectedResult;

        let target_path = path.join(projectPath, fname);
        let template_path;

        if (source == 'user' && fpath) {
            template_path = fpath;
        } else {
            let tmp = fname.substr(0, 1) == '.' ? fname.slice('1') : fname;
            template_path = path.join(__dirname, 'template', tmp);
            if (fname.includes("License")) {
                template_path = path.join(__dirname, 'template', fname);
                target_path = path.join(projectPath, "License");
            };
        };

        let fileStatus = fs.existsSync(target_path);
        if (fileStatus == true) {
            let msg = `【${projectName}】下已存在文件 【${fname}】，请选择接下来的操作？`;
            let btn = await hx.window.showInformationMessage(msg, ['覆盖', '打开', '关闭']).then((btn) => {
                return btn;
            });
            if (btn == '打开') {
                hx.workspace.openTextDocument(target_path);
            };
            if (btn == '覆盖') {
                // fs.unlinkSync(target_path);
                this.cofyfile(template_path, target_path, fname);
            };
            return;
        };
        this.cofyfile(template_path, target_path, fname);
    };

    async main() {
        let data = [];

        // 默认模板
        let isSelected = await this.getSelectedDirName();
        if (isSelected == null) return;

        // 自定义模板
        let customTemplateList = await UserCustom.get();
        if (customTemplateList != undefined && customTemplateList != 'error') {
            data = [...this.profileList, ...customTemplateList];
        } else {
            data = [...this.profileList];
        };

        const PickResult = hx.window.showQuickPick(data, {
            placeHolder: "请选择您要操作的配置文件"
        });

        let selected = await PickResult.then(function(result) {
            return result;
        });
        if (selected) {
            this.handleFile(selected);
        };
    };

};

module.exports = Profile;
