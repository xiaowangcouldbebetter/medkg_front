<template>
  <div class="kg-stats">
    <div class="stats-header">
      <h3>知识图谱统计信息</h3>
      <button class="refresh-btn" @click="fetchStatistics" :disabled="loading">
        <i class="el-icon-refresh" :class="{ 'is-loading': loading }"></i> 刷新
      </button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else class="stats-content">
      <div class="stats-cards">
        <div class="stats-card">
          <div class="card-icon">
            <i class="el-icon-bangzhu"></i>
          </div>
          <div class="card-content">
            <h4>节点总数</h4>
            <div class="card-value">{{ statistics.total_nodes || 0 }}</div>
          </div>
        </div>
        
        <div class="stats-card">
          <div class="card-icon">
            <i class="el-icon-connection"></i>
          </div>
          <div class="card-content">
            <h4>关系总数</h4>
            <div class="card-value">{{ statistics.total_relationships || 0 }}</div>
          </div>
        </div>
      </div>
      
      <div class="stats-tables">
        <div class="stats-table">
          <h4>节点类型统计</h4>
          <table>
            <thead>
              <tr>
                <th>节点类型</th>
                <th>数量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(count, label) in statistics.nodes" :key="label">
                <td>{{ label }}</td>
                <td>{{ count }}</td>
              </tr>
              <tr v-if="!statistics.nodes || Object.keys(statistics.nodes).length === 0">
                <td colspan="2">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="stats-table">
          <h4>关系类型统计</h4>
          <table>
            <thead>
              <tr>
                <th>关系类型</th>
                <th>数量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(count, type) in statistics.relationships" :key="type">
                <td>{{ type }}</td>
                <td>{{ count }}</td>
              </tr>
              <tr v-if="!statistics.relationships || Object.keys(statistics.relationships).length === 0">
                <td colspan="2">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      <i class="el-icon-warning-outline"></i>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'KnowledgeGraphStats',
  data() {
    return {
      loading: false,
      error: null,
      statistics: {
        nodes: {},
        relationships: {},
        total_nodes: 0,
        total_relationships: 0
      }
    };
  },
  created() {
    this.fetchStatistics();
  },
  methods: {
    async fetchStatistics() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get('/kg/statistics/');
        
        if (response.data.success) {
          this.statistics = response.data.statistics;
        } else {
          this.error = response.data.message || '获取统计信息失败';
        }
      } catch (error) {
        console.error('获取知识图谱统计信息失败:', error);
        this.error = error.response?.data?.message || '获取统计信息失败，请稍后再试';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.kg-stats {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
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

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-container {
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

.stats-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stats-cards {
  display: flex;
  margin-bottom: 20px;
  gap: 20px;
}

.stats-card {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 20px;
  display: flex;
  align-items: center;
}

.card-icon {
  width: 60px;
  height: 60px;
  background-color: #eaf4fe;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
}

.card-icon i {
  font-size: 30px;
  color: #409eff;
}

.card-content h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #606266;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stats-tables {
  display: flex;
  flex: 1;
  gap: 20px;
}

.stats-table {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 15px;
}

.stats-table h4 {
  margin: 0 0 15px;
  font-size: 16px;
  color: #303133;
}

.stats-table table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.stats-table th {
  font-weight: 500;
  color: #606266;
  background-color: #f5f7fa;
}

.stats-table tbody tr:hover {
  background-color: #f5f7fa;
}

.error-message {
  margin-top: 20px;
  padding: 10px;
  background-color: #fff0f0;
  border-radius: 4px;
  color: #f56c6c;
  display: flex;
  align-items: center;
}

.error-message i {
  margin-right: 5px;
  font-size: 16px;
}
</style> 