重构
原始需求：
ffmpeg相关的音视频处理，独立一个js。重构很容易出bug，又要详细的测试，非常麻烦。所以我们把这个工作拆分几步来做，确保尽量少的bug。
1. 了解app.js里面ffmpeg相关功能、方法、函数等代码。总结都有什么使用了音视频处理。我初步整理大改有：
SVGA转MP4、SVGA转双通道MP4、MP4转双通道MP4、序列帧转双通道MP4、lottie转双通道MP4、绿幕抠图、多段变速、变速里的音频处理、MP4转SVGA的音频提取（我不确定这个算不算）、双通道MP4转SVGA的音频提取（我不确定这个算不算）。你检查下是否还有遗漏，整理成ffmpeg音视频处理列表。其他初始化、加载、错误处理、内存性能相关代码，你也了解清楚。
2. 新建ffmpeg-service.js文件，把相关的方法函数功能什么的，适合放进去的整理好。html引用ffmpeg-service.js。
3. 按照ffmpeg音视频处理列表，一个一个替换方法。可以分几步进行，不要一次性替换。一个模式一个模式去替换。旧方法注释掉，注明旧代码。
4. 检查测试，比对和旧代码实现效果是否一样，没有问题才开始删代码。根据旧代码标记可以方便的删代码。


整合后的FFmpeg重构方案
第1步：全面梳理FFmpeg相关代码
分析app.js中FFmpeg相关的所有代码，包括：
功能类代码：
- SVGA转MP4
- SVGA转双通道MP4
- MP4转双通道MP4
- 序列帧转双通道MP4
- Lottie转双通道MP4
- 绿幕抠图
- 多段变速
- 变速里的音频处理
- MP4转SVGA的音频提取
- 双通道MP4转SVGA的音频提取
基础设施类代码：
- FFmpeg初始化/加载机制（包括插队加载逻辑）
- 进度回调处理
- 错误处理和异常捕获
- 取消操作机制
- 内存清理和资源释放
- 性能优化相关代码
输出： 形成完整的FFmpeg音视频处理功能清单

---
第2步：设计ffmpeg-service.js模块架构
创建ffmpeg-service.js文件，设计统一的接口规范：
模块结构设计：
- 统一的初始化方法（确保FFmpeg只加载一次）
- 统一的进度回调接口（所有功能都能接入）
- 统一的错误处理机制（避免重复try-catch）
- 统一的取消操作接口（符合你的取消功能规范）
- 统一的资源清理方法
在正式迁移代码前，先确定：
- 对外暴露的方法名和参数设计
- 让你review接口是否合理
- 确保后续是"对接口"而不是"边写边改"

---
第3步：渐进式替换（分批次进行）
替换顺序按复杂度递增：
第一批：简单独立功能
- 绿幕抠图（确认没使用ffmpeg，任务已经去掉）
第二批：核心清晰功能
- SVGA转MP4
- MP4转双通道MP4
第三批：复杂关联功能
- SVGA转双通道MP4
- 序列帧转双通道MP4
- Lottie转双通道MP4
- 变速及音频处理（含插队加载逻辑）
- 音频提取相关
每次替换规则：
- 旧方法注释掉，标注// 旧代码 - 迁移至ffmpeg-service.js
- 保留旧代码便于对比和回滚
- 一次只替换一个功能模式

---
第4步：测试验证（每批次替换后执行）
测试维度：
- ✅ 正常流程测试
- ✅ 取消操作测试
- ✅ 错误处理测试
- ✅ 边界情况测试
- ✅ 控制台日志对比（确保输出一致）
- ✅ 性能表现对比
确认无误后：
- 根据// 旧代码标记删除注释的代码
- 在html中引用ffmpeg-service.js（第一批次替换时引入）

---
关键注意事项
1. 保留FFmpeg插队加载机制 - 特别是转SVGA弹窗触发的优先加载
2. 统一取消机制 - 符合你之前定义的取消功能规范
3. 详细注释 - 所有迁移代码必须有清晰注释，确保可维护性
4. 阶段性确认 - 每批次完成后向你汇报，确认通过再继续下一批


实际重构步骤记录
第1步完成：FFmpeg音视频处理功能清单
根据对app.js和mp4-converter.js的全面分析，整理如下：
📋 FFmpeg功能使用清单
功能类代码（你列出的+我补充的）
| 序号 | 功能名称 | 函数/代码位置 | 是否使用FFmpeg | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **SVGA转MP4** | `startMP4Conversion()` (旧版)<br>`extractFrames()` | ✅ 是 | 使用mp4-converter.js模块 |
| 2 | **SVGA转双通道MP4** | `startYyevaConversion()` | ✅ 是 | 使用DualChannelComposer模块 |
| 3 | **MP4转双通道MP4** | `startMp4ToDualChannelConversion()` (约5978行) | ✅ 是 | 视频重编码+双通道合成 |
| 4 | **序列帧转双通道MP4** | `startFramesToDualChannelConversion()` (约7465行) | ✅ 是 | 使用DualChannelComposer |
| 5 | **Lottie转双通道MP4** | `startLottieToDualChannelConversion()` (约6473行) | ✅ 是 | 使用DualChannelComposer |
| 6 | 绿幕抠图 | `applyChromaKey()` (约5318行) | ❌ 否 | 仅Canvas实时处理，不涉及FFmpeg |
| 7 | 多段变速 | `speedRemapConfig`相关逻辑 | ✅ 是 | 帧映射+音频变速 |
| 8 | 变速音频处理 | `buildAudioTempoFilter()` (约6348行) | ✅ 是 | 构建atempo滤镜链 |
| 9 | **MP4转SVGA音频提取** | `extractAudioFromMp4()` (约8184行) | ✅ 是 | 确认使用FFmpeg提取 |
| 10 | **双通道MP4转SVGA音频提取** | `extractAudioFromMp4()` (同上) | ✅ 是 | 确认使用FFmpeg提取 |
| 11 | **转换为普通MP4** | `startStandardMp4Conversion()` (约1837行) | ✅ 是 | 支持SVGA/双通道转普通MP4 |
| 12 | **普通MP4格式兼容转换** | `confirmConvertVideo()` (约3132行) | ✅ 是 | FFmpeg重编码为兼容格式 |

基础设施类代码
| 类别 | 函数/代码位置 | 行号范围 | 说明 |
| :--- | :--- | :--- | :--- |
| 初始化/加载 | `loadFFmpeg()` | 8076-8174 | SharedArrayBuffer检测、动态加载库、创建实例 |
| 插队加载机制 | `loadLibrary()` | 809行附近 | 支持highPriority参数优先加载FFmpeg |
| 进度回调 | `ffmpeg.setProgress()` | 多处 | 统一使用setProgress监控进度 |
| 错误处理 | `try-catch`包裹 | 分散在各转换函数 | 没有统一错误处理机制 |
| 取消操作 | `mp4ConvertCancelled`等标志位 | 多处 | 各功能独立实现，不统一 |
| 资源清理 | `ffmpeg.FS('unlink')` | 多处 | 删除临时文件释放内存 |
| 性能优化 | 无专门管理 | - | 无统一性能监控 |
独立模块
- mp4-converter.js：完整的FFmpeg封装模块
  - 已实现：初始化、帧序列转MP4、音频合成、进度回调、资源清理
  - 这个模块设计非常好，可以作为参考模板
- dual-channel-composer.js：双通道合成器（可能也用FFmpeg，需确认）
⚠️ 发现的问题
1. 没有统一的FFmpeg实例管理
  - app.js中：this.ffmpeg
  - mp4-converter.js中：独立的Mp4Converter.ffmpeg
  - 可能导致重复加载和内存浪费
2. 错误处理分散
  - 每个转换函数都有自己的try-catch
  - 错误提示不统一
3. 取消机制不统一
  - 有的用mp4ConvertCancelled
  - 有的用isConverting标志位检查
  - 有的传递checkCancelled回调
4. 进度回调格式不一致
  - 有的用百分比(0-100)
  - 有的用比例(0-1)
第2步替换做完
第3步第一批替换完成
第一批完成总结
✅ 已替换功能：
1. 普通MP4格式兼容性转换
2. 音频提取（支持变速）
3. 音频变速滤镜构建
4. FFmpeg加载（兼容转发）
✅ 测试通过：
- 场景4：变速音频处理 ✅
✅ 代码清理：
- 删除调试日志 ✅
- 旧代码标记保留 ✅

---
第三步第二批替换完成
已改造：
1. mp4-converter.js (SVGA转MP4核心)
   - ✅ 使用FFmpegService的统一实例
   - ✅ 避免重复加载FFmpeg
   - ✅ 添加旧代码标记
2. MP4转双通道MP4 (startMp4ToDualChannelConversion)
   - ✅ 迁移至 FFmpegService.convertMp4ToDualChannel
   - ✅ 统一错误处理
   - ✅ 统一进度回调
   - ✅ 统一取消机制

测试情况：
✅ 测试基本通过
