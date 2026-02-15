/**
 * PNG压缩工具
 * 功能：支持批量拖拽PNG图片进行压缩，显示压缩进度，支持打包下载
 */

// 全局变量
const app = {
    images: [], // 存储图片数据
    isCompressing: false, // 是否正在压缩
    compressedCount: 0, // 已压缩完成的图片数量
    totalSizeBefore: 0, // 压缩前总大小
    totalSizeAfter: 0, // 压缩后总大小
    theme: 'light' // 当前主题
};

// 初始化主题
try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        app.theme = savedTheme;
    }
} catch (e) {
    console.error('获取主题失败:', e);
}

// DOM元素
const elements = {
    dragArea: document.getElementById('dragArea'),
    imageListSection: document.getElementById('imageListSection'),
    imageList: document.getElementById('imageList'),
    clearBtn: document.getElementById('clearBtn'),
    compressBtn: document.getElementById('compressBtn'),
    compressionQuality: document.getElementById('compressionQuality'),
    compressionValue: document.getElementById('compressionValue'),
    overallProgress: document.getElementById('overallProgress'),
    overallProgressFill: document.getElementById('overallProgressFill'),
    overallProgressStats: document.getElementById('overallProgressStats'),
    downloadSection: document.getElementById('downloadSection'),
    downloadStats: document.getElementById('downloadStats'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    themeToggle: document.querySelector('.theme-toggle'),
    logoImg: document.querySelector('.logo-img'),
    logoLink: document.querySelector('.logo-link')
};

// 初始化应用
function init() {
    // 初始化主题
    setTheme(app.theme);

    // 设置初始logo图片
    updateLogoImage();

    // 绑定事件
    bindEvents();

    // 初始化压缩服务
    initCompressionService();
}

// 更新Logo图片
function updateLogoImage() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
        elements.logoImg.src = '../assets/img/logo_dark.png';
    } else {
        elements.logoImg.src = '../assets/img/logo.png';
    }
}

// 处理压缩质量改变
function handleCompressionQualityChange() {
    const quality = elements.compressionQuality.value;
    elements.compressionValue.textContent = quality;
}

// 处理Logo鼠标进入事件
function handleLogoMouseEnter() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
        elements.logoImg.src = '../assets/img/logo_hover_dark.png';
    } else {
        elements.logoImg.src = '../assets/img/logo_hover.png';
    }
}

// 处理Logo鼠标离开事件
function handleLogoMouseLeave() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
        elements.logoImg.src = '../assets/img/logo_dark.png';
    } else {
        elements.logoImg.src = '../assets/img/logo.png';
    }
}

// 绑定事件
function bindEvents() {
    // 拖拽事件
    elements.dragArea.addEventListener('dragenter', handleDragEnter);
    elements.dragArea.addEventListener('dragover', handleDragOver);
    elements.dragArea.addEventListener('drop', handleDrop);
    elements.dragArea.addEventListener('dragleave', handleDragLeave);

    // 按钮事件
    elements.clearBtn.addEventListener('click', clearImageList);
    elements.compressBtn.addEventListener('click', startCompression);
    elements.downloadAllBtn.addEventListener('click', downloadAll);
    elements.themeToggle.addEventListener('click', toggleTheme);

    // 滑块事件
    elements.compressionQuality.addEventListener('input', handleCompressionQualityChange);

    // Logo事件
    elements.logoLink.addEventListener('mouseenter', handleLogoMouseEnter);
    elements.logoLink.addEventListener('mouseleave', handleLogoMouseLeave);
}

// 初始化压缩服务
async function initCompressionService() {
    try {
        // 初始化图像压缩服务
        await window.MeeWoo.Services.ImageCompressionService.init();
        console.log('图像压缩服务初始化成功');
    } catch (error) {
        console.error('图像压缩服务初始化失败:', error);
        showToast('图像压缩服务初始化失败，部分功能可能不可用');
    }
}

// 拖拽事件处理
function handleDragEnter(e) {
    e.preventDefault();
    elements.dragArea.classList.add('drag-over');
}

function handleDragOver(e) {
    e.preventDefault();
    elements.dragArea.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    elements.dragArea.classList.remove('drag-over');

    // 获取拖入的文件
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleDragLeave(e) {
    e.preventDefault();
    // 检查是否完全离开拖拽区域
    if (e.currentTarget === e.target) {
        elements.dragArea.classList.remove('drag-over');
    }
}

// 处理拖入的文件
function processFiles(files) {
    // 过滤出PNG文件
    const pngFiles = files.filter(file => file.type === 'image/png' || file.name.toLowerCase().endsWith('.png'));

    if (pngFiles.length === 0) {
        showToast('请拖入PNG格式的图片');
        return;
    }

    // 处理每个PNG文件
    pngFiles.forEach(file => {
        addImage(file);
    });

    // 显示图片列表
    elements.imageListSection.style.display = 'block';
}

// 添加图片到列表
function addImage(file) {
    // 创建图片对象
    const image = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        file: file,
        name: file.name,
        size: file.size,
        compressedSize: 0,
        compressionRate: 0,
        status: 'pending', // pending, compression, completed, failed
        progress: 0,
        compressedData: null
    };

    // 添加到图片列表
    app.images.push(image);
    app.totalSizeBefore += image.size;

    // 创建DOM元素
    const imageItem = createImageItem(image);
    elements.imageList.appendChild(imageItem);

    // 显示图片预览
    showImagePreview(image);
}

// 创建图片项DOM元素
function createImageItem(image) {
    const div = document.createElement('div');
    div.className = 'image-item';
    div.dataset.id = image.id;

    div.innerHTML = `
        <div class="image-item-header">
            <div class="status ${image.status}">${getStatusText(image.status)}</div>
            <div class="image-info">
                <div class="image-filename">${image.name}</div>
                <div class="image-stats">
                    <span class="original-size">${formatSize(image.size)}</span>
                    <span class="compressed-size" style="display: none;"></span>
                    <span class="compression-rate" style="display: none;"></span>
                </div>
            </div>
        </div>
        <img class="image-thumbnail" alt="${image.name}">
        <div class="progress-container" style="display: none;">
            <div class="progress-label">
                <span>压缩进度</span>
                <span class="progress-percentage">0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        </div>
        <div class="download-buttons" style="display: none;">
            <button class="btn-primary btn-download" data-id="${image.id}">下载</button>
        </div>
    `;

    return div;
}

// 显示图片预览
function showImagePreview(image) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageItem = document.querySelector(`.image-item[data-id="${image.id}"]`);
        const thumbnail = imageItem.querySelector('.image-thumbnail');
        thumbnail.src = e.target.result;
    };
    reader.readAsDataURL(image.file);
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        pending: '等待',
        compression: '压缩中',
        completed: '完成',
        failed: '失败'
    };
    return statusMap[status] || status;
}

// 格式化文件大小
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 清空图片列表
function clearImageList() {
    if (app.isCompressing) {
        showToast('正在压缩中，无法清空列表');
        return;
    }

    // 重置状态
    app.images = [];
    app.compressedCount = 0;
    app.totalSizeBefore = 0;
    app.totalSizeAfter = 0;

    // 清空DOM
    elements.imageList.innerHTML = '';
    elements.imageListSection.style.display = 'none';
    elements.downloadSection.style.display = 'none';
    elements.overallProgress.style.display = 'none';
}

// 开始压缩
async function startCompression() {
    if (app.isCompressing) {
        showToast('正在压缩中，请稍候');
        return;
    }

    if (app.images.length === 0) {
        showToast('请先添加PNG图片');
        return;
    }

    // 初始化压缩状态
    app.isCompressing = true;
    app.compressedCount = 0;
    app.totalSizeAfter = 0;

    // 显示整体进度
    elements.overallProgress.style.display = 'block';
    elements.downloadSection.style.display = 'none';

    // 禁用按钮
    elements.compressBtn.disabled = true;
    elements.clearBtn.disabled = true;

    // 遍历图片列表，开始压缩
    for (let i = 0; i < app.images.length; i++) {
        await compressImage(app.images[i], i);
    }

    // 压缩完成
    app.isCompressing = false;

    // 启用按钮
    elements.compressBtn.disabled = false;
    elements.clearBtn.disabled = false;

    // 显示下载区域
    showDownloadSection();
}

// 压缩单个图片
async function compressImage(image, index) {
    try {
        // 更新状态
        updateImageStatus(image, 'compression');

        // 读取文件数据
        const arrayBuffer = await readFileAsArrayBuffer(image.file);
        const uint8Array = new Uint8Array(arrayBuffer);

        // 获取压缩级别
        const quality = parseInt(elements.compressionQuality.value);

        // 调用压缩服务
        const compressedData = await window.MeeWoo.Services.ImageCompressionService.compressImage(uint8Array, quality);

        // 更新压缩结果
        image.compressedSize = compressedData.length;
        image.compressionRate = Math.round((1 - image.compressedSize / image.size) * 100);
        image.status = 'completed';
        image.progress = 100;
        image.compressedData = compressedData;

        // 更新总大小
        app.totalSizeAfter += image.compressedSize;

    } catch (error) {
        console.error('压缩图片失败:', error);
        image.status = 'failed';
    } finally {
        // 更新进度
        app.compressedCount++;
        updateOverallProgress();
        updateImageItem(image);
    }
}

// 读取文件为ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// 更新图片状态
function updateImageStatus(image, status) {
    image.status = status;
    updateImageItem(image);
}

// 更新图片项DOM
function updateImageItem(image) {
    const imageItem = document.querySelector(`.image-item[data-id="${image.id}"]`);
    if (!imageItem) return;

    // 更新状态
    const statusEl = imageItem.querySelector('.status');
    statusEl.className = `status ${image.status}`;
    statusEl.textContent = getStatusText(image.status);

    // 更新进度
    const progressContainer = imageItem.querySelector('.progress-container');
    const progressFill = imageItem.querySelector('.progress-fill');
    const progressPercentage = imageItem.querySelector('.progress-percentage');

    if (image.status === 'compression') {
        progressContainer.style.display = 'block';
        progressFill.style.width = `${image.progress}%`;
        progressPercentage.textContent = `${image.progress}%`;
    } else {
        progressContainer.style.display = 'none';
    }

    // 更新统计信息
    const originalSizeEl = imageItem.querySelector('.original-size');
    const compressedSizeEl = imageItem.querySelector('.compressed-size');
    const compressionRateEl = imageItem.querySelector('.compression-rate');

    if (image.status === 'completed') {
        compressedSizeEl.textContent = `${formatSize(image.compressedSize)}`;
        compressedSizeEl.style.display = 'inline';

        compressionRateEl.textContent = `(${image.compressionRate}% 压缩率)`;
        compressionRateEl.style.display = 'inline';

        // 显示下载按钮
        const downloadButtons = imageItem.querySelector('.download-buttons');
        downloadButtons.style.display = 'flex';

        // 绑定下载事件
        const downloadBtn = imageItem.querySelector('.btn-download');
        downloadBtn.addEventListener('click', () => downloadImage(image));
    }
}

// 更新整体进度
function updateOverallProgress() {
    const progress = Math.round((app.compressedCount / app.images.length) * 100);
    elements.overallProgressFill.style.width = `${progress}%`;
    elements.overallProgressStats.textContent = `${app.compressedCount}/${app.images.length} 图片`;
}

// 显示下载区域
function showDownloadSection() {
    elements.downloadSection.style.display = 'block';

    // 计算总压缩率
    const totalCompressionRate = Math.round((1 - app.totalSizeAfter / app.totalSizeBefore) * 100);

    // 更新统计信息
    elements.downloadStats.innerHTML = `
        <p>压缩完成！共压缩 ${app.images.length} 张图片</p>
        <p>压缩前总大小: ${formatSize(app.totalSizeBefore)}</p>
        <p>压缩后总大小: ${formatSize(app.totalSizeAfter)}</p>
        <p>总压缩率: ${totalCompressionRate}%</p>
    `;
}

// 下载单个图片
function downloadImage(image) {
    if (!image.compressedData) return;

    // 创建Blob对象
    const blob = new Blob([image.compressedData], { type: 'image/png' });

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${image.name.split('.')[0]}_compressed.png`;

    // 触发下载
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 打包下载所有图片
async function downloadAll() {
    if (app.compressedCount === 0) return;

    try {
        // 检查JSZip是否可用
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip库未加载');
        }

        // 创建JSZip实例
        const zip = new JSZip();

        // 添加压缩后的图片到zip
        app.images.forEach(image => {
            if (image.status === 'completed' && image.compressedData) {
                zip.file(`${image.name.split('.')[0]}_compressed.png`, image.compressedData);
            }
        });

        // 生成zip文件
        const content = await zip.generateAsync({ type: 'blob' });

        // 创建下载链接
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed_pngs_${new Date().getTime()}.zip`;

        // 触发下载
        document.body.appendChild(a);
        a.click();

        // 清理
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('打包下载成功');
    } catch (error) {
        console.error('打包下载失败:', error);
        showToast('打包下载失败');
    }
}

// 显示提示信息
function showToast(message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;

    // 添加到页面
    document.body.appendChild(toast);

    // 样式
    Object.assign(toast.style, {
        position: 'fixed',
        top: '48px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        zIndex: '9999',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'fadeInOut 3s ease-in-out'
    });

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            10% { opacity: 1; transform: translateX(-50%) translateY(0); }
            90% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
    `;
    document.head.appendChild(style);

    // 3秒后移除
    setTimeout(() => {
        document.body.removeChild(toast);
        document.head.removeChild(style);
    }, 3000);
}

// 设置主题
function setTheme(theme) {
    app.theme = theme;
    try {
        localStorage.setItem('theme', theme);
    } catch (e) {
        console.error('存储主题失败:', e);
    }

    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // 更新Logo图片
    updateLogoImage();
}

// 切换主题
function toggleTheme() {
    const newTheme = app.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);