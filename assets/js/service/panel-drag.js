/**
 * @file panel-drag.js
 * @description 侧边弹窗拖拽功能实现
 * @author MeeWoo Team
 * @date 2026-01-26
 * 
 * 功能说明：
 * 1. 支持拖动侧边弹窗头部来移动弹窗
 * 2. 自定义关闭动画：原地消失(300ms) → 飞出去(1ms)
 * 3. 位置不记忆，重新打开时回到默认位置
 * 
 * 实现原理：
 * 1. 使用原生JavaScript事件监听实现拖拽
 * 2. 通过添加/移除CSS类实现动画效果
 * 3. 利用setTimeout控制动画时序
 */
(function (global) {
  'use strict';

  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  global.MeeWoo = global.MeeWoo || {};
  global.MeeWoo.Service = global.MeeWoo.Service || {};

  /**
   * 侧边弹窗拖拽服务
   * @type {Object}
   */
  global.MeeWoo.Service.PanelDrag = {
    /**
     * 初始化拖拽功能
     */
    init: function () {
      this.setupDragListeners();
      this.setupCloseAnimation();
    },

    /**
     * 设置拖拽事件监听器
     */
    setupDragListeners: function () {
      // 获取所有侧边弹窗
      const panels = document.querySelectorAll('.side-panel');

      panels.forEach(panel => {
        // 获取弹窗头部
        const header = panel.querySelector('.side-panel-header');
        if (!header) return;

        // 标记为可拖拽
        panel.classList.add('draggable');

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        let initialStyle = null;
        let offsetX = 0;
        let offsetY = 0;

        // 鼠标按下事件 - 只监听左键
        header.addEventListener('mousedown', (e) => {
          // 只允许左键拖动
          if (e.button !== 0) return;

          // 防止选中文本
          e.preventDefault();
          e.stopPropagation();

          isDragging = true;
          panel.classList.add('dragging');

          // 记录初始位置和鼠标位置
          startX = e.clientX;
          startY = e.clientY;

          // 获取初始偏移量（相对于视口）
          const rect = panel.getBoundingClientRect();
          initialLeft = rect.left;
          initialTop = rect.top;

          // 保存初始样式，用于恢复
          initialStyle = {
            left: panel.style.left,
            right: panel.style.right,
            top: panel.style.top,
            transition: panel.style.transition
          };

          // 隐藏滚动条，避免拖拽时页面滚动
          document.body.style.overflow = 'hidden';
        });

        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;

          e.preventDefault();
          e.stopPropagation();

          // 计算偏移量
          offsetX = e.clientX - startX;
          offsetY = e.clientY - startY;

          // 计算新位置
          const newLeft = initialLeft + offsetX;
          const newTop = initialTop + offsetY;

          // 清除可能存在的right样式，使用left定位
          panel.style.right = '';
          // 更新弹窗位置
          panel.style.left = `${newLeft}px`;
          panel.style.top = `${newTop}px`;

          // 禁用默认的飞行动画过渡
          panel.style.transition = 'none';
        });

        // 鼠标释放事件
        document.addEventListener('mouseup', (e) => {
          if (!isDragging) return;

          isDragging = false;
          panel.classList.remove('dragging');

          // 恢复页面滚动
          document.body.style.overflow = '';

          // 恢复过渡动画
          panel.style.transition = '';
        });

        // 鼠标离开窗口事件
        document.addEventListener('mouseleave', () => {
          if (!isDragging) return;

          isDragging = false;
          panel.classList.remove('dragging');

          // 恢复页面滚动
          document.body.style.overflow = '';

          // 恢复过渡动画
          panel.style.transition = '';
        });
      });
    },

    /**
     * 设置关闭动画
     */
    setupCloseAnimation: function () {
      // 获取所有侧边弹窗
      const panels = document.querySelectorAll('.side-panel');

      panels.forEach(panel => {
        // 监听关闭动画结束事件
        panel.addEventListener('transitionend', (e) => {
          if (e.propertyName === 'opacity' && panel.classList.contains('closing')) {
            // 原地消失动画结束后，添加fly-out类开始飞出去动画
            panel.classList.add('fly-out');

            // 重置位置（回默认位置）
            if (panel.classList.contains('side-panel--left')) {
              panel.style.left = '-400px';
            } else {
              panel.style.right = '-400px';
            }

            // 重置top和transform
            panel.style.top = '';
            panel.style.transform = '';

            // 动画结束后移除类名，准备下次打开
            setTimeout(() => {
              panel.classList.remove('closing', 'fly-out');
            }, 100);
          }
        });
      });
    },

    /**
     * 自定义关闭弹窗方法
     * @param {HTMLElement} panel - 要关闭的弹窗元素
     */
    closePanel: function (panel) {
      if (!panel) return;

      // 移除show类
      panel.classList.remove('show');

      // 添加closing类，开始原地消失动画
      panel.classList.add('closing');
    },

    /**
     * 重置弹窗位置到默认位置
     * @param {HTMLElement} panel - 要重置的弹窗元素
     */
    resetPanelPosition: function (panel) {
      if (!panel) return;

      // 移除所有拖拽相关样式
      panel.style.left = '';
      panel.style.right = '';
      panel.style.top = '';
      panel.style.transform = '';

      // 移除拖拽相关类
      panel.classList.remove('dragging', 'closing', 'fly-out');
    }
  };

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      global.MeeWoo.Service.PanelDrag.init();
    });
  } else {
    // DOM已经加载完成
    global.MeeWoo.Service.PanelDrag.init();
  }
})(window);
