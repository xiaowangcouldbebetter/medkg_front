<template>
  <div class="kg-update">
    <div class="update-header">
      <h3>知识图谱更新</h3>
    </div>
    
    <div class="update-form">
      <div class="form-group">
        <label for="source-url">数据源URL</label>
        <input 
          type="text" 
          id="source-url" 
          v-model="sourceUrl" 
          placeholder="请输入医疗数据源URL，例如：https://example.com/medical-data"
          :class="{ 'error': urlError }"
        />
        <div class="input-desc">请输入包含医疗知识的网页地址，系统会自动爬取并解析数据</div>
        <div class="error-message" v-if="urlError">{{ urlError }}</div>
      </div>
      
      <div class="form-group">
        <label>数据类型</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="dataType" value="html" />
            <span>HTML网页</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="dataType" value="json" />
            <span>JSON数据</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="dataType" value="xml" />
            <span>XML数据</span>
          </label>
        </div>
      </div>
      
      <button 
        class="update-button"
        @click="startUpdate"
        :disabled="isUpdating"
      >
        <i class="el-icon-refresh-right" v-if="!isUpdating"></i>
        <i class="el-icon-loading" v-else></i>
        {{ isUpdating ? '更新中...' : '开始更新' }}
      </button>
    </div>
    
    <div class="result-container" v-if="showResult">
      <div class="result-header">
        <h4>更新结果</h4>
        <button class="close-btn" @click="closeResult">×</button>
      </div>
      
      <div class="result-content" :class="{ 'success': updateSuccess, 'error': !updateSuccess }">
        <i class="el-icon-success" v-if="updateSuccess"></i>
        <i class="el-icon-error" v-else></i>
        <span>{{ updateMessage }}</span>
      </div>
    </div>
    
    <div class="update-instructions">
      <h4>操作说明</h4>
      <ul>
        <li>输入有效的医疗数据源URL，支持HTML网页、JSON和XML格式</li>
        <li>系统会自动爬取该URL页面中的医疗信息</li>
        <li>根据页面内容自动提取疾病、症状、治疗方法等知识</li>
        <li>将提取的知识整合到现有的知识图谱中</li>
        <li>请确保URL内容遵循相应格式，以便系统正确解析</li>
        <li>更新过程可能需要几分钟，取决于数据量大小</li>
      </ul>
    </div>
    
    <div class="update-history">
      <h4>近期更新记录</h4>
      <div class="history-table-container">
        <table v-if="updateHistory.length > 0">
          <thead>
            <tr>
              <th>更新时间</th>
              <th>数据源</th>
              <th>状态</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in updateHistory" :key="index">
              <td>{{ formatDate(item.timestamp) }}</td>
              <td class="source-url">{{ item.sourceUrl }}</td>
              <td :class="{ 'success-text': item.success, 'error-text': !item.success }">
                {{ item.success ? '成功' : '失败' }}
              </td>
              <td>{{ item.message }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-history">暂无更新记录</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'KnowledgeGraphUpdate',
  data() {
    return {
      sourceUrl: '',
      dataType: 'html',
      urlError: '',
      isUpdating: false,
      showResult: false,
      updateSuccess: false,
      updateMessage: '',
      updateHistory: []
    };
  },
  methods: {
    validateUrl() {
      this.urlError = '';
      if (!this.sourceUrl) {
        this.urlError = '请输入数据源URL';
        return false;
      }
      
      try {
        new URL(this.sourceUrl);
        return true;
      } catch (e) {
        this.urlError = '请输入有效的URL';
        return false;
      }
    },
    
    async startUpdate() {
      if (!this.validateUrl()) {
        return;
      }
      
      this.isUpdating = true;
      this.showResult = false;
      
      try {
        const response = await axios.post('/api/kg/update/', {
          source_url: this.sourceUrl,
          data_type: this.dataType
        });
        
        // 更新结果
        this.updateSuccess = response.data.success;
        this.updateMessage = response.data.message;
        
        // 添加到历史记录
        this.updateHistory.unshift({
          timestamp: new Date(),
          sourceUrl: this.sourceUrl,
          success: response.data.success,
          message: response.data.message
        });
        
        // 如果更新历史超过10条，则保留最近的10条
        if (this.updateHistory.length > 10) {
          this.updateHistory = this.updateHistory.slice(0, 10);
        }
        
        // 保存更新历史到本地存储
        this.saveUpdateHistory();
        
        // 清空输入
        if (response.data.success) {
          this.sourceUrl = '';
        }
      } catch (error) {
        console.error('更新知识图谱失败:', error);
        this.updateSuccess = false;
        this.updateMessage = error.response?.data?.message || '更新失败，请稍后再试';
        
        // 添加到历史记录
        this.updateHistory.unshift({
          timestamp: new Date(),
          sourceUrl: this.sourceUrl,
          success: false,
          message: this.updateMessage
        });
        
        // 保存更新历史
        this.saveUpdateHistory();
      } finally {
        this.isUpdating = false;
        this.showResult = true;
      }
    },
    
    closeResult() {
      this.showResult = false;
    },
    
    formatDate(date) {
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    saveUpdateHistory() {
      try {
        localStorage.setItem('kgUpdateHistory', JSON.stringify(this.updateHistory));
      } catch (e) {
        console.error('保存更新历史失败:', e);
      }
    },
    
    loadUpdateHistory() {
      try {
        const historyStr = localStorage.getItem('kgUpdateHistory');
        if (historyStr) {
          this.updateHistory = JSON.parse(historyStr);
        }
      } catch (e) {
        console.error('加载更新历史失败:', e);
      }
    }
  },
  created() {
    this.loadUpdateHistory();
  }
};
</script>

<style scoped>
.kg-update {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.update-header {
  margin-bottom: 20px;
}

.update-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.update-form {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: #409eff;
}

.form-group input[type="text"].error {
  border-color: #f56c6c;
}

.input-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.error-message {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 5px;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-label input {
  margin-right: 5px;
}

.update-button {
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.update-button:hover {
  background-color: #66b1ff;
}

.update-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.update-button i {
  margin-right: 5px;
}

.result-container {
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
}

.result-header {
  background-color: #f5f7fa;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.result-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #909399;
}

.close-btn:hover {
  color: #409eff;
}

.result-content {
  padding: 15px;
  display: flex;
  align-items: center;
}

.result-content.success {
  background-color: #f0f9eb;
}

.result-content.error {
  background-color: #fef0f0;
}

.result-content i {
  font-size: 20px;
  margin-right: 10px;
}

.result-content .el-icon-success {
  color: #67c23a;
}

.result-content .el-icon-error {
  color: #f56c6c;
}

.update-instructions {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.update-instructions h4 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 500;
}

.update-instructions ul {
  margin: 0;
  padding-left: 20px;
}

.update-instructions li {
  margin-bottom: 5px;
  font-size: 14px;
  color: #606266;
}

.update-history {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 15px;
}

.update-history h4 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 500;
}

.history-table-container {
  overflow-x: auto;
}

.update-history table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.update-history th,
.update-history td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.update-history th {
  background-color: #f5f7fa;
  font-weight: 500;
  color: #606266;
}

.source-url {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.success-text {
  color: #67c23a;
}

.error-text {
  color: #f56c6c;
}

.no-history {
  padding: 20px;
  text-align: center;
  color: #909399;
}
</style> 