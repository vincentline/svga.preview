/**
 * 资源管理器 (ResourceManager)
 * 统一管理 ObjectURL 的生命周期，防止内存泄漏，消除 setTimeout hack。
 * 
 * 功能：
 * 1. 自动追踪所有创建的 Blob URL。
 * 2. 支持按分组（Group）批量释放资源。
 * 3. 提供安全的资源释放机制。
 */
(function (window) {
  'use strict';

  // Ensure namespace
  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Core = window.MeeWoo.Core || {};

  function ResourceManager() {
    // 存储所有 URL，结构：{ groupName: Set<url> }
    this._groups = {};
    // 存储所有 URL 的引用计数（预留，暂未使用）
    this._refCount = {};
  }

  /**
   * 创建并追踪 ObjectURL
   * @param {Blob|File} blob - 文件对象
   * @param {string} group - 分组名称（如 'svga', 'mp4', 'common'）
   * @returns {string}生成的 ObjectURL
   */
  ResourceManager.prototype.createObjectURL = function (blob, group) {
    if (!blob) return '';
    group = group || 'default';

    var url = URL.createObjectURL(blob);

    if (!this._groups[group]) {
      this._groups[group] = new Set();
    }
    this._groups[group].add(url);

    return url;
  };

  /**
   * 释放指定的 ObjectURL
   * @param {string} url - 要释放的 URL
   * @param {string} group - (可选) 所在的组，如果提供则从组中移除
   */
  ResourceManager.prototype.revokeObjectURL = function (url, group) {
    if (!url) return;

    // 真正的释放操作
    URL.revokeObjectURL(url);

    // 从记录中移除
    if (group && this._groups[group]) {
      this._groups[group].delete(url);
    } else {
      // 如果未指定组，则遍历查找并移除（效率较低，建议指定组）
      for (var g in this._groups) {
        if (this._groups[g].has(url)) {
          this._groups[g].delete(url);
          break;
        }
      }
    }
  };

  /**
   * 释放指定分组下的所有资源
   * @param {string} group - 分组名称
   */
  ResourceManager.prototype.releaseGroup = function (group) {
    if (!this._groups[group]) return;

    var urls = this._groups[group];
    urls.forEach(function (url) {
      URL.revokeObjectURL(url);
    });

    // 清空该组
    this._groups[group].clear();
    // delete this._groups[group]; // 可选：保留空 Set 避免频繁创建
  };

  /**
   * 释放所有资源（用于页面卸载或重置）
   */
  ResourceManager.prototype.releaseAll = function () {
    for (var group in this._groups) {
      this.releaseGroup(group);
    }

    // 清理音频资源
    if (window.MeeWoo.Controllers && window.MeeWoo.Controllers.GlobalAudioManager) {
      window.MeeWoo.Controllers.GlobalAudioManager.unloadAll();
    }
  };

  // 暴露到全局命名空间
  window.MeeWoo.Core.ResourceManager = ResourceManager;
  // 创建全局单例
  window.MeeWoo.Core.resourceManager = new ResourceManager();

})(window);