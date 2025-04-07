<template>
  <div class="system-logs">
    <div class="logs-header">
      <h3>系统日志</h3>
      <div class="header-actions">
        <div class="filter-control">
          <label for="level-filter">日志级别:</label>
          <select id="level-filter" v-model="levelFilter" @change="fetchLogs">
            <option value="">全部</option>
            <option value="INFO">信息</option>
            <option value="WARNING">警告</option>
            <option value="ERROR">错误</option>
            <option value="CRITICAL">严重错误</option>
          </select>
        </div>
        
        <button class="refresh-btn" @click="fetchLogs" :disabled="loading">
          <i class="el-icon-refresh" :class="{ 'is-loading': loading }"></i> 刷新
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <i class="el-icon-warning-outline"></i>
      <div class="error-message">{{ error }}</div>
      <button class="retry-btn" @click="fetchLogs">重试</button>
    </div>
    
    <div v-else class="logs-content">
      <div class="logs-stats">
        <div class="stats-item" :class="{ 'active': levelFilter === '' }" @click="levelFilter = ''; fetchLogs()">
          <div class="stats-value">{{ totalLogs }}</div>
          <div class="stats-label">全部日志</div>
        </div>
        
        <div class="stats-item info-item" :class="{ 'active': levelFilter === 'INFO' }" @click="levelFilter = 'INFO'; fetchLogs()">
          <div class="stats-value">{{ infoCount }}</div>
          <div class="stats-label">信息</div>
        </div>
        
        <div class="stats-item warning-item" :class="{ 'active': levelFilter === 'WARNING' }" @click="levelFilter = 'WARNING'; fetchLogs()">
          <div class="stats-value">{{ warningCount }}</div>
          <div class="stats-label">警告</div>
        </div>
        
        <div class="stats-item error-item" :class="{ 'active': levelFilter === 'ERROR' }" @click="levelFilter = 'ERROR'; fetchLogs()">
          <div class="stats-value">{{ errorCount }}</div>
          <div class="stats-label">错误</div>
        </div>
        
        <div class="stats-item critical-item" :class="{ 'active': levelFilter === 'CRITICAL' }" @click="levelFilter = 'CRITICAL'; fetchLogs()">
          <div class="stats-value">{{ criticalCount }}</div>
          <div class="stats-label">严重错误</div>
        </div>
      </div>
      
      <div class="logs-table-container">
        <table v-if="logs.length > 0">
          <thead>
            <tr>
              <th>时间</th>
              <th>级别</th>
              <th>模块</th>
              <th>消息</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ formatDate(log.created_at) }}</td>
              <td :class="getLevelClass(log.level)">
                <div class="level-badge">{{ log.level }}</div>
              </td>
              <td>{{ log.module }}</td>
              <td class="message-cell">{{ log.message }}</td>
              <td>
                <button class="view-btn" @click="viewLogDetails(log)">
                  <i class="el-icon-view"></i> 查看
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="no-logs">
          <i class="el-icon-document"></i>
          <p>暂无日志数据</p>
        </div>
      </div>
      
      <div class="pagination">
        <button 
          class="pagination-btn" 
          :disabled="currentPage <= 1" 
          @click="goToPage(currentPage - 1)"
        >
          <i class="el-icon-arrow-left"></i> 上一页
        </button>
        
        <div class="pagination-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </div>
        
        <button 
          class="pagination-btn" 
          :disabled="currentPage >= totalPages" 
          @click="goToPage(currentPage + 1)"
        >
          下一页 <i class="el-icon-arrow-right"></i>
        </button>
      </div>
    </div>
    
    <!-- 日志详情弹窗 -->
    <div class="log-details-modal" v-if="showLogDetails">
      <div class="modal-content">
        <div class="modal-header">
          <h4>日志详情</h4>
          <button class="close-btn" @click="showLogDetails = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-item">
            <div class="detail-label">级别:</div>
            <div class="detail-value">
              <span :class="getLevelClass(selectedLog.level)">{{ selectedLog.level }}</span>
            </div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">时间:</div>
            <div class="detail-value">{{ formatDate(selectedLog.created_at) }}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">模块:</div>
            <div class="detail-value">{{ selectedLog.module }}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">消息:</div>
            <div class="detail-value message-box">{{ selectedLog.message }}</div>
          </div>
          
          <div class="detail-item" v-if="selectedLog.trace">
            <div class="detail-label">错误追踪:</div>
            <div class="detail-value trace-box">{{ selectedLog.trace }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SystemLogs',
  data() {
    return {
      loading: false,
      error: null,
      logs: [],
      levelFilter: '',
      currentPage: 1,
      pageSize: 15,
      totalLogs: 0,
      totalPages: 1,
      infoCount: 0,
      warningCount: 0,
      errorCount: 0,
      criticalCount: 0,
      showLogDetails: false,
      selectedLog: {}
    };
  },
  created() {
    this.fetchLogs();
    this.fetchLogStats();
  },
  methods: {
    async fetchLogs() {
      this.loading = true;
      this.error = null;
      
      try {
        const offset = (this.currentPage - 1) * this.pageSize;
        
        let url = `/admin/logs/system/?limit=${this.pageSize}&offset=${offset}`;
        if (this.levelFilter) {
          url += `&level=${this.levelFilter}`;
        }
        
        const response = await axios.get(url);
        
        if (response.data.success) {
          this.logs = response.data.logs;
          this.totalLogs = response.data.total;
          this.totalPages = Math.ceil(this.totalLogs / this.pageSize);
          
          // 如果当前页超过总页数，则跳转到第一页
          if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.goToPage(1);
          }
        } else {
          this.error = response.data.message || '获取系统日志失败';
        }
      } catch (error) {
        console.error('获取系统日志失败:', error);
        this.error = error.response?.data?.message || '获取系统日志失败，请稍后再试';
      } finally {
        this.loading = false;
      }
    },
    
    async fetchLogStats() {
      try {
        // 获取INFO级别日志数量
        const infoResponse = await axios.get('/admin/logs/system/?level=INFO&limit=1');
        this.infoCount = infoResponse.data.total;
        
        // 获取WARNING级别日志数量
        const warningResponse = await axios.get('/admin/logs/system/?level=WARNING&limit=1');
        this.warningCount = warningResponse.data.total;
        
        // 获取ERROR级别日志数量
        const errorResponse = await axios.get('/admin/logs/system/?level=ERROR&limit=1');
        this.errorCount = errorResponse.data.total;
        
        // 获取CRITICAL级别日志数量
        const criticalResponse = await axios.get('/admin/logs/system/?level=CRITICAL&limit=1');
        this.criticalCount = criticalResponse.data.total;
      } catch (error) {
        console.error('获取日志统计信息失败:', error);
      }
    },
    
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchLogs();
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    
    getLevelClass(level) {
      const classMap = {
        'INFO': 'level-info',
        'WARNING': 'level-warning',
        'ERROR': 'level-error',
        'CRITICAL': 'level-critical'
      };
      
      return classMap[level] || '';
    },
    
    viewLogDetails(log) {
      this.selectedLog = log;
      this.showLogDetails = true;
    }
  }
};
</script>

<style scoped>
.system-logs {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logs-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}

.filter-control {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.filter-control label {
  margin-right: 8px;
  font-size: 14px;
}

.filter-control select {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.refresh-btn {
  background-color: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.refresh-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.refresh-btn i {
  margin-right: 5px;
}

.refresh-btn .is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-container,
.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #409eff;
  border-radius: 50%;
  animation: rotate 1s linear infinite;
}

.loading-container p {
  margin-top: 10px;
  color: #606266;
}

.error-container i {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 15px;
}

.error-message {
  color: #f56c6c;
  margin-bottom: 15px;
}

.retry-btn {
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: #66b1ff;
}

.logs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.logs-stats {
  display: flex;
  margin-bottom: 20px;
  gap: 15px;
}

.stats-item {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.stats-item:hover {
  background-color: #f0f0f0;
}

.stats-item.active {
  border-color: #409eff;
}

.info-item.active {
  background-color: #ecf5ff;
}

.warning-item.active {
  background-color: #fdf6ec;
}

.error-item.active {
  background-color: #fef0f0;
}

.critical-item.active {
  background-color: #fde2e2;
}

.stats-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #606266;
}

.logs-table-container {
  flex: 1;
  overflow: auto;
  margin-bottom: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

th {
  background-color: #f5f7fa;
  font-weight: 500;
  color: #606266;
  position: sticky;
  top: 0;
  z-index: 1;
}

tbody tr:hover {
  background-color: #f5f7fa;
}

.message-cell {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.level-info .level-badge {
  background-color: #ecf5ff;
  color: #409eff;
}

.level-warning .level-badge {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.level-error .level-badge {
  background-color: #fef0f0;
  color: #f56c6c;
}

.level-critical .level-badge {
  background-color: #fde2e2;
  color: #d81e06;
}

.view-btn {
  background-color: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.view-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.view-btn i {
  margin-right: 3px;
}

.no-logs {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  color: #909399;
}

.no-logs i {
  font-size: 48px;
  margin-bottom: 10px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.pagination-btn {
  background-color: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination-btn i {
  margin: 0 5px;
}

.pagination-info {
  font-size: 14px;
  color: #606266;
}

/* 日志详情弹窗 */
.log-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 4px;
  width: 80%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
}

.close-btn:hover {
  color: #409eff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-label {
  font-weight: 500;
  margin-bottom: 5px;
  color: #606266;
}

.detail-value {
  word-break: break-word;
}

.message-box,
.trace-box {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 10px;
  white-space: pre-wrap;
}

.trace-box {
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
}
</style> 