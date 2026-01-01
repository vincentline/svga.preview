/**
 * 视图控制器模块（ViewportController）
 * 
 * ===== 模块职责 =====
 * 管理播放器画布的视图变换（缩放、平移、居中）
 * 与 PlayerController（播放控制）分离，保持职责单一原则
 * 
 * ===== 设计思路 =====
 * 1. 状态管理：维护 scale、offsetX、offsetY 三个视图状态
 * 2. 回调机制：通过 onViewportChange 回调通知主应用更新 Vue 响应式数据
 * 3. 配置化：支持自定义缩放范围、步长、屏幕高度比例等
 * 4. 无依赖：不依赖任何第三方库，可独立运行
 * 
 * ===== 核心概念 =====
 * - scale（缩放比例）：1.0 表示原始尺寸，0.5 表示缩小一半，2.0 表示放大一倍
 * - offsetX（水平偏移）：正值向右移动，负值向左移动（像素）
 * - offsetY（垂直偏移）：正值向下移动，负值向上移动（像素）
 * - transform-origin: top center - CSS 缩放原点为顶部中心？
 * 
 * ===== 使用示例 =====
 * ```javascript
 * // 1. 创建控制器实例
 * var viewportController = new ViewportController({
 *   // 获取当前内容尺寸的回调
 *   getContentSize: function() { 
 *     return { width: 1080, height: 1920 }; 
 *   },
 *   // 视图变化时的回调（用于同步 Vue 数据）
 *   onViewportChange: function(scale, offsetX, offsetY) {
 *     this.viewerScale = scale;
 *     this.viewerOffsetX = offsetX;
 *     this.viewerOffsetY = offsetY;
 *   },
 *   footerHeight: 154,        // 底部浮层高度
 *   screenHeightRatio: 0.75,  // 初始缩放：屏幕高度75%
 *   minScale: 0.1,            // 最小缩放比例
 *   maxScale: 5,              // 最大缩放比例
 *   zoomStep: 0.1             // 每次缩放步长
 * });
 * 
 * // 2. 加载新文件时：计算初始缩放 + 居中
 * var initialScale = viewportController.calculateInitialScale(1080, 1920);
 * viewportController.setScale(initialScale, false); // 不触发回调
 * viewportController.centerView(); // 居中并触发回调
 * 
 * // 3. 用户交互：缩放
 * viewportController.zoomIn();  // 放大 10%
 * viewportController.zoomOut(); // 缩小 10%
 * 
 * // 4. 用户交互：1:1 显示
 * viewportController.setScaleTo1(); // scale = 1.0
 * 
 * // 5. 用户交互：适应屏幕
 * viewportController.resetView(); // 重新计算初始缩放并居中
 * ```
 * 
 * ===== 注意事项 =====
 * - 所有方法默认会触发 onViewportChange 回调，除非明确传入 notify=false
 * - 缩放和平移不会自动限制画布边界，需要在应用层处理（如果需要）
 * - zoomIn/zoomOut 采用围绕中心点缩放模式，自动调整 offsetY 保持中心点不动
 * - applyZoomWithCenterPoint() 实现了中心点缩放的核心逻辑
 */

(function (global) {
  'use strict';

  /**
   * 视图控制器构造函数
   * 
   * @param {Object} options - 配置选项
   * @param {Function} options.getContentSize - 获取当前内容尺寸的回调函数，返回 {width, height}
   * @param {Function} options.onViewportChange - 视图变化时的回调函数 (scale, offsetX, offsetY)
   * @param {Number} [options.footerHeight=154] - 底部浮层高度（像素）
   * @param {Number} [options.screenHeightRatio=0.75] - 初始缩放时屏幕高度占比
   * @param {Number} [options.minScale=0.1] - 最小缩放比例
   * @param {Number} [options.maxScale=5] - 最大缩放比例
   * @param {Number} [options.zoomStep=0.1] - 每次缩放的步长
   */
  function ViewportController(options) {
    this.options = options || {};

    // 回调函数
    this.getContentSize = options.getContentSize || function () { return null; };
    this.onViewportChange = options.onViewportChange || function () { };

    // 视图状态（内部状态，通过回调同步到 Vue）
    this.scale = 1;      // 缩放比例
    this.offsetX = 0;    // 水平偏移（像素）
    this.offsetY = 0;    // 垂直偏移（像素）

    // 视图模式状态：'fit-height' 适应屏幕高度 | '1:1' 原始尺寸
    this.viewMode = 'fit-height';

    // 配置参数
    this.headerHeight = options.headerHeight || 36;                // 顶部标题栏高度
    this.footerHeight = options.footerHeight || 154;                    // 底部浮层高度
    this.defaultScreenHeightRatio = options.screenHeightRatio || 0.75; // 默认屏幕高度的75%
    this.minScale = options.minScale || 0.1;                           // 最小缩放 10%
    this.maxScale = options.maxScale || 5;                             // 最大缩放 500%
    this.zoomStep = options.zoomStep || 0.1;                           // 每次缩放 10%
  }

  /**
   * 计算初始缩放比例
   * 
   * ===== 功能说明 =====
   * 根据内容尺寸和屏幕高度，计算合适的初始缩放比例
   * 使内容高度占屏幕高度的 75%（默认，可通过 screenHeightRatio 配置）
   * 
   * ===== 计算逻辑 =====
   * 1. 获取窗口高度：window.innerHeight（整个浏览器窗口的高度）
   * 2. 计算目标高度：窗口高度 * 75%
   *    注意：这里用的是整个窗口高度，不减去底部浮层（footerHeight）
   *    原因：75%是相对屏幕的视觉占比，不是可用空间占比
   * 3. 计算缩放比例：目标高度 / 内容原始高度
   * 4. 限制范围：0.1 ~ 5.0（可配置 minScale/maxScale）
   * 
   * ===== 与居中计算的区别 =====
   * - 初始缩放：决定画布显示多大（基于整个窗口高度）
   * - 居中偏移：决定画布在可视区域的位置（需要减去 footerHeight）
   * 
   * @param {Number} contentWidth - 内容原始宽度（像素）
   * @param {Number} contentHeight - 内容原始高度（像素）
   * @returns {Number} 缩放比例 (0.1 ~ 5.0)
   * 
   * @example
   * // 示例1：1080x1920 的内容，在 1080p 屏幕上
   * // 窗口高度 = 1080, 目标高度 = 1080 * 0.75 = 810
   * // 缩放比例 = 810 / 1920 = 0.421875
   * var scale = controller.calculateInitialScale(1080, 1920); // 返回 0.421875
   * 
   * // 示例2：750x1334 的内容，在竖屏手机上
   * // 窗口高度 = 1334, 目标高度 = 1000.5
   * // 缩放比例 = 1000.5 / 1334 = 0.75
   * var scale = controller.calculateInitialScale(750, 1334); // 返回 0.75
   */
  ViewportController.prototype.calculateInitialScale = function (contentWidth, contentHeight) {
    if (!contentWidth || !contentHeight) return 1;

    // 获取整个窗口高度（包括底部浮层区域）
    var windowHeight = window.innerHeight;

    // 计算目标高度 = 窗口高度 * 75%
    // 注意：这里不减去 footerHeight，因为75%是相对屏幕的视觉占比
    var targetHeight = windowHeight * this.defaultScreenHeightRatio; // 默认0.75

    // 根据内容原始高度计算缩放比例
    // 例如：内容1920px，目标810px，则 scale = 0.421875
    var scale = targetHeight / contentHeight;

    // 限制缩放范围，避免过度缩小或放大
    // 默认范围：0.1（10%）~ 5.0（500%）
    if (scale < this.minScale) scale = this.minScale;
    if (scale > this.maxScale) scale = this.maxScale;

    return scale;
  };

  /**
   * 设置缩放比例
   * 
   * 功能：
   *   直接设置缩放比例，并通过回调通知主应用
   *   会自动限制在允许的范围内 (minScale ~ maxScale)
   * 
   * @param {Number} scale - 新的缩放比例
   * @param {Boolean} [notify=true] - 是否触发 onViewportChange 回调
   * 
   * @example
   * // 设置为原始尺寸（100%）
   * controller.setScale(1.0);
   * 
   * // 设置为 200%，但不触发回调
   * controller.setScale(2.0, false);
   */
  ViewportController.prototype.setScale = function (scale, notify) {
    // 限制缩放范围
    if (scale < this.minScale) scale = this.minScale;
    if (scale > this.maxScale) scale = this.maxScale;

    this.scale = scale;

    // 默认触发回调，除非明确传入 false
    if (notify !== false) {
      this.onViewportChange(this.scale, this.offsetX, this.offsetY);
    }
  };

  /**
   * 设置偏移量
   * 
   * 功能：
   *   直接设置水平和垂直偏移量
   *   通常用于拖拽画布后更新位置
   * 
   * @param {Number} offsetX - 水平偏移（像素）
   * @param {Number} offsetY - 垂直偏移（像素）
   * @param {Boolean} [notify=true] - 是否触发 onViewportChange 回调
   * 
   * @example
   * // 重置偏移到原点
   * controller.setOffset(0, 0);
   * 
   * // 向右移动 100px，向下移动 50px
   * controller.setOffset(100, 50);
   */
  ViewportController.prototype.setOffset = function (offsetX, offsetY, notify) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // 默认触发回调，除非明确传入 false
    if (notify !== false) {
      this.onViewportChange(this.scale, this.offsetX, this.offsetY);
    }
  };

  /**
   * 居中视图
   * 
   * ===== 功能说明 =====
   * 将内容在可视区域内垂直居中显示，水平偏移重置为 0
   * 通常在加载新文件或改变缩放比例后调用
   * 
   * ===== 计算逻辑 =====
   * 1. 计算可用高度 = 窗口高度 - 顶部标题栏高度(headerHeight) - 底部浮层高度(footerHeight)
   *    原因：顶部和底部会遮挡内容，需要避开这些区域
   *    沉浸模式：headerHeight=0, footerHeight=80
   *    正常模式：headerHeight=36, footerHeight=154
   * 2. 计算内容当前高度 = 原始高度 * 当前缩放比例
   * 3. 判断是否需要居中：
   *    - 如果内容高度 < 可用高度：居中显示（计算上下留白）
   *    - 如果内容高度 >= 可用高度：顶部对齐（offsetY = headerHeight）
   * 4. 水平方向：始终居中（offsetX = 0，CSS 通过 left:50% + translateX(-50%) 实现）
   * 
   * ===== 与初始缩放的区别 =====
   * - 初始缩放（calculateInitialScale）：
   *   使用整个窗口高度计算，不减 headerHeight/footerHeight
   *   目的：决定画布显示多大（视觉占比75%）
   * 
   * - 居中偏移（centerView）：
   *   使用可用高度（窗口高度 - headerHeight - footerHeight）
   *   目的：决定画布在可视区域的位置，避开顶部和底部浮层
   * 
   * ===== headerHeight 的作用 =====
   * headerHeight = 顶部标题栏的实际高度（默认36px）
   * 用于居中计算时避开顶部遮挡区域
   * 沉浸模式下标题栏隐藏，headerHeight=0
   * 如果以后标题栏高度改为50px，需要同步修改这个值
   * 
   * @example
   * // 加载新文件后居中
   * controller.setScale(initialScale, false);
   * controller.centerView();
   * 
   * // 示例计算：
   * // 窗口高度 = 1080px
   * // 顶部标题栏 = 36px
   * // 底部浮层 = 154px
   * // 可用高度 = 1080 - 36 - 154 = 890px
   * // 内容高度 = 1920 * 0.42 = 806.4px
   * // 居中偏移 = 36 + (890 - 806.4) / 2 = 36 + 41.8 = 77.8px
   */
  ViewportController.prototype.centerView = function () {
    // 计算可用高度 = 窗口高度 - 顶部标题栏 - 底部浮层
    // 这里必须减去 headerHeight 和 footerHeight，因为它们会遮挡内容
    var availableHeight = window.innerHeight - this.headerHeight - this.footerHeight;

    // 获取内容原始尺寸
    var size = this.getContentSize();

    // 计算内容当前高度 = 原始高度 * 当前缩放比例
    var contentHeight = size ? size.height * this.scale : 0;

    // 重置水平偏移（水平居中由 CSS 的 left:50% + translateX(-50%) 实现）
    this.offsetX = 0;

    // 计算垂直偏移（居中）
    if (contentHeight > 0 && contentHeight < availableHeight) {
      // 情况1：内容高度小于可用高度 → 居中显示
      // offsetY = headerHeight + 上方留白 - 视觉偏移调整
      // 数学居中往往视觉偏下，向上偏移20px获得更好的视觉居中效果
      this.offsetY = this.headerHeight + (availableHeight - contentHeight) / 2 - 20;
    } else {
      // 情况2：内容高度超出可用高度 → 顶部对齐
      // 避免出现顶部空白，让用户可以从头开始查看内容
      this.offsetY = this.headerHeight;
    }

    // 触发回调，通知主应用更新 Vue 数据
    this.onViewportChange(this.scale, this.offsetX, this.offsetY);
  };

  /**
   * 放大
   * 
   * 功能：
   *   每次增加固定步长 (zoomStep，默认0.1)
   *   围绕播放器中心点缩放，保持中心点位置不变
   * 
   * 实现：
   *   调用 applyZoomWithCenterPoint() 自动补偿偏移量
   * 
   * @example
   * // 点击 + 按钮或滚轮向上
   * controller.zoomIn(); // scale: 0.5 -> 0.6，中心点保持不动
   */
  ViewportController.prototype.zoomIn = function () {
    var oldScale = this.scale;
    var newScale = Math.min(oldScale + this.zoomStep, this.maxScale);
    this.applyZoomWithCenterPoint(oldScale, newScale);
  };

  /**
   * 缩小
   * 
   * 功能：
   *   每次减少固定步长 (zoomStep，默认0.1)
   *   围绕播放器中心点缩放，保持中心点位置不变
   * 
   * 实现：
   *   调用 applyZoomWithCenterPoint() 自动补偿偏移量
   * 
   * @example
   * // 点击 - 按钮或滚轮向下
   * controller.zoomOut(); // scale: 0.6 -> 0.5，中心点保持不动
   */
  ViewportController.prototype.zoomOut = function () {
    var oldScale = this.scale;
    var newScale = Math.max(oldScale - this.zoomStep, this.minScale);
    this.applyZoomWithCenterPoint(oldScale, newScale);
  };

  /**
   * 应用缩放并保持中心点不动
   * 
   * 功能：
   *   改变缩放比例的同时，调整垂直偏移量
   *   使得画面中心点相对屏幕的位置保持不变
   * 
   * 原理详解：
   *   - CSS transform-origin 设置为 "top center"，缩放从顶部中心开始
   *   - 缩放时，内容高度变化，但顶部位置固定
   *   - 这会导致画面中心点相对屏幕移动
   *   - 需要计算偏移补偿：offsetY -= (新高度 - 旧高度) / 2
   * 
   * 使用场景：
   *   zoomIn/zoomOut 方法内部调用，实现围绕中心点缩放
   * 
   * @param {Number} oldScale - 旧的缩放比例
   * @param {Number} newScale - 新的缩放比例
   * 
   * @example
   * // 从 0.5 缩放到 0.6，保持中心点不动
   * controller.applyZoomWithCenterPoint(0.5, 0.6);
   */
  ViewportController.prototype.applyZoomWithCenterPoint = function (oldScale, newScale) {
    var size = this.getContentSize();

    if (size && size.height > 0) {
      var oldHeight = size.height * oldScale;
      var newHeight = size.height * newScale;
      var heightDiff = newHeight - oldHeight;

      // 向上调整 offsetY，让中心点保持不动
      this.offsetY -= heightDiff / 2;
    }

    this.scale = newScale;
    this.onViewportChange(this.scale, this.offsetX, this.offsetY);
  };

  /**
   * 重置视图
   * 
   * 功能：
   *   重新计算初始缩放比例并居中显示
   *   相当于重置到刚加载文件时的状态
   * 
   * 调用场景：
   *   - 点击“适应屏幕”按钮
   *   - 需要恢复到默认视图状态
   * 
   * @example
   * // 点击“适应屏幕”
   * controller.resetView();
   */
  ViewportController.prototype.resetView = function () {
    var size = this.getContentSize();
    if (!size) return;

    var initialScale = this.calculateInitialScale(size.width, size.height);
    this.scale = initialScale;
    this.viewMode = 'fit-height'; // 设置为适应屏幕高度模式
    this.centerView();
  };

  /**
   * 设置为 1:1 缩放（原始尺寸）
   * 
   * 功能：
   *   将缩放比例设为 1.0，并自动居中
   *   即显示内容的实际像素尺寸
   * 
   * 调用场景：
   *   - 点击 "1:1" 按钮
   *   - 查看原始分辨率
   * 
   * 注意：
   *   会自动调用 centerView() 进行居中
   *   居中位置计算方式与适应窗口一致，减去底部浮层高度
   * 
   * @example
   * // 点击 1:1 按钮
   * controller.setScaleTo1(); // 自动居中
   */
  ViewportController.prototype.setScaleTo1 = function () {
    this.scale = 1.0;
    this.viewMode = '1:1'; // 设置为1:1模式
    // 自动居中，使用与适应窗口相同的居中逻辑
    this.centerView();
  };

  /**
   * 切换视图模式
   * 
   * 功能：
   *   在1:1和适应屏幕高度两种模式间切换
   *   无论用户过程中怎么缩放，都只简单切换状态
   * 
   * 逻辑：
   *   - 当前是 'fit-height' → 切换到 '1:1' （scale = 1.0）
   *   - 当前是 '1:1' → 切换到 'fit-height' （重置为初始缩放）
   * 
   * 调用场景：
   *   - 点击底部浮层的切换按钮（1:1 / 适应屏幕高度）
   * 
   * @example
   * // 点击切换按钮
   * controller.toggleViewMode();
   */
  ViewportController.prototype.toggleViewMode = function () {
    if (this.viewMode === 'fit-height') {
      // 当前是适应屏幕高度 → 切换到1:1
      this.setScaleTo1();
    } else {
      // 当前是1:1 → 切换到适应屏幕高度
      this.resetView();
    }
  };

  /**
   * 获取当前视图模式
   * 
   * @returns {String} 'fit-height' 或 '1:1'
   */
  ViewportController.prototype.getViewMode = function () {
    return this.viewMode;
  };

  /**
   * 设置底部浮层高度
   * 
   * 功能：
   *   动态更新底部浮层高度，用于沉浸模式切换
   *   沉浸模式时footerHeight=80px（mini浮层）
   *   正常模式时footerHeight=154px（完整浮层）
   * 
   * @param {Number} height - 新的底部浮层高度（像素）
   * 
   * @example
   * // 进入沉浸模式
   * controller.setFooterHeight(80);
   * 
   * // 退出沉浸模式
   * controller.setFooterHeight(154);
   */
  ViewportController.prototype.setFooterHeight = function (height) {
    this.footerHeight = height;
  };

  /**
   * 设置顶部标题栏高度
   * 
   * 功能：
   *   动态更新顶部标题栏高度，用于沉浸模式切换
   *   沉浸模式时headerHeight=0（标题栏隐藏）
   *   正常模式时headerHeight=36px
   * 
   * @param {Number} height - 新的顶部标题栏高度（像素）
   * 
   * @example
   * // 进入沉浸模式
   * controller.setHeaderHeight(0);
   * 
   * // 退出沉浸模式
   * controller.setHeaderHeight(36);
   */
  ViewportController.prototype.setHeaderHeight = function (height) {
    this.headerHeight = height;
  };

  /**
   * 获取当前视图状态
   * 
   * 功能：
   *   返回当前的缩放比例和偏移量
   *   用于保存或调试
   * 
   * @returns {Object} 视图状态对象
   * @returns {Number} return.scale - 当前缩放比例
   * @returns {Number} return.offsetX - 当前水平偏移（像素）
   * @returns {Number} return.offsetY - 当前垂直偏移（像素）
   * 
   * @example
   * var state = controller.getViewportState();
   * console.log(state); // { scale: 0.5, offsetX: 0, offsetY: 100 }
   */
  ViewportController.prototype.getViewportState = function () {
    return {
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };
  };

  /**
   * 销毁控制器
   * 
   * 功能：
   *   清理所有回调引用，防止内存泄漏
   *   在组件卸载或重新初始化前调用
   * 
   * @example
   * // 重新初始化前先销毁旧实例
   * if (this.viewportController) {
   *   this.viewportController.destroy();
   *   this.viewportController = null;
   * }
   */
  ViewportController.prototype.destroy = function () {
    this.getContentSize = null;
    this.onViewportChange = null;
  };

  // 导出到全局
  global.ViewportController = ViewportController;

})(window);
