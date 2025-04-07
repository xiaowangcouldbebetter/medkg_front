<template>
  <div class="user-logs">
    <div class="logs-header">
      <h3>用户日志</h3>
      <div class="header-actions">
        <div class="filter-control">
          <label for="status-filter">日志状态:</label>
          <select id="status-filter" v-model="statusFilter" @change="fetchLogs">
            <option value="">全部</option>
            <option value="success">成功回复</option>
            <option value="not_found">知识图谱中未找到</option>
            <option value="error">系统错误</option>
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
        <div class="stats-item" :class="{ 'active': statusFilter === '' }" @click="statusFilter = ''; fetchLogs()">
          <div class="stats-value">{{ totalLogs }}</div>
          <div class="stats-label">全部日志</div>
        </div>
        
        <div class="stats-item" :class="{ 'active': statusFilter === 'success' }" @click="statusFilter = 'success'; fetchLogs()">
          <div class="stats-value">{{ successCount }}</div>
          <div class="stats-label">成功回复</div>
        </div>
        
        <div class="stats-item" :class="{ 'active': statusFilter === 'not_found' }" @click="statusFilter = 'not_found'; fetchLogs()">
          <div class="stats-value">{{ notFoundCount }}</div>
          <div class="stats-label">未找到</div>
        </div>
        
        <div class="stats-item" :class="{ 'active': statusFilter === 'error' }" @click="statusFilter = 'error'; fetchLogs()">
          <div class="stats-value">{{ errorCount }}</div>
          <div class="stats-label">系统错误</div>
        </div>
      </div>
      
      <div class="logs-table-container">
        <table v-if="logs.length > 0">
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>问题</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ formatDate(log.created_at) }}</td>
              <td>{{ log.user }}</td>
              <td class="question-cell">{{ log.question }}</td>
              <td :class="getStatusClass(log.status)">{{ getStatusText(log.status) }}</td>
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
            <div class="detail-label">用户:</div>
            <div class="detail-value">{{ selectedLog.user }}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">时间:</div>
            <div class="detail-value">{{ formatDate(selectedLog.created_at) }}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">状态:</div>
            <div class="detail-value" :class="getStatusClass(selectedLog.status)">
              {{ getStatusText(selectedLog.status) }}
            </div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">问题:</div>
            <div class="detail-value question-box">{{ selectedLog.question }}</div>
          </div>
          
          <div class="detail-item" v-if="selectedLog.answer">
            <div class="detail-label">回答:</div>
            <div class="detail-value answer-box">{{ selectedLog.answer }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'UserLogs',
  data() {
    return {
      loading: false,
      error: null,
      logs: [],
      statusFilter: '',
      currentPage: 1,
      pageSize: 10,
      totalLogs: 0,
      totalPages: 1,
      successCount: 0,
      notFoundCount: 0,
      errorCount: 0,
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
        
        let url = `/admin/logs/user/?limit=${this.pageSize}&offset=${offset}`;
        if (this.statusFilter) {
          url += `&status=${this.statusFilter}`;
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
          this.error = response.data.message || '获取用户日志失败';
        }
      } catch (error) {
        console.error('获取用户日志失败:', error);
        this.error = error.response?.data?.message || '获取用户日志失败，请稍后再试';
      } finally {
        this.loading = false;
      }
    },
    
    async fetchLogStats() {
      try {
        // 获取成功日志数量
        const successResponse = await axios.get('/admin/logs/user/?status=success&limit=1');
        this.successCount = successResponse.data.total;
        
        // 获取未找到日志数量
        const notFoundResponse = await axios.get('/admin/logs/user/?status=not_found&limit=1');
        this.notFoundCount = notFoundResponse.data.total;
        
        // 获取错误日志数量
        const errorResponse = await axios.get('/admin/logs/user/?status=error&limit=1');
        this.errorCount = errorResponse.data.total;
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
    
    getStatusText(status) {
      const statusMap = {
        'success': '成功回复',
        'not_found': '未找到',
        'error': '系统错误'
      };
      
      return statusMap[status] || status;
    },
    
    getStatusClass(status) {
      const classMap = {
        'success': 'status-success',
        'not_found': 'status-warning',
        'error': 'status-error'
      };
      
      return classMap[status] || '';
    },
    
    viewLogDetails(log) {
      this.selectedLog = log;
      this.showLogDetails = true;
    }
  }
};
</script>

<style scoped>
.user-logs {
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
  gap: 20px;
}

.stats-item {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 15px;
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
  background-color: #ecf5ff;
}

.stats-value {
  font-size: 24px;
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

.question-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-success {
  color: #67c23a;
}

.status-warning {
  color: #e6a23c;
}

.status-error {
  color: #f56c6c;
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

.question-box,
.answer-box {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 10px;
  white-space: pre-wrap;
}

.answer-box {
  max-height: 300px;
  overflow-y: auto;
}
</style> 