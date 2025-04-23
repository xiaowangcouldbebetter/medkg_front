<template>
  <div class="chat-container" :class="{ 'dark-mode': darkMode }">
    <!-- 标题栏 -->
    <div class="chat-header">
      <div class="header-left">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        </div>
      </div>
      <div class="header-center">
        <h1>智能医疗问答系统</h1>
        <div class="header-subtitle">基于医疗知识图谱的智能诊疗助手</div>
      </div>
      <div class="header-right">
        <button class="icon-button" @click="toggleDarkMode" :title="darkMode ? '切换到亮色模式' : '切换到暗色模式'">
          <svg v-if="darkMode" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 消息列表区域 -->
    <div class="message-list" ref="messageList">
      <div class="welcome-message" v-if="messages.length === 0">
        <div class="welcome-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <h2>欢迎使用医疗问答系统</h2>
        <p>您可以询问任何医疗相关问题，例如：</p>
        <div class="suggestion-chips">
          <div class="chip" v-for="(suggestion, index) in suggestions" :key="index" @click="useExample(suggestion)">
            {{ suggestion }}
          </div>
        </div>
      </div>
      
      <transition-group name="message-fade">
        <div 
          v-for="message in messages" 
          :key="message.id" 
          :class="['message-bubble', message.isUser ? 'user' : 'system']"
        >
          <div class="message-avatar">
            <div class="avatar-icon">
              <span v-if="message.isUser">您</span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div class="message-wrapper">
            <div class="message-header">
              <span>{{ message.isUser ? '您的问题' : '系统回复' }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content" v-html="formatMessage(message.text)"></div>
            <div class="message-actions" v-if="!message.isUser">
              <button class="action-btn" @click="copyToClipboard(message.text)" title="复制回答">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </transition-group>
      
      <div class="typing-indicator" v-if="isLoading">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-wrapper">
        <input
          v-model.trim="inputText"
          placeholder="请输入您的医疗问题..."
          @keyup.enter="sendMessage"
          :disabled="isLoading"
          ref="inputField"
        />
        <button 
          :disabled="!inputText || isLoading"
          @click="sendMessage"
          class="send-button"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="input-footer">
        <span>按 Enter 发送 | <kbd>Esc</kbd> 清空输入框 | <kbd>/</kbd> 查看示例</span>
      </div>
    </div>
    
    <!-- 消息通知 -->
    <div class="toast" v-if="toast.show" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      inputText: '',
      messages: [],
      messageId: 0,
      isLoading: false,
      darkMode: false,
      suggestions: [
        '糖尿病的症状有哪些？',
        '高血压如何预防？',
        '头痛可能是什么原因？',
        '感冒药和发烧药有什么区别？',
        '如何正确使用抗生素？'
      ],
      toast: {
        show: false,
        message: '',
        type: 'info',
        timeout: null
      }
    };
  },
  
  mounted() {
    // 检查本地存储的暗黑模式设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;
    
    // 键盘快捷键监听
    document.addEventListener('keydown', this.handleKeyDown);
    
    // 自动聚焦输入框
    this.$nextTick(() => {
      this.$refs.inputField.focus();
    });
  },
  
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  },
  
  methods: {
    // 处理键盘快捷键
    handleKeyDown(e) {
      // ESC 清空输入
      if (e.key === 'Escape') {
        this.inputText = '';
        this.$refs.inputField.focus();
      }
      
      // 斜杠显示帮助
      if (e.key === '/' && this.inputText === '') {
        e.preventDefault();
        this.showToast('请选择下方的示例问题', 'info');
      }
    },
    
    // 使用示例问题
    useExample(text) {
      this.inputText = text;
      this.sendMessage();
    },
    
    // 显示通知消息
    showToast(message, type = 'info') {
      if (this.toast.timeout) {
        clearTimeout(this.toast.timeout);
      }
      
      this.toast.show = true;
      this.toast.message = message;
      this.toast.type = type;
      
      this.toast.timeout = setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },
    
    // 复制文本到剪贴板
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('已复制到剪贴板', 'success');
      }).catch(err => {
        this.showToast('复制失败', 'error');
        console.error('无法复制: ', err);
      });
    },
    
    // 切换暗黑模式
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
    },
    
    // 格式化消息内容，处理换行和特殊标记
    formatMessage(text) {
      if (!text) return '';
      
      // 处理换行
      let formatted = text.replace(/\n/g, '<br>');
      
      // 处理【】中的内容为高亮
      formatted = formatted.replace(/【(.+?)】/g, '<span class="highlight">$1</span>');
      
      // 处理属性信息和关系信息的标题
      formatted = formatted.replace(/属性信息：/g, '<strong class="info-title">属性信息：</strong>');
      formatted = formatted.replace(/相关信息：/g, '<strong class="info-title">相关信息：</strong>');
      
      // 处理列表项
      formatted = formatted.replace(/- (.+)/g, '<div class="list-item">• $1</div>');
      
      return formatted;
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    // 优化后的数据提取方法
    findAnswerInData(data) {
      if (!data?.data?.results || data.data.results.length === 0) {
        return '很抱歉，暂时没有找到相关信息。请尝试换一种方式提问，或者咨询其他医疗问题。';
      }

      const results = data.data.results;
      
      // 检测问题类型
      const questionType = this.detectQuestionType(results);
      
      // 根据不同问题类型格式化答案
      switch(questionType) {
        case 'disease_desc':
          return this.formatDiseaseDescription(results);
        case 'disease_acompany':
          return this.formatDiseaseComplication(results);
        case 'disease_do_food':
          return this.formatDiseaseFood(results);
        case 'disease_symptom':
          return this.formatDiseaseSymptom(results);
        case 'disease_prevent':
          return this.formatDiseasePrevent(results);
        default:
          return this.formatGeneralResults(results);
      }
    },
    
    // 检测问题类型
    detectQuestionType(results) {
      // 检查第一个结果是否有实体和属性
      const firstResult = results[0];
      
      // 检查是否是疾病描述
      if (firstResult.properties && 
          firstResult.properties.desc && 
          firstResult.properties.desc.length > 50) {
        return 'disease_desc';
      }
      
      // 检查是否是并发症
      if (results.length > 3 && 
          results.every(r => r.relations && 
                            r.relations.some(rel => 
                              rel.relation && 
                              rel.relation.includes('并发症')))) {
        return 'disease_acompany';
      }
      
      // 检查是否是食物相关
      if (results.some(r => r.relations && 
                          r.relations.some(rel => 
                            rel.relation && 
                            (rel.relation.includes('宜吃') || 
                             rel.relation.includes('推荐食谱'))))) {
        return 'disease_do_food';
      }
      
      // 检查是否是症状相关
      if (results.some(r => r.relations && 
                          r.relations.some(rel => 
                            rel.relation && 
                            rel.relation.includes('症状')))) {
        return 'disease_symptom';
      }
      
      // 检查是否是预防相关
      if (results.some(r => r.relations && 
                          r.relations.some(rel => 
                            rel.relation && 
                            rel.relation.includes('预防')))) {
        return 'disease_prevent';
      }
      
      return 'general';
    },
    
    // 格式化疾病描述
    formatDiseaseDescription(results) {
      let answer = '';
      const result = results[0];
      
      if (result.entity) {
        answer += `<div class="entity-title">【${result.entity}】</div>`;
      }
      
      if (result.properties && result.properties.desc) {
        // 清理描述中的特殊字符
        let desc = result.properties.desc.replace(/\\xa0/g, ' ').trim();
        
        // 分段落显示
        const paragraphs = desc.split('\n').filter(p => p.trim());
        
        paragraphs.forEach(para => {
          answer += `<p class="desc-paragraph">${para}</p>`;
        });
      }
      
      return answer || '很抱歉，暂时没有找到相关疾病的描述信息。';
    },
    
    // 格式化并发症信息
    formatDiseaseComplication(results) {
      if (!results || results.length === 0) return '未找到相关并发症信息';
      
      const mainEntity = results[0].entity;
      let answer = `<div class="entity-title">【${mainEntity}】的并发症</div>`;
      
      // 创建并发症分类
      const complications = {
        from: [], // 主疾病引起的并发症
        to: []    // 可能导致主疾病的其他疾病
      };
      
      // 分类处理
      results.forEach(result => {
        if (result.relations && result.relations.length > 0) {
          result.relations.forEach(relation => {
            if (relation.source === mainEntity) {
              // 主疾病引起的并发症
              complications.from.push(relation.target);
            } else if (relation.target === mainEntity) {
              // 可能导致主疾病的其他疾病
              complications.to.push(relation.source);
            }
          });
        }
      });
      
      // 格式化主疾病引起的并发症
      if (complications.from.length > 0) {
        answer += `<div class="complication-section">
          <div class="section-title">${mainEntity}可能引起的并发症：</div>
          <div class="complication-list">`;
        
        complications.from.slice(0, 10).forEach(comp => {
          answer += `<div class="complication-item">• ${comp}</div>`;
        });
        
        if (complications.from.length > 10) {
          answer += `<div class="complication-more">等${complications.from.length}种并发症</div>`;
        }
        
        answer += `</div></div>`;
      }
      
      // 格式化可能导致主疾病的其他疾病
      if (complications.to.length > 0) {
        answer += `<div class="complication-section">
          <div class="section-title">可能导致${mainEntity}的其他疾病：</div>
          <div class="complication-list">`;
        
        complications.to.slice(0, 10).forEach(comp => {
          answer += `<div class="complication-item">• ${comp}</div>`;
        });
        
        if (complications.to.length > 10) {
          answer += `<div class="complication-more">等${complications.to.length}种疾病</div>`;
        }
        
        answer += `</div></div>`;
      }
      
      // 添加注意事项
      answer += `<div class="notice-section">
        <div class="notice-title">温馨提示：</div>
        <div class="notice-content">并发症信息仅供参考，具体诊断和治疗请咨询专业医生。</div>
      </div>`;
      
      return answer;
    },
    
    // 格式化食物信息
    formatDiseaseFood(results) {
      if (!results || results.length === 0) return '未找到相关饮食信息';
      
      const mainEntity = results[0].entity;
      let answer = `<div class="entity-title">【${mainEntity}】的饮食建议</div>`;
      
      // 分类食物
      const foods = {
        recommended: [], // 宜吃食物
        recipes: []      // 推荐食谱
      };
      
      // 分类处理
      results.forEach(result => {
        if (result.relations && result.relations.length > 0) {
          result.relations.forEach(relation => {
            if (relation.relation && relation.relation.includes('宜吃')) {
              foods.recommended.push(relation.target);
            } else if (relation.relation && relation.relation.includes('推荐食谱')) {
              foods.recipes.push(relation.target);
            }
          });
        }
      });
      
      // 格式化宜吃食物
      if (foods.recommended.length > 0) {
        answer += `<div class="food-section">
          <div class="section-title">宜吃食物：</div>
          <div class="food-grid">`;
        
        foods.recommended.forEach(food => {
          answer += `<div class="food-item">
            <span class="food-icon">🍽️</span>
            <span class="food-name">${food}</span>
          </div>`;
        });
        
        answer += `</div></div>`;
      }
      
      // 格式化推荐食谱
      if (foods.recipes.length > 0) {
        answer += `<div class="food-section">
          <div class="section-title">推荐食谱：</div>
          <div class="recipe-list">`;
        
        foods.recipes.forEach(recipe => {
          answer += `<div class="recipe-item">
            <span class="recipe-icon">🍲</span>
            <span class="recipe-name">${recipe}</span>
          </div>`;
        });
        
        answer += `</div></div>`;
      }
      
      // 添加饮食建议
      answer += `<div class="notice-section">
        <div class="notice-title">饮食注意事项：</div>
        <div class="notice-content">合理饮食是控制疾病的重要手段，建议配合医生指导制定个性化饮食方案。</div>
      </div>`;
      
      return answer;
    },
    
    // 格式化症状信息
    formatDiseaseSymptom(results) {
      if (!results || results.length === 0) return '未找到相关症状信息';
      
      const mainEntity = results[0].entity;
      let answer = `<div class="entity-title">【${mainEntity}】的症状</div>`;
      
      // 收集症状
      const symptoms = [];
      
      results.forEach(result => {
        if (result.relations && result.relations.length > 0) {
          result.relations.forEach(relation => {
            if (relation.relation && relation.relation.includes('症状')) {
              symptoms.push(relation.target);
            }
          });
        }
      });
      
      // 格式化症状列表
      if (symptoms.length > 0) {
        answer += `<div class="symptom-section">
          <div class="symptom-list">`;
        
        symptoms.forEach(symptom => {
          answer += `<div class="symptom-item">• ${symptom}</div>`;
        });
        
        answer += `</div></div>`;
      } else {
        answer += '<p>未找到相关症状信息</p>';
      }
      
      return answer;
    },
    
    // 格式化预防信息
    formatDiseasePrevent(results) {
      if (!results || results.length === 0) return '未找到相关预防信息';
      
      const mainEntity = results[0].entity;
      let answer = `<div class="entity-title">【${mainEntity}】的预防措施</div>`;
      
      // 收集预防信息
      const preventions = [];
      
      results.forEach(result => {
        if (result.relations && result.relations.length > 0) {
          result.relations.forEach(relation => {
            if (relation.relation && relation.relation.includes('预防')) {
              preventions.push(relation.target);
            }
          });
        }
      });
      
      // 格式化预防列表
      if (preventions.length > 0) {
        answer += `<div class="prevention-section">
          <div class="prevention-list">`;
        
        preventions.forEach((prevention, index) => {
          answer += `<div class="prevention-item">
            <div class="prevention-number">${index + 1}</div>
            <div class="prevention-content">${prevention}</div>
          </div>`;
        });
        
        answer += `</div></div>`;
      } else {
        answer += '<p>未找到相关预防信息</p>';
      }
      
      return answer;
    },
    
    // 格式化通用结果
    formatGeneralResults(results) {
      let formattedAnswer = '';

      results.forEach((result, index) => {
        if (index > 0) formattedAnswer += '\n\n';
        
        // 添加实体信息
        if (result.entity) {
          formattedAnswer += `<div class="entity-title">【${result.entity}】</div>`;
        }
        
        // 添加属性信息
        if (result.properties && Object.keys(result.properties).length > 0) {
          formattedAnswer += '<div class="properties-section">';
          formattedAnswer += '<div class="section-title">属性信息：</div>';
          
          Object.entries(result.properties).forEach(([key, value]) => {
            // 跳过空值或name属性(已经在实体标题中显示)
            if (!value || key === 'name') return;
            
            // 对于较长的描述信息
            if (key === 'desc' && typeof value === 'string' && value.length > 100) {
              const paragraphs = value.replace(/\\xa0/g, ' ').split('\n').filter(p => p.trim());
              formattedAnswer += `<div class="property-item"><span class="property-key">${key}:</span>`;
              paragraphs.forEach(para => {
                formattedAnswer += `<p class="property-value-paragraph">${para}</p>`;
              });
              formattedAnswer += '</div>';
            } else {
              formattedAnswer += `<div class="property-item">
                <span class="property-key">${key}:</span>
                <span class="property-value">${value}</span>
              </div>`;
            }
          });
          
          formattedAnswer += '</div>';
        }
        
        // 添加关系信息
        if (result.relations && result.relations.length > 0) {
          formattedAnswer += '<div class="relations-section">';
          formattedAnswer += '<div class="section-title">相关信息：</div>';
          
          const relationsByType = {};
          
          // 对关系进行分组
          result.relations.forEach(relation => {
            const type = relation.relation || '其他';
            if (!relationsByType[type]) {
              relationsByType[type] = [];
            }
            relationsByType[type].push(relation);
          });
          
          // 按关系类型输出
          Object.entries(relationsByType).forEach(([type, relations]) => {
            formattedAnswer += `<div class="relation-group">
              <div class="relation-type">${type}：</div>
              <div class="relation-items">`;
              
            relations.forEach(relation => {
              formattedAnswer += `<div class="relation-item">• ${relation.target || relation.source}</div>`;
            });
            
            formattedAnswer += '</div></div>';
          });
          
          formattedAnswer += '</div>';
        }
      });

      return formattedAnswer || '很抱歉，暂时没有找到相关信息。请尝试换一种方式提问，或者咨询其他医疗问题。';
    },

    async sendMessage() {
      if (!this.inputText) return;

      try {
        // 添加用户消息
        this.messages.push({
          id: this.messageId++,
          text: this.inputText,
          isUser: true,
          timestamp: Date.now()
        });

        // 保存当前问题
        const currentQuestion = this.inputText;
        this.inputText = '';
        
        // 焦点回到输入框
        this.$nextTick(() => {
          this.$refs.inputField.focus();
        });

        this.isLoading = true;
        
        // 自动滚动到底部
        this.scrollToBottom();
        
        const response = await axios.post('/qa/', { 
          question: currentQuestion,
          log_query: true // 添加参数指示需要记录日志
        });

        // 处理响应
        const answer = response.data?.success
          ? this.findAnswerInData(response.data)
          : '抱歉，服务器处理您的请求时遇到了问题，请稍后再试。';

        // 添加系统消息
        this.messages.push({
          id: this.messageId++,
          text: answer,
          isUser: false,
          timestamp: Date.now()
        });
        
        // 记录对话日志
        this.recordChatLog(currentQuestion, answer, response.data?.success ? 'success' : 'error');

      } catch (error) {
        console.error(`请求失败：${error.response?.data?.message || error.message}`);
        // 添加错误消息
        const errorMessage = '抱歉，连接服务器时遇到了问题。请检查您的网络连接，或稍后再试。';
        this.messages.push({
          id: this.messageId++,
          text: errorMessage,
          isUser: false,
          timestamp: Date.now()
        });
        
        // 记录错误日志
        this.recordChatLog(currentQuestion, errorMessage, 'error');
      } finally {
        this.isLoading = false;
        // 自动滚动到底部
        this.scrollToBottom();
      }
    },
    
    // 记录聊天日志
    async recordChatLog(question, answer, status = 'success') {
      try {
        await axios.post('/logs/chat/', {
          question,
          answer,
          status
        });
      } catch (error) {
        console.error('记录聊天日志失败:', error);
      }
    },
    
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messageList;
        container.scrollTop = container.scrollHeight;
      });
    }
  },
};
</script>

<style scoped>
/* 基础变量 - 亮色模式 */
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
  --highlight-bg: rgba(77, 150, 255, 0.1);
  --highlight-text: #3879D9;
  --success-color: #4CAF50;
  --error-color: #F44336;
  --info-color: #2196F3;
}

/* 主容器 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-color);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 暗色模式 */
.dark-mode {
  --primary-color: #5D9DFF;
  --primary-dark: #4187E7;
  --secondary-color: #7BD986;
  --accent-color: #FF7B7B;
  --background-color: #121212;
  --surface-color: #1E1E1E;
  --text-primary: #E1E1E1;
  --text-secondary: #AAAAAA;
  --border-color: #333333;
  --highlight-bg: rgba(93, 157, 255, 0.15);
  --highlight-text: #5D9DFF;
}

/* 头部 */
.chat-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 15px 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  position: relative;
  z-index: 10;
}

.header-left, .header-right {
  flex: 0 0 auto;
  width: 40px;
}

.header-center {
  flex: 1;
  text-align: center;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.chat-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-subtitle {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-top: 3px;
}

.icon-button {
  background: none;
  border: none;
  color: white;
  opacity: 0.9;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background 0.2s, opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: var(--background-color);
  position: relative;
  scroll-behavior: smooth;
}

/* 欢迎消息 */
.welcome-message {
  text-align: center;
  margin: auto;
  max-width: 600px;
  padding: 30px;
  background: var(--surface-color);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
  animation: fadeIn 0.6s ease;
}

.welcome-icon {
  color: var(--primary-color);
  margin-bottom: 20px;
}

.welcome-message h2 {
  margin: 10px 0;
  color: var(--text-primary);
}

.welcome-message p {
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.chip {
  background: var(--highlight-bg);
  color: var(--primary-color);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.chip:hover {
  background: var(--highlight-bg);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

/* 消息气泡 */
.message-bubble {
  display: flex;
  max-width: 90%;
  border-radius: 0 15px 15px 15px;
  line-height: 1.6;
  position: relative;
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.user .avatar-icon {
  background: var(--accent-color);
}

.system .avatar-icon {
  background: var(--primary-color);
}

.message-wrapper {
  background: var(--surface-color);
  padding: 15px;
  border-radius: 0 15px 15px 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  position: relative;
  min-width: 200px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.message-time {
  font-size: 0.75rem;
  font-weight: normal;
}

.message-content {
  white-space: pre-line;
  font-size: 15px;
}

.message-content .highlight {
  color: var(--highlight-text);
  font-weight: 600;
  padding: 0 2px;
}

.message-content .info-title {
  display: block;
  margin-top: 12px;
  margin-bottom: 6px;
  color: var(--text-primary);
  font-weight: 600;
}

.message-content .list-item {
  margin-left: 8px;
  margin-bottom: 4px;
  display: flex;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 5px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--highlight-bg);
  color: var(--primary-color);
}

.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.user .message-avatar {
  margin-right: 0;
  margin-left: 12px;
}

.user .message-wrapper {
  background: var(--highlight-bg);
  border-radius: 15px 0 15px 15px;
}

.system {
  align-self: flex-start;
}

/* 输入区域 */
.input-area {
  padding: 15px 20px;
  background: var(--surface-color);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  display: flex;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 30px;
  overflow: hidden;
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(77, 150, 255, 0.2);
}

input {
  flex: 1;
  padding: 15px 20px;
  border: none;
  font-size: 16px;
  background: transparent;
  color: var(--text-primary);
}

input:focus {
  outline: none;
}

.input-footer {
  text-align: center;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

kbd {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 2px 5px;
  font-size: 11px;
}

.send-button {
  width: 50px;
  height: 50px;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  margin: 2px;
}

.send-button:hover {
  background: var(--primary-dark);
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 输入中动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  align-self: flex-start;
  background: var(--surface-color);
  padding: 12px 20px;
  border-radius: 18px;
  margin-top: 5px;
}

.typing-indicator .dot {
  width: 8px;
  height: 8px;
  margin: 0 4px;
  background: var(--primary-color);
  border-radius: 50%;
  opacity: 0.6;
  animation: dotPulse 1.5s infinite;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* 消息通知 */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: toastIn 0.3s ease;
}

.toast.success {
  background-color: var(--success-color);
}

.toast.error {
  background-color: var(--error-color);
}

.toast.info {
  background-color: var(--info-color);
}

/* 动画 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes toastIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

/* 消息淡入动画 */
.message-fade-enter-active, .message-fade-leave-active {
  transition: all 0.3s;
}
.message-fade-enter, .message-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-bubble {
    max-width: 95%;
  }
  
  .chat-header h1 {
    font-size: 1.2rem;
  }
  
  .header-subtitle {
    font-size: 0.8rem;
  }
  
  .input-area {
    padding: 10px;
  }
  
  .suggestion-chips {
    flex-direction: column;
    align-items: center;
  }
  
  .chip {
    width: 100%;
    max-width: 300px;
  }
  
  .welcome-message {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .message-avatar {
    width: 30px;
    height: 30px;
    margin-right: 8px;
  }
  
  .user .message-avatar {
    margin-left: 8px;
  }
  
  .avatar-icon {
    width: 30px;
    height: 30px;
  }
  
  .input {
    padding: 12px 15px;
    font-size: 14px;
  }
  
  .send-button {
    width: 45px;
    height: 45px;
  }
  
  .input-footer {
    display: none;
  }
}

/* 新增回答格式化样式 */
.entity-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.desc-paragraph {
  margin-bottom: 10px;
  line-height: 1.6;
  text-align: justify;
}

.section-title {
  font-weight: 600;
  color: var(--text-primary);
  margin: 15px 0 8px;
}

/* 属性样式 */
.properties-section {
  margin-bottom: 15px;
}

.property-item {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
}

.property-key {
  font-weight: 500;
  color: var(--primary-dark);
  margin-right: 5px;
}

.property-value {
  color: var(--text-primary);
}

.property-value-paragraph {
  margin-top: 5px;
  margin-bottom: 10px;
  text-align: justify;
  line-height: 1.6;
}

/* 关系样式 */
.relations-section {
  margin-bottom: 15px;
}

.relation-group {
  margin-bottom: 15px;
}

.relation-type {
  font-weight: 500;
  color: var(--primary-dark);
  margin-bottom: 5px;
}

.relation-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.relation-item {
  background-color: var(--highlight-bg);
  border-radius: 8px;
  padding: 4px 12px;
  margin-bottom: 5px;
  color: var(--highlight-text);
  font-size: 0.9rem;
}

/* 并发症样式 */
.complication-section {
  margin-bottom: 20px;
}

.complication-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.complication-item {
  background-color: var(--highlight-bg);
  color: var(--highlight-text);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.complication-more {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 5px;
}

/* 食物样式 */
.food-section {
  margin-bottom: 20px;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.food-item, .recipe-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: var(--highlight-bg);
  padding: 8px 12px;
  border-radius: 8px;
  transition: transform 0.2s;
}

.food-item:hover, .recipe-item:hover {
  transform: translateY(-2px);
}

.food-icon, .recipe-icon {
  font-size: 1.2rem;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

/* 症状样式 */
.symptom-section {
  margin-bottom: 20px;
}

.symptom-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.symptom-item {
  background-color: var(--highlight-bg);
  color: var(--highlight-text);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* 预防样式 */
.prevention-section {
  margin-bottom: 20px;
}

.prevention-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.prevention-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  background-color: var(--highlight-bg);
  border-radius: 10px;
}

.prevention-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  font-weight: bold;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.prevention-content {
  flex: 1;
}

/* 温馨提示样式 */
.notice-section {
  margin-top: 20px;
  padding: 12px 15px;
  background-color: rgba(255, 107, 107, 0.1);
  border-left: 3px solid var(--accent-color);
  border-radius: 6px;
}

.notice-title {
  font-weight: 600;
  color: var(--accent-color);
  margin-bottom: 5px;
}

.notice-content {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .food-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .relation-items, .complication-list {
    flex-direction: column;
    gap: 5px;
  }
  
  .relation-item, .complication-item, .symptom-item {
    width: fit-content;
  }
}
</style>