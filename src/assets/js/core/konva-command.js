/**
 * ==================== Konva 命令管理模块 (Konva Command Manager) ====================
 * 
 * 模块索引：
 * 1. 【命令工厂】 - 创建不同类型的命令
 * 2. 【命令队列】 - 管理命令历史记录
 * 3. 【撤销重做】 - 实现撤销和重做功能
 * 4. 【命令执行】 - 执行命令和管理状态
 * 5. 【命令事件】 - 命令相关事件处理
 * 
 * 功能说明：
 * 负责 Konva 编辑操作的命令管理，使用命令模式实现编辑历史记录和撤销/重做功能，包括：
 * 1. 支持多种命令类型：添加元素、删除元素、修改元素属性、变换元素等
 * 2. 命令队列管理
 * 3. 撤销和重做功能
 * 4. 命令执行和状态管理
 * 5. 命令事件分发
 * 
 * 命名空间：MeeWoo.Core.KonvaCommand
 */

(function (window) {
    'use strict';

    // 确保命名空间存在
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Core = window.MeeWoo.Core || {};

    /**
     * Konva 命令管理模块
     */
    var KonvaCommand = {
        // 命令类型
        commandTypes: {
            ADD_ELEMENT: 'addElement',
            DELETE_ELEMENT: 'deleteElement',
            UPDATE_ELEMENT: 'updateElement',
            TRANSFORM_ELEMENT: 'transformElement',
            MOVE_ELEMENT: 'moveElement',
            COPY_ELEMENT: 'copyElement',
            PASTE_ELEMENT: 'pasteElement',
            GROUP_ELEMENTS: 'groupElements',
            UNGROUP_ELEMENTS: 'ungroupElements',
            LOCK_ELEMENT: 'lockElement',
            UNLOCK_ELEMENT: 'unlockElement',
            HIDE_ELEMENT: 'hideElement',
            SHOW_ELEMENT: 'showElement'
        },

        /**
         * 初始化命令管理器
         * @param {Object} stageInstance - 舞台实例对象
         * @param {Object} options - 命令管理器配置选项
         * @returns {Object} 命令管理器实例
         */
        initCommandManager: function (stageInstance, options) {
            // 默认配置
            var defaultOptions = {
                maxHistorySize: 100,
                enabled: true
            };

            // 合并配置
            var config = Object.assign({}, defaultOptions, options);

            // 命令状态
            var commandState = {
                stageInstance: stageInstance,
                config: config,
                commandHistory: [],
                historyIndex: -1,
                isExecutingCommand: false,
                commandQueue: []
            };

            return commandState;
        },

        /**
         * 执行命令
         * @param {Object} commandState - 命令状态对象
         * @param {Object} command - 命令对象
         */
        executeCommand: function (commandState, command) {
            if (!command || !command.execute || !command.undo) {
                return;
            }

            // 如果正在执行命令，将新命令加入队列
            if (commandState.isExecutingCommand) {
                commandState.commandQueue.push(command);
                return;
            }

            commandState.isExecutingCommand = true;

            try {
                // 执行命令
                command.execute();
                
                // 更新命令历史
                this.updateCommandHistory(commandState, command);
                
                // 触发命令执行事件
                this.triggerCommandEvent(commandState, 'execute', command);
            } catch (error) {
                console.error('Command execution failed:', error);
            } finally {
                commandState.isExecutingCommand = false;
                
                // 执行队列中的命令
                this.executeCommandQueue(commandState);
            }
        },

        /**
         * 执行命令队列
         * @param {Object} commandState - 命令状态对象
         */
        executeCommandQueue: function (commandState) {
            while (commandState.commandQueue.length > 0) {
                var command = commandState.commandQueue.shift();
                this.executeCommand(commandState, command);
            }
        },

        /**
         * 撤销命令
         * @param {Object} commandState - 命令状态对象
         */
        undo: function (commandState) {
            if (this.canUndo(commandState)) {
                commandState.isExecutingCommand = true;

                try {
                    // 获取当前命令
                    var command = commandState.commandHistory[commandState.historyIndex];
                    
                    // 撤销命令
                    command.undo();
                    
                    // 更新历史索引
                    commandState.historyIndex--;
                    
                    // 触发撤销事件
                    this.triggerCommandEvent(commandState, 'undo', command);
                } catch (error) {
                    console.error('Command undo failed:', error);
                } finally {
                    commandState.isExecutingCommand = false;
                }
            }
        },

        /**
         * 重做命令
         * @param {Object} commandState - 命令状态对象
         */
        redo: function (commandState) {
            if (this.canRedo(commandState)) {
                commandState.isExecutingCommand = true;

                try {
                    // 获取下一个命令
                    commandState.historyIndex++;
                    var command = commandState.commandHistory[commandState.historyIndex];
                    
                    // 执行命令
                    command.execute();
                    
                    // 触发重做事件
                    this.triggerCommandEvent(commandState, 'redo', command);
                } catch (error) {
                    console.error('Command redo failed:', error);
                } finally {
                    commandState.isExecutingCommand = false;
                }
            }
        },

        /**
         * 更新命令历史
         * @param {Object} commandState - 命令状态对象
         * @param {Object} command - 已执行的命令
         */
        updateCommandHistory: function (commandState, command) {
            // 如果当前索引不在历史记录末尾，截断历史记录
            if (commandState.historyIndex < commandState.commandHistory.length - 1) {
                commandState.commandHistory = commandState.commandHistory.slice(0, commandState.historyIndex + 1);
            }

            // 添加新命令到历史记录
            commandState.commandHistory.push(command);
            commandState.historyIndex++;

            // 限制历史记录大小
            if (commandState.commandHistory.length > commandState.config.maxHistorySize) {
                commandState.commandHistory.shift();
                commandState.historyIndex--;
            }
        },

        /**
         * 检查是否可以撤销
         * @param {Object} commandState - 命令状态对象
         * @returns {boolean} 是否可以撤销
         */
        canUndo: function (commandState) {
            return commandState.historyIndex >= 0;
        },

        /**
         * 检查是否可以重做
         * @param {Object} commandState - 命令状态对象
         * @returns {boolean} 是否可以重做
         */
        canRedo: function (commandState) {
            return commandState.historyIndex < commandState.commandHistory.length - 1;
        },

        /**
         * 清除命令历史
         * @param {Object} commandState - 命令状态对象
         */
        clearCommandHistory: function (commandState) {
            commandState.commandHistory = [];
            commandState.historyIndex = -1;
            
            // 触发清除事件
            this.triggerCommandEvent(commandState, 'clearHistory');
        },

        /**
         * 触发命令事件
         * @param {Object} commandState - 命令状态对象
         * @param {string} eventName - 事件名称
         * @param {Object} command - 命令对象
         */
        triggerCommandEvent: function (commandState, eventName, command) {
            var stage = commandState.stageInstance.stage;
            
            // 触发自定义事件
            stage.fire('command:' + eventName, {
                commandState: commandState,
                command: command,
                canUndo: this.canUndo(commandState),
                canRedo: this.canRedo(commandState)
            });
        },

        /**
         * 创建添加元素命令
         * @param {Object} commandState - 命令状态对象
         * @param {Konva.Node} element - 要添加的元素
         * @param {Konva.Layer} layer - 要添加到的图层
         * @returns {Object} 命令对象
         */
        createAddElementCommand: function (commandState, element, layer) {
            var command = {
                type: this.commandTypes.ADD_ELEMENT,
                element: element,
                layer: layer,
                execute: function () {
                    // 添加元素到图层
                    layer.add(element);
                    layer.draw();
                },
                undo: function () {
                    // 从图层中移除元素
                    element.remove();
                    layer.draw();
                }
            };

            return command;
        },

        /**
         * 创建删除元素命令
         * @param {Object} commandState - 命令状态对象
         * @param {Konva.Node} element - 要删除的元素
         * @returns {Object} 命令对象
         */
        createDeleteElementCommand: function (commandState, element) {
            var parent = element.getParent();

            var command = {
                type: this.commandTypes.DELETE_ELEMENT,
                element: element,
                parent: parent,
                execute: function () {
                    // 从父容器中移除元素
                    element.remove();
                    parent.draw();
                },
                undo: function () {
                    // 将元素添加回父容器
                    parent.add(element);
                    parent.draw();
                }
            };

            return command;
        },

        /**
         * 创建更新元素属性命令
         * @param {Object} commandState - 命令状态对象
         * @param {Konva.Node} element - 要更新的元素
         * @param {Object} newProperties - 新属性
         * @param {Object} oldProperties - 旧属性
         * @returns {Object} 命令对象
         */
        createUpdateElementCommand: function (commandState, element, newProperties, oldProperties) {
            var command = {
                type: this.commandTypes.UPDATE_ELEMENT,
                element: element,
                newProperties: newProperties,
                oldProperties: oldProperties || this.saveElementProperties(element, Object.keys(newProperties)),
                execute: function () {
                    // 更新元素属性
                    element.setAttrs(this.newProperties);
                    element.getLayer().draw();
                },
                undo: function () {
                    // 恢复旧属性
                    element.setAttrs(this.oldProperties);
                    element.getLayer().draw();
                }
            };

            return command;
        },

        /**
         * 创建变换元素命令
         * @param {Object} commandState - 命令状态对象
         * @param {Konva.Node} element - 要变换的元素
         * @param {Object} newTransform - 新变换状态
         * @param {Object} oldTransform - 旧变换状态
         * @returns {Object} 命令对象
         */
        createTransformElementCommand: function (commandState, element, newTransform, oldTransform) {
            var command = {
                type: this.commandTypes.TRANSFORM_ELEMENT,
                element: element,
                newTransform: newTransform,
                oldTransform: oldTransform || this.saveTransformState(element),
                execute: function () {
                    // 应用新变换
                    element.setAttrs(this.newTransform);
                    element.getLayer().draw();
                },
                undo: function () {
                    // 恢复旧变换
                    element.setAttrs(this.oldTransform);
                    element.getLayer().draw();
                }
            };

            return command;
        },

        /**
         * 创建复制元素命令
         * @param {Object} commandState - 命令状态对象
         * @param {Konva.Node} element - 要复制的元素
         * @returns {Object} 命令对象
         */
        createCopyElementCommand: function (commandState, element) {
            var command = {
                type: this.commandTypes.COPY_ELEMENT,
                element: element,
                copy: null,
                execute: function () {
                    // 复制元素
                    this.copy = element.clone();
                    // 重新生成ID
                    this.copy.setAttr('id', 'element-' + Date.now() + '-' + Math.floor(Math.random() * 10000));
                    // 触发复制事件
                    commandState.stageInstance.stage.fire('command:copy', {
                        element: this.element,
                        copy: this.copy
                    });
                },
                undo: function () {
                    // 复制操作不需要撤销
                    this.copy = null;
                }
            };

            return command;
        },

        /**
         * 创建粘贴元素命令
         * @param {Object} commandState - 命令状态对象
         * @param {Konva.Node} element - 要粘贴的元素
         * @param {Konva.Layer} layer - 要粘贴到的图层
         * @returns {Object} 命令对象
         */
        createPasteElementCommand: function (commandState, element, layer) {
            var command = {
                type: this.commandTypes.PASTE_ELEMENT,
                element: element,
                layer: layer,
                execute: function () {
                    // 添加元素到图层
                    layer.add(this.element);
                    // 调整位置，避免重叠
                    this.element.x(this.element.x() + 20);
                    this.element.y(this.element.y() + 20);
                    layer.draw();
                },
                undo: function () {
                    // 从图层中移除元素
                    this.element.remove();
                    layer.draw();
                }
            };

            return command;
        },

        /**
         * 保存元素属性
         * @param {Konva.Node} element - 要保存属性的元素
         * @param {Array} properties - 要保存的属性列表
         * @returns {Object} 保存的属性
         */
        saveElementProperties: function (element, properties) {
            var savedProperties = {};

            properties.forEach(function (property) {
                savedProperties[property] = element.getAttr(property);
            });

            return savedProperties;
        },

        /**
         * 保存元素变换状态
         * @param {Konva.Node} element - 要保存变换状态的元素
         * @returns {Object} 变换状态
         */
        saveTransformState: function (element) {
            // 保存位置、缩放、旋转、倾斜等状态
            return {
                x: element.x(),
                y: element.y(),
                scaleX: element.scaleX(),
                scaleY: element.scaleY(),
                rotation: element.rotation(),
                skewX: element.skewX(),
                skewY: element.skewY()
            };
        },

        /**
         * 批量执行命令
         * @param {Object} commandState - 命令状态对象
         * @param {Array} commands - 要执行的命令数组
         * @param {string} batchName - 批量命令名称
         */
        executeBatchCommands: function (commandState, commands, batchName) {
            // 创建批量命令
            var batchCommand = {
                type: 'batch',
                name: batchName || 'batch',
                commands: commands,
                execute: function () {
                    // 执行所有命令
                    this.commands.forEach(function (command) {
                        command.execute();
                    });
                },
                undo: function () {
                    // 撤销所有命令（逆序）
                    for (var i = this.commands.length - 1; i >= 0; i--) {
                        this.commands[i].undo();
                    }
                }
            };

            // 执行批量命令
            this.executeCommand(commandState, batchCommand);
        },

        /**
         * 获取命令历史记录
         * @param {Object} commandState - 命令状态对象
         * @returns {Array} 命令历史记录
         */
        getCommandHistory: function (commandState) {
            return commandState.commandHistory;
        },

        /**
         * 获取当前历史索引
         * @param {Object} commandState - 命令状态对象
         * @returns {number} 当前历史索引
         */
        getHistoryIndex: function (commandState) {
            return commandState.historyIndex;
        },

        /**
         * 获取历史记录大小
         * @param {Object} commandState - 命令状态对象
         * @returns {number} 历史记录大小
         */
        getHistorySize: function (commandState) {
            return commandState.commandHistory.length;
        }
    };

    // 导出模块
    window.MeeWoo.Core.KonvaCommand = KonvaCommand;
})(window);