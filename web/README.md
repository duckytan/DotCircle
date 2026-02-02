# 点点圈 Web 版本

这是点点圈（DotCircle）的 Web 版本，可以直接部署到 GitHub Pages。

## 🚀 快速部署到 GitHub Pages

### 方法1：通过 GitHub 界面部署（推荐）

1. **Fork 或创建仓库**
   - 登录 GitHub
   - 创建一个新仓库，命名为 `dotcircle`（或其他名字）
   - 将 `web` 文件夹中的内容上传到仓库根目录

2. **启用 GitHub Pages**
   - 进入仓库的 **Settings**（设置）
   - 找到 **Pages** 选项
   - 在 **Source** 部分选择 **Deploy from a branch**
   - 选择 **main** 或 **master** 分支，文件夹选择 **/(root)**
   - 点击 **Save**

3. **等待部署**
   - 等待几分钟，GitHub 会自动构建和部署
   - 访问 `https://你的用户名.github.io/仓库名` 即可查看

### 方法2：通过 Git 命令行部署

```bash
# 克隆仓库（或创建新仓库）
git clone https://github.com/你的用户名/dotcircle.git
cd dotcircle

# 将 web 文件夹内容复制到仓库根目录
cp -r web/* .

# 提交并推送
git add .
git commit -m "Initial web deployment"
git push origin main
```

## 📁 文件结构

```
web/
├── index.html          # 首页 - 礼包列表
├── publish.html        # 发布页
├── detail.html         # 礼包详情
├── my.html             # 个人中心
├── packages.html       # 分享管理
├── leaderboard.html    # 排行榜
├── rules.html          # 规则说明
├── css/
│   └── style.css      # 全局样式
├── js/
│   └── data.js        # 数据层和工具函数
└── README.md          # 本文件
```

## ✨ 功能特性

- 📱 **完全响应式**：适配手机、平板、桌面设备
- 🎨 **精美UI**：采用橙色主题，符合小程序设计规范
- 💾 **本地存储**：使用 localStorage 模拟数据持久化
- 🔄 **PWA支持**：可以添加到主屏幕，像原生应用一样使用
- ⚡ **纯静态**：无需后端服务器，GitHub Pages 直接部署

## 📱 页面功能

### 首页 (index.html)
- 礼包列表展示（按曝光值排序）
- 类型筛选（全部/链接/图片）
- 搜索功能
- 悬浮发布按钮
- 无限滚动加载

### 发布页 (publish.html)
- 今日任务检查
- 链接/图片双模式发布
- 元宝链接格式验证
- 互助契约开关
- 额度限制检查

### 礼包详情页 (detail.html)
- 发布者信息
- 领取进度展示
- 帮助者列表
- 礼包内容查看
- 领取操作

### 个人中心 (my.html)
- 用户信息和信用分
- 累计统计
- 今日任务
- 徽章展示
- 功能菜单入口

### 分享管理 (packages.html)
- 我的分享列表
- 状态筛选
- 更正领取数
- 取消分享

### 排行榜 (leaderboard.html)
- 四类榜单（互助/信用/活跃/贡献）
- 实时排名
- Top3 特殊标识

### 规则说明 (rules.html)
- 核心理念
- 互助流程
- 信用等级体系
- 分数变动规则

## 🔧 技术栈

- **前端**：原生 HTML5 + CSS3 + JavaScript (ES6+)
- **样式**：CSS 变量 + Flexbox + Grid
- **存储**：localStorage
- **图标**：SVG
- **字体**：系统默认字体栈

## 🎯 使用说明

### 数据说明
由于是纯前端实现，数据存储在浏览器的 localStorage 中：
- 清除浏览器数据会重置所有信息
- 不同设备/浏览器数据不互通
- 适合演示和个人使用

### 模拟数据
首次访问会自动生成模拟数据：
- 20个模拟用户
- 30个模拟礼包
- 随机信用分和互助记录

## 📝 自定义配置

可以在 `js/data.js` 中修改：

```javascript
// 修改默认信用分
const DEFAULT_CREDIT = 60

// 修改每日额度
const DEFAULT_QUOTA = 2

// 修改等级阈值
const LEVEL_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  NORMAL: 60,
  WARNING: 40,
  RESTRICTED: 20,
  BANNED: 0
}
```

## 🎨 自定义主题

在 `css/style.css` 中修改 CSS 变量：

```css
:root {
  --primary: #f97316;        /* 主色调 */
  --primary-light: #fb923c;  /* 浅色 */
  --primary-dark: #ea580c;   /* 深色 */
}
```

## 🚀 进阶部署

### 绑定自定义域名
1. 在仓库根目录创建 `CNAME` 文件
2. 写入你的域名，如：`dotcircle.example.com`
3. 在域名 DNS 设置中添加 CNAME 记录指向 `用户名.github.io`

### 启用 HTTPS
GitHub Pages 自动提供 HTTPS，无需额外配置。

### PWA 支持（可选）
可以添加 `manifest.json` 和 Service Worker 实现：
- 离线访问
- 添加到主屏幕
- 推送通知

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

MIT License

---

**点点圈 - 让互助更简单** ⭕