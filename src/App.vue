<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import axios from 'axios';
import { ElMessage } from 'element-plus';

export default {
  name: 'App',
  created() {
    // 暂时禁用复杂的路由守卫
    
    this.$router.beforeEach((to, from, next) => {
      // 检查路由是否需要认证
      if (to.matched.some(record => record.meta.requiresAuth)) {
        // 检查是否已登录并且令牌有效
        if (this.checkLoginStatus()) {
          next(); // 允许访问
        } else {
          // 提示用户
          ElMessage.warning('您需要登录后才能访问该页面');
          // 重定向到登录页
          next({
            path: '/login',
            query: { redirect: to.fullPath } // 将要访问的页面作为查询参数传递
          });
        }
      } else {
        // 对于不需要认证的路由，直接访问
        next();
      }
    });
    
  },
  mounted() {
    // 添加响应拦截器（main.js中已添加请求拦截器）
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // 服务器返回了错误状态码
          console.error('API响应错误:', error.response.status, error.response.data);
          
          // 处理401未授权错误（token无效或过期）
          if (error.response.status === 401) {
            // 清除登录状态
            localStorage.removeItem('userToken');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('isLoggedIn');
            
            // 如果当前不在登录页，则重定向到登录页
            if (this.$route.path !== '/login' && this.$route.path !== '/admin/login') {
              ElMessage.error('登录已过期，请重新登录');
              // 根据当前路径判断重定向到哪个登录页
              if (this.$route.path.startsWith('/admin')) {
                this.$router.push('/admin/login');
              } else {
                this.$router.push('/login');
              }
            }
          } else {
            ElMessage.error(`请求失败: ${error.response.data.message || '服务器错误'}`);
          }
        } else if (error.request) {
          // 请求已发出，但没有收到响应
          console.error('API请求错误: 未收到响应', error.request);
          ElMessage.error('无法连接到服务器，请检查网络连接');
        } else {
          // 请求配置出错
          console.error('API请求错误:', error.message);
          ElMessage.error('请求配置错误');
        }
        return Promise.reject(error);
      }
    );
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const token = localStorage.getItem('userToken');
      const expires = localStorage.getItem('tokenExpires');
      
      // 检查令牌是否存在且未过期
      if (isLoggedIn && token && expires) {
        const expiryDate = new Date(expires);
        if (expiryDate > new Date()) {
          // 设置axios默认请求头，添加授权信息
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return true;
        } else {
          // 清除失效的登录信息
          this.clearLoginStatus();
          return false;
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
    }
  }
}
</script>

<style>
/* 全局CSS变量 */
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
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 全局重置和基础样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  width: 100%;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--background-color);
  line-height: 1.5;
  font-size: 16px;
}

#app {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.2s;
}

a:hover {
  color: var(--primary-dark);
}

button {
  cursor: pointer;
  font-family: inherit;
}

input, select, textarea {
  font-family: inherit;
  font-size: inherit;
}

/* 溢出处理 */
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 通用布局类 */
.flex {
  display: flex;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.flex-wrap {
  flex-wrap: wrap;
}

.flex-grow {
  flex-grow: 1;
}

/* 通用间距类 */
.mt-4 {
  margin-top: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.p-4 {
  padding: 1rem;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
