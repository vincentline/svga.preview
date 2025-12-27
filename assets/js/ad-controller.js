/**
 * 广告位控制器
 * =========================
 * 【文件职责说明】
 * 这个文件只负责"操作页面上的广告位 DOM"（显示 / 隐藏），
 * 不保存配置数据本身。
 * 
 * 【配置数据来源】
 * 配置信息来自 SiteConfigLoader：
 *   const adConfig = SiteConfigLoader.getFeature('advertisement');
 *   // 形如：{ enabled: true, position: 'right-float' }
 * 
 * 【广告位容器标记】
 * 广告位容器通过 HTML 中的 data-ad-position 属性标记：
 *   <div data-ad-position="right-float"> ... </div>
 * 
 * 【控制逻辑】
 * - 如果广告开关关闭 或 获取不到配置：隐藏所有广告位
 * - 如果广告开关开启：只显示 position 对应的那一个容器
 * 
 * 【与 site-config-loader.js 的关系】
 * - site-config-loader.js：负责"加载配置数据"
 * - ad-controller.js：负责"根据配置操作 DOM"
 */

(function(window) {
    'use strict';

    /**
     * 广告位管理器
     * 职责：
     * - 扫描页面上所有 data-ad-position 容器
     * - 根据配置（features.advertisement）决定显示/隐藏哪个
     */
    class AdController {
        constructor() {
            this.initialized = false;
            this.containers = new Map(); // 存储广告位容器：key = position, value = DOM元素
        }

        /**
         * 初始化广告位控制器
         * 使用方式：文件底部会在 DOMContentLoaded 后自动调用一次 init()
         */
        async init() {
            if (this.initialized) {
                return;
            }

            // 等待站点配置加载完成（SiteConfigLoader 会自动去拉远程 JSON）
            await window.SiteConfigLoader.ready();

            // 查找所有广告位容器
            this.findAdContainers();

            // 根据配置应用显示/隐藏逻辑
            this.applyConfig();

            this.initialized = true;
            console.log('[AdController] 初始化完成');
        }

        /**
         * 查找页面中的广告位容器
         * 
         * 规则：
         * - 所有带 data-ad-position="xxx" 的元素都会被收集
         * - 其中 xxx 要与配置里的 features.advertisement.position 对应
         */
        findAdContainers() {
            const containers = document.querySelectorAll('[data-ad-position]');
            containers.forEach(container => {
                const position = container.getAttribute('data-ad-position');
                this.containers.set(position, container);
                console.log(`[AdController] 发现广告位容器: ${position}`);
            });
        }

        /**
         * 应用配置到广告位
         * 
         * adConfig 格式示例：
         * {
         *   enabled: true,
         *   position: 'right-float'
         * }
         * 
         * 逻辑：
         * - 如果未配置 / 加载失败：隐藏所有广告位（不影响主功能）
         * - 如果 enabled=false：隐藏所有广告位
         * - 如果 enabled=true：只显示 position 对应的那个
         */
        applyConfig() {
            const adConfig = window.SiteConfigLoader.getFeature('advertisement');
            
            if (!adConfig) {
                console.log('[AdController] 未找到广告位配置，隐藏所有广告位');
                this.hideAllAds();
                return;
            }

            const { enabled, position } = adConfig;

            if (enabled && position) {
                // 启用指定位置的广告位
                this.showAd(position);
                console.log(`[AdController] 显示广告位: ${position}`);
            } else {
                // 隐藏所有广告位
                this.hideAllAds();
                console.log('[AdController] 广告位已禁用');
            }
        }

        /**
         * 显示指定位置的广告位
         * @param {string} position - 广告位位置标识（需与 data-ad-position 一致）
         */
        showAd(position) {
            const container = this.containers.get(position);
            if (container) {
                container.style.display = 'block';
                container.setAttribute('data-ad-visible', 'true');
            } else {
                console.warn(`[AdController] 未找到广告位容器: ${position}`);
            }
        }

        /**
         * 隐藏指定位置的广告位
         * @param {string} position - 广告位位置标识
         */
        hideAd(position) {
            const container = this.containers.get(position);
            if (container) {
                container.style.display = 'none';
                container.setAttribute('data-ad-visible', 'false');
            }
        }

        /**
         * 隐藏所有广告位
         */
        hideAllAds() {
            this.containers.forEach((container, position) => {
                this.hideAd(position);
            });
        }

        /**
         * 检查指定位置的广告位是否可见
         * @param {string} position - 广告位位置标识
         * @returns {boolean} 是否可见
         * 
         * 可用于后续逻辑判断，例如避免和别的浮层抢位置。
         */
        isAdVisible(position) {
            const container = this.containers.get(position);
            if (!container) {
                return false;
            }
            return container.getAttribute('data-ad-visible') === 'true';
        }
    }

    // 创建全局实例：window.AdController
    window.AdController = new AdController();

    // 页面加载完成后自动初始化广告控制
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.AdController.init();
        });
    } else {
        // DOM已加载完成，立即初始化
        window.AdController.init();
    }

})(window);
