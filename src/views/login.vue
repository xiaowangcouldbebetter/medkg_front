<template>
  <div class="login-page">
    <div class="medical-bg"></div>
    
    <div class="login-container" v-if="!isLoggedIn">
      <div class="branding">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        </div>
        <h1>智能医疗问答系统</h1>
        <p>基于知识图谱的诊疗助手</p>
      </div>
      
      <div class="tabs">
        <button 
          :class="['tab-btn', activeTab === 'login' ? 'active' : '']" 
          @click="activeTab = 'login'"
        >
          登录
        </button>
        <button 
          :class="['tab-btn', activeTab === 'register' ? 'active' : '']" 
          @click="activeTab = 'register'"
        >
          注册
        </button>
      </div>
      
      <!-- 登录表单 -->
      <div v-show="activeTab === 'login'" class="form-container">
        <div class="form-group">
          <label for="login-username">用户名</label>
          <div class="input-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input 
              id="login-username"
              v-model="loginData.name" 
              placeholder="请输入用户名"
              autocomplete="username"
            >
          </div>
        </div>
        
        <div class="form-group">
          <label for="login-password">密码</label>
          <div class="input-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input 
              id="login-password"
              v-model="loginData.plainPassword" 
              type="password" 
              placeholder="请输入密码"
              autocomplete="current-password"
            >
          </div>
        </div>
        
        <button 
          class="submit-btn" 
          @click="handleLogin"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>登录</span>
        </button>
      </div>
      
      <!-- 注册表单 -->
      <div v-show="activeTab === 'register'" class="form-container">
        <div class="form-group">
          <label for="register-username">用户名</label>
          <div class="input-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input 
              id="register-username"
              v-model="registerData.name" 
              placeholder="请输入用户名" 
              autocomplete="new-username"
            >
          </div>
        </div>
        
        <div class="form-group">
          <label for="register-email">邮箱</label>
          <div class="input-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <input 
              id="register-email"
              v-model="registerData.email" 
              type="email" 
              placeholder="请输入邮箱"
              autocomplete="email"
            >
          </div>
        </div>
        
        <div class="form-group">
          <label for="register-password">密码</label>
          <div class="input-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input 
              id="register-password"
              v-model="registerData.plainPassword" 
              type="password" 
              placeholder="请输入密码"
              autocomplete="new-password"
            >
          </div>
        </div>
        
        <button 
          class="submit-btn" 
          @click="handleRegister"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>注册</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import JSEncrypt from 'jsencrypt';
import apiConfig from '../api/config.js';
import axios from 'axios';

export default {
  data() {
    return {
      // 新增UI相关数据
      activeTab: 'login',
      isLoading: false,
      
      // 认证相关数据
      isLoggedIn: false,
      publicKey: '', // RSA公钥
      
      registerData: {
        name: '',
        email: '',
        plainPassword: '',
        password: '' // 加密后的密码
      },
      loginData: {
        name: '',
        plainPassword: '',
        password: '' // 加密后的密码
      }
    };
  },
  methods: {
    // 获取公钥
    async getPublicKey() {
      try {
        const response = await axios.get(`${apiConfig.endpoints.publicKey}`);
        if (response.data.code === 0) {
          this.publicKey = response.data.data;
          return true;
        }
        return false;
      } catch (error) {
        console.error('获取公钥失败:', error);
        ElMessage.error('获取加密公钥失败，请稍后重试');
        return false;
      }
    },
    
    // 加密密码
    encryptPassword(password) {
      if (!this.publicKey) {
        ElMessage.error('加密公钥不可用，请刷新页面重试');
        return null;
      }
      
      try {
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(this.publicKey);
        return encryptor.encrypt(password);
      } catch (error) {
        console.error('密码加密失败:', error);
        ElMessage.error('密码加密失败');
        return null;
      }
    },
    
    // 注册方法
    async handleRegister() {
      if (!this.registerData.name || !this.registerData.plainPassword || !this.registerData.email) {
        ElMessage.error('请填写完整的注册信息');
        return;
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.registerData.email)) {
        ElMessage.error('请输入有效的邮箱地址');
        return;
      }
      
      this.isLoading = true;
      
      // 获取公钥
      if (!this.publicKey && !(await this.getPublicKey())) {
        this.isLoading = false;
        return;
      }
      
      // 加密密码
      const encryptedPassword = this.encryptPassword(this.registerData.plainPassword);
      if (!encryptedPassword) {
        this.isLoading = false;
        return;
      }
      
      try {
        const response = await axios.post(
          `${apiConfig.endpoints.register}`,
          {
            name: this.registerData.name,
            email: this.registerData.email,
            password: encryptedPassword
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.code === 0) {
          ElMessage.success('注册成功');
          
          // 如果注册成功同时返回了token，直接登录
          if (response.data.data.token) {
            this.handleLoginSuccess(response.data.data);
          } else {
            // 否则切换到登录标签页
            this.activeTab = 'login';
            this.loginData.name = this.registerData.name;
            this.loginData.plainPassword = '';
          }
        } else {
          ElMessage.error(response.data.msg || '注册失败');
        }
      } catch (error) {
        console.error('注册请求失败:', error.response?.data);
        const errorMsg = error.response?.data?.msg || '注册失败，请稍后重试';
        ElMessage.error(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    // 登录方法
    async handleLogin() {
      if (!this.loginData.name || !this.loginData.plainPassword) {
        ElMessage.error('请填写用户名和密码');
        return;
      }
      
      this.isLoading = true;
      
      // 获取公钥
      if (!this.publicKey && !(await this.getPublicKey())) {
        this.isLoading = false;
        return;
      }
      
      // 加密密码
      const encryptedPassword = this.encryptPassword(this.loginData.plainPassword);
      if (!encryptedPassword) {
        this.isLoading = false;
        return;
      }
      
      try {
        const response = await axios.post(
          `${apiConfig.endpoints.login}`,
          {
            name: this.loginData.name,
            password: encryptedPassword
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.code === 0) {
          this.handleLoginSuccess(response.data.data);
        } else {
          ElMessage.error(response.data.msg || '登录失败');
        }
      } catch (error) {
        console.error('登录失败:', error.response?.data);
        const errorMsg = error.response?.status === 401 
          ? '用户名或密码错误' 
          : (error.response?.data?.msg || '登录失败，请稍后重试');
        
        ElMessage.error(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },
    
    // 处理登录成功
    handleLoginSuccess(userData) {
      this.isLoggedIn = true;
      ElMessage.success('登录成功');
      
      // 保存登录状态和用户信息
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userToken', userData.token);
      localStorage.setItem('userType', userData.userType);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('tokenExpires', userData.expires);
      
      // 设置axios默认请求头，添加授权信息
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      // 路由跳转
      this.$router.push('/chat');
    },
    
    // 检查登录状态
    checkLoginStatus() {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const token = localStorage.getItem('userToken');
      const expires = localStorage.getItem('tokenExpires');
      
      // 检查令牌是否存在且未过期
      if (isLoggedIn && token && expires) {
        const expiryDate = new Date(expires);
        if (expiryDate > new Date()) {
          this.isLoggedIn = true;
          // 设置axios默认请求头，添加授权信息
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return true;
        } else {
          // 令牌已过期，清除登录状态
          this.clearLoginStatus();
        }
      }
      return false;
    },
    
    // 清除登录状态
    clearLoginStatus() {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('tokenExpires');
      
      // 清除axios默认请求头
      delete axios.defaults.headers.common['Authorization'];
      
      this.isLoggedIn = false;
    }
  },
  mounted() {
    // 检查是否已登录
    if (this.checkLoginStatus()) {
      this.$router.push('/chat');
    } else {
      // 预先获取公钥
      this.getPublicKey();
    }
  }
}
</script>

<style scoped>
/* 基础变量 */
:root {
  --primary-color: #4D96FF;
  --primary-dark: #3879D9;
  --secondary-color: #6BCB77;
  --accent-color: #FF6B6B;
  --background-color: #F8FAFC;
  --surface-color: #FFFFFF;
  --text-primary: #334155;
  --text-secondary: #64748B;
  --border-color: #E2E8F0;
  --input-bg: #F1F5F9;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 登录页面样式 */
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 20px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow: hidden;
}

/* 医疗背景 */
.medical-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%234D96FF" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>');
  background-size: 120px;
  background-position: center;
  opacity: 0.03;
  z-index: 0;
}

/* 登录容器 */
.login-container {
  position: relative;
  width: 100%;
  max-width: 420px;
  background-color: var(--surface-color);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 1;
}

/* 品牌部分 */
.branding {
  text-align: center;
  padding: 40px 20px 20px;
  background: linear-gradient(135deg, #4D96FF 0%, #3879D9 100%);
  color: white;
}

.logo {
  margin: 0 auto 16px;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.branding h1 {
  margin: 0 0 5px;
  font-size: 1.8rem;
  font-weight: 600;
}

.branding p {
  margin: 0;
  opacity: 0.8;
  font-size: 1rem;
}

/* 标签切换 */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.tab-btn:hover {
  color: var(--primary-color);
}

.tab-btn.active {
  color: var(--primary-color);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--primary-color);
}

/* 表单容器 */
.form-container {
  padding: 30px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--input-bg);
  border-radius: 10px;
  transition: all 0.3s;
}

.input-with-icon:focus-within {
  box-shadow: 0 0 0 2px rgba(77, 150, 255, 0.3);
}

.input-with-icon svg {
  margin: 0 12px;
  color: var(--text-secondary);
}

.input-with-icon input,
.input-with-icon select {
  flex: 1;
  padding: 14px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  width: 100%;
}

.input-with-icon input:focus,
.input-with-icon select:focus {
  outline: none;
}

.select-box {
  appearance: none;
  padding-right: 30px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2364748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  margin-top: 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(to right, var(--primary-color), var(--primary-dark));
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 150, 255, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  transform: none;
  box-shadow: none;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .branding {
    padding: 30px 20px 15px;
  }
  
  .branding h1 {
    font-size: 1.5rem;
  }
  
  .logo {
    width: 50px;
    height: 50px;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .tab-btn {
    padding: 12px;
  }
}
</style>