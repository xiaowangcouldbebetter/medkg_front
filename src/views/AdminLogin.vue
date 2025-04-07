<template>
  <div class="admin-login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>管理员登录</h2>
        <p>医疗知识图谱管理系统</p>
      </div>
      
      <div class="login-form">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="请输入邮箱" 
            :class="{ 'error': emailError }"
          />
          <div class="error-message" v-if="emailError">{{ emailError }}</div>
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-input-container">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              placeholder="请输入密码"
              :class="{ 'error': passwordError }"
            />
            <i 
              class="password-toggle-icon"
              :class="showPassword ? 'el-icon-view' : 'el-icon-hide'"
              @click="showPassword = !showPassword"
            ></i>
          </div>
          <div class="error-message" v-if="passwordError">{{ passwordError }}</div>
        </div>
        
        <button 
          class="login-button"
          @click="handleLogin"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">登录</span>
          <i v-else class="el-icon-loading"></i>
        </button>
        
        <div class="login-footer">
          <router-link to="/login">返回用户登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import apiConfig from '../api/config.js';
import { ElMessage } from 'element-plus';

export default {
  name: 'AdminLogin',
  data() {
    return {
      email: '',
      password: '',
      emailError: '',
      passwordError: '',
      showPassword: false,
      isLoading: false
    };
  },
  methods: {
    validateEmail() {
      this.emailError = '';
      if (!this.email) {
        this.emailError = '请输入邮箱';
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.emailError = '请输入有效的邮箱地址';
        return false;
      }
      return true;
    },
    validatePassword() {
      this.passwordError = '';
      if (!this.password) {
        this.passwordError = '请输入密码';
        return false;
      }
      return true;
    },
    validateForm() {
      const isEmailValid = this.validateEmail();
      const isPasswordValid = this.validatePassword();
      return isEmailValid && isPasswordValid;
    },
    async handleLogin() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        const response = await axios.post(`${apiConfig.endpoints.adminLogin}`, {
          email: this.email,
          password: this.password
        });
        
        if (response.data.success) {
          // 存储管理员信息和会话
          localStorage.setItem('adminToken', response.data.token || 'admin-token');
          localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
          
          // 显示登录成功消息
          ElMessage.success('登录成功');
          
          // 跳转到管理员控制台
          this.$router.push('/admin/dashboard');
        } else {
          ElMessage.error(response.data.message || '登录失败');
        }
      } catch (error) {
        console.error('登录失败:', error);
        if (error.response && error.response.data) {
          ElMessage.error(error.response.data.message || '登录失败，请检查邮箱和密码');
        } else {
          ElMessage.error('登录失败，请稍后再试');
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.admin-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-box {
  width: 400px;
  padding: 35px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #303133;
}

.form-group input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #409eff;
}

.form-group input.error {
  border-color: #f56c6c;
}

.error-message {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
}

.password-input-container {
  position: relative;
}

.password-toggle-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #909399;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover {
  background-color: #66b1ff;
}

.login-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 15px;
  text-align: center;
}

.login-footer a {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.login-footer a:hover {
  color: #66b1ff;
}
</style> 