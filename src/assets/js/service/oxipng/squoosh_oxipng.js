/**
 * @file squoosh_oxipng.js
 * @description OXIPNG 基于 WebAssembly 的 PNG 优化库
 * @author MeeWoo Team
 * @date 2026-01-22
 * 
 * 功能说明：
 * - 提供高效的 PNG 图片压缩优化功能
 * - 基于 WebAssembly 实现，性能优异
 * - 支持多种优化级别和参数配置
 * 
 * 核心方法：
 * - optimise: 优化 PNG 图片数据
 * - optimise_raw: 优化原始 RGBA 数据为 PNG
 * - __wbg_init: WebAssembly 模块初始化
 */

// WebAssembly 实例对象
let wasm;

// 缓存的文本解码器，用于处理 WebAssembly 返回的字符串
const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ?
    new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) :
    { decode: () => { throw Error('TextDecoder not available') } });

// 初始化解码器
if (typeof TextDecoder !== 'undefined') {
    cachedTextDecoder.decode();
};

// 缓存的 Uint8Array 内存视图，用于高效访问 WebAssembly 内存
let cachedUint8Memory0 = null;

/**
 * 获取 WebAssembly 内存的 Uint8Array 视图
 * @returns {Uint8Array} WebAssembly 内存的 Uint8Array 视图
 */
function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

/**
 * 从 WebAssembly 内存中获取字符串
 * @param {number} ptr - 字符串在 WebAssembly 内存中的指针
 * @param {number} len - 字符串长度
 * @returns {string} 解码后的字符串
 */
function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

// 当前传递给 WebAssembly 的数组长度
let WASM_VECTOR_LEN = 0;

/**
 * 将 Uint8Array 数据传递给 WebAssembly 模块
 * @param {Uint8Array} arg - 要传递的 Uint8Array 数据
 * @param {function} malloc - WebAssembly 内存分配函数
 * @returns {number} 分配的内存指针
 */
function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

// 缓存的 Int32Array 内存视图，用于高效访问 WebAssembly 内存
let cachedInt32Memory0 = null;

/**
 * 获取 WebAssembly 内存的 Int32Array 视图
 * @returns {Int32Array} WebAssembly 内存的 Int32Array 视图
 */
function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

/**
 * 从 WebAssembly 内存中获取 Uint8Array 数据
 * @param {number} ptr - 数据在 WebAssembly 内存中的指针
 * @param {number} len - 数据长度
 * @returns {Uint8Array} 获取的 Uint8Array 数据
 */
function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
 * 优化 PNG 图片数据
 * @param {Uint8Array} data - 原始 PNG 数据
 * @param {number} level - 优化级别（0-6，0最快，6最高质量）
 * @param {boolean} interlace - 是否启用隔行扫描
 * @param {boolean} optimize_alpha - 是否优化 alpha 通道
 * @returns {Uint8Array} 优化后的 PNG 数据
 */
export function optimise(data, level, interlace, optimize_alpha) {
    try {
        // 调整栈指针，为返回值预留空间
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        // 将数据传递到 WebAssembly 内存
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        // 调用 WebAssembly 优化函数
        wasm.optimise(retptr, ptr0, len0, level, interlace, optimize_alpha);
        // 从返回值中获取结果指针和长度
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        // 复制结果数据并释放内存
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1, 1);
        // 返回优化后的 PNG 数据
        return v2;
    } finally {
        // 恢复栈指针
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * 将原始 RGBA 数据优化为 PNG 格式
 * @param {Uint8ClampedArray} data - 原始 RGBA 数据
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 * @param {number} level - 优化级别（0-6，0最快，6最高质量）
 * @param {boolean} interlace - 是否启用隔行扫描
 * @param {boolean} optimize_alpha - 是否优化 alpha 通道
 * @returns {Uint8Array} 优化后的 PNG 数据
 */
export function optimise_raw(data, width, height, level, interlace, optimize_alpha) {
    try {
        // 调整栈指针，为返回值预留空间
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        // 将数据传递到 WebAssembly 内存
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        // 调用 WebAssembly 优化函数
        wasm.optimise_raw(retptr, ptr0, len0, width, height, level, interlace, optimize_alpha);
        // 从返回值中获取结果指针和长度
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        // 复制结果数据并释放内存
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1, 1);
        // 返回优化后的 PNG 数据
        return v2;
    } finally {
        // 恢复栈指针
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * 加载并实例化 WebAssembly 模块
 * @param {Response|ArrayBuffer|WebAssembly.Module} module - WebAssembly 模块或响应对象
 * @param {Object} imports - WebAssembly 导入对象
 * @returns {Promise<Object>} 包含 WebAssembly 实例和模块的对象
 */
async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                // 优先使用流式实例化，性能更好
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                // 如果流式实例化失败，降级到普通实例化
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
                } else {
                    throw e;
                }
            }
        }

        // 将 Response 转换为 ArrayBuffer 后实例化
        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        // 直接实例化 WebAssembly 模块
        const instance = await WebAssembly.instantiate(module, imports);

        // 处理不同的返回值类型
        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }
}

/**
 * 获取 WebAssembly 模块的导入对象
 * @returns {Object} WebAssembly 导入对象，包含异常处理函数
 */
function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    // 绑定 WebAssembly 异常抛出函数，将 Wasm 异常转换为 JavaScript 异常
    imports.wbg.__wbindgen_throw = function (arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

/**
 * 初始化 WebAssembly 内存
 * @param {Object} imports - WebAssembly 导入对象
 * @param {WebAssembly.Memory|null} maybe_memory - 可选的预分配内存对象
 */
function __wbg_init_memory(imports, maybe_memory) {
    // 预留函数，用于 WebAssembly 内存初始化
    // 目前为空实现，后续可根据需要扩展
}

/**
 * 完成 WebAssembly 模块初始化
 * @param {WebAssembly.Instance} instance - WebAssembly 实例
 * @param {WebAssembly.Module} module - WebAssembly 模块
 * @returns {Object} WebAssembly 导出对象，包含所有可调用的 Wasm 函数
 */
function __wbg_finalize_init(instance, module) {
    // 保存 WebAssembly 实例的导出对象
    wasm = instance.exports;
    // 保存模块引用，用于后续优化
    __wbg_init.__wbindgen_wasm_module = module;
    // 清空缓存的内存视图，确保下次使用时重新创建
    cachedInt32Memory0 = null;
    cachedUint8Memory0 = null;

    // 返回 WebAssembly 导出对象
    return wasm;
}

/**
 * 同步初始化 WebAssembly 模块
 * @param {ArrayBuffer|WebAssembly.Module} module - WebAssembly 模块或二进制数据
 * @returns {Object} WebAssembly 导出对象
 */
function initSync(module) {
    // 如果 WebAssembly 实例已存在，直接返回
    if (wasm !== undefined) return wasm;

    // 获取 WebAssembly 导入对象
    const imports = __wbg_get_imports();
    // 初始化内存
    __wbg_init_memory(imports);

    // 如果输入不是 WebAssembly.Module 对象，先创建模块
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    // 创建 WebAssembly 实例
    const instance = new WebAssembly.Instance(module, imports);
    // 完成初始化并返回导出对象
    return __wbg_finalize_init(instance, module);
}

/**
 * 异步初始化 WebAssembly 模块
 * @param {string|URL|Response|ArrayBuffer|WebAssembly.Module} input - WebAssembly 模块的输入源
 * @returns {Promise<Object>} WebAssembly 导出对象
 */
async function __wbg_init(input) {
    // 如果 WebAssembly 实例已存在，直接返回
    if (wasm !== undefined) return wasm;

    // 使用默认 URL 如果未提供输入
    if (typeof input === 'undefined') {
        input = new URL('squoosh_oxipng_bg.wasm', import.meta.url);
    }

    // 获取 WebAssembly 导入对象
    const imports = __wbg_get_imports();
    // 初始化内存
    __wbg_init_memory(imports);

    // 如果输入是字符串、Request 或 URL 对象，先获取资源
    if (typeof input === 'string' ||
        (typeof Request === 'function' && input instanceof Request) ||
        (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    // 加载并实例化 WebAssembly 模块
    const { instance, module } = await __wbg_load(await input, imports);
    // 完成初始化并返回导出对象
    return __wbg_finalize_init(instance, module);
}

// 导出同步初始化函数
export { initSync }
// 导出默认的异步初始化函数
export default __wbg_init;

// 环境检测
// 检测是否在 Service Worker 环境中
const isServiceWorker = globalThis.ServiceWorkerGlobalScope !== undefined;
// 检测是否在 CloudFlare Workers 环境中
const isRunningInCloudFlareWorkers = isServiceWorker && typeof self !== 'undefined' && globalThis.caches && globalThis.caches.default !== undefined;
// 检测是否在 Node.js 环境中
const isRunningInNode = typeof process === 'object' && process.release && process.release.name === 'node';

// 为非浏览器环境提供 Polyfill
if (isRunningInCloudFlareWorkers || isRunningInNode) {
    // 为 ImageData 提供 Polyfill，确保在非浏览器环境中可用
    if (!globalThis.ImageData) {
        // 简单的 ImageData 构造函数 Polyfill
        globalThis.ImageData = class ImageData {
            constructor(data, width, height) {
                this.data = data;
                this.width = width;
                this.height = height;
            }
        };
    }

    // 为 import.meta.url 提供默认值，确保在不支持的环境中可用
    if (import.meta.url === undefined) {
        import.meta.url = 'https://localhost';
    }

    // 为 self.location 提供默认值，确保在 Service Worker 环境中可用
    if (typeof self !== 'undefined' && self.location === undefined) {
        self.location = { href: '' };
    }
}
