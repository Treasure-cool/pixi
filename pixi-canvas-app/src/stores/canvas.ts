// src/stores/canvas.ts
import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid'; // 生成唯一 ID，需先安装：npm install uuid

// 定义元素类型
type ElementType = 'rect' | 'circle' | 'image' | 'text';

interface CanvasElement {
  id: string;
  type: ElementType;
  x: number; // 位置 x
  y: number; // 位置 y
  // 图形通用属性
  width?: number;
  height?: number;
  radius?: number; // 圆角/圆半径
  background?: string; // 背景色（十六进制，如 #ff0000）
  borderWidth?: number;
  borderColor?: string;
  // 图片属性
  url?: string;
  filters?: string[]; // 滤镜名称：grayscale, blur, sepia
  // 文本属性
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    elements: [] as CanvasElement[],
    selectedElementId: null as string | null,
  }),
  getters: {
    selectedElement: (state) => 
      state.elements.find(el => el.id === state.selectedElementId),
  },
  actions: {
    // 初始化：从 localStorage 加载数据
    init() {
      const saved = localStorage.getItem('canvasData');
      if (saved) this.elements = JSON.parse(saved);
      else this.addDefaultElements(); // 添加默认元素测试
    },
    // 添加默认元素（方便测试）
    addDefaultElements() {
      this.elements.push(
        {
          id: uuidv4(),
          type: 'rect',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          background: '#ffcc00',
          borderWidth: 2,
          borderColor: '#333333',
        },
        {
          id: uuidv4(),
          type: 'text',
          x: 400,
          y: 100,
          text: 'Hello Pixi + Vue',
          fontFamily: 'Arial',
          fontSize: 24,
          color: '#ff0000',
          bold: true,
          underline: true,
        }
      );
      this.saveToLocalStorage();
    },
    // 更新元素属性
    updateElement(id: string, changes: Partial<CanvasElement>) {
      const index = this.elements.findIndex(el => el.id === id);
      if (index !== -1) {
        this.elements[index] = { ...this.elements[index], ...changes };
        this.saveToLocalStorage();
      }
    },
    // 选中元素
    selectElement(id: string | null) {
      this.selectedElementId = id;
    },
    // 保存到本地存储
    saveToLocalStorage() {
      localStorage.setItem('canvasData', JSON.stringify(this.elements));
    },
  },
});