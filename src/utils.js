const fs = require("fs");
const os = require("os");
const path = require("path");
const process = require("process");
const {
    spawn,
    exec
} = require('child_process');
const readline = require('readline');
const hx = require("hbuilderx");

const osName = os.platform();

const uglifyjs = path.join(path.resolve(__dirname, '..'), "node_modules/uglify-js/bin/uglifyjs");

// hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');

/**
 * @description 比较版本号
 * @param {Object} a
 * @param {Object} b
 */
function cmp_hx_version(a, b) {
    let i = 0;
    const arr1 = a.split('.');
    const arr2 = b.split('.');
    while (true) {
        const s1 = arr1[i];
        const s2 = arr2[i++];
        if (s1 === undefined || s2 === undefined) {
            return arr2.length - arr1.length;
        }
        if (s1 === s2) continue;
        return s2 - s1;
    }
};

/**
 * @description 对话框
 *     - 插件API: hx.window.showMessageBox
 *     - 已屏蔽esc事件，不支持esc关闭弹窗；因此弹窗上的x按钮，也无法点击。
 *     - 按钮组中必须提供`关闭`操作。且关闭按钮需要位于数组最后。
 * @param {String} title
 * @param {String} text
 * @param {String} buttons 按钮，必须大于1个
 * @return {String}
 */
function hxShowMessageBox(title, text, buttons = ['关闭']) {
    return new Promise((resolve, reject) => {
        if (buttons.length > 1 && (buttons.includes('关闭') || buttons.includes('取消'))) {
            if (osName == 'darwin') {
                buttons = buttons.reverse();
            };
        };
        hx.window.showMessageBox({
            type: 'info',
            title: title,
            text: text,
            buttons: buttons,
            defaultButton: 0,
            escapeButton: -100
        }).then(button => {
            resolve(button);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * @description 创建输出控制台
 * @param {String} channel_name
 * @param {String} msg
 * @param {msgLevel} msgLevel (warning | success | error | info), 控制文本颜色
 */
function createOutputChannel(channel_name, msg, msgLevel=undefined) {
    let outputChannel = hx.window.createOutputChannel(channel_name);
    outputChannel.show();

    // 采用try{} catch{} 写法的原因：颜色输出在3.1.0才支持，为了兼容老版本
    try {
        const cmpVersionResult = cmp_hx_version(hxVersion, '3.1.0');
        if (['warning', 'success', 'error', 'info'].includes(msgLevel) && (cmpVersionResult <= 0)) {
            outputChannel.appendLine({ line: msg, level: msgLevel });
        } else {
            outputChannel.appendLine(msg);
        };
    } catch (e) {
        console.log(e)
        outputChannel.appendLine(msg);
    };
};

/**
 * @description 读取剪贴板
 */
function clipboardRead() {
    return new Promise((resolve, reject) => {
        let textPromise = hx.env.clipboard.readText();
        textPromise.then(function(res) {
            if (res) {
                resolve(res);
            } else {
                reject('');
            };
        });
    });
};

/**
 * @description 命令行运行
 * @param {String} DirName
 * @param {String} 命令行运行的命令
 */
function runCmd(cmd = '', opts = {}, msg) {
    opts = Object.assign({
        stdio: 'pipe',
        cwd: process.cwd()
    }, opts);

    const shell = process.platform === 'win32' ? {cmd: 'cmd',arg: '/C'} : {cmd: 'sh',arg: '-c'};
    try {
        child = spawn(shell.cmd, [shell.arg, cmd], opts);
    } catch (error) {
        return Promise.reject(error)
    };
    return new Promise(resolve => {
        if (child.stdout) {
            child.stdout.on('data', data => {
                if (msg == "解压zip") {
                    let stdoutMsg = (data.toString()).trim();
                    createOutputChannel(`${msg}`, stdoutMsg);
                };
            });
        };

        if (child.stderr) {
            child.stderr.on('data', data => {
                let stderrMsg = (data.toString()).trim();
                createOutputChannel(`${msg}`, stderrMsg);
                hx.window.setStatusBarMessage(`${msg} 正在执行.....`, 500000, 'info');
            })
        };

        child.on('error', error => {
            hx.window.setStatusBarMessage(`${msg} 失败`, 5000, 'error');
            resolve('run_error');
        });

        child.on('close', code => {
            hx.window.setStatusBarMessage(`${msg} 完成`, 5000, 'info');
            resolve('run_end');
        });
    });
};

/**
 * @description 复制路径
 * @param {Object} param 项目管理器选中的信息
 */
async function copy(selectInfo, action) {
    let {
        selectedPath,
        projectPath
    } = selectInfo;
    let copyText = action != 'Relative' ? selectedPath : selectedPath.replace(projectPath + '/', '');
    hx.env.clipboard.writeText(copyText);
};

/**
 * @description  压缩
 */
async function compress(selectInfo) {
    let {
        selectedPath,
        projectPath,
        selectedType
    } = selectInfo;

    // 压缩包名称
    let parse = path.parse(selectedPath);
    let zipName = parse["name"];
    if (zipName.startsWith('.')) {
        zipName = zipName.replace('.', '')
    };

    let zipContent = selectedPath.replace(projectPath, '');
    if (zipContent == '') {
        zipContent = '*';
    };
    if (zipContent.startsWith('/')) {
        zipContent = zipContent.replace('/', '')
    };

    // 运行目录
    let runDir = path.dirname(selectedPath);
    if (projectPath == selectedPath) {
        runDir = projectPath;
    };

    let boxMsg = osName == 'darwin' ? `请选择要压缩的格式` : "请选择要压缩的格式";
    let btns = osName == 'darwin' ? ["zip", "tar.bz2", "tar.gz", "关闭"] : ["zip", "关闭"];
    let selectBtn = await hxShowMessageBox("压缩", boxMsg, btns);

    // 判断是否存在
    let zipFilePath = path.join(runDir, zipName + '.' + selectBtn);
    if (fs.existsSync(zipFilePath)) {
        zipName = zipName + '_' + (Date.now()).toString();
    } else {
        zipName = zipName + '.' + selectBtn;
    };

    let cmdOptions = {
        cwd: runDir
    };
    if (osName == 'darwin') {
        switch (selectBtn) {
            case "zip":
                runCmd(`zip -r ${zipName} ${zipContent}`, cmdOptions, "压缩zip")
                break;
            case "tar.bz2":
                runCmd(`tar -jcvf ${zipName} ${zipContent}`, cmdOptions, "压缩tar.bz2")
                break;
            case "tar.gz":
                runCmd(`tar -jcvf ${zipName} ${zipContent}`, cmdOptions, "压缩tar.gz")
                break;
            default:
                break;
        }
    } else {
        hx.window.showErrorMessage("暂不支持windows压缩。")
    };
};


/**
 * @description 解压
 * @param {Object} param
 */
async function decompress(selectInfo) {
    let {
        selectedPath,
        projectPath,
        selectedType
    } = selectInfo;

    let parseInfo = path.parse(selectedPath);
    let {
        ext,
        dir,
        base,
        name
    } = parseInfo;
    let decompressDirName = name;

    let btns = ["解压并覆盖", "解压不覆盖", "关闭"];
    let boxmsg = `解压并覆盖：解压缩时覆盖原有的文件\n解压不覆盖：解压缩时不要覆盖原有的文件\n\n注意：解压操作，会解压到当前文件夹下，且覆盖后无法找回。请谨慎操作。`
    let selectBtn = await hxShowMessageBox(`解压${base}`, boxmsg, btns);
    if (selectBtn != `解压并覆盖` && selectBtn != `解压不覆盖`) return;

    let cmdOptions = {
        cwd: dir
    };

    if (osName == 'darwin') {
        if (ext == ".zip") {
            let param1 = selectBtn == '解压并覆盖' ? ' -o ' : ' -n ';
            runCmd(`unzip -v ${param1} ${base}`, cmdOptions, "解压zip");
        };
        if (ext == '.bz2') {
            let tarbz2 = base.substring(base.length-8);
            if (tarbz2 == '.tar.bz2') {
                let coverParam2 = selectBtn == '解压并覆盖' ? ' -m ' : ' -k ';
                runCmd(`tar -zxvf ${base} ${coverParam2}`, cmdOptions, "解压tar.bz2");
            };
        };
        if (ext == '.gz') {
            let tarbz2 = base.substring(base.length-7);
            if (tarbz2 == '.tar.gz') {
                let coverParam3 = selectBtn == '解压并覆盖' ? ' -m ' : ' -k ';
                runCmd(`tar -jxvf ${base} ${coverParam3}`, cmdOptions, "解压tar.gz");
            };
        };
    };
};

/**
 * @description unicode转中文
 */
function unicodeToChinese(selectInfo) {
    let {
        focusPosition,
        selectedPath
    } = selectInfo;
    if (focusPosition == 'editor') {
        let activeEditor = hx.window.getActiveTextEditor();
        activeEditor.then(function(editor) {
            let selection = editor.selection;
            let word = editor.document.getText(selection);
            let isSelect = word.length;
            if (isSelect != 0) {
                let replaceText = eval("'" + word + "'");
                editor.edit(editBuilder => {
                    editBuilder.replace(selection, replaceText);
                });
                return;
            };
            fileToChinese(selectedPath);
        });
    } else {
        hx.window.showErrorMessage("请在编辑器打开相关文件进行操作。", ["我知道了"]);
    };
};

/*
 * 按行读取文件内容
 * 返回：字符串数组
 * 参数：fReadName:文件名路径
 * */
function readFileToArr(fReadName) {
    return new Promise((resolve, reject) => {
        try{
            let fRead = fs.createReadStream(fReadName);
            let objReadline = readline.createInterface({
                input: fRead
            });
            let arr = new Array();
            objReadline.on('line', function(line) {
                arr.push(line);
                resolve(arr);
            });
        }catch(e){
            reject([]);
        };
    });
};

/**
 * @description 把整个文件的unicode转中文
 */
async function fileToChinese(filepath) {
    let oldFileContent = await readFileToArr(filepath, function(data) {
        return data;
    });
    let filecontent = "";
    for (let s of oldFileContent) {
        let line = unescape(s.replace(/\\u/g, "%u"));
        filecontent = filecontent + line + "\n";
    };
    fs.writeFile(filepath, filecontent, function (err) {
       if (err) throw err;
    });
};

/**
 * @description 压缩js文件
 */
function jsUglifyjs(selectInfo, action) {
    let {selectedPath, selectedType} = selectInfo;
    if (selectedType != 'file') {
        return hx.window.showErrorMessage("js压缩：请选中js文件后，再进行压缩。", ["我知道了"]);
    };

    let parse = path.parse(selectedPath);
    let { dir, base, name } = parse;

    let cmdOptions = {
        cwd: dir
    };
    if (action == "Compressed") {
        runCmd(`${uglifyjs} ${base} --comments -c -o ${name}.min.js`, cmdOptions, `压缩${base}`);
    };
    if (action == "mangle") {
        runCmd(`${uglifyjs} ${base} --comments -c -m -o ${name}.min.js`, cmdOptions, `压缩${base}`);
    };
};

/**
 * @description url编码
 */
async function goToUrlEncode() {
    let content = await clipboardRead();

    let msg = content == "" ? "提示：剪切板为空。如要进行URL编码，请将要编码的内容，复制到剪切板，然后再点击编码。" : "剪切板内容编码如下:";
    let msgLevel = content == "" ? "warning" : "success";
    createOutputChannel('URL编码', msg, msgLevel);

    const encodeResult = await encodeURIComponent(content);
    createOutputChannel('URL编码', encodeResult);
};

/**
 * @description url解码
 */
async function goToUrlDecode() {
    let content = await clipboardRead();

    let msg = content == "" ? "提示：剪切板为空。如要进行URL解码，请将要解码的内容，复制到剪切板，然后再点击解码。" : "剪切板内容解码如下:";
    let msgLevel = content == "" ? "warning" : "success";
    createOutputChannel('URL解码', msg, msgLevel);

    const result = await decodeURIComponent(content);
    createOutputChannel('URL解码', result);
};


module.exports = {
    copy,
    compress,
    decompress,
    unicodeToChinese,
    jsUglifyjs,
    goToUrlEncode,
    goToUrlDecode
}
