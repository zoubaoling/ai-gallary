# AI画廊小程序

基于TDesign组件库开发的AI图片生成和分享小程序。

## 📱 功能特性

- **AI图片生成**: 支持文字描述生成高质量AI图片
- **社区分享**: 用户可以分享和浏览他人作品
- **微信登录**: 支持微信一键登录，安全便捷
- **个人画廊**: 管理个人创作历史和收藏
- **智能提示**: 提供创作灵感和常用风格选择
- **TDesign风格**: 统一的设计语言和用户体验

## 🛠 技术栈

- **框架**: 微信小程序原生开发
- **语言**: TypeScript
- **UI组件**: TDesign Miniprogram
- **样式**: WXSS
- **状态管理**: 本地存储 + 全局数据

## 📁 项目结构

```
miniprogram/
├── app.ts                 # 应用入口文件
├── app.json              # 应用配置文件
├── app.wxss              # 全局样式文件
├── types/                # TypeScript类型定义
│   └── index.ts
├── pages/                # 页面文件
│   ├── home/             # 首页
│   │   ├── home.ts
│   │   ├── home.wxml
│   │   ├── home.wxss
│   │   └── home.json
│   ├── profile/          # 我的页面
│   │   ├── profile.ts
│   │   ├── profile.wxml
│   │   ├── profile.wxss
│   │   └── profile.json
│   └── create/           # 创建图片页面
│       ├── create.ts
│       ├── create.wxml
│       ├── create.wxss
│       └── create.json
├── assets/               # 静态资源
│   ├── icons/           # 图标文件
│   └── images/          # 图片文件
└── utils/               # 工具函数
    └── util.ts
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 构建npm包

在微信开发者工具中：
1. 点击"工具" -> "构建npm"
2. 等待构建完成

### 3. 预览和调试

1. 在微信开发者工具中打开项目
2. 点击"预览"或"真机调试"
3. 扫描二维码在手机上预览

## 📱 页面说明

### 首页 (pages/home)
- 展示所有用户分享的AI画作
- 支持下拉刷新和上拉加载更多
- 悬浮创建按钮快速进入创作页面
- 底部Tab导航

### 我的页面 (pages/profile)
- 用户信息展示和微信登录
- 个人画廊管理
- 功能菜单（收藏、历史、设置）
- 未登录状态引导

### 创建图片页面 (pages/create)
- 提示词输入和智能提示
- 常用风格标签选择
- AI图片生成和预览
- 发布到画廊功能
- 创作灵感推荐

## 🎨 设计规范

### 色彩系统
- 主色: #0052D9 (TDesign Blue)
- 成功色: #00A870 (TDesign Green)
- 警告色: #ED7B2F (TDesign Orange)
- 错误色: #D54941 (TDesign Red)
- 灰色系: #F3F3F3 ~ #4B4B4B

### 字体规范
- 系统字体: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- 标题: 32-36rpx, font-weight: 600
- 正文: 28rpx, font-weight: 400
- 辅助文字: 24-26rpx, font-weight: 400

### 间距规范
- 页面边距: 40rpx
- 组件间距: 20-32rpx
- 内容间距: 16-24rpx

## 🔧 开发说明

### TypeScript配置
- 严格模式开启
- 类型检查完整
- 路径映射配置

### 组件使用
所有UI组件均使用TDesign Miniprogram，确保设计一致性。

### 数据管理
- 使用微信小程序本地存储
- 全局数据管理用户状态
- 模拟API接口，便于后续对接真实后端

## 📝 待办事项

- [ ] 对接真实AI图片生成API
- [ ] 实现作品详情页面
- [ ] 添加作品点赞和评论功能
- [ ] 实现用户收藏功能
- [ ] 添加作品搜索和分类
- [ ] 优化图片加载和缓存
- [ ] 添加分享功能
- [ ] 实现用户设置页面

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License
