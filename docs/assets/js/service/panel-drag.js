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
        // 获取弹窗头部 - 支持多种头部类名
        let header = panel.querySelector('.side-panel-header');
        // 如果没有默认头部，检查是否是素材面板
        if (!header && panel.classList.contains('material-panel')) {
          header = panel.querySelector('.material-panel-stats');
        }
        if (!header) return;

        // 标记为可拖拽
        panel.classList.add('draggable');

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        let initialStyle = null;

        // 鼠标按下事件 - 只监听左键
        header.addEventListener('mousedown', (e) => {
          // 只允许左键拖动
          if (e.button !== 0) return;

          // 防止选中文本
          e.preventDefault();

          isDragging = true;
          panel.classList.add('dragging');

          // 设置弹窗不透明度为90%
          panel.style.opacity = '0.9';

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
            transition: panel.style.transition,
            opacity: panel.style.opacity
          };

          // 隐藏滚动条，避免拖拽时页面滚动
          document.body.style.overflow = 'hidden';
        });

        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;

          // 计算偏移量
          const offsetX = e.clientX - startX;
          const offsetY = e.clientY - startY;

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
        document.addEventListener('mouseup', () => {
          if (!isDragging) return;

          isDragging = false;
          panel.classList.remove('dragging');

          // 恢复弹窗不透明度为100%，使用transition: none避免动画
          panel.style.transition = 'none';
          panel.style.opacity = '';

          // 恢复页面滚动
          document.body.style.overflow = '';

          // 强制重排
          panel.offsetHeight;

          // 保持位置固定，不恢复过渡动画
        });

        // 鼠标离开窗口事件
        document.addEventListener('mouseleave', () => {
          if (!isDragging) return;

          isDragging = false;
          panel.classList.remove('dragging');

          // 恢复弹窗不透明度为100%，使用transition: none避免动画
          panel.style.transition = 'none';
          panel.style.opacity = '';

          // 恢复页面滚动
          document.body.style.overflow = '';

          // 强制重排
          panel.offsetHeight;

          // 保持位置固定，不恢复过渡动画
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
          if (e.propertyName === 'opacity') {
            // 当关闭动画结束时，重置位置
            this.resetPanelPosition(panel);
          }

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

        // 监听动画结束事件，确保位置被重置
        panel.addEventListener('animationend', (e) => {
          this.resetPanelPosition(panel);
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
      // 延迟初始化，确保Vue组件已经渲染完成
      setTimeout(() => {
        global.MeeWoo.Service.PanelDrag.init();
      }, 100);
    });
  } else {
    // DOM已经加载完成
    // 延迟初始化，确保Vue组件已经渲染完成
    setTimeout(() => {
      global.MeeWoo.Service.PanelDrag.init();
    }, 100);
  }

  // 使用MutationObserver监听DOM变化，自动初始化新添加的面板
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // 检查是否有新节点添加
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          // 只处理元素节点
          if (node.nodeType === 1) {
            // 检查节点本身是否是面板
            if (node.classList && node.classList.contains('side-panel')) {
              global.MeeWoo.Service.PanelDrag.setupPanel(node);
            }

            // 检查节点的后代是否包含面板
            const panels = node.querySelectorAll('.side-panel');
            panels.forEach((panel) => {
              global.MeeWoo.Service.PanelDrag.setupPanel(panel);
            });
          }
        });
      }
    });
  });

  // 开始监听DOM变化 - 确保document.body存在
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    // 如果document.body不存在，等待DOMContentLoaded事件
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  }

  // 为动态添加的面板提供初始化方法
  global.MeeWoo.Service.PanelDrag.setupPanel = function (panelElement) {
    if (!panelElement) return;

    // 检查是否已经初始化过
    if (panelElement._dragInitialized) {
      return;
    }

    // 标记为已初始化
    panelElement._dragInitialized = true;

    // 获取弹窗头部 - 支持多种头部类名
    let header = panelElement.querySelector('.side-panel-header');
    // 如果没有默认头部，检查是否是素材面板
    if (!header && panelElement.classList.contains('material-panel')) {
      header = panelElement.querySelector('.material-panel-stats');
    }
    if (!header) {
      return;
    }

    // 标记为可拖拽
    panelElement.classList.add('draggable');

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let initialStyle = null;

    // 鼠标按下事件 - 只监听左键
    header.addEventListener('mousedown', (e) => {
      // 只允许左键拖动
      if (e.button !== 0) return;

      // 防止选中文本
      e.preventDefault();

      isDragging = true;
      panelElement.classList.add('dragging');

      // 设置弹窗不透明度为90%
      panelElement.style.opacity = '0.9';

      // 记录初始位置和鼠标位置
      startX = e.clientX;
      startY = e.clientY;

      // 获取初始偏移量（相对于视口）
      const rect = panelElement.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      // 保存初始样式，用于恢复
      initialStyle = {
        left: panelElement.style.left,
        right: panelElement.style.right,
        top: panelElement.style.top,
        transition: panelElement.style.transition,
        opacity: panelElement.style.opacity
      };

      // 隐藏滚动条，避免拖拽时页面滚动
      document.body.style.overflow = 'hidden';
    });

    // 鼠标移动事件
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      // 计算偏移量
      const offsetX = e.clientX - startX;
      const offsetY = e.clientY - startY;

      // 计算新位置
      const newLeft = initialLeft + offsetX;
      const newTop = initialTop + offsetY;

      // 清除可能存在的right样式，使用left定位
      panelElement.style.right = '';
      // 更新弹窗位置
      panelElement.style.left = `${newLeft}px`;
      panelElement.style.top = `${newTop}px`;

      // 禁用默认的飞行动画过渡
      panelElement.style.transition = 'none';
    });

    // 鼠标释放事件
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;

      isDragging = false;
      panelElement.classList.remove('dragging');

      // 恢复弹窗不透明度为100%，使用transition: none避免动画
      panelElement.style.transition = 'none';
      panelElement.style.opacity = '';

      // 恢复页面滚动
      document.body.style.overflow = '';

      // 强制重排
      panelElement.offsetHeight;

      // 保持位置固定，不恢复过渡动画
    });

    // 鼠标离开窗口事件
    document.addEventListener('mouseleave', () => {
      if (!isDragging) return;

      isDragging = false;
      panelElement.classList.remove('dragging');

      // 恢复弹窗不透明度为100%，使用transition: none避免动画
      panelElement.style.transition = 'none';
      panelElement.style.opacity = '';

      // 恢复页面滚动
      document.body.style.overflow = '';

      // 强制重排
      panelElement.offsetHeight;

      // 保持位置固定，不恢复过渡动画
    });
  }
})(window);
