// 登录状态管理工具
class AuthUtils {
  constructor() {
    this.tokenKey = 'imghelptoken';
    this.userKey = 'imghelpuser';
    this.loginUrl = 'https://www.imghlp.com/auth/login.html';
  }

  // 检查是否已登录
  isLoggedIn() {
    return !!localStorage.getItem(this.tokenKey);
  }

  // 获取Token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // 获取用户信息
  getUserInfo() {
    const userInfo = localStorage.getItem(this.userKey);
    return userInfo ? JSON.parse(userInfo) : null;
  }

  // 存储Token
  saveToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // 存储用户信息
  saveUserInfo(userInfo) {
    localStorage.setItem(this.userKey, JSON.stringify(userInfo));
  }

  // 清除登录信息
  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // 重定向到登录页面
  redirectToLogin(returnUrl) {
    const encodedReturnUrl = encodeURIComponent(returnUrl || window.location.href);
    window.location.href = `${this.loginUrl}?returnUrl=${encodedReturnUrl}`;
  }

  // 处理登录回调
  handleLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userInfo = urlParams.get('user');
    
    if (token && userInfo) {
      try {
        // 存储Token和用户信息
        this.saveToken(token);
        this.saveUserInfo(JSON.parse(userInfo));
        
        // 清理URL参数
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
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