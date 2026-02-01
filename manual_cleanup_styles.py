# 手动创建适合登录页的CSS文件

css_content = """/* ==================== 全局重置 & 基础布局 ==================== */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: 'Segoe UI', 'Noto Sans SC', -apple-system, BlinkMacSystemFont,
    sans-serif;
  overflow: hidden;
  background-color: #fcfcfc;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlM2UzZTMiLz48L3N2Zz4=');
  background-repeat: repeat;
  background-size: 12px 12px;
  transition: background-color 0.3s, background-image 0.3s;
}

body.dark-mode {
  background-color: #1a1a1a;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMzMzMzMzMiLz48L3N2Zz4=');
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ==================== 通用输入框样式系统 ==================== */

/* 基础输入框样式 - 用于input元素内部 */
.base-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  font-family: 'Segoe UI', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #333333;
  text-align: center;
  outline: none;
}

body.dark-mode .base-input {
  color: #cccccc;
}

/* 输入框容器通用样式 */
.input-wrapper {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  gap: 4px;
  min-width: 50px;
  background: #F3F3F3;
  border: 2px solid #F3F3F3;
  border-radius: 12px;
  flex: none;
  flex-grow: 0;
}

.input-wrapper:hover {
  background: #FCFCFC;
  border: 2px solid #333333;
}

.input-wrapper:focus-within {
  background: #FFFFFF;
  border: 2px solid #333333;
}

body.dark-mode .input-wrapper {
  background: #3a3a3a;
  border: 2px solid #3a3a3a;
}

body.dark-mode .input-wrapper:hover {
  background: #454545;
  border: 2px solid #999999;
}

body.dark-mode .input-wrapper:focus-within {
  background: #3a3a3a;
  border: 2px solid #999999;
}

/* 尺寸修饰符 */
.input-wrapper--lg {
  height: 44px;
}

/* ==================== 通用按钮系统 ==================== */

/* 大按钮 - 次要按钮（btn02_Large） */
.btn-large-secondary {
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-family: 'Segoe UI', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.57;
  text-align: center;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 110px;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: auto;
  background-color: #5b5b5b;
  border-color: #5b5b5b;
  color: #ffffff;
}

.btn-large-secondary:hover {
  background-color: #555555;
  border-color: #000000;
}

.btn-large-secondary:active {
  background-color: #000000;
  border-color: #000000;
}

.btn-large-secondary:disabled {
  background-color: rgba(91, 91, 91, 0.3);
  border-color: rgba(91, 91, 91, 0.3);
  color: #ffffff;
  cursor: not-allowed;
  opacity: 1;
}

/* ==================== 登录页面专用样式 ==================== */

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
}

body.dark-mode .login-card {
  background: #2a2a2a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.login-logo {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo img {
  width: 250px;
  height: 64px;
  margin: 8px 0 0 4px;
}

.login-logo h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

body.dark-mode .login-logo h1 {
  color: #fff;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

body.dark-mode .form-group label {
  color: #ccc;
}

.form-actions {
  margin-top: 32px;
}

.form-actions .btn-large-secondary {
  width: 100%;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #999;
}

body.dark-mode .login-footer {
  color: #777;
}

.login-footer a {
  color: #00b4ff;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

body.dark-mode .error-message {
  background: #4e342e;
  color: #ffab91;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

body.dark-mode .loading-overlay {
  background: rgba(26, 26, 26, 0.8);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #00b4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
"""

# 保存清理后的CSS
output_path = 'docs/auth/styles_cleaned.css'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(css_content)

print(f"手动清理后的CSS文件已保存到: {output_path}")
print(f"清理后的CSS文件大小: {len(css_content)} 字符")
