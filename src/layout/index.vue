<template>
  <!-- 项目主界面 -->
  <div class="app-container">
    <el-container>
      <!-- 主界面的标题栏 -->
      <el-header class="app-header">
        <div class="logo-container">
          <div class="logo-icon"></div>
          <span class="logo-text">医疗知识图谱智能问答系统</span>
        </div>
        
        <div class="header-right">
          <!-- 搜索框 -->
          <el-input
            v-model="searchQuery"
            placeholder="搜索..."
            prefix-icon="Search"
            class="header-search"
            clearable
            @keyup.enter="handleSearch"
          />
          
          <!-- 通知图标 -->
          <el-badge :value="3" class="notification-badge">
            <el-icon class="header-icon"><Bell /></el-icon>
          </el-badge>
          
          <!-- 用户头像和下拉菜单 -->
          <el-dropdown trigger="click" class="user-dropdown">
            <div class="user-info">
              <el-avatar :size="40" :src="userAvatar">{{ userAvatarText }}</el-avatar>
              <span class="username">{{ userName || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showUserInfo">
                  <el-icon><User /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item v-if="isAdmin" @click="navigateToAdmin">
                  <el-icon><Setting /></el-icon>管理面板
                </el-dropdown-item>
                <el-dropdown-item @click="showFeedbackDialog">
                  <el-icon><ChatDotRound /></el-icon>问题反馈
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主界面的内容区域 -->
      <el-container class="main-container">
        <!-- 侧边栏 -->
        <el-aside width="240px" class="sidebar">
          <el-menu 
            :default-active="activeMenu" 
            class="sidebar-menu"
            :collapse="isCollapse"
            router
            unique-opened
          >
            <template v-for="(item, index) in menulist" :key="index">
              <template v-if="item.hidden !== true">
                <el-sub-menu :index="'' + index">
                  <template #title>
                    <el-icon><component :is="item.icon" /></el-icon>
                    <span>{{ item.name }}</span>
                  </template>

                  <el-menu-item 
                    v-for="child in item.children" 
                    :key="child.path" 
                    :index="child.path"
                  >
                    <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
                    <span>{{ child.name }}</span>
                  </el-menu-item>
                </el-sub-menu>
              </template>
            </template>
          </el-menu>
          
          <!-- 折叠按钮 -->
          <div class="collapse-btn" @click="toggleSidebar">
            <el-icon v-if="isCollapse"><Expand /></el-icon>
            <el-icon v-else><Fold /></el-icon>
          </div>
        </el-aside>

        <!-- 主内容区域 -->
        <el-main class="main-content">
          <!-- 面包屑导航 -->
          <div class="breadcrumb-container">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
                {{ item }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <!-- 页面内容 -->
          <div class="page-container">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>
    
    <!-- 用户信息对话框 -->
    <el-dialog 
      v-model="userInfoDialogVisible" 
      title="用户信息" 
      width="400px"
      :before-close="handleCloseDialog"
    >
      <div class="user-info-container">
        <el-avatar :size="80" :src="userAvatar" class="user-avatar">{{ userAvatarText }}</el-avatar>
        <div class="user-details">
          <p><strong>用户名:</strong> {{ userName }}</p>
          <p><strong>邮箱:</strong> {{ userEmail }}</p>
          <p><strong>用户类型:</strong> {{ userType === 'admin' ? '管理员' : '普通用户' }}</p>
          <p v-if="lastLogin"><strong>上次登录:</strong> {{ formatDate(lastLogin) }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userInfoDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="editUserInfo">编辑</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 问题反馈对话框 -->
    <el-dialog
      v-model="feedbackDialogVisible"
      title="问题反馈"
      width="500px"
    >
      <el-form :model="feedbackForm" label-width="80px" :rules="feedbackRules" ref="feedbackFormRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="feedbackForm.title" placeholder="请输入反馈标题"></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="feedbackForm.type" placeholder="请选择反馈类型" style="width: 100%">
            <el-option label="系统错误" value="bug"></el-option>
            <el-option label="功能建议" value="suggestion"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="feedbackForm.content" 
            type="textarea" 
            rows="5" 
            placeholder="请详细描述您遇到的问题或建议..."
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="feedbackDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitFeedback">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<!--菜单使用router内容-->
<script>
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import apiConfig from '../api/config.js';

export default {
  methods: {
    // 退出登录
    handleLogout() {
      ElMessageBox.confirm(
        '确定要退出登录吗?',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        // 调用后端退出登录接口
        axios.post(`${apiConfig.endpoints.logout}`, {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        }).then(() => {
          this.clearLoginStatus();
          ElMessage.success('退出登录成功');
          this.$router.push('/login');
        }).catch(error => {
          console.error('退出登录请求失败:', error);
          // 即使请求失败也清除本地登录状态
          this.clearLoginStatus();
          ElMessage.warning('退出登录请求失败，但已在本地清除登录状态');
          this.$router.push('/login');
        });
      }).catch(() => {
        // 用户取消退出操作
      });
    },
    
    // 清除登录状态
    clearLoginStatus() {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('tokenExpires');
      localStorage.removeItem('lastLogin');
      
      // 清除axios默认请求头
      delete axios.defaults.headers.common['Authorization'];
    },
    
    // 显示用户信息对话框
    showUserInfo() {
      // 尝试从后端获取最新用户信息
      axios.get(`${apiConfig.endpoints.userInfo}`)
        .then(response => {
          if (response.data.code === 0) {
            const userData = response.data.data;
            this.userName = userData.name;
            this.userEmail = userData.email;
            this.userType = userData.userType;
            this.lastLogin = userData.lastLogin;
            
            // 存储到本地
            localStorage.setItem('userName', userData.name);
            localStorage.setItem('userEmail', userData.email);
            localStorage.setItem('userType', userData.userType);
            localStorage.setItem('lastLogin', userData.lastLogin);
            
            // 更新头像文本
            this.updateAvatarText();
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        })
        .finally(() => {
          this.userInfoDialogVisible = true;
        });
    },
    
    // 关闭对话框
    handleCloseDialog() {
      this.userInfoDialogVisible = false;
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    
    // 获取用户信息
    getUserInfo() {
      this.userName = localStorage.getItem('userName') || '';
      this.userEmail = localStorage.getItem('userEmail') || '';
      this.userType = localStorage.getItem('userType') || 'user';
      this.lastLogin = localStorage.getItem('lastLogin') || '';
      this.isAdmin = this.userType === 'admin';
      
      // 更新头像文本
      this.updateAvatarText();
    },
    
    // 更新头像文本
    updateAvatarText() {
      if (this.userName) {
        this.userAvatarText = this.userName.charAt(0).toUpperCase();
      } else {
        this.userAvatarText = 'U';
      }
    },
    
    // 切换侧边栏折叠状态
    toggleSidebar() {
      this.isCollapse = !this.isCollapse;
    },
    
    // 跳转到管理面板
    navigateToAdmin() {
      if (this.isAdmin) {
        this.$router.push('/admin');
      } else {
        ElMessage.warning('只有管理员才能访问管理面板');
      }
    },
    
    // 处理搜索
    handleSearch() {
      if (this.searchQuery.trim()) {
        ElMessage.info(`搜索: ${this.searchQuery}`);
        // 实现搜索功能
      }
    },
    
    // 显示反馈对话框
    showFeedbackDialog() {
      this.feedbackDialogVisible = true;
    },
    
    // 提交反馈
    submitFeedback() {
      this.$refs.feedbackFormRef.validate((valid) => {
        if (valid) {
          // 获取用户ID
          const userId = localStorage.getItem('userId');
          
          // 准备提交的数据
          const feedbackData = {
            ...this.feedbackForm,
            user_id: userId
          };
          
          // 发送请求
          axios.post(`/user/feedback/`, feedbackData)
            .then(response => {
              if (response.data.success) {
                ElMessage.success('反馈提交成功，感谢您的建议！');
                this.feedbackDialogVisible = false;
                // 重置表单
                this.feedbackForm = {
                  title: '',
                  type: 'bug',
                  content: ''
                };
              } else {
                ElMessage.error(response.data.message || '提交失败');
              }
            })
            .catch(error => {
              console.error('提交反馈失败:', error);
              ElMessage.error('提交反馈失败，请稍后再试');
            });
        } else {
          return false;
        }
      });
    },
    
    // 编辑用户信息
    editUserInfo() {
      ElMessage.info('编辑用户信息功能正在开发中...');
    },
    
    // 更新面包屑
    updateBreadcrumbs() {
      // 根据当前路由生成面包屑
      const currentRoute = this.$route;
      this.breadcrumbs = [];
      
      if (currentRoute.meta && currentRoute.meta.title) {
        this.breadcrumbs.push(currentRoute.meta.title);
      } else if (currentRoute.name) {
        this.breadcrumbs.push(currentRoute.name);
      }
    }
  },
  mounted() {
    // 在这里获取路由配置信息
    this.menulist = this.$router.options.routes;
    
    // 获取用户信息
    this.getUserInfo();
    
    // 设置当前活动菜单
    this.activeMenu = this.$route.path;
    
    // 初始化面包屑
    this.updateBreadcrumbs();
  },
  watch: {
    $route(to) {
      // 更新活动菜单
      this.activeMenu = to.path;
      
      // 更新面包屑
      this.updateBreadcrumbs();
    }
  },
  data() {
    return {
      menulist: [],
      userName: '',
      userEmail: '',
      userType: 'user',
      isAdmin: false,
      lastLogin: '',
      userAvatar: '',
      userAvatarText: 'U',
      userInfoDialogVisible: false,
      isCollapse: false,
      activeMenu: '/',
      breadcrumbs: [],
      searchQuery: '',
      feedbackDialogVisible: false,
      feedbackForm: {
        title: '',
        type: 'bug',
        content: ''
      },
      feedbackRules: {
        title: [
          { required: true, message: '请输入反馈标题', trigger: 'blur' },
          { min: 3, max: 100, message: '标题长度在3到100个字符之间', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择反馈类型', trigger: 'change' }
        ],
        content: [
          { required: true, message: '请输入反馈内容', trigger: 'blur' },
          { min: 10, max: 500, message: '内容长度在10到500个字符之间', trigger: 'blur' }
        ]
      }
    }
  },
}
</script>


<style scoped>
/* 全局容器样式 */
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.app-header {
  background: linear-gradient(135deg, #42b983 0%, #3398db 100%);
  color: white;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  margin-left: 10px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-search {
  width: 200px;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  color: white;
}

.notification-badge {
  margin-right: 10px;
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
  color: white;
}

/* 主内容区域样式 */
.main-container {
  flex: 1;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  transition: width 0.3s;
  position: relative;
}

.sidebar-menu {
  height: calc(100% - 40px);
  border-right: none;
}

.collapse-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s;
}

.collapse-btn:hover {
  background-color: #e6e8eb;
}

/* 主内容区域样式 */
.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.breadcrumb-container {
  margin-bottom: 20px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-container {
  flex: 1;
  background-color: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 用户信息对话框样式 */
.user-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.user-avatar {
  margin-bottom: 20px;
}

.user-details {
  width: 100%;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.user-details p {
  margin: 10px 0;
}

/* 过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
