# YYEVA 双通道 MP4 播放器 Checklist

## 解析功能
- [x] YYEVA Metadata 解析器能正确识别 `yyeffectmp4json` 标记
- [x] Base64 解码和 zlib 解压正确执行
- [x] 解析后的 JSON 数据结构符合预期（descript, effect, datas）

## 文件检测
- [x] 普通双通道 MP4 被识别为 `type: 'dualChannel'`
- [x] YYEVA 格式 MP4 被识别为 `type: 'yyeva'`
- [x] 检测结果包含完整的 yyevaData

## 播放功能
- [x] YYEVA 视频能正常播放（RGB + Alpha 合成）
- [x] 动态元素在正确位置渲染
- [x] 文本元素渲染正确（字体、颜色、对齐方式）
- [x] 图片元素渲染正确（缩放模式）

## API 功能
- [x] `setYyevaText(effectTag, config)` 能正确设置文本内容
- [x] `setYyevaImage(effectTag, imageSource)` 能正确设置替换图片
- [x] 未设置配置时使用默认占位内容

## 兼容性
- [x] 普通双通道 MP4 播放不受影响
- [x] YYEVA 格式检测失败时降级为普通双通道播放
- [x] 动态元素渲染不影响视频帧性能

## 文档更新
- [x] help.md 中格式支持表格已更新
