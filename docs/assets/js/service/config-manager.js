/**
 * 用户配置管理器
 * 负责持久化存储用户偏好设置 (localStorage)
 * 
 * 【功能特性】
 * 1. 单例模式：确保全局只有一个管理器实例，避免状态冲突。
 * 2. 跨标签页同步：当其他标签页修改配置时，自动同步更新。
 * 3. 路径访问：支持 'user.theme' 形式的深层键值访问。
 * 4. 容错处理：加载失败时尝试保留原始数据，避免意外清空。
 */
(function (global) {
  'use strict';

  // Ensure namespace
  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Core = window.MeeWoo.Core || {};

  const STORAGE_KEY = 'svga_preview_user_config';
  let instance = null;

  class ConfigManager {
    constructor() {
      // 单例模式检查
      if (instance) {
        return instance;
      }

      this.config = {};
      this._init();

      // 监听跨标签页的存储变化
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
          this.config = this._load(); // 重新加载最新配置
        }
      });

      instance = this;
    }

    /**
     * 初始化：加载配置
     * @private
     */
    _init() {
      this.config = this._load();
    }

    /**
     * 从 localStorage 加载配置
     * @private
     * @returns {Object} 配置对象
     */
    _load() {
      try {
        // 检查 localStorage 是否可用
        if (!localStorage) {
          console.warn('[ConfigManager] localStorage 不可用');
          return {};
        }
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.error('[ConfigManager] 存储配额超出，配置加载失败');
          this._handleQuotaExceeded();
        } else {
          console.warn('[ConfigManager] 配置加载失败，可能数据已损坏:', e);
        }
        // 发生错误时返回空对象，但在实际生产中可能需要备份旧数据
        // 这里简单处理：若解析失败，视为无配置，不覆盖原始损坏数据（直到下一次保存）
        return {};
      }
    }

    /**
     * 保存配置到 localStorage
     * @private
     */
    _persist() {
      try {
        const data = JSON.stringify(this.config);
        // 检查存储大小是否可能超出配额
        const dataSize = new Blob([data]).size;
        // localStorage 通常有 5MB 配额，这里检查是否接近限制
        if (dataSize > 4.5 * 1024 * 1024) {
          console.warn('[ConfigManager] 配置数据接近存储配额限制:', dataSize, 'bytes');
          // 可以在这里添加清理逻辑，例如移除旧的或不常用的配置
        }
        localStorage.setItem(STORAGE_KEY, data);
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.error('[ConfigManager] 存储配额超出，配置保存失败');
          // 可以在这里添加清理逻辑，例如清空部分配置
          this._handleQuotaExceeded();
        } else {
          console.error('[ConfigManager] 配置保存失败:', e);
        }
      }
    }

    /**
     * 处理存储配额超出的情况
     * @private
     */
    _handleQuotaExceeded() {
      try {
        // 尝试清空所有配置以释放空间
        this.config = {};
        localStorage.removeItem(STORAGE_KEY);
        console.warn('[ConfigManager] 已清空配置以释放存储空间');
      } catch (e) {
        console.error('[ConfigManager] 清理配置失败:', e);
      }
    }

    /**
     * 获取配置项
     * @param {string} key 配置键，支持 'a.b.c' 路径格式
     * @param {*} defaultValue 默认值（当值为 undefined 时返回）
     * @returns {*} 配置值
     */
    get(key, defaultValue) {
      if (!key) return this.config;

      const keys = key.split('.');
      let result = this.config;

      for (const k of keys) {
        if (result === undefined || result === null) {
          return defaultValue;
        }
        result = result[k];
      }

      return result !== undefined ? result : defaultValue;
    }

    /**
     * 设置配置项
     * @param {string} key 配置键，支持 'a.b.c' 路径格式
     * @param {*} value 配置值（请勿存储 Function/Symbol/循环引用对象）
     */
    set(key, value) {
      const keys = key.split('.');
      const lastKey = keys.pop();
      let target = this.config;

      // 逐层寻找目标对象，不存在则创建
      for (const k of keys) {
        if (typeof target[k] !== 'object' || target[k] === null) {
          target[k] = {};
        }
        target = target[k];
      }

      target[lastKey] = value;
      this._persist();
    }

    /**
     * 获取所有配置的副本
     * @returns {Object}
     */
    getAll() {
      return JSON.parse(JSON.stringify(this.config));
    }

    /**
     * 移除配置项
     * @param {string} key 配置键，支持 'a.b.c' 路径格式
     */
    remove(key) {
      const keys = key.split('.');
      const lastKey = keys.pop();
      let target = this.config;

      for (const k of keys) {
        if (typeof target[k] !== 'object' || target[k] === null) {
          return; // 路径不存在，无需删除
        }
        target = target[k];
      }

      delete target[lastKey];
      this._persist();
    }

    /**
     * 清空所有配置
     */
    clear() {
      this.config = {};
      this._persist();
    }
  }

  // 暴露到全局命名空间
  global.MeeWoo.Core.ConfigManager = ConfigManager;

})(window);
