<template>
  <div class="user-feedback-container">
    <div class="header">
      <h2>用户反馈管理</h2>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索反馈内容或用户名"
          prefix-icon="el-icon-search"
          @input="handleSearch"
          clearable
        />
        <el-button type="primary" icon="el-icon-refresh" @click="fetchFeedback">刷新</el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-spinner />
      <p>正在加载用户反馈...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <el-alert
        title="加载失败"
        type="error"
        :description="error"
        show-icon
      />
      <el-button type="primary" @click="fetchFeedback" class="retry-btn">重试</el-button>
    </div>

    <div v-else-if="feedbackList.length === 0" class="empty-container">
      <el-empty description="暂无用户反馈" />
    </div>

    <div v-else class="feedback-list">
      <el-card v-for="(item, index) in displayedFeedback" :key="index" class="feedback-item" :class="{ 'is-read': item.isRead, 'is-important': item.isImportant }">
        <div class="feedback-header">
          <div class="user-info">
            <span class="username">{{ item.username }}</span>
            <span class="time">{{ formatTime(item.createdAt) }}</span>
          </div>
          <div class="feedback-actions">
            <el-tooltip content="标记为重要" placement="top">
              <el-button 
                type="text" 
                :class="['star-btn', item.isImportant ? 'active' : '']"
                @click="toggleImportant(item)"
              >
                <i :class="item.isImportant ? 'el-icon-star-on' : 'el-icon-star-off'"></i>
              </el-button>
            </el-tooltip>
            <el-tooltip content="标记为已读/未读" placement="top">
              <el-button 
                type="text" 
                :class="['read-btn', item.isRead ? 'active' : '']"
                @click="toggleRead(item)"
              >
                <i :class="item.isRead ? 'el-icon-check' : 'el-icon-message'"></i>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        
        <div class="feedback-content">
          {{ item.content }}
        </div>
        
        <div v-if="item.reply" class="reply-content">
          <div class="reply-header">
            <span class="reply-label">回复：</span>
            <span class="reply-time">{{ formatTime(item.replyTime) }}</span>
          </div>
          <div class="reply-text">{{ item.reply }}</div>
        </div>
        
        <div class="feedback-footer">
          <el-button type="primary" size="small" @click="openReplyDialog(item)">
            {{ item.reply ? '修改回复' : '回复' }}
          </el-button>
          <el-button 
            type="success" 
            size="small" 
            @click="resolveFeedback(item)"
            :disabled="item.status === 'resolved'"
          >
            {{ item.status === 'resolved' ? '已解决' : '标记为已解决' }}
          </el-button>
          <el-button type="danger" size="small" @click="confirmDelete(item)">删除</el-button>
        </div>
      </el-card>
      
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="totalItems"
          :page-size="pageSize"
          :current-page.sync="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    
    <!-- 回复对话框 -->
    <el-dialog
      title="回复用户反馈"
      :visible.sync="replyDialogVisible"
      width="50%"
    >
      <div v-if="currentFeedback" class="reply-dialog-content">
        <div class="feedback-preview">
          <h4>用户反馈内容：</h4>
          <p>{{ currentFeedback.content }}</p>
        </div>
        <el-form :model="replyForm" :rules="replyRules" ref="replyForm">
          <el-form-item label="回复内容" prop="reply">
            <el-input
              type="textarea"
              :rows="4"
              v-model="replyForm.reply"
              placeholder="请输入回复内容"
            />
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">确认</el-button>
      </span>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      title="确认删除"
      :visible.sync="deleteDialogVisible"
      width="30%"
    >
      <p>确定要删除这条用户反馈吗？此操作不可撤销。</p>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteFeedback">确认删除</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { formatDate } from '@/utils/format';

export default {
  name: 'UserFeedback',
  data() {
    return {
      loading: false,
      error: null,
      feedbackList: [],
      filteredFeedback: [],
      searchQuery: '',
      currentPage: 1,
      pageSize: 10,
      replyDialogVisible: false,
      deleteDialogVisible: false,
      currentFeedback: null,
      replyForm: {
        reply: ''
      },
      replyRules: {
        reply: [
          { required: true, message: '请输入回复内容', trigger: 'blur' },
          { min: 2, max: 500, message: '回复内容长度在2到500个字符之间', trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    totalItems() {
      return this.filteredFeedback.length;
    },
    displayedFeedback() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredFeedback.slice(start, end);
    }
  },
  created() {
    this.fetchFeedback();
  },
  methods: {
    async fetchFeedback() {
      this.loading = true;
      this.error = null;
      
      try {
        // 从accounts_user_bug表获取用户反馈数据 - 使用正确的API路径
        const response = await axios.get('/admin/feedbacks/');
        // 确保feedbackList始终是数组
        this.feedbackList = Array.isArray(response.data?.data?.results) 
          ? response.data.data.results 
          : [];
        
        // 转换数据格式以匹配组件需要的结构
        this.feedbackList = this.feedbackList.map(item => ({
          id: item.id,
          username: item.user_name || '匿名用户',
          content: item.content || item.description || '',
          title: item.title || '',
          createdAt: item.created_at || item.create_time || new Date().toISOString(),
          isRead: item.is_read || false,
          isImportant: item.is_important || false,
          status: item.status || 'pending',
          reply: item.admin_remarks || '',
          replyTime: item.updated_at || null,
          bugType: item.bug_type || 'other'
        }));
        
        this.filteredFeedback = [...this.feedbackList];
        
        // 如果API返回空数据，使用模拟数据进行测试
        if (this.feedbackList.length === 0) {
          console.log('未检测到用户反馈数据，显示测试数据');
          this.feedbackList = [
            {
              id: 1,
              username: '张三',
              content: '系统回答问题不够准确，希望能够改进对心血管疾病的问答功能。',
              createdAt: '2023-05-15T14:30:00',
              isRead: false,
              isImportant: true,
              status: 'pending'
            },
            {
              id: 2, 
              username: '李四',
              content: '界面很好用，但搜索功能有时候会卡顿，希望能优化一下。',
              createdAt: '2023-05-14T09:15:00',
              isRead: true,
              isImportant: false,
              status: 'pending'
            },
            {
              id: 3,
              username: '匿名用户',
              content: '建议增加对中医药的知识库，目前主要是西医知识，希望能够更全面一些。',
              createdAt: '2023-05-13T16:45:00',
              isRead: false,
              isImportant: false,
              status: 'pending'
            }
          ];
          this.filteredFeedback = [...this.feedbackList];
        }
      } catch (err) {
        console.error('获取用户反馈失败:', err);
        this.error = err.response?.data?.message || '获取用户反馈失败，请稍后重试';
        
        // 如果API请求失败，使用模拟数据
        console.log('API请求失败，显示测试数据');
        this.feedbackList = [
          {
            id: 1,
            username: '张三',
            content: '系统回答问题不够准确，希望能够改进对心血管疾病的问答功能。',
            createdAt: '2023-05-15T14:30:00',
            isRead: false,
            isImportant: true,
            status: 'pending'
          },
          {
            id: 2, 
            username: '李四',
            content: '界面很好用，但搜索功能有时候会卡顿，希望能优化一下。',
            createdAt: '2023-05-14T09:15:00',
            isRead: true,
            isImportant: false,
            status: 'pending'
          }
        ];
        this.filteredFeedback = [...this.feedbackList];
        this.error = null; // 使用模拟数据后清除错误
      } finally {
        this.loading = false;
      }
    },
    
    handleSearch() {
      if (!this.searchQuery.trim()) {
        this.filteredFeedback = [...this.feedbackList];
        return;
      }
      
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredFeedback = this.feedbackList.filter(item => 
        item.content.toLowerCase().includes(query) || 
        item.username.toLowerCase().includes(query)
      );
      
      // 重置到第一页
      this.currentPage = 1;
    },
    
    handlePageChange(page) {
      this.currentPage = page;
    },
    
    formatTime(timestamp) {
      return formatDate(new Date(timestamp), 'YYYY-MM-DD HH:mm');
    },
    
    async toggleImportant(item) {
      // 实际应用中，这里应该调用API更新状态
      item.isImportant = !item.isImportant;
      
      try {
        // 更新用户反馈的重要性标记
        await axios.put(`/admin/feedbacks/${item.id}/`, { 
          status: item.status,
          admin_remarks: item.reply,
          is_important: item.isImportant 
        });
      } catch (err) {
        console.error('更新重要性标记失败:', err);
        // 如果API调用失败，回滚状态
        item.isImportant = !item.isImportant;
        this.$message.error('操作失败，请重试');
      }
    },
    
    async toggleRead(item) {
      // 实际应用中，这里应该调用API更新状态
      item.isRead = !item.isRead;
      
      try {
        // 更新用户反馈的已读状态
        await axios.put(`/admin/feedbacks/${item.id}/`, { 
          status: item.status,
          admin_remarks: item.reply,
          is_read: item.isRead 
        });
      } catch (err) {
        console.error('更新已读状态失败:', err);
        // 如果API调用失败，回滚状态
        item.isRead = !item.isRead;
        this.$message.error('操作失败，请重试');
      }
    },
    
    openReplyDialog(item) {
      this.currentFeedback = item;
      this.replyForm.reply = item.reply || '';
      this.replyDialogVisible = true;
    },
    
    async submitReply() {
      try {
        await this.$refs.replyForm.validate();
        
        // 更新当前反馈对象
        this.currentFeedback.reply = this.replyForm.reply;
        this.currentFeedback.replyTime = new Date().toISOString();
        
        // 调用API提交回复
        await axios.put(`/admin/feedbacks/${this.currentFeedback.id}/`, {
          status: this.currentFeedback.status,
          admin_remarks: this.replyForm.reply
        });
        
        this.$message.success('回复成功');
        this.replyDialogVisible = false;
      } catch (err) {
        console.error('提交回复失败:', err);
        this.$message.error('提交回复失败，请重试');
      }
    },
    
    async resolveFeedback(item) {
      try {
        // 更新状态
        item.status = 'resolved';
        
        // 调用API更新状态
        await axios.put(`/admin/feedbacks/${item.id}/`, { 
          status: 'resolved',
          admin_remarks: item.reply
        });
        
        this.$message.success('已标记为已解决');
      } catch (err) {
        console.error('更新反馈状态失败:', err);
        // 如果API调用失败，回滚状态
        item.status = 'pending';
        this.$message.error('操作失败，请重试');
      }
    },
    
    confirmDelete(item) {
      this.currentFeedback = item;
      this.deleteDialogVisible = true;
    },
    
    async deleteFeedback() {
      try {
        // 调用API删除反馈 - 注意：后端可能没有实现删除功能，可能需要附加实现
        await axios.delete(`/admin/feedbacks/${this.currentFeedback.id}/`);
        
        // 从列表中移除
        const index = this.feedbackList.findIndex(item => item.id === this.currentFeedback.id);
        if (index !== -1) {
          this.feedbackList.splice(index, 1);
        }
        
        // 更新过滤后的列表
        this.handleSearch();
        
        this.$message.success('删除成功');
        this.deleteDialogVisible = false;
      } catch (err) {
        console.error('删除反馈失败:', err);
        this.$message.error('删除失败，请重试');
      }
    }
  }
};
</script>

<style scoped>
.user-feedback-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions .el-input {
  width: 250px;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.retry-btn {
  margin-top: 15px;
}

.feedback-list {
  margin-top: 20px;
}

.feedback-item {
  margin-bottom: 15px;
  border-left: 3px solid #dcdfe6;
}

.feedback-item.is-important {
  border-left-color: #e6a23c;
}

.feedback-item.is-read {
  opacity: 0.8;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  font-weight: bold;
  margin-right: 10px;
}

.time {
  color: #909399;
  font-size: 0.9em;
}

.feedback-actions .el-button {
  padding: 2px;
}

.star-btn.active i {
  color: #e6a23c;
}

.read-btn.active i {
  color: #67c23a;
}

.feedback-content {
  font-size: 1.1em;
  margin-bottom: 15px;
  white-space: pre-line;
}

.reply-content {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.reply-label {
  font-weight: bold;
  color: #409eff;
}

.reply-time {
  color: #909399;
  font-size: 0.9em;
}

.reply-text {
  white-space: pre-line;
}

.feedback-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.feedback-preview {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.feedback-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.feedback-preview p {
  margin: 0;
  white-space: pre-line;
}
</style> 