# tuhui2020.github.io

这是一个适用于 `tuhui2020.github.io` 的静态网站：

- `index.html`：主页面
- `projects.html`：章节页面，会自动读取 GitHub 用户 `tuhui2020` 的公开仓库
- `readme.html`：README 阅读页，以深色 Markdown 风格展示项目说明
- `resources.html`：资料页面
- `nav.html`：公共导航栏模板，所有页面通过脚本加载
- `styles.css`：全站样式
- `script.js`：导航加载、仓库读取、README 读取与页面交互脚本
- `images/`：放置 `wolfox` 图标和艺术字体图片

建议在 `images/` 下放入以下文件：

- `wolfox-icon.png`
- `wolfox-wordmark.png`

如果图片暂时没有放入，页面会自动显示文字样式作为兜底。

功能说明：

- 首页显示“章节”和“资料”两个入口
- 章节页会展示每个 GitHub 项目
- 每个项目下方有“读取 README”和“项目地址”两个按钮
- README 页面会从 GitHub API 读取仓库说明，并用 Markdown 风格展示
- 所有子页面顶部都带有返回上一页按钮
