/**
 * 图片压缩服务 - 使用 oxipng WASM 版本
 * 功能：识别文件类型，对不同类型文件分别做压缩处理
 * - PNG: 首选 oxipng 压缩，失败则降级到 Pako，再失败则使用浏览器默认编码
 * - JPG: 不压缩
 */
(function (global) {
    'use strict';

    // Ensure namespace
    window.MeeWoo = window.MeeWoo || {};
    window.MeeWoo.Services = window.MeeWoo.Services || {};

    const ImageCompressionService = {
        oxipngModule: null,
        initialized: false,
        compressionFailed: false,
        oxipngReady: false,

        /**
         * 初始化 oxipng 模块
         */
        init: async function () {
            try {
                // 动态导入 oxipng 模块
                const { default: optimise, init } = await import('./oxipng/optimise.js');

                // 初始化 oxipng（会自动加载 wasm 文件）
                await init();

                this.oxipngModule = { optimise };
                this.initialized = true;
                this.oxipngReady = true;
                console.log('ImageCompressionService initialized with oxipng wasm');
            } catch (error) {
                console.error('Failed to load oxipng wasm:', error);
                this.initialized = true; // 标记为已初始化，但 oxipng 不可用
                this.oxipngReady = false;
                console.log('ImageCompressionService initialized with fallback mode');
            }
        },

        /**
         * 检查 oxipng 服务状态
         */
        isOxipngReady: function () {
            return this.oxipngReady;
        },

        /**
         * 识别文件类型
         * @param {Uint8Array} data - 文件数据
         * @returns {string} - 文件类型（'png'或其他）
         */
        detectFileType: function (data) {
            // PNG 签名：89 50 4E 47 0D 0A 1A 0A
            if (data.length >= 8) {
                const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
                let isPNG = true;
                for (let i = 0; i < 8; i++) {
                    if (data[i] !== pngSignature[i]) {
                        isPNG = false;
                        break;
                    }
                }
                if (isPNG) return 'png';
            }
            return 'unknown';
        },

        /**
         * 使用 oxipng 压缩 PNG
         * @param {Uint8Array} pngData - PNG 数据
         * @param {number} quality - 压缩质量（10-100）
         * @returns {Promise<Uint8Array>} - 压缩后的 PNG 数据
         */
        compressWithOxipng: async function (pngData, quality) {
            if (!this.initialized) {
                await this.init();
            }

            if (!this.isOxipngReady()) {
                throw new Error('oxipng not available');
            }

            try {
                // 使用 oxipng 压缩 PNG
                // quality 转换为 oxipng 的优化级别（1-6）
                const optimizationLevel = Math.min(6, Math.max(1, Math.round(quality / 20)));
                const compressedBuffer = await this.oxipngModule.optimise(pngData.buffer, {
                    level: optimizationLevel,
                    interlace: false,
                    optimiseAlpha: true
                });
                return new Uint8Array(compressedBuffer);
            } catch (error) {
                console.error('oxipng compression failed:', error);
                throw error;
            }
        },

        /**
         * 使用 Pako 压缩 PNG
         * @param {Uint8Array} pngData - PNG 数据
         * @returns {Promise<Uint8Array>} - 压缩后的 PNG 数据
         */
        compressWithPako: async function (pngData) {
            if (typeof pako === 'undefined') {
                throw new Error('pako not available');
            }

            try {
                // 获取图片尺寸
                const view = new DataView(pngData.buffer);
                const width = view.getUint32(16);
                const height = view.getUint32(20);

                // 创建 Canvas 并绘制图片
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                const img = await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => reject(new Error('Image load failed'));
                    image.src = URL.createObjectURL(new Blob([pngData], { type: 'image/png' }));
                });

                ctx.drawImage(img, 0, 0);

                // 获取像素数据
                const imageData = ctx.getImageData(0, 0, width, height);
                const pixels = imageData.data;

                // 准备未压缩的像素数据（每行前加filter byte 0）
                const rawData = new Uint8Array(height * (1 + width * 4));
                for (let y = 0; y < height; y++) {
                    rawData[y * (1 + width * 4)] = 0;  // filter type 0
                    for (let x = 0; x < width; x++) {
                        const idx = (y * width + x) * 4;
                        const pos = y * (1 + width * 4) + 1 + x * 4;
                        rawData[pos] = pixels[idx];
                        rawData[pos + 1] = pixels[idx + 1];
                        rawData[pos + 2] = pixels[idx + 2];
                        rawData[pos + 3] = pixels[idx + 3];
                    }
                }

                // 使用 pako 压缩
                const compressed = pako.deflate(rawData);

                // 构建简单的 PNG 文件
                return this._buildSimplePNG(width, height, compressed);
            } catch (error) {
                console.error('pako compression failed:', error);
                throw error;
            }
        },

        /**
         * 使用浏览器默认 PNG 编码
         * @param {Uint8Array} pngData - PNG 数据
         * @returns {Promise<Uint8Array>} - 压缩后的 PNG 数据
         */
        compressWithBrowserDefault: async function (pngData) {
            try {
                // 创建 Canvas 并绘制图片
                const img = await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => reject(new Error('Image load failed'));
                    image.src = URL.createObjectURL(new Blob([pngData], { type: 'image/png' }));
                });

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // 使用浏览器默认 PNG 编码
                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png');
                });

                const arrayBuffer = await blob.arrayBuffer();
                return new Uint8Array(arrayBuffer);
            } catch (error) {
                console.error('Browser default compression failed:', error);
                throw error;
            }
        },

        /**
         * 压缩 PNG 数据（三级降级机制）
         * @param {Uint8Array} pngData - PNG 数据
         * @param {number} quality - 压缩质量（10-100）
         * @returns {Promise<Uint8Array>} - 压缩后的 PNG 数据
         */
        compressPNG: async function (pngData, quality = 80) {
            let compressedData;

            // 首选：使用 oxipng 压缩
            try {
                // 先初始化（如果未初始化）
                if (!this.initialized) {
                    await this.init();
                }

                if (this.isOxipngReady()) {
                    compressedData = await this.compressWithOxipng(pngData, quality);
                    return compressedData;
                }
            } catch (error) {
                console.error('oxipng compression failed:', error);
            }

            // 降级：使用 pako 压缩
            try {
                compressedData = await this.compressWithPako(pngData);
                return compressedData;
            } catch (error) {
                this.compressionFailed = true;
            }

            // 降级：使用浏览器默认编码
            try {
                compressedData = await this.compressWithBrowserDefault(pngData);
                return compressedData;
            } catch (error) {
                this.compressionFailed = true;
                console.error('All compression methods failed, returning original data');
                return pngData;
            }
        },

        /**
         * 从 Canvas 压缩为 PNG
         * @param {HTMLCanvasElement} canvas - Canvas 元素
         * @param {number} quality - 压缩质量（10-100）
         * @returns {Promise<Uint8Array>} - 压缩后的 PNG 数据
         */
        compressCanvas: async function (canvas, quality = 80) {
            // 先将 Canvas 转换为 PNG Blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });

            // 读取 Blob 为 ArrayBuffer
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // 压缩 PNG 数据
            return await this.compressPNG(uint8Array, quality);
        },

        /**
         * 压缩图片数据（主入口）
         * @param {Uint8Array} data - 图片数据
         * @param {number} quality - 压缩质量（10-100）
                 * @returns {Promise<Uint8Array>} - 压缩后的图片数据
                 */
        compressImage: async function (data, quality = 80) {
            // 识别文件类型
            const fileType = this.detectFileType(data);

            // 根据文件类型选择压缩方式
            if (fileType === 'png') {
                return await this.compressPNG(data, quality);
            } else {
                // 非 PNG 格式不压缩，直接返回原始数据
                return data;
            }
        },

        /**
         * 检查是否有压缩失败
         */
        hasCompressionFailed: function () {
            return this.compressionFailed;
        },

        /**
         * 重置压缩失败标记
         */
        resetCompressionFailed: function () {
            this.compressionFailed = false;
        },

        /**
         * 构建简单的 PNG 文件
         * @private
         */
        _buildSimplePNG: function (width, height, idatData) {
            // PNG 签名
            const signature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

            // IHDR 块 (13 bytes)
            const ihdr = new Uint8Array(13);
            const view = new DataView(ihdr.buffer);
            view.setUint32(0, width);
            view.setUint32(4, height);
            ihdr[8] = 8;   // bit depth
            ihdr[9] = 6;   // color type: RGBA
            ihdr[10] = 0;  // compression
            ihdr[11] = 0;  // filter
            ihdr[12] = 0;  // interlace

            const ihdrChunk = this._createPNGChunk('IHDR', ihdr);
            const idatChunk = this._createPNGChunk('IDAT', idatData);
            const iendChunk = this._createPNGChunk('IEND', new Uint8Array(0));

            // 组合所有部分
            const totalLength = signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
            const png = new Uint8Array(totalLength);
            let offset = 0;

            png.set(signature, offset); offset += signature.length;
            png.set(ihdrChunk, offset); offset += ihdrChunk.length;
            png.set(idatChunk, offset); offset += idatChunk.length;
            png.set(iendChunk, offset);

            return png;
        },

        /**
         * 创建 PNG chunk
         * @private
         */
        _createPNGChunk: function (type, data) {
            const length = data.length;
            const chunk = new Uint8Array(12 + length);
            const view = new DataView(chunk.buffer);

            // 长度
            view.setUint32(0, length);

            // 类型
            for (let i = 0; i < 4; i++) {
                chunk[4 + i] = type.charCodeAt(i);
            }

            // 数据
            chunk.set(data, 8);

            // CRC
            const crc = this._crc32(chunk.subarray(4, 8 + length));
            view.setUint32(8 + length, crc);

            return chunk;
        },

        /**
         * 计算 CRC32
         * @private
         */
        _crc32: function (data) {
            // 懒初始化 CRC 表
            if (!this._crc32Table) {
                this._crc32Table = new Uint32Array(256);
                for (let i = 0; i < 256; i++) {
                    let c = i;
                    for (let k = 0; k < 8; k++) {
                        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                    }
                    this._crc32Table[i] = c;
                }
            }

            let crc = -1;
            for (let i = 0; i < data.length; i++) {
                crc = this._crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
            }
            return (crc ^ -1) >>> 0;
        },

        _crc32Table: null
    };

    window.MeeWoo.Services.ImageCompressionService = ImageCompressionService;

})(typeof window !== 'undefined' ? window : this);