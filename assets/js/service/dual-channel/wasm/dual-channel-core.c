/**
 * Dual Channel Core - WebAssembly核心算法
 * 实现双通道图像合成的核心像素处理算法
 * 编译命令: emcc dual-channel-core.c -o dual-channel-core.wasm -Os -s WASM=1 -s EXPORTED_FUNCTIONS='["_processSinglePixel", "_processBlock", "_init"]' -s ALLOW_MEMORY_GROWTH=1
 */

#include <stdint.h>
#include <math.h>

// 内存布局定义
#define MEMORY_ALIGNMENT 16

// 函数声明
extern void *malloc(size_t size);
extern void free(void *ptr);

/**
 * 初始化WebAssembly模块
 */
__attribute__((export_name("init")))
void init() {
    // 初始化代码（如果需要）
}

/**
 * 处理单个像素
 * @param x - 像素X坐标
 * @param y - 像素Y坐标
 * @param frameData - 原始图像数据
 * @param width - 原始图像宽度
 * @param dualWidth - 双通道图像宽度
 * @param dualData - 双通道图像数据
 * @param blackBgData - 黑底图像数据
 * @param isColorLeftAlphaRight - 是否左彩右灰模式
 */
__attribute__((export_name("processSinglePixel")))
void processSinglePixel(
    int32_t x, int32_t y,
    uint8_t *frameData,
    int32_t width,
    int32_t dualWidth,
    uint8_t *dualData,
    uint8_t *blackBgData,
    int32_t isColorLeftAlphaRight
) {
    // 计算像素索引
    int32_t pixelIndex = y * width + x;
    int32_t frameIdx = pixelIndex * 4;
    
    // 读取像素数据
    uint8_t r = frameData[frameIdx + 0];
    uint8_t g = frameData[frameIdx + 1];
    uint8_t b = frameData[frameIdx + 2];
    uint8_t a = frameData[frameIdx + 3];
    
    // 反预乘Alpha
    uint8_t finalR = r;
    uint8_t finalG = g;
    uint8_t finalB = b;
    
    if (a > 0) {
        if (a < 255) {
            // 计算反预乘
            float alphaFactor = 255.0f / (float)a;
            finalR = (uint8_t)fminf(255.0f, (float)r * alphaFactor);
            finalG = (uint8_t)fminf(255.0f, (float)g * alphaFactor);
            finalB = (uint8_t)fminf(255.0f, (float)b * alphaFactor);
        }
    } else {
        finalR = 0;
        finalG = 0;
        finalB = 0;
    }
    
    // 计算双通道图像中的位置
    int32_t leftIdx = (y * dualWidth + x) * 4;
    int32_t rightIdx = (y * dualWidth + x + width) * 4;
    
    // 写入双通道数据
    if (isColorLeftAlphaRight) {
        // 左彩右灰模式
        dualData[leftIdx + 0] = finalR;
        dualData[leftIdx + 1] = finalG;
        dualData[leftIdx + 2] = finalB;
        dualData[leftIdx + 3] = a;
        
        dualData[rightIdx + 0] = a;
        dualData[rightIdx + 1] = a;
        dualData[rightIdx + 2] = a;
        dualData[rightIdx + 3] = 255;
    } else {
        // 左灰右彩模式
        dualData[leftIdx + 0] = a;
        dualData[leftIdx + 1] = a;
        dualData[leftIdx + 2] = a;
        dualData[leftIdx + 3] = 255;
        
        dualData[rightIdx + 0] = finalR;
        dualData[rightIdx + 1] = finalG;
        dualData[rightIdx + 2] = finalB;
        dualData[rightIdx + 3] = a;
    }
    
    // 合成黑底数据
    // 处理左侧通道
    uint8_t pixelAlphaLeft = dualData[leftIdx + 3];
    if (pixelAlphaLeft == 255) {
        blackBgData[leftIdx + 0] = dualData[leftIdx + 0];
        blackBgData[leftIdx + 1] = dualData[leftIdx + 1];
        blackBgData[leftIdx + 2] = dualData[leftIdx + 2];
    } else if (pixelAlphaLeft == 0) {
        blackBgData[leftIdx + 0] = 0;
        blackBgData[leftIdx + 1] = 0;
        blackBgData[leftIdx + 2] = 0;
    } else {
        // 半透明像素：与黑底混合
        float alphaFactorLeft = (float)pixelAlphaLeft / 255.0f;
        blackBgData[leftIdx + 0] = (uint8_t)roundf(dualData[leftIdx + 0] * alphaFactorLeft);
        blackBgData[leftIdx + 1] = (uint8_t)roundf(dualData[leftIdx + 1] * alphaFactorLeft);
        blackBgData[leftIdx + 2] = (uint8_t)roundf(dualData[leftIdx + 2] * alphaFactorLeft);
    }
    blackBgData[leftIdx + 3] = 255;
    
    // 处理右侧通道
    uint8_t pixelAlphaRight = dualData[rightIdx + 3];
    if (pixelAlphaRight == 255) {
        blackBgData[rightIdx + 0] = dualData[rightIdx + 0];
        blackBgData[rightIdx + 1] = dualData[rightIdx + 1];
        blackBgData[rightIdx + 2] = dualData[rightIdx + 2];
    } else if (pixelAlphaRight == 0) {
        blackBgData[rightIdx + 0] = 0;
        blackBgData[rightIdx + 1] = 0;
        blackBgData[rightIdx + 2] = 0;
    } else {
        // 半透明像素：与黑底混合
        float alphaFactorRight = (float)pixelAlphaRight / 255.0f;
        blackBgData[rightIdx + 0] = (uint8_t)roundf(dualData[rightIdx + 0] * alphaFactorRight);
        blackBgData[rightIdx + 1] = (uint8_t)roundf(dualData[rightIdx + 1] * alphaFactorRight);
        blackBgData[rightIdx + 2] = (uint8_t)roundf(dualData[rightIdx + 2] * alphaFactorRight);
    }
    blackBgData[rightIdx + 3] = 255;
}

/**
 * 处理图像块
 * @param startX - 块起始X坐标
 * @param startY - 块起始Y坐标
 * @param blockWidth - 块宽度
 * @param blockHeight - 块高度
 * @param frameData - 原始图像数据
 * @param width - 原始图像宽度
 * @param dualWidth - 双通道图像宽度
 * @param dualData - 双通道图像数据
 * @param blackBgData - 黑底图像数据
 * @param isColorLeftAlphaRight - 是否左彩右灰模式
 */
__attribute__((export_name("processBlock")))
void processBlock(
    int32_t startX, int32_t startY,
    int32_t blockWidth, int32_t blockHeight,
    uint8_t *frameData,
    int32_t width,
    int32_t dualWidth,
    uint8_t *dualData,
    uint8_t *blackBgData,
    int32_t isColorLeftAlphaRight
) {
    // 遍历块内的每个像素
    for (int32_t y = startY; y < startY + blockHeight; y++) {
        for (int32_t x = startX; x < startX + blockWidth; x++) {
            // 处理单个像素
            processSinglePixel(
                x, y,
                frameData,
                width,
                dualWidth,
                dualData,
                blackBgData,
                isColorLeftAlphaRight
            );
        }
    }
}
