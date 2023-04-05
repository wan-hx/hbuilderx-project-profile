# 文件实用工具

本插件包含以下功能：

* 复制路径
* 复制相对路径
* 左侧视图右键菜单：新建特定名称文件，比如License、.editorconfig、.gitignore等
* 左侧视图右键菜单：zip压缩、解压缩
* 左侧视图右键菜单：js压缩
* 编辑器右键菜单：unicode转中文
* 编辑器右键菜单【url解码、编码】

![](https://img-cdn-aliyun.dcloud.net.cn/stream/plugin_screens/6a66d420-56de-11eb-9b8b-3b53cb239112_0.png)

## 配置快捷键

点击菜单【工具】【自定义快捷键】【用户设置】，可自定义快捷键。

拷贝下列内容，设置快捷键时，请注意文档格式。

```
{
    "key":"",
    "command": ""
}
```

|描述				|command					|
|--					|--							|
|复制路径			|pt.copyPath				|
|复制相对路径		|pt.copyRelativePath		|
|新建特定名称文件	|pt.ProjectProfileTemplate	|
|压缩为zip			|pt.compress				|
|解压到当前目录		|pt.decompress				|
|js压缩				|pt.uglifyjsCompressed		|
|unicode转中文		|pt.unicodeToChinese		|
|URL解码			|pt.UrlDecode				|
|URL编码			|pt.UrlEncode				|


