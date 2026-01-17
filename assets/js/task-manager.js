/**
 * 任务管理器 (TaskManager)
 * 统一管理所有耗时任务的生命周期（注册、取消、状态查询）。
 * 
 * 设计目标：
 * 1. 解耦：app.js 不再需要硬编码维护任务列表。
 * 2. 安全：确保所有任务都能被统一取消，防止资源残留。
 * 3. 简单：采用“注册-销毁”模式，任务启动时注册，结束时销毁。
 */
(function (window) {
  'use strict';

  // Ensure namespace
  window.SvgaPreview = window.SvgaPreview || {};
  window.SvgaPreview.Core = window.SvgaPreview.Core || {};

  function TaskManager() {
    // 存储任务 Map<id, { name: string, cancel: Function }>
    this.tasks = new Map();
  }

  /**
   * 注册一个新任务
   * @param {string} name - 任务名称（用于UI提示，如 "GIF导出"）
   * @param {Function} cancelCallback - 取消任务时的回调函数
   * @returns {string} taskId - 任务唯一ID，用于任务完成时销毁
   */
  TaskManager.prototype.register = function (name, cancelCallback) {
    var id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.tasks.set(id, {
      name: name,
      cancel: cancelCallback
    });
    // console.log('[TaskManager] Registered:', name, id);
    return id;
  };

  /**
   * 标记任务完成（从列表中移除）
   * @param {string} taskId - 任务ID
   */
  TaskManager.prototype.finish = function (taskId) {
    if (this.tasks.has(taskId)) {
      // var name = this.tasks.get(taskId).name;
      this.tasks.delete(taskId);
      // console.log('[TaskManager] Finished:', name, taskId);
    }
  };

  /**
   * 取消所有正在运行的任务
   * @returns {Array<string>} 被取消的任务名称列表
   */
  TaskManager.prototype.cancelAll = function () {
    var cancelledNames = [];
    
    // 遍历所有任务并执行取消回调
    this.tasks.forEach(function (task, id) {
      if (task.cancel && typeof task.cancel === 'function') {
        try {
          task.cancel();
        } catch (e) {
          console.error('[TaskManager] Error cancelling task:', task.name, e);
        }
      }
      cancelledNames.push(task.name);
    });

    // 清空列表
    this.tasks.clear();
    return cancelledNames;
  };

  /**
   * 获取正在运行的任务列表（用于UI显示）
   * @returns {Array<{name: string}>}
   */
  TaskManager.prototype.getRunningTasks = function () {
    var list = [];
    this.tasks.forEach(function (task) {
      list.push({ name: task.name });
    });
    return list;
  };

  /**
   * 检查是否有任务正在运行
   * @returns {boolean}
   */
  TaskManager.prototype.hasRunningTasks = function () {
    return this.tasks.size > 0;
  };

  // 暴露到全局命名空间
  window.SvgaPreview.Core.TaskManager = TaskManager;
  // 创建全局单例
  window.SvgaPreview.Core.taskManager = new TaskManager();

})(window);
