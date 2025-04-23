<template>
  <div class="admin-dashboard">
    <div class="admin-sidebar">
      <div class="logo">
        <h2>医疗知识图谱</h2>
        <p>管理系统</p>
      </div>
      
      <ul class="nav-menu">
        <li 
          v-for="(item, index) in navItems" 
          :key="index"
          :class="{ 'active': currentView === item.id }"
          @click="switchView(item.id)"
        >
          <i :class="item.icon"></i>
          <span>{{ item.title }}</span>
        </li>
      </ul>
      
      <div class="admin-info">
        <div class="admin-avatar">
          <span>{{ getAdminInitials() }}</span>
        </div>
        <div class="admin-name">{{ adminName }}</div>
        <button class="logout-btn" @click="handleLogout">
          <i class="el-icon-switch-button"></i> 退出登录
        </button>
      </div>
    </div>
    
    <div class="admin-content">
      <div class="content-header">
        <h2>{{ getCurrentViewTitle() }}</h2>
        <div class="admin-actions">
          <span class="welcome-text">欢迎，{{ adminName }}</span>
        </div>
      </div>
      
      <div class="content-body">
        <!-- 知识图谱统计 -->
        <div v-if="currentView === 'kg-stats'" class="kg-stats-container">
          <KnowledgeGraphStats />
        </div>
        
        <!-- 知识图谱可视化 -->
        <div v-if="currentView === 'kg-visual'" class="kg-visual-container">
          <KnowledgeGraphVisualization />
        </div>
        
        <!-- 知识图谱更新 -->
        <div v-if="currentView === 'kg-update'" class="kg-update-container">
          <KnowledgeGraphUpdate />
        </div>
        
        <!-- 用户日志 -->
        <div v-if="currentView === 'user-logs'" class="logs-container">
          <UserLogs />
        </div>
        
        <!-- 系统日志 -->
        <div v-if="currentView === 'system-logs'" class="logs-container">
          <SystemLogs />
        </div>
        
        <!-- 用户反馈 -->
        <div v-if="currentView === 'user-feedback'" class="feedback-container">
          <UserFeedback />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KnowledgeGraphStats from '@/components/admin/KnowledgeGraphStats.vue';
import KnowledgeGraphVisualization from '@/components/admin/KnowledgeGraphVisualization.vue';
import KnowledgeGraphUpdate from '@/components/admin/KnowledgeGraphUpdate.vue';
import UserLogs from '@/components/admin/UserLogs.vue';
import SystemLogs from '@/components/admin/SystemLogs.vue';
import UserFeedback from '@/components/admin/UserFeedback.vue';

export default {
  name: 'AdminDashboard',
  components: {
    KnowledgeGraphStats,
    KnowledgeGraphVisualization,
    KnowledgeGraphUpdate,
    UserLogs,
    SystemLogs,
    UserFeedback
  },
  data() {
    return {
      adminName: '',
      currentView: 'kg-stats',
      navItems: [
        { id: 'kg-stats', title: '知识图谱统计', icon: 'el-icon-data-analysis' },
        { id: 'kg-visual', title: '知识图谱可视化', icon: 'el-icon-connection' },
        { id: 'kg-update', title: '知识图谱更新', icon: 'el-icon-refresh' },
        { id: 'user-logs', title: '用户日志', icon: 'el-icon-user' },
        { id: 'system-logs', title: '系统日志', icon: 'el-icon-monitor' },
        { id: 'user-feedback', title: '用户反馈', icon: 'el-icon-chat-dot-square' }
      ]
    };
  },
  created() {
    this.checkAdminAuth();
    this.loadAdminInfo();
  },
  methods: {
    checkAdminAuth() {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        this.$router.push('/admin/login');
      }
    },
    loadAdminInfo() {
      const adminInfoStr = localStorage.getItem('adminInfo');
      if (adminInfoStr) {
        try {
          const adminInfo = JSON.parse(adminInfoStr);
          this.adminName = adminInfo.name || '管理员';
        } catch (error) {
          console.error('解析管理员信息失败:', error);
          this.adminName = '管理员';
        }
      } else {
        this.adminName = '管理员';
      }
    },
    getAdminInitials() {
      if (!this.adminName) return 'A';
      return this.adminName.charAt(0).toUpperCase();
    },
    switchView(viewId) {
      this.currentView = viewId;
    },
    getCurrentViewTitle() {
      const currentItem = this.navItems.find(item => item.id === this.currentView);
      return currentItem ? currentItem.title : '';
    },
    handleLogout() {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      this.$message.success('已退出登录');
      this.$router.push('/admin/login');
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  height: 100vh;
  background-color: #f0f2f5;
}

.admin-sidebar {
  width: 250px;
  background-color: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.logo p {
  margin: 5px 0 0;
  font-size: 12px;
  opacity: 0.7;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  flex: 1;
}

.nav-menu li {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.nav-menu li:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-menu li.active {
  background-color: #1890ff;
}

.nav-menu li i {
  margin-right: 10px;
  font-size: 16px;
}

.admin-info {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1890ff;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

.admin-avatar span {
  font-size: 16px;
  font-weight: bold;
}

.admin-name {
  font-size: 14px;
  margin-bottom: 10px;
}

.logout-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 5px 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: color 0.3s;
}

.logout-btn:hover {
  color: #fff;
}

.logout-btn i {
  margin-right: 5px;
}

.admin-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 20px;
}

.content-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.welcome-text {
  font-size: 14px;
  color: #606266;
}

.content-body {
  flex: 1;
  overflow: auto;
}

.kg-stats-container,
.kg-visual-container,
.kg-update-container,
.logs-container,
.feedback-container {
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style> 