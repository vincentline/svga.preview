// 图片处理API调用工具
class ImageApi {
  constructor() {
    this.baseUrl = 'https://api.imghlp.com';
  }

  // 检查登录状态
  checkLogin() {
    if (!window.authUtils.isLoggedIn()) {
      throw new Error('未登录，请先登录');
    }
    return window.authUtils.getToken();
  }

  // 通用请求方法
  async request(endpoint, data) {
    const token = this.checkLogin();

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token过期，重新登录
          window.authUtils.redirectToLogin(window.location.href);
          throw new Error('登录已过期，请重新登录');
        }
        throw new Error(`API调用失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API调用失败');
      }

      return result.data;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // 合并图片
  async mergeImages(images) {
    return this.request('/merge', { images });
  }

  // 切割图片
  async splitImage(mergedImage, positionData) {
    return this.request('/split', { mergedImage, positionData });
  }

  // 文件转Base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Base64转Blob
  base64ToBlob(base64) {
    const matches = base64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('无效的Base64格式');
    }
    const type = matches[1];
    const buffer = Uint8Array.from(atob(matches[2]), c => c.charCodeAt(0));
    return new Blob([buffer], { type: `image/${type}` });
  }
}

// 导出单例
const imageApi = new ImageApi();
window.imageApi = imageApi; // 全局可用