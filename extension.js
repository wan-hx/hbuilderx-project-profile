const hx = require("hbuilderx");
const main= require('./src/main.js');

function activate(context) {
    let disposable = hx.commands.registerCommand('pt.ProjectProfileTemplate', (param) => {
        main(param, "template")
    });
    context.subscriptions.push(disposable);

    // 复制路径
    let copyPath = hx.commands.registerCommand('pt.copyPath', (param) => {
        main(param, "copy");
    });
    context.subscriptions.push(copyPath);

    // 复制相对路径
    let copyRelativePath = hx.commands.registerCommand('pt.copyRelativePath', (param) => {
        main(param, 'copyRelative');
    });
    context.subscriptions.push(copyRelativePath);

    // 压缩
    let ApiCompress = hx.commands.registerCommand('pt.compress', (param) => {
        main(param, 'compress');
    });
    context.subscriptions.push(ApiCompress);

    // 解压
    let ApiDecompress = hx.commands.registerCommand('pt.decompress', (param) => {
        main(param, 'decompress');
    });
    context.subscriptions.push(ApiDecompress);

    // unicode转中文
    let unicode = hx.commands.registerCommand('pt.unicodeToChinese', (param) => {
        main(param, 'unicodeToChinese');
    });
    context.subscriptions.push(unicode);

    // js压缩
    let jsCompressed = hx.commands.registerCommand('pt.uglifyjsCompressed', (param) => {
        main(param, 'jsCompressed');
    });
    context.subscriptions.push(jsCompressed);

    // url解码
    let UrlDecode = hx.commands.registerCommand('pt.UrlDecode', (param) => {
        main(param, 'UrlDecode');
    });
    context.subscriptions.push(UrlDecode);

    // url编码
    let UrlEncode = hx.commands.registerCommand('pt.UrlEncode', (param) => {
        main(param, 'UrlEncode');
    });
    context.subscriptions.push(UrlEncode);
};

function deactivate() {

};

module.exports = {
    activate,
    deactivate
}
