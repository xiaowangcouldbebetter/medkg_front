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
          this.hasData = graphData && graphData.nodes && graphData.nodes.length > 0;
          
          if (this.hasData) {
            this.renderNetwork(graphData);
          } else {
            console.log('没有知识图谱数据');
          }
        } else {
          this.hasData = false;
          this.error = response.data.message || '获取可视化数据失败';
        }
      } catch (error) {
        console.error('获取知识图谱可视化数据失败:', error);
        this.hasData = false;
        this.error = error.response?.data?.message || '获取可视化数据失败，请稍后再试';
        
        // 添加模拟数据，方便测试
        if (process.env.NODE_ENV === 'development') {
          console.log('使用模拟数据进行测试');
          this.useMockData();
        }
      } finally {
        this.loading = false;
      }
    },
    
    // 添加模拟数据方法
    useMockData() {
      const mockData = {
        nodes: [
          { id: "疾病1", label: "疾病" },
          { id: "症状A", label: "症状" },
          { id: "症状B", label: "症状" },
          { id: "药物X", label: "药物" },
          { id: "治疗方法Y", label: "治疗" }
        ],
        links: [
          { source: "疾病1", target: "症状A", relation: "引起" },
          { source: "疾病1", target: "症状B", relation: "导致" },
          { source: "药物X", target: "疾病1", relation: "治疗" },
          { source: "治疗方法Y", target: "疾病1", relation: "适用于" }
        ]
      };
      
      this.hasData = true;
      this.renderNetwork(mockData);
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
      
      // 确保DOM已经渲染，且container元素存在
      this.$nextTick(() => {
        if (!this.$refs.networkContainer) {
          console.error('无法找到网络容器元素');
          this.error = '渲染可视化失败，无法找到容器元素';
          return;
        }
        
        try {
          // 处理节点数据
          const nodeData = graphData.nodes.map(node => {
            const color = this.generateNodeColor(node.label);
            
            return {
              id: node.id,
              label: node.id, // 直接使用id作为标签，因为返回的数据中没有properties.name
              title: this.generateNodeTooltip(node),
              color: {
                background: color,
                border: this.darkenColor(color, 0.2),
                highlight: {
                  background: this.lightenColor(color, 0.2),
                  border: this.darkenColor(color, 0.3)
                }
              },
              font: { color: '#fff', size: 14, face: 'Arial' },
              shape: 'dot',
              size: 30,
              group: node.label
            };
          });
          
          // 处理边数据
          const edgeData = graphData.links.map(link => {
            return {
              from: link.source,
              to: link.target,
              label: link.relation || '', // 使用relation字段代替type
              arrows: 'to',
              font: { size: 12, align: 'middle', multi: true, color: '#555' },
              color: { color: '#aaa', inherit: false },
              smooth: { type: 'curvedCW', roundness: 0.2 },
              width: 1.5
            };
          });
          
          // 创建数据集
          this.nodes = new DataSet(nodeData);
          this.edges = new DataSet(edgeData);
          
          // 网络配置 - 模拟Neo4j Browser布局
          const options = {
            nodes: {
              shape: 'dot',
              size: 30,
              borderWidth: 2,
              shadow: true,
              font: {
                face: 'Arial'
              }
            },
            edges: {
              width: 1.5,
              shadow: true,
              smooth: { 
                type: 'curvedCW', 
                roundness: 0.2 
              }
            },
            interaction: {
              hover: true,
              navigationButtons: true,
              keyboard: true,
              multiselect: true,
              tooltipDelay: 300
            },
            physics: {
              enabled: true,
              solver: 'forceAtlas2Based',
              forceAtlas2Based: {
                gravitationalConstant: -100,
                centralGravity: 0.01,
                springLength: 200,
                springConstant: 0.08,
                damping: 0.4,
                avoidOverlap: 0.8
              },
              stabilization: {
                enabled: true,
                iterations: 1000,
                updateInterval: 25
              }
            },
            layout: {
              improvedLayout: true,
              randomSeed: 42 // 固定种子使得每次布局相似
            }
          };
          
          // 创建网络 - 确保容器元素已经存在且可用
          const container = this.$refs.networkContainer;
          if (!container) {
            throw new Error('网络容器元素不存在');
          }
          
          // 确保容器高度
          if (container.clientHeight === 0) {
            container.style.height = '500px';
          }
          
          this.network = new Network(
            container,
            { nodes: this.nodes, edges: this.edges },
            options
          );
          
          // 添加网络事件
          this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
              const nodeId = params.nodes[0];
              const node = this.nodes.get(nodeId);
              console.log('点击了节点:', node);
              // 这里可以添加节点详情展示
            }
          });
          
          // 添加双击事件，展开相关节点
          this.network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
              const nodeId = params.nodes[0];
              // 这里可以添加加载节点关联节点的逻辑
              console.log('双击节点:', nodeId);
            }
          });
        } catch (error) {
          console.error('渲染网络可视化失败:', error);
          this.error = '渲染可视化失败: ' + error.message;
          this.hasData = false;
        }
      });
    },
    
    generateNodeTooltip(node) {
      let tooltip = `<div class="node-tooltip">`;
      tooltip += `<div class="tooltip-header">${node.label}</div>`;
      tooltip += `<div class="tooltip-content">`;
      
      // 由于API返回的节点数据没有properties，直接显示节点ID和标签
      tooltip += `<div class="tooltip-row"><span>ID:</span> ${node.id}</div>`;
      tooltip += `<div class="tooltip-row"><span>标签:</span> ${node.label}</div>`;
      
      // 如果节点有其他属性，也可以显示
      Object.entries(node).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'label' && value && String(value).length < 100) {
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