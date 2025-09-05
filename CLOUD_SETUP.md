# 云开发配置说明

## 环境信息
- 云开发环境ID: `zou-cloud1-4gee2jb2b028dcdc`
- 小程序AppID: `wxadcb7ab8d0825727`

## 云函数部署

### 1. 部署用户登录云函数
```bash
# 在微信开发者工具中右键 cloudfunctions/userLogin 文件夹
# 选择"上传并部署：云端安装依赖"
```

### 2. 部署更新用户信息云函数
```bash
# 在微信开发者工具中右键 cloudfunctions/updateUserInfo 文件夹
# 选择"上传并部署：云端安装依赖"
```

## 数据库集合

### users 集合
存储用户信息，包含以下字段：
- `_id`: 文档ID（自动生成）
- `openid`: 微信用户openid
- `id`: 用户自定义ID
- `nickname`: 用户昵称
- `avatar`: 用户头像URL
- `createTime`: 创建时间
- `updateTime`: 更新时间
- `lastLoginTime`: 最后登录时间
- `isActive`: 是否活跃

### artworks 集合
存储AI生成的作品，包含以下字段：
- `_id`: 文档ID（自动生成）
- `title`: 作品标题
- `description`: 作品描述
- `imageUrl`: 作品图片URL
- `prompt`: 生成提示词
- `negativePrompt`: 负面提示词
- `style`: 艺术风格
- `author`: 作者信息（包含openid、nickname、avatar等）
- `likeCount`: 点赞数
- `isLiked`: 是否已点赞
- `createTime`: 创建时间
- `updateTime`: 更新时间

## 权限设置

### users 集合权限
- 读取：仅创建者可读
- 写入：仅创建者可写

### artworks 集合权限
- 读取：所有用户可读
- 写入：仅创建者可写

## 使用说明

### 1. 用户登录流程
1. 用户点击登录按钮
2. 调用 `cloudService.getUserProfile()` 方法
3. 内部调用 `userLogin` 云函数获取openid
4. 调用 `updateUserInfo` 云函数更新用户信息
5. 返回用户信息并保存到本地存储

### 2. 作品发布流程
1. 用户生成图片后点击发布
2. 调用 `cloudService.saveArtwork()` 方法
3. 将作品信息保存到 `artworks` 集合

### 3. 作品加载流程
1. 首页调用 `cloudService.getAllArtworks()` 获取所有作品
2. 个人页面调用 `cloudService.getUserArtworks()` 获取用户作品
3. 如果云开发失败，自动降级使用模拟数据

## 注意事项

1. 确保云开发环境已开通并配置正确
2. 云函数需要先部署才能使用
3. 数据库集合需要手动创建并设置权限
4. 建议在真机上测试，模拟器可能无法正常使用云开发功能

## 故障排除

### 云函数调用失败
- 检查云函数是否已正确部署
- 检查云开发环境ID是否正确
- 查看云函数日志排查错误

### 数据库操作失败
- 检查数据库集合是否已创建
- 检查数据库权限设置
- 确认用户已正确登录

### 用户登录失败
- 检查微信开发者工具是否已登录
- 确认小程序AppID配置正确
- 检查云开发环境是否正常

### "获取用户信息失败"错误
这个问题通常是由于微信小程序政策变化导致的：

**原因：**
- `wx.getUserProfile` 接口已被废弃（2022年后）
- 需要使用新的头像昵称填写组件

**解决方案：**
1. 确保使用最新版本的代码（已修复）
2. 登录时会使用默认昵称"微信用户"
3. 登录后可以通过头像昵称填写组件更新信息

**测试步骤：**
1. 在微信开发者工具控制台运行测试脚本：
   ```javascript
   // 复制 test-cloud-functions.js 内容到控制台
   runAllTests();
   ```
2. 检查云函数日志
3. 确认数据库集合和权限设置正确

### 头像昵称更新失败
- 确保用户已登录
- 检查云函数 `updateUserInfo` 是否正常部署
- 查看控制台错误日志
