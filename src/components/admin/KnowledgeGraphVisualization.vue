<template>
  <div class="kg-visualization">
    <div class="visualization-header">
      <h3>知识图谱可视化</h3>
      <div class="header-actions">
        <div class="limit-control">
          <label for="node-limit">节点限制:</label>
          <select id="node-limit" v-model="nodeLimit" @change="loadVisualizationData">
            <option value="20">20个</option>
            <option value="50">50个</option>
            <option value="100">100个</option>
            <option value="200">200个</option>
          </select>
        </div>
        
        <button class="refresh-btn" @click="loadVisualizationData" :disabled="loading">
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
      <button class="retry-btn" @click="loadVisualizationData">重试</button>
    </div>
    
    <div v-else-if="!hasData" class="no-data-container">
      <i class="el-icon-data-line"></i>
      <div class="no-data-message">暂无知识图谱数据</div>
    </div>
    
    <div v-else ref="networkContainer" class="network-container"></div>
    
    <div class="legend-container" v-if="hasData">
      <h4>图例</h4>
      <div class="legend-items">
        <div v-for="(color, label) in nodeColors" :key="label" class="legend-item">
          <div class="legend-color" :style="{ backgroundColor: color }"></div>
          <div class="legend-label">{{ label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Network, DataSet } from 'vis-network/standalone';

export default {
  name: 'KnowledgeGraphVisualization',
  data() {
    return {
      loading: false,
      error: null,
      network: null,
      nodes: null,
      edges: null,
      nodeLimit: 50,
      nodeColors: {}, // 每种节点类型的颜色
      hasData: false
    };
  },
  mounted() {
    this.loadVisualizationData();
  },
  beforeDestroy() {
    if (this.network) {
      this.network.destroy();
    }
  },
  methods: {
    async loadVisualizationData() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`/kg/visualization/?limit=${this.nodeLimit}`);
        
        if (response.data.success) {
          const graphData = response.data.data;
          this.hasData = graphData.nodes?.length > 0;
          
          if (this.hasData) {
            this.renderNetwork(graphData);
          }
        } else {
          this.hasData = false;
          this.error = response.data.message || '获取可视化数据失败';
        }
      } catch (error) {
        console.error('获取知识图谱可视化数据失败:', error);
        this.hasData = false;
        this.error = error.response?.data?.message || '获取可视化数据失败，请稍后再试';
      } finally {
        this.loading = false;
      }
    },
    
    generateNodeColor(label) {
      // 如果该类型已经有颜色，则返回该颜色
      if (this.nodeColors[label]) {
        return this.nodeColors[label];
      }
      
      // 生成一个随机颜色并存储
      const colors = [
        '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
        '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
      ];
      
      const colorIndex = Object.keys(this.nodeColors).length % colors.length;
      this.nodeColors[label] = colors[colorIndex];
      
      return this.nodeColors[label];
    },
    
    renderNetwork(graphData) {
      // 如果已经存在网络，则销毁它
      if (this.network) {
        this.network.destroy();
        this.nodes = null;
        this.edges = null;
      }
      
      // 处理节点数据
      const nodeData = graphData.nodes.map(node => {
        const color = this.generateNodeColor(node.label);
        
        return {
          id: node.id,
          label: node.properties.name || node.id.toString(),
          title: this.generateNodeTooltip(node),
          color: {
            background: color,
            border: this.darkenColor(color, 0.2),
            highlight: {
              background: this.lightenColor(color, 0.2),
              border: this.darkenColor(color, 0.3)
            }
          },
          font: { color: '#fff' },
          group: node.label
        };
      });
      
      // 处理边数据
      const edgeData = graphData.links.map(link => {
        return {
          from: link.source,
          to: link.target,
          label: link.type,
          arrows: 'to',
          font: { size: 10, align: 'middle' },
          color: { color: '#aaa', inherit: false }
        };
      });
      
      // 创建数据集
      this.nodes = new DataSet(nodeData);
      this.edges = new DataSet(edgeData);
      
      // 网络配置
      const options = {
        nodes: {
          shape: 'dot',
          size: 20,
          borderWidth: 2,
          shadow: true
        },
        edges: {
          width: 1,
          smooth: { type: 'continuous' }
        },
        interaction: {
          hover: true,
          navigationButtons: true,
          keyboard: true
        },
        physics: {
          stabilization: true,
          barnesHut: {
            gravitationalConstant: -5000,
            centralGravity: 0.3,
            springLength: 150,
            springConstant: 0.04,
            damping: 0.09
          }
        }
      };
      
      // 创建网络
      const container = this.$refs.networkContainer;
      this.network = new Network(
        container,
        { nodes: this.nodes, edges: this.edges },
        options
      );
    },
    
    generateNodeTooltip(node) {
      let tooltip = `<div class="node-tooltip">`;
      tooltip += `<div class="tooltip-header">${node.label}</div>`;
      tooltip += `<div class="tooltip-content">`;
      
      Object.entries(node.properties).forEach(([key, value]) => {
        if (value && String(value).length < 100) { // 避免过长的文本
          tooltip += `<div class="tooltip-row"><span>${key}:</span> ${value}</div>`;
        }
      });
      
      tooltip += `</div></div>`;
      return tooltip;
    },
    
    // 辅助函数：使颜色变深
    darkenColor(hex, amount) {
      return this.adjustColor(hex, -amount);
    },
    
    // 辅助函数：使颜色变亮
    lightenColor(hex, amount) {
      return this.adjustColor(hex, amount);
    },
    
    // 辅助函数：调整颜色
    adjustColor(hex, amount) {
      let r = parseInt(hex.substring(1, 3), 16);
      let g = parseInt(hex.substring(3, 5), 16);
      let b = parseInt(hex.substring(5, 7), 16);
      
      r = Math.max(0, Math.min(255, r + r * amount));
      g = Math.max(0, Math.min(255, g + g * amount));
      b = Math.max(0, Math.min(255, b + b * amount));
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.kg-visualization {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.visualization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.visualization-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}

.limit-control {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.limit-control label {
  margin-right: 8px;
  font-size: 14px;
}

.limit-control select {
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

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-container,
.error-container,
.no-data-container {
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

.error-container i,
.no-data-container i {
  font-size: 48px;
  color: #909399;
  margin-bottom: 15px;
}

.error-container .error-message {
  color: #f56c6c;
  margin-bottom: 15px;
}

.no-data-container .no-data-message {
  color: #909399;
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

.network-container {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f9f9f9;
}

.legend-container {
  margin-top: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.legend-container h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #303133;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 5px;
}

.legend-label {
  font-size: 12px;
}

/* 自定义工具提示样式 */
:deep(.node-tooltip) {
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
  max-width: 300px;
}

:deep(.tooltip-header) {
  background-color: #409eff;
  color: white;
  padding: 8px 12px;
  font-weight: bold;
}

:deep(.tooltip-content) {
  padding: 8px 12px;
}

:deep(.tooltip-row) {
  margin-bottom: 5px;
  font-size: 12px;
}

:deep(.tooltip-row span) {
  font-weight: bold;
  color: #606266;
}
</style> 