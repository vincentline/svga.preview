/**
 * 用户类型控制器
 * =========================
 * 【文件职责说明】
 * 这个文件负责根据用户类型控制页面元素的显示/隐藏，
 * 特别是左侧边栏的按钮。
 * 
 * 【用户类型来源】
 * 用户类型信息来自 SiteConfigLoader：
 *   const userType = SiteConfigLoader.getUserType();
 *   // 可能值：public（默认，面向大众）、internal（面向内部）
 * 
 * 【控制逻辑】
 * - 面向大众：隐藏指定的按钮（素材自助、名人礼物视频版、AI图片生成）
 * - 面向内部：显示所有按钮
 * 
 * 【按钮标记】
 * 需要控制的按钮通过 HTML 中的 data-user-type 属性标记：
 *   <div data-user-type="material-self-service" class="drawer-btn"> ... </div>
 * 
 * 【与 site-config-loader.js 的关系】
 * - site-config-loader.js：负责加载配置和解析URL参数，确定用户类型
 * - user-type-controller.js：负责根据用户类型操作DOM，控制元素显示/隐藏
 */

(function (window) {
    'use strict';

    // Ensure namespace
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Controllers = window.MeeWoo.Controllers || {};

    /**
     * 用户类型管理器
     * 职责：
     * - 根据用户登录状态和类型控制页面元素的显示/隐藏
     * - 为需要控制的元素添加 data-user-type 属性
     * - 实现登录状态的响应式管理
     */
    class UserTypeController {
        constructor() {
            this.initialized = false;
            this.elements = new Map(); // 存储需要控制的元素：key = type, value = DOM元素
            this.observers = []; // 观察者列表，用于监听登录状态变化
            this.lastLoginStatus = null; // 上一次的登录状态，用于检测变化
            this.pollingInterval = null; // 轮询检测登录状态变化
            this.customRules = new Map(); // 自定义元素控制规则
        }

        /**
         * 初始化用户类型控制器
         * 使用方式：文件底部会在 DOMContentLoaded 后自动调用一次 init()
         */
        async init() {
            if (this.initialized) {
                return;
            }

            // 等待站点配置加载完成（SiteConfigLoader 会自动去拉远程 JSON）
            if (window.MeeWoo && window.MeeWoo.Core && window.MeeWoo.Core.SiteConfig) {
                await window.MeeWoo.Core.SiteConfig.ready();
            }

            // 查找所有需要控制的元素
            this.findControlledElements();

            // 根据用户类型应用显示/隐藏逻辑
            this.applyUserTypeConfig();

            this.initialized = true;
        }

        /**
         * 查找页面中需要控制的元素
         * 
         * 规则：
         * - 所有带 data-user-type="xxx" 的元素都会被收集
         * - 其中 xxx 要与配置里的 features.userType.controls[userType].hideButtons 对应
         */
        findControlledElements() {
            const elements = document.querySelectorAll('[data-user-type]');
            elements.forEach(element => {
                const type = element.getAttribute('data-user-type');
                if (!this.elements.has(type)) {
                    this.elements.set(type, []);
                }
                this.elements.get(type).push(element);
            });
        }

        /**
         * 获取当前用户类型
         * 根据登录状态确定用户类型：
         * - 未登录：public（大众）
         * - 登录的普通用户：internal（内部）
         * - 登录的管理员：admin（预留）
         */
        getUserType() {
            // 检查用户是否登录
            const isLoggedIn = window.authUtils && window.authUtils.isLoggedIn();
            
            if (!isLoggedIn) {
                return 'public'; // 未登录用户 = 大众
            }
            
            // 登录用户：先默认为普通用户（内部），管理员预留
            // 后续可根据用户信息判断是否为管理员
            return 'internal'; // 登录的普通用户 = 内部
        }

        /**
         * 根据用户类型应用配置
         * 
         * 逻辑：
         * - 获取当前用户类型对应的配置
         * - 隐藏配置中指定的按钮
         * - 显示其他所有按钮
         */
        applyUserTypeConfig() {
            // 获取当前用户类型
            const userType = this.getUserType();
            
            // 使用正确的 SiteConfig 实例路径获取配置
            let userTypeConfig = {};
            if (window.MeeWoo && window.MeeWoo.Core && window.MeeWoo.Core.SiteConfig) {
                userTypeConfig = window.MeeWoo.Core.SiteConfig.getUserTypeConfig();
            }

            const { hideButtons = [] } = userTypeConfig;

            // 隐藏需要隐藏的按钮
            hideButtons.forEach(type => {
                const elements = this.elements.get(type);
                if (elements) {
                    elements.forEach(element => {
                        this.hideElement(element);
                    });
                }
            });

            // 显示其他按钮
            this.elements.forEach((elements, type) => {
                if (!hideButtons.includes(type)) {
                    elements.forEach(element => {
                        this.showElement(element);
                    });
                }
            });
        }

        /**
         * 显示指定元素
         * @param {HTMLElement} element - 需要显示的元素
         */
        showElement(element) {
            if (element) {
                element.style.display = '';
                element.style.visibility = 'visible';
                element.setAttribute('data-user-visible', 'true');
            }
        }

        /**
         * 隐藏指定元素
         * @param {HTMLElement} element - 需要隐藏的元素
         */
        hideElement(element) {
            if (element) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.setAttribute('data-user-visible', 'false');
            }
        }

        /**
         * 检查指定类型的元素是否可见
         * @param {string} type - 元素类型
         * @returns {boolean} 是否可见
         * 
         * 可用于后续逻辑判断。
         */
        isElementVisible(type) {
            const elements = this.elements.get(type);
            if (!elements || elements.length === 0) {
                return false;
            }
            const element = elements[0];
            return element && element.getAttribute('data-user-visible') === 'true';
        }

        /**
         * 刷新用户类型配置
         * 重新查找元素并应用配置
         * 
         * 当动态元素加载后（如Vue的v-if条件渲染）调用此方法
         */
        refresh() {
            // 重新查找所有需要控制的元素
            this.findControlledElements();
            // 重新应用用户类型配置
            this.applyUserTypeConfig();
        }

        /**
         * 启动登录状态轮询检测
         * 定期检查登录状态是否变化，变化时自动刷新
         */
        startLoginStatusPolling() {
            // 清除现有轮询
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }
            
            // 每500ms检查一次登录状态
            this.pollingInterval = setInterval(() => {
                const currentLoginStatus = window.authUtils && window.authUtils.isLoggedIn();
                if (currentLoginStatus !== this.lastLoginStatus) {
                    this.lastLoginStatus = currentLoginStatus;
                    this.refresh();
                    this.notifyObservers();
                }
            }, 500);
        }

        /**
         * 停止登录状态轮询检测
         */
        stopLoginStatusPolling() {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
            }
        }

        /**
         * 添加观察者
         * @param {Function} callback - 登录状态变化时的回调函数
         */
        addObserver(callback) {
            if (typeof callback === 'function' && !this.observers.includes(callback)) {
                this.observers.push(callback);
            }
        }

        /**
         * 移除观察者
         * @param {Function} callback - 要移除的回调函数
         */
        removeObserver(callback) {
            const index = this.observers.indexOf(callback);
            if (index > -1) {
                this.observers.splice(index, 1);
            }
        }

        /**
         * 通知所有观察者登录状态变化
         */
        notifyObservers() {
            const isLoggedIn = window.authUtils && window.authUtils.isLoggedIn();
            const userType = this.getUserType();
            this.observers.forEach(callback => {
                try {
                    callback(isLoggedIn, userType);
                } catch (error) {
                    console.error('Observer callback error:', error);
                }
            });
        }

        /**
         * 注册需要控制的元素
         * @param {HTMLElement|string} element - DOM元素或选择器
         * @param {string} type - 元素类型，对应配置中的hideButtons
         */
        registerElement(element, type) {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            
            if (element && type) {
                element.setAttribute('data-user-type', type);
                this.refresh();
            }
        }

        /**
         * 批量注册需要控制的元素
         * @param {Array<{element: HTMLElement|string, type: string}>} elements - 元素配置数组
         */
        registerElements(elements) {
            elements.forEach(item => {
                this.registerElement(item.element, item.type);
            });
        }

        /**
         * 检查元素是否应该显示
         * @param {string} type - 元素类型
         * @returns {boolean} 是否应该显示
         */
        shouldShowElement(type) {
            // 先检查自定义规则
            if (this.customRules && this.customRules.has(type)) {
                const rule = this.customRules.get(type);
                try {
                    return rule();
                } catch (error) {
                    console.error('Custom rule error:', error);
                }
            }

            // 再使用默认规则
            const userType = this.getUserType();
            let userTypeConfig = {};
            
            if (window.MeeWoo && window.MeeWoo.Core && window.MeeWoo.Core.SiteConfig) {
                userTypeConfig = window.MeeWoo.Core.SiteConfig.getUserTypeConfig();
            }

            const { hideButtons = [] } = userTypeConfig;
            return !hideButtons.includes(type);
        }

        /**
         * 获取当前登录状态
         * @returns {boolean} 是否登录
         */
        isLoggedIn() {
            return window.authUtils && window.authUtils.isLoggedIn();
        }

        /**
         * 获取当前用户类型
         * @returns {string} 用户类型
         */
        getCurrentUserType() {
            return this.getUserType();
        }

        /**
         * 添加自定义元素控制规则
         * @param {string} elementType - 元素类型
         * @param {Function} rule - 控制规则函数，返回 boolean 表示是否显示
         */
        addCustomRule(elementType, rule) {
            if (!this.customRules) {
                this.customRules = new Map();
            }
            this.customRules.set(elementType, rule);
        }

        /**
         * 移除自定义元素控制规则
         * @param {string} elementType - 元素类型
         */
        removeCustomRule(elementType) {
            if (this.customRules) {
                this.customRules.delete(elementType);
            }
        }
    }

    // 创建全局实例：window.MeeWoo.Controllers.UserTypeController
    window.MeeWoo.Controllers.UserTypeController = new UserTypeController();

    // 页面加载完成后自动初始化用户类型控制
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const userTypeController = window.MeeWoo.Controllers.UserTypeController;
            userTypeController.init().then(() => {
                // 启动登录状态轮询检测
                userTypeController.startLoginStatusPolling();
            });
        });
    } else {
        // DOM已加载完成，立即初始化
        const userTypeController = window.MeeWoo.Controllers.UserTypeController;
        userTypeController.init().then(() => {
            // 启动登录状态轮询检测
            userTypeController.startLoginStatusPolling();
        });
    }

})(window);