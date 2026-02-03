// 登录状态管理工具
class AuthUtils {
  constructor() {
    this.tokenKey = 'imghelptoken';
    this.userKey = 'imghelpuser';
    this.loginUrl = 'https://www.imghlp.com/auth/login.html';
  }

  // 检查是否已登录
  isLoggedIn() {
    try {
      return !!localStorage.getItem(this.tokenKey);
    } catch (e) {
      console.error('检查登录状态失败:', e);
      return false;
    }
  }

  // 获取Token
  getToken() {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (e) {
      console.error('获取Token失败:', e);
      return null;
    }
  }

  // 获取用户信息
  getUserInfo() {
    try {
      const userInfo = localStorage.getItem(this.userKey);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (e) {
      console.error('获取用户信息失败:', e);
      return null;
    }
  }

  // 存储Token
  saveToken(token) {
    try {
      localStorage.setItem(this.tokenKey, token);
      return true;
    } catch (e) {
      console.error('存储Token失败:', e);
      return false;
    }
  }

  // 存储用户信息
  saveUserInfo(userInfo) {
    try {
      // 限制存储的数据大小
      const limitedUserInfo = {
        username: userInfo.username || '',
        id: userInfo.id || ''
      };
      localStorage.setItem(this.userKey, JSON.stringify(limitedUserInfo));
      return true;
    } catch (e) {
      console.error('存储用户信息失败:', e);
      return false;
    }
  }

  // 清除登录信息
  clearAuth() {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      return true;
    } catch (e) {
      console.error('清除登录信息失败:', e);
      return false;
    }
  }

  // 重定向到登录页面
  redirectToLogin(returnUrl) {
    const encodedReturnUrl = encodeURIComponent(returnUrl || window.location.href);
    window.location.href = `${this.loginUrl}?returnUrl=${encodedReturnUrl}`;
  }

  // 处理登录回调
  handleLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('authToken') || urlParams.get('token');
    const userInfoParam = urlParams.get('userInfo') || urlParams.get('user');
    
    if (token && userInfoParam) {
      try {
        // 存储Token和用户信息
        this.saveToken(token);
        this.saveUserInfo(JSON.parse(userInfoParam));
        
        // 清理URL参数
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('authToken');
        cleanUrl.searchParams.delete('token');
        cleanUrl.searchParams.delete('userInfo');
        cleanUrl.searchParams.delete('user');
        window.history.replaceState({}, '', cleanUrl.toString());
        
        return true;
      } catch (e) {
        console.error('处理登录回调失败:', e);
        return false;
      }
    }
    return false;
  }
}

// 导出单例
const authUtils = new AuthUtils();
window.authUtils = authUtils; // 全局可用