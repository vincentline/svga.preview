/**
 * InputController.js
 * 负责全局输入设备的事件监听与交互状态管理
 * 
 * 职责：
 * 1. 监听全局文件拖拽事件（dragenter, dragleave, drop），管理拖拽遮罩层状态
 * 2. 接收文件并回调给业务层，不包含业务逻辑判断
 * 3. 未来可扩展键盘快捷键监听等功能
 */
(function (global) {
  'use strict';

  // Ensure namespace
  global.SvgaPreview = global.SvgaPreview || {};
  global.SvgaPreview.Controllers = global.SvgaPreview.Controllers || {};

  var InputController = function (options) {
    this.options = options || {};
    // 容器通常是 document.body
    this.container = this.options.container || document.body;

    // 回调函数
    this.onDrop = this.options.onDrop || function () { };
    this.onHoverChange = this.options.onHoverChange || function () { };

    // 内部计数器（用于解决 dragenter/leave 在子元素上频繁触发的问题）
    this.dragCounter = 0;

    // 绑定方法上下文
    this._handleDragEnter = this.handleDragEnter.bind(this);
    this._handleDragLeave = this.handleDragLeave.bind(this);
    this._handleDragOver = this.handleDragOver.bind(this);
    this._handleDrop = this.handleDrop.bind(this);

    this.init();
  };

  InputController.prototype = {
    init: function () {
      // 绑定事件
      this.container.addEventListener('dragenter', this._handleDragEnter);
      this.container.addEventListener('dragleave', this._handleDragLeave);
      this.container.addEventListener('dragover', this._handleDragOver);
      this.container.addEventListener('drop', this._handleDrop);
    },

    handleDragEnter: function (e) {
      this.dragCounter++;
      // 只有进入最外层时才通知显示遮罩
      if (this.dragCounter === 1) {
        this.onHoverChange(true);
      }
    },

    handleDragLeave: function (e) {
      this.dragCounter--;
      // 只有完全离开容器时才通知隐藏遮罩
      if (this.dragCounter === 0) {
        this.onHoverChange(false);
      }
    },

    handleDragOver: function (e) {
      // 必须阻止默认行为，否则浏览器会直接打开文件而不是触发 drop
      e.preventDefault();
    },

    handleDrop: function (e) {
      e.preventDefault();
      // 重置状态
      this.dragCounter = 0;
      this.onHoverChange(false);

      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        // 将文件移交给业务层，此处不进行任何业务判断
        this.onDrop(files);
      }
    },

    destroy: function () {
      // 移除事件监听
      this.container.removeEventListener('dragenter', this._handleDragEnter);
      this.container.removeEventListener('dragleave', this._handleDragLeave);
      this.container.removeEventListener('dragover', this._handleDragOver);
      this.container.removeEventListener('drop', this._handleDrop);
    }
  };

  // Export
  global.SvgaPreview.Controllers.InputController = InputController;

})(typeof window !== 'undefined' ? window : this);
