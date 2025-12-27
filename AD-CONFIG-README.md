# 广告位配置说明

## 配置文件位置

- **本地模板文件**: `site-config.json` (项目根目录)
- **实际加载地址**: 腾讯云COS (需要手动上传)

## 快速开始

### 1. 修改配置文件URL

打开 `docs/assets/js/site-config-loader.js`，找到第22行：

```javascript
const CONFIG_URL = 'https://your-bucket.cos.ap-region.myqcloud.com/config/site-config.json';
```

将其替换为你的腾讯云COS配置文件实际地址。

### 2. 编辑配置内容

编辑项目根目录的 `site-config.json` 文件：

```json
{
  "version": "1.0.0",
  "timestamp": 1735315567000,
  "features": {
    "advertisement": {
      "enabled": false,
      "position": "right-float"
    }
  }
}
```

**配置说明：**

- `version`: 配置版本号，每次修改需递增
- `timestamp`: 当前时间戳，用于防止浏览器缓存
- `features.advertisement.enabled`: `true` 显示广告位，`false` 隐藏广告位
- `features.advertisement.position`: 广告位位置，当前支持 `right-float` (右侧浮层)

### 3. 上传到腾讯云COS

1. 修改 `version` 字段 (如 1.0.0 → 1.0.1)
2. 更新 `timestamp` 为当前时间戳 (可用 `Date.now()` 获取)
3. 上传 `site-config.json` 到腾讯云COS
4. (可选) 刷新CDN缓存

### 4. 验证配置

1. 访问配置文件URL，确认内容已更新
2. 刷新网站页面
3. 打开浏览器控制台，查看日志：
   - `[SiteConfig] 配置加载成功` - 配置加载成功
   - `[AdController] 显示广告位: right-float` - 广告位已启用
   - `[AdController] 广告位已禁用` - 广告位已禁用

## 注意事项

1. **URL配置**: 必须先修改 `site-config-loader.js` 中的 `CONFIG_URL` 为实际地址
2. **版本号**: 每次修改配置时必须更新 `version` 和 `timestamp`
3. **CORS配置**: 确保腾讯云COS已正确配置跨域访问规则
4. **公共读权限**: 配置文件需设置为公共读权限
5. **CDN缓存**: 如果配置了CDN，修改后需手动刷新缓存

## 广告位位置

当前支持的广告位位置标识：

- `right-float`: 右侧浮层 (固定定位，垂直居中)
- `bottom-float`: 底部浮层 (预留，需要时可使用)
- `inline-top`: 页面顶部内嵌 (预留)

## 扩展配置

未来可以在 `features` 下添加其他功能配置，例如：

```json
{
  "version": "1.0.1",
  "timestamp": 1735315567000,
  "features": {
    "advertisement": {
      "enabled": true,
      "position": "right-float"
    },
    "analytics": {
      "enabled": false,
      "provider": "google",
      "trackingId": "UA-XXXXX-X"
    }
  }
}
```

## 故障排查

### 配置加载失败

- 检查配置文件URL是否正确
- 检查CORS配置是否正确
- 检查网络连接是否正常
- 查看浏览器控制台错误信息

### 广告位不显示

- 确认配置中 `enabled` 为 `true`
- 确认 `position` 字段匹配
- 检查浏览器窗口宽度 (小于1200px时广告位自动隐藏)
- 查看浏览器控制台日志

### 配置更新不生效

- 清除浏览器缓存
- 检查 `version` 和 `timestamp` 是否已更新
- 如果配置了CDN，尝试刷新CDN缓存
- 直接访问配置文件URL，确认内容已更新

## 技术实现

- **配置加载器**: `docs/assets/js/site-config-loader.js`
- **广告位控制器**: `docs/assets/js/ad-controller.js`
- **广告位容器**: `docs/index.html` (搜索 `id="ad-container"`)
- **广告位样式**: `docs/assets/css/styles.css` (文件末尾)
