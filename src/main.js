import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import axios from 'axios';
import apiConfig from './api/config.js';

// 设置Axios默认配置
axios.defaults.baseURL = apiConfig.API_BASE_URL;

// 添加请求拦截器
axios.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      // 处理401错误（未授权）
      if (error.response.status === 401) {
        // 判断是管理员请求还是普通用户请求
        const isAdminRequest = error.config.url.includes('/admin/');
        
        if (isAdminRequest) {
          // 清除管理员token并跳转到管理员登录页
          localStorage.removeItem('adminToken');
          if (router.currentRoute.value.meta.requiresAdminAuth) {
            router.push('/admin/login');
          }
        } else {
          // 清除用户token并跳转到登录页
          localStorage.removeItem('token');
          if (router.currentRoute.value.meta.requiresAuth) {
            router.push('/login');
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

const app = createApp(App);
app.use(store);
app.use(router);
app.use(ElementPlus);

// 配置全局属性
app.config.globalProperties.$axios = axios;

// 注册ElementPlus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');