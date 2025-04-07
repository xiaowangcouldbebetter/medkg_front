<template>
  <!-- 项目主界面 -->
  <div class="common-layout">
    <el-container>
      <!-- 主界面的标题栏 -->
      <el-header style="background-color: #409eff;height: 80px;">
        <el-row>
          <el-col :span="4">
            <div class="home-title" />
            <span class="title-text">智能诊疗</span>
          </el-col>
          <el-col :span="1">
            <div class="home-title-ic" /><el-icon class="home-title-icon" color="black">
              <Fold />
            </el-icon>
          </el-col>
          <el-col :span="15">
            <div class="grid-content ep-bg-purple-dark" />
          </el-col>

          <!-- 头像 -->
          <el-col :span="2" style="margin-top: 10px;">
            <el-avatar :size="50" icon="el-icon-user-solid" :src="userAvatar" />
          </el-col>

          <!-- 下拉列表 -->
          <el-col :span="2">
            <div class="home-title-dropdown" />
            <el-dropdown style="margin-top: 10px;">
              <el-button type="primary" style="width: auto; min-width: 80px; height: 30px; margin: 10px;">
                {{ userName || '用户' }}
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="showUserInfo">用户信息</el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin">管理面板</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-col>
        </el-row>
      </el-header>

      <!-- 主界面的内容区域 -->
      <el-container style="height: 900px;">
        <el-aside style="background-color: lightblue;" width="240px">

          <!---添加菜单栏-->
          <el-menu defult-active="1" class="el-menu-popper-demo" style="max-width: 600px" router>

            <!-- 遍历 menulist 数组，为每个元素创建一个 el-sub-menu 组件 -->

            <template v-for="(item, index) in this.menulist" :key="index">
              <template v-if="item.hidden != true">
                <el-sub-menu :index="'' + index">
                  <!-- 修改此处的代码，在<span>中添加一个变量，此变量根据index.js中的图标的变量 -->
                  <template #title><el-icon style="color: #409eff;">
                      <component :is="item.icon" />
                    </el-icon>
                    <span>{{ item.name }}</span>
                  </template>

                  <el-menu-item :index="child.path" v-for="child in item['children']">
                    <span>{{ child.name }}</span>
                  </el-menu-item>
                </el-sub-menu>
              </template>
            </template>
          </el-menu>
        </el-aside>

        <el-main style="background-color: aliceblue;">
          <router-view />
        </el-main>

      </el-container>
    </el-container>
    
    <!-- 用户信息对话框 -->
    <el-dialog 
      v-model="userInfoDialogVisible" 
      title="用户信息" 
      width="30%"
      :before-close="handleCloseDialog"
    >
      <div class="user-info-container">
        <el-avatar :size="80" icon="el-icon-user-solid" :src="userAvatar" class="user-avatar" />
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
        axios.post(`${apiConfig.API_BASE_URL}${apiConfig.endpoints.logout}`, {}, {
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
      axios.get(`${apiConfig.API_BASE_URL}${apiConfig.endpoints.userInfo}`)
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
      
      // 生成用户头像
      if (this.userName) {
        // 使用首字母作为头像
        this.userAvatar = '';
      }
    }
  },
  mounted() {
    // 在这里获取路由配置信息
    this.menulist = this.$router.options.routes;
    
    // 获取用户信息
    this.getUserInfo();
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
      userInfoDialogVisible: false
    }
  },
}
</script>


<style scoped>
.home-title {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
  color: rgb(24, 22, 22);
}

.title-text {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
  color: rgb(255, 255, 255);
  text-shadow: 2px 2px 4px #000000;
}

.home-title-icon {
  font-size: 50px;
  color: white;
  font-weight: bold;
  padding: 5px;
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
}

.user-details p {
  margin: 10px 0;
  padding: 8px;
  border-bottom: 1px solid #eee;
}
</style>
