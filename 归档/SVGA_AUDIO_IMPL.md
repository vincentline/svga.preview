# SVGA 音频播放实现技术文档

## 1. 背景与问题

SVGA 官方播放器（`svga.min.js`）在音频支持上存在以下严重缺陷，导致无法满足预览工具的需求：

1.  **无法控制播放/暂停**：官方播放器一旦开始播放，音频就会接管，无法随动画暂停而暂停。
2.  **Seek 不同步**：拖拽进度条时，画面跳转了，但音频依然从头播放或位置错乱。
3.  **静音失效**：无法通过 API 有效控制静音。
4.  **解析缺陷**：官方 Parser 经常丢失音频配置（`audios` 列表为空），或者无法正确提取音频 Key。

因此，本项目采用了**完全接管音频播放权**的策略，绕过官方播放器的音频逻辑，使用 `Howler.js` 实现精准的音频同步控制。

---

## 2. 核心技术方案

### 2.1 架构概览

*   **数据层 (`app.js`)**：
    *   使用 `protobuf` 手动解析 SVGA 文件，提取可靠的音频配置（`audios`）和音频数据（`images` 中的二进制数据）。
    *   **强制覆盖**：无视官方 Parser 返回的音频配置，优先使用手动解析的数据。
*   **驱动层 (`app.js` -> `onFrame`)**：
    *   利用 SVGA 播放器的 `onFrame` 回调作为“时钟信号”。
    *   每一帧主动调用 `PlayerController.syncAudio(frame)`，驱动音频同步。
*   **控制层 (`player-controller.js`)**：
    *   `SvgaPlayerAdapter`：封装音频逻辑的适配器。
    *   `GlobalAudioManager`：全局单例，管理所有 `Howl` 实例，负责统一的停止、静音和销毁。

### 2.2 关键流程

#### A. 音频数据解析与注入
1.  **加载文件**：`loadSvgaFile` 启动。
2.  **手动解析**：调用 `SVGA.Parser` 的同时，后台启动 `protobuf` 解析（`parseSvgaAudioData`）。
3.  **数据提取**：从 protobuf 结构中提取 `audios` 列表（包含 `audioKey`, `startFrame`, `endFrame` 等）。
4.  **强制更新**：解析完成后，**强制覆盖** `app.js` 中的 `svgaAudios`，并调用 `playerController.getAdapter()` 触发状态同步，确保播放器拿到最新数据。

#### B. 音频同步（Sync Audio）
这是最核心的逻辑，位于 `SvgaPlayerAdapter.prototype.syncAudio`：

1.  **时钟驱动**：`app.js` 在 `onFrame` 回调中，检查 `_this.isPlaying`。只有在**播放状态**下，才调用 `syncAudio`。
2.  **区间判断**：遍历音频列表，判断当前帧是否在 `[startFrame, endFrame)` 区间内。
    *   *容错处理*：如果 `startFrame` / `endFrame` 缺失，默认为 0。如果 `endFrame` 为 0，视为全长播放（`totalFrames`）。
3.  **播放控制**：
    *   如果当前帧在区间内，且对应的 `Howl` 实例未播放：
        1.  计算 `seekPos`：`startTime + (currentFrame - startFrame) / fps`。
        2.  **执行播放**：`howl.seek(seekPos)` -> `howl.play()` -> `howl.mute(isMuted)`。
    *   如果当前帧不在区间内，但音频正在播放：立即 `stop()`。

#### C. 全局控制（Pause/Mute）
1.  **暂停**：用户点击暂停或拖拽进度条时，调用 `GlobalAudioManager.stopAll()`（注意是 `stop` 而不是 `pause`，确保下次播放位置准确）。
2.  **静音**：`app.js` 将 `isMuted` 状态传递给 `PlayerController`，后者调用 `GlobalAudioManager.muteAll()`。

---

## 3. 遇到的坑与解决方案（踩坑记录）

### 3.1 解析器的大坑
*   **现象**：`videoItem.audios` 经常为空，或者有配置但没声音。
*   **原因**：官方 Parser 对某些 SVGA 版本的音频字段解析不全。
*   **解法**：引入 `protobuf.js` 手动解析二进制数据。如果手动解析成功，**无条件信任并覆盖**官方数据。

### 3.2 Key 匹配的玄学
*   **现象**：有配置、有数据，但就是没声音。
*   **原因**：SVGA 制作工具混乱，Key 的命名五花八门。
    *   配置里叫 `music`，数据里叫 `music.mp3`。
    *   配置里叫 `296`，数据里叫 `audio_296`。
*   **解法**：实现了**多重模糊匹配策略**：
    1.  精确匹配。
    2.  尝试添加/去除 `.mp3`, `.wav` 后缀。
    3.  尝试添加 `audio_` 前缀。
    4.  **终极兜底**：遍历所有数据 Key，进行字符串包含匹配（`indexOf`），且限制长度 `>3` 防止误判。

### 3.3 自动播放策略（Autoplay Policy）
*   **现象**：代码执行了 `play()`，但浏览器拦截了，导致无声。
*   **解法**：依赖用户交互（点击播放按钮）来激活 AudioContext。`Howler.js` 内部处理了大部分兼容性，但需确保 `play()` 调用是在用户操作的调用链中（或 AudioContext 已解锁）。

### 3.4 Howler.js 的生命周期管理
*   **现象**：无法暂停，静音无效。
*   **原因**：`howl.on('unload')` 在某些情况下绑定失败抛出异常，导致该实例被错误地从 `GlobalAudioManager` 列表中移除，从而脱离管控。
*   **解法**：即使事件绑定失败，也**严禁**将实例从管理列表中移除。必须强引用持有，才能控制其停止。

### 3.5 暂停后的“余音”
*   **现象**：点击暂停，画面停了，声音还在放。
*   **原因**：SVGA 的 `onFrame` 在暂停瞬间可能还会触发一次；或者 `pause()` 只是暂停了动画，没通知音频。
*   **解法**：
    1.  在 `app.js` 的 `onFrame` 中增加 `if (_this.isPlaying)` 检查，暂停状态下严禁驱动音频。
    2.  在 `PlayerController` 监听到暂停状态变化时，强制调用 `GlobalAudioManager.stopAll()`。

---

## 4. 维护指南（给 AI 的提示）

如果你需要修改音频逻辑，请务必遵守以下原则：

1.  **不要信任官方播放器**：永远假设官方播放器的音频功能是坏的。
2.  **数据优先**：确保 `app.js` 中的 `svgaAudios` 是来自 protobuf 解析的“真数据”。
3.  **时钟驱动**：音频的播放**必须且只能**由 `onFrame` 回调驱动，不要尝试自己在 `PlayerController` 里搞定时器，那样绝对会对不齐。
4.  **集中管理**：所有的 `Howl` 实例创建后，必须立即加入 `GlobalAudioManager`。任何对音频的操作（停、静音）都必须通过 Manager 批量处理，不要操作单个实例。
5.  **Seek 顺序**：`howl.seek()` 最好在 `howl.play()` 之前或紧随其后。对于 Web Audio API 模式，顺序通常不敏感，但为了兼容性，建议 `seek` -> `play`。

---

## 5. 代码索引

*   **手动解析音频**：[app.js](file:///f:/百度云同步盘/BaiduSyncdisk/04生活/小工具/svga.preview.git/svga.preview/docs/assets/js/app.js) -> `parseSvgaAudioData`
*   **驱动音频同步**：[app.js](file:///f:/百度云同步盘/BaiduSyncdisk/04生活/小工具/svga.preview.git/svga.preview/docs/assets/js/app.js) -> `initSvgaPlayer` -> `onFrame`
*   **音频管理器**：[player-controller.js](file:///f:/百度云同步盘/BaiduSyncdisk/04生活/小工具/svga.preview.git/svga.preview/docs/assets/js/player-controller.js) -> `GlobalAudioManager`
*   **同步逻辑实现**：[player-controller.js](file:///f:/百度云同步盘/BaiduSyncdisk/04生活/小工具/svga.preview.git/svga.preview/docs/assets/js/player-controller.js) -> `SvgaPlayerAdapter.prototype.syncAudio`
*   **Key 模糊匹配**：[player-controller.js](file:///f:/百度云同步盘/BaiduSyncdisk/04生活/小工具/svga.preview.git/svga.preview/docs/assets/js/player-controller.js) -> `getHowlInstance`
