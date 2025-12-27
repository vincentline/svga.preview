/**
 * 站点配置加载器
 * 负责从腾讯云COS加载站点配置，支持配置缓存控制和失败降级
 */

(function(window) {
    'use strict';

    // 默认配置（加载失败时使用）
    const DEFAULT_CONFIG = {
        version: '1.0.0',
        timestamp: Date.now(),
        features: {
            advertisement: {
                enabled: false,
                position: 'right-float'
            }
        }
    };

    // 配置文件URL（需要替换为实际的腾讯云COS地址）
    const CONFIG_URL = 'https://your-bucket.cos.ap-region.myqcloud.com/config/site-config.json';

    /**
     * 站点配置管理器
     */
    class SiteConfigLoader {
        constructor() {
            this.config = null;
            this.loaded = false;
            this.callbacks = [];
        }

        /**
         * 加载配置文件
         * @param {string} configUrl - 配置文件URL（可选，默认使用CONFIG_URL）
         * @returns {Promise<Object>} 配置对象
         */
        async load(configUrl = CONFIG_URL) {
            // 如果已加载，直接返回
            if (this.loaded && this.config) {
                return this.config;
            }

            try {
                // 构造防缓存URL
                const url = this.buildCacheBustingUrl(configUrl);
                
                // 设置3秒超时
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(url, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const config = await response.json();

                // 验证配置格式
                if (!this.validateConfig(config)) {
                    throw new Error('Invalid config format');
                }

                this.config = config;
                this.loaded = true;

                console.log('[SiteConfig] 配置加载成功:', config);
                return config;

            } catch (error) {
                console.warn('[SiteConfig] 配置加载失败，使用默认配置:', error.message);
                this.config = DEFAULT_CONFIG;
                this.loaded = true;
                return DEFAULT_CONFIG;
            }
        }

        /**
         * 构造防缓存URL
         * @param {string} baseUrl - 基础URL
         * @returns {string} 带缓存参数的URL
         */
        buildCacheBustingUrl(baseUrl) {
            const timestamp = Date.now();
            const separator = baseUrl.includes('?') ? '&' : '?';
            return `${baseUrl}${separator}t=${timestamp}`;
        }

        /**
         * 验证配置格式
         * @param {Object} config - 配置对象
         * @returns {boolean} 是否有效
         */
        validateConfig(config) {
            if (!config || typeof config !== 'object') {
                return false;
            }

            // 验证必需字段
            if (!config.version || !config.timestamp || !config.features) {
                return false;
            }

            return true;
        }

        /**
         * 获取功能配置
         * @param {string} featureName - 功能名称
         * @returns {Object|null} 功能配置对象
         */
        getFeature(featureName) {
            if (!this.config || !this.config.features) {
                return null;
            }
            return this.config.features[featureName] || null;
        }

        /**
         * 检查功能是否启用
         * @param {string} featureName - 功能名称
         * @returns {boolean} 是否启用
         */
        isFeatureEnabled(featureName) {
            const feature = this.getFeature(featureName);
            return feature && feature.enabled === true;
        }

        /**
         * 等待配置加载完成
         * @returns {Promise<Object>} 配置对象
         */
        ready() {
            if (this.loaded) {
                return Promise.resolve(this.config);
            }

            return new Promise((resolve) => {
                this.callbacks.push(resolve);
            });
        }

        /**
         * 触发回调
         */
        notifyCallbacks() {
            this.callbacks.forEach(callback => callback(this.config));
            this.callbacks = [];
        }
    }

    // 创建全局实例
    window.SiteConfigLoader = new SiteConfigLoader();

    // 页面加载完成后自动加载配置
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SiteConfigLoader.load().then(() => {
                window.SiteConfigLoader.notifyCallbacks();
            });
        });
    } else {
        // DOM已加载完成，立即加载配置
        window.SiteConfigLoader.load().then(() => {
            window.SiteConfigLoader.notifyCallbacks();
        });
    }

})(window);
