
## 12. 核心架构重构与稳定性优化

### 12.1 背景

随着项目功能的迭代，代码库中出现了几类典型问题：
1.  **逻辑复杂化**：`switchMode` 方法中充斥着大量的 `if-else` 判断，每次增加新格式都需要修改多处代码，极易引入 Bug。
2.  **资源管理混乱**：`ObjectURL`（Blob URL）的创建和释放分散在各个逻辑角落，依赖不稳定的 `setTimeout(..., 100)` 来延迟释放资源，导致偶发的内存泄漏或资源过早释放（黑屏）。
3.  **音频控制不稳**：SVGA 播放器的音频控制依赖对 `Howler.js` 的劫持，但在快速切换文件或并发操作时，由于竞态条件导致音频实例“漏网”，出现静音失效或声音残留。

### 12.2 解决方案

#### 12.2.1 模式策略表 (Strategy Pattern)

**重构前**：
```javascript
switchMode: function(mode) {
    if (mode === 'svga') { cleanupSvga(); ... }
    else if (mode === 'mp4') { cleanupMp4(); ... }
    // ... 冗长的判断
}
```

**重构后**：
引入 `modeStrategies` 映射表，实现配置驱动的模式管理。

```javascript
this.modeStrategies = {
    'svga': { cleanup: this.cleanupSvga },
    'yyeva': { cleanup: this.cleanupYyeva },
    'mp4': { cleanup: this.cleanupMp4 },
    // ...
};

switchMode: function(targetMode) {
    var strategy = this.modeStrategies[this.currentModule];
    if (strategy) strategy.cleanup.call(this);
    // ...
}
```

#### 12.2.2 资源管理器 (ResourceManager)

**问题**：
`URL.createObjectURL(blob)` 创建的 URL 必须手动释放。之前代码中通过 `setTimeout` 延迟释放是一种不可靠的 Hack。

**方案**：
实现 `ResourceManager` 单例，统一托管所有 ObjectURL。

1.  **自动追踪**：`resourceManager.createObjectURL(blob, 'groupName')`。
2.  **分组管理**：支持按模式（'svga', 'mp4'）分组。
3.  **统一释放**：在 `switchMode` 时调用 `releaseGroup('oldMode')`，确保彻底清理上一模式的所有资源。

```javascript
// ResourceManager.js
ResourceManager.prototype.createObjectURL = function (blob, group) {
    var url = URL.createObjectURL(blob);
    this._groups[group].add(url);
    return url;
};

ResourceManager.prototype.releaseGroup = function (group) {
    this._groups[group].forEach(URL.revokeObjectURL);
    this._groups[group].clear();
};
```

#### 12.2.3 音频稳定性修复

**问题**：
`GlobalAudioManager` 通过劫持 `Howl.prototype.init` 来捕获音频实例。
原实现使用 `setTimeout(..., 0)` 来确保实例初始化完成，但在文件快速切换时，`setTimeout` 回调执行时实例可能已被外部逻辑销毁，导致报错或丢失引用。

**修复**：
1.  **消除异步**：移除 `setTimeout`，在 `init` 劫持中同步添加实例。
2.  **防御性编程**：放宽 `add` 检查，即使实例部分属性未就绪也强制纳入管理，确保 `stopAll` / `muteAll` 能覆盖所有实例。
3.  **初始化竞态**：修改 `player-controller.js`，在加载时立即检查 `Howl` 是否存在，而非仅依赖 200ms 的轮询，防止小文件加载过快漏过劫持时机。

### 12.3 成果

- **代码可维护性**：`app.js` 逻辑大幅简化，新增格式只需在策略表中添加一行配置。
- **稳定性**：彻底解决了 `TypeError` 报错和内存泄漏隐患。
- **用户体验**：音频控制在任何极端操作下均保持可靠。
