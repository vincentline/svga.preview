# 技术文档

## 架构概览

### 核心模块
- **App (app.js)**: 主业务逻辑，负责 UI 交互、状态管理和模块调度。
- **FFmpegService (ffmpeg-service.js)**: 统一的音视频处理基础设施，封装了 FFmpeg WebAssembly 的核心功能。
- **LibraryLoader (library-loader.js)**: 动态依赖加载器，负责按需加载第三方库（如 protobuf, pako, ffmpeg 等）。
- **SVGA Builder (svga-builder.js)**: 负责构建和生成 SVGA 文件。
- **DualChannelComposer (dual-channel-composer.js)**: 负责双通道视频的帧合成。

## FFmpegService 详解

`FFmpegService` 是本项目最核心的基础设施之一，负责所有音视频转换任务。它采用了单例模式，确保全局只有一个 FFmpeg 实例，以节省内存并防止状态冲突。

### 核心特性

1.  **单例管理**: 
    - 确保 `ffmpeg.wasm` 只被加载和初始化一次。
    - 统一管理内存文件系统，自动清理临时文件。

2.  **插队加载 (High Priority Loading)**:
    - 支持 `init({ highPriority: true })`，可利用 `LibraryLoader` 的插队机制优先加载 FFmpeg 库，提升用户体验。

3.  **并发锁 (isBusy)**:
    - 内置 `isBusy` 状态锁。
    - 由于 `ffmpeg.wasm` (v0.11) 是单线程模型，同一时间只能执行一个任务。
    - 当一个任务正在运行时，新的调用会被拒绝并抛出“服务正忙”错误，防止底层崩溃。

4.  **通用命令接口 (runCommand)**:
    - 提供了底层的 `runCommand` 接口，允许执行任意 FFmpeg 命令。
    - 自动处理输入文件的写入、命令执行、输出文件的读取和清理。

5.  **健壮的错误处理**:
    - 统一的 `try-catch-finally` 结构，确保即使任务失败，也能释放 `isBusy` 锁并清理临时文件。
    - 提供了 `reset()` 方法，用于在极端情况下强制重置服务状态。

### API 使用示例

#### 1. 初始化
```javascript
// 推荐在页面加载后预加载（低优先级）
FFmpegService.init();

// 在需要使用时强制插队加载（高优先级）
await FFmpegService.init({ 
    highPriority: true,
    corePath: '/assets/js/ffmpeg-core.js', // 可选：自定义 core 路径
    log: true // 可选：开启调试日志
});
```

#### 2. 提取音频
```javascript
var audioData = await FFmpegService.extractAudio({
    videoFile: file,
    totalFrames: 100,
    fps: 30,
    speedRatio: 1.0, // 可选：变速
    onProgress: (p) => console.log('进度:', p)
});
```

#### 3. 序列帧转 MP4
```javascript
var mp4Blob = await FFmpegService.convertFramesToMp4({
    frames: [uint8Array1, uint8Array2, ...], // JPEG/PNG 数据
    fps: 30,
    quality: 80, // 1-100
    audioData: audioUint8Array, // 可选：音频数据
    onProgress: (p) => console.log('进度:', p)
});
```

#### 4. 执行通用命令
```javascript
try {
    var result = await FFmpegService.runCommand({
        inputFiles: [
            { name: 'input.mp4', data: fileData }
        ],
        args: ['-i', 'input.mp4', '-c', 'copy', 'output.mp4'],
        outputFiles: ['output.mp4']
    });
    
    var outputData = result['output.mp4'];
} catch (e) {
    if (e.message === 'FFmpeg服务正忙，请稍后再试') {
        // 提示用户等待
    }
}
```

### 跨页面兼容性
- **独立运行**: 不同页面（如 `index.html` 和 `sth.auto.html`）拥有独立的 JS 运行环境和 FFmpeg 实例，互不干扰，可并行工作。
- **SharedArrayBuffer**: 依赖服务器响应头 `COOP` 和 `COEP` 开启跨域隔离。

## 开发指南

### 添加新功能
1.  **优先使用 FFmpegService**: 不要直接引入 `ffmpeg.min.js` 或手动管理 `createFFmpeg`。
2.  **检查 isBusy**: 调用前需捕获可能的 Busy 错误。
3.  **资源清理**: 如果编写新的 Service 方法，务必使用 `_cleanupFiles` 清理 MEMFS 中的临时文件。

### 调试
- 开启 `log: true` 可在控制台查看 FFmpeg 的详细输出。
- 如果遇到“服务正忙”且无法恢复，可调用 `FFmpegService.reset()`。
