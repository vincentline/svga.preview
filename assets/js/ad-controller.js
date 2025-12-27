/**
 * 广告位控制器
 * 根据站点配置控制广告位的显示和隐藏
 */

(function(window) {
    'use strict';

    /**
     * 广告位管理器
     */
    class AdController {
        constructor() {
            this.initialized = false;
            this.containers = new Map(); // 存储广告位容器
        }

        /**
         * 初始化广告位控制器
         */
        async init() {
            if (this.initialized) {
                return;
            }

            // 等待配置加载完成
            await window.SiteConfigLoader.ready();

            // 查找所有广告位容器
            this.findAdContainers();

            // 应用配置
            this.applyConfig();

            this.initialized = true;
            console.log('[AdController] 初始化完成');
        }

        /**
         * 查找页面中的广告位容器
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
         * @param {string} position - 广告位位置标识
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
         */
        isAdVisible(position) {
            const container = this.containers.get(position);
            if (!container) {
                return false;
            }
            return container.getAttribute('data-ad-visible') === 'true';
        }
    }

    // 创建全局实例
    window.AdController = new AdController();

    // 页面加载完成后自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.AdController.init();
        });
    } else {
        // DOM已加载完成，立即初始化
        window.AdController.init();
    }

})(window);
