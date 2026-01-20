/**
 * 站点配置加载器
 * =========================
 * 【文件职责说明】
 * 这个文件不是"配置数据本身"，而是"配置加载工具"。
 * 真正的配置数据在一个 JSON 文件里（site-config.json），部署在腾讯云 COS 或 CDN 上。
 * 
 * 【为什么需要这个文件】
 * 1. 远程配置加载：从 COS 拉取 JSON，带防缓存机制（URL 加时间戳）
 * 2. 超时控制：3秒超时，避免网络问题影响页面加载
 * 3. 格式校验：确保 JSON 结构合法（必须有 version/features）
 * 4. 失败降级：加载失败时使用 DEFAULT_CONFIG 兜底，不影响主功能
 * 5. 统一接口：提供 getFeature() / isFeatureEnabled() / ready() 等方法
 * 
 * 【当前用途】
 * - 控制广告位开关和位置（features.advertisement）
 * - 未来可扩展：主题配置、公告提示、实验性功能等
 * 
 * 【与 ad-controller.js 的关系】
 * - site-config-loader.js：负责"加载配置数据"
 * - ad-controller.js：负责"根据配置操作 DOM"（显示/隐藏广告位）
 * 
 * 【使用方式】
 * await SiteConfigLoader.ready();
 * const adConfig = SiteConfigLoader.getFeature('advertisement');
 * // adConfig 形如：{ enabled: true, position: 'right-float' }
 */

(function(window) {
    'use strict';

    // Ensure namespace exists
  // 按照项目规范，使用 MeeWoo 作为项目级命名空间
  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Core = window.MeeWoo.Core || {};

    // 默认配置（加载失败时使用）
    // 注意：这里只是兜底用，真正生效的配置建议统一放在远程 JSON 中维护
    const DEFAULT_CONFIG = {
        version: '1.0.0',
        features: {
            // 广告位配置：与 ad-controller.js 中的逻辑配合使用
            advertisement: {
                enabled: false,        // 默认关闭广告位
                position: 'right-float' // 默认位置标识（仅兜底使用）
            }
        }
    };

    // 配置文件URL（需要替换为实际的腾讯云COS地址）
    // 实际使用时：
    //  - 线上：改成你 COS / CDN 上的 site-config.json 地址
    //  - 本地调试：可以临时改成 '/site-config.json' 或相对路径
    const CONFIG_URL = 'https://blog-1258489735.cos.ap-chengdu.myqcloud.com/other/svga_set/site-config.json';

    /**
     * 站点配置管理器
     * 职责：加载配置、校验格式、提供查询接口
     */
    class SiteConfigLoader {
        constructor() {
            this.config = null;   // 当前生效的配置对象
            this.loaded = false;  // 是否已加载完成（成功或降级默认）
            this.callbacks = [];  // 等待 ready() 的回调队列
        }

        /**
         * 加载配置文件
         * @param {string} configUrl - 配置文件URL（可选，默认使用CONFIG_URL）
         * @returns {Promise<Object>} 配置对象
         * 
         * 一般不需要手动调用，页面加载完成后会自动调用一次。
         * 如果已经加载过，会直接返回缓存的 this.config。
         */
        async load(configUrl = CONFIG_URL) {
            // 如果已加载，直接返回
            if (this.loaded && this.config) {
                return this.config;
            }

            // 检测本地环境，直接使用默认配置，避免 CORS 问题
            // 兼容 file:// 协议（hostname 为空）
            const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(window.location.hostname);
            if (isLocalhost) {
                console.log('[SiteConfig] 本地环境，使用默认配置');
                this.config = DEFAULT_CONFIG;
                this.loaded = true;
                return DEFAULT_CONFIG;
            }

            try {
                // 构造防缓存URL（每次请求带时间戳参数）
                const url = this.buildCacheBustingUrl(configUrl);
                
                // 设置3秒超时，避免网络问题拖死页面
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

                // 验证配置格式（至少要有 version / features）
                if (!this.validateConfig(config)) {
                    throw new Error('Invalid config format');
                }

                this.config = config;
                this.loaded = true;

                console.log('[SiteConfig] 配置加载成功:', config);
                return config;

            } catch (error) {
                // 加载失败：使用默认配置兜底，不影响主功能使用
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
         * 
         * 通过在URL后面追加 t=timestamp，避免浏览器/CDN 缓存旧配置。
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

            // 验证必需字段（只需要 version 和 features）
            if (!config.version || !config.features) {
                return false;
            }

            return true;
        }

        /**
         * 获取功能配置
         * @param {string} featureName - 功能名称（例如 'advertisement'）
         * @returns {Object|null} 功能配置对象
         * 
         * 示例：
         *   const adConfig = SiteConfigLoader.getFeature('advertisement');
         *   // adConfig 形如：{ enabled: true, position: 'right-float' }
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
         * 
         * 用法：
         *   await SiteConfigLoader.ready();
         *   const adConfig = SiteConfigLoader.getFeature('advertisement');
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
         * 内部使用：在 load() 完成后，通知所有等待 ready() 的地方
         */
        notifyCallbacks() {
            this.callbacks.forEach(callback => callback(this.config));
            this.callbacks = [];
        }
    }

    // 创建全局实例：window.MeeWoo.Core.SiteConfig
    window.MeeWoo.Core.SiteConfig = new SiteConfigLoader();

    // 页面加载完成后自动加载配置
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.MeeWoo.Core.SiteConfig.load().then(() => {
                window.MeeWoo.Core.SiteConfig.notifyCallbacks();
            });
        });
    } else {
        // DOM已加载完成，立即加载配置
        window.MeeWoo.Core.SiteConfig.load().then(() => {
            window.MeeWoo.Core.SiteConfig.notifyCallbacks();
        });
    }

})(window);
