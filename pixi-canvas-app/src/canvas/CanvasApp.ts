import * as PIXI from 'pixi.js';
// 完全注释：滤镜库导入（彻底移除滤镜相关依赖引用）
// import 'pixi-filters';

// 完全注释：滤镜类型声明扩展（避免命名空间错误）
// declare module 'pixi.js' {
//   interface FilterSystem {
//     GrayscaleFilter: typeof import('pixi-filters').GrayscaleFilter;
//     BlurFilter: typeof import('pixi-filters').BlurFilter;
//     SepiaFilter: typeof import('pixi-filters').SepiaFilter;
//   }
// }

// 扩展Graphics类型以支持自定义属性
interface ExtendedGraphics extends PIXI.Graphics {
  _originalBorderWidth?: number;
  _originalBorderColor?: number;

  // 边框核心属性
  /*riginalBorderStyle?: string; // 如 solid/dashed
  _originalBorderRadius?: number | string; // 如 4 或 '5%'

  // 关联样式属性
  _originalPadding?: number | string;
  _originalBoxShadow?: string | 'none';
  _originalBoxSizing?: 'content-box' | 'border-box';

  // 状态标识属性
  _isBorderModified: boolean = false;
  _borderModifyReason?: 'hover' | 'focus' | 'user-action';*/
}

// 元素类型定义
type ElementType = 'rect' | 'roundedRect' | 'circle' | 'image' | 'text';

// 元素基础属性
interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  background?: string;
  borderWidth?: number;
  borderColor?: string;
  url?: string;
  // 完全注释：滤镜属性（彻底移除，避免类型关联）
  // filters?: string[];
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}

export class CanvasApp {
  private app: PIXI.Application;
  private canvasContainer: PIXI.Container;
  private elementMap: Map<string, PIXI.DisplayObject>;
  private canvasElementMap: Map<string, CanvasElement> = new Map();
  private selectedElementId: string | null = null;

  // 撤销和重做历史记录
  private undoStack: CanvasElement[] = [];
  private redoStack: CanvasElement[] = [];

  // ========== 新增：拖拽状态变量（仅添加，不修改其他属性） ==========
  private dragType: 'canvas' | 'element' | null = null; // 当前拖拽类型
  private dragTarget: PIXI.DisplayObject | null = null; // 拖拽的目标元素
  private dragStart = {
    mouseX: 0, // 鼠标按下时的全局X坐标
    mouseY: 0, // 鼠标按下时的全局Y坐标
    elementX: 0, // 元素按下时的初始X坐标
    elementY: 0, // 元素按下时的初始Y坐标
    canvasX: 0, // 画布按下时的初始X坐标
    canvasY: 0, // 画布按下时的初始Y坐标
  };

  constructor(containerId: string = 'canvas-container', width: number = 1920, height: number = 1080) {
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x87ceeb,// 天空蓝背景画布
      antialias: true,// 抗锯齿
      resolution: window.devicePixelRatio || 1,
    });//就是一个定义画布的结构体声明

    // 修正画布挂载：断言为HTMLCanvasElement
    const container = document.getElementById(containerId);
    if (container && this.app.view) {
      container.appendChild(this.app.view as unknown as HTMLCanvasElement);//将 PIXI 生成的画布（app.view）添加到父容器中，让画布在页面上可见
    }

    this.canvasContainer = new PIXI.Container();//是 PIXI 中用于「分组管理 2D 元素」的 “虚拟容器”,本身不可见，但可以统一控制其子元素的位置、缩放、透明度等
    this.app.stage.addChild(this.canvasContainer);//是 PIXI 渲染树的「根容器」，所有需要渲染的元素 / 容器，最终都必须作为 stage 的子元素（或子容器的子元素）才能被显示
    this.elementMap = new Map();//比如 key 是元素 ID，value 是 PIXI 元素实例

    this.initInteraction();
    this.initDemoElements();
  }

  // ========== 核心修改：替换initInteraction方法（保留原有逻辑，新增元素拖拽） ==========
  private initInteraction(): void {
    const canvasView = this.app.view as unknown as HTMLCanvasElement;

    // 1. 画布缩放（保留原有逻辑）
    canvasView.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const scale = this.canvasContainer.scale.x + e.deltaY * -0.0005;
      this.canvasContainer.scale.set(Math.max(0.01, Math.min(10, scale)));
    });

    // 2. 鼠标按下：区分「元素拖拽」和「画布拖拽」（核心新增）
    this.app.stage.interactive = true; // 保留原有开启交互
    this.app.stage.on('mousedown', (e: PIXI.FederatedMouseEvent) => {
      e.stopPropagation();
      const localPos = e.data.getLocalPosition(this.canvasContainer);

      // 检测是否点击到元素（复用原有选中逻辑）
      let clickedElement: PIXI.DisplayObject | null = null;
      this.elementMap.forEach((el) => {
        if (el.getBounds().contains(localPos.x, localPos.y)) {
          clickedElement = el;
        }
      });

      if (clickedElement) {
        // 元素拖拽：初始化状态
        this.dragType = 'element';
        this.dragTarget = clickedElement;
        this.dragStart.mouseX = e.clientX;
        this.dragStart.mouseY = e.clientY;
       interface PositionedDisplayObject extends PIXI.DisplayObject {
        x: number;
        y: number;
        }
      // 使用时断言
        this.dragStart.elementX = (clickedElement as PositionedDisplayObject).x;
        this.dragStart.elementY = (clickedElement as PositionedDisplayObject).y;
        canvasView.style.cursor = 'move';
      } else {
        // 画布拖拽：保留原有逻辑
        this.dragType = 'canvas';
        this.dragStart.mouseX = e.clientX;
        this.dragStart.mouseY = e.clientY;
        this.dragStart.canvasX = this.canvasContainer.position.x;
        this.dragStart.canvasY = this.canvasContainer.position.y;
        canvasView.style.cursor = 'grabbing';
      }
    });

    // 3. 鼠标移动：执行对应拖拽逻辑（核心新增）
    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.dragType) return;

      if (this.dragType === 'element' && this.dragTarget) {
        // 元素拖拽：抵消画布缩放，精准跟随鼠标
        const dx = e.clientX - this.dragStart.mouseX;
        const dy = e.clientY - this.dragStart.mouseY;
        const scaleX = this.canvasContainer.scale.x;
        const scaleY = this.canvasContainer.scale.y;

        // 仅修改元素坐标（核心：不改变任何其他逻辑，只改x/y）
        this.dragTarget.x = this.dragStart.elementX + dx / scaleX;
        this.dragTarget.y = this.dragStart.elementY + dy / scaleY;
      } else if (this.dragType === 'canvas') {
        // 画布拖拽：保留原有逻辑
        const dx = e.clientX - this.dragStart.mouseX;
        const dy = e.clientY - this.dragStart.mouseY;
        this.canvasContainer.position.x = this.dragStart.canvasX + dx;
        this.canvasContainer.position.y = this.dragStart.canvasY + dy;
      }
    });

    // 4. 鼠标释放：重置状态（保留+适配）
    window.addEventListener('mouseup', () => {
      this.dragType = null;
      this.dragTarget = null;
      canvasView.style.cursor = 'grab';
    });

    // 5. 鼠标离开窗口：重置状态（新增，避免拖拽卡住）
    window.addEventListener('mouseleave', () => {
      this.dragType = null;
      this.dragTarget = null;
      canvasView.style.cursor = 'grab';
    });

    // 6. 点击选中元素：保留原有逻辑
    this.app.stage.on('click', (e) => {
      const localPos = e.data.getLocalPosition(this.canvasContainer);
      this.selectElementByPosition(localPos.x, localPos.y);
    });

    // 7. 右键删除元素：保留原有逻辑
    canvasView.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      if (this.selectedElementId) {
        this.deleteElement(this.selectedElementId);
      }
    });

    // 8. 撤销/重做：保留原有逻辑
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        this.undo();
      } else if (e.ctrlKey && e.key === 'y') {
        this.redo();
      }
    });
  }

  // ========== 以下所有方法完全保留，无任何修改 ==========
  private selectElementByPosition(x: number, y: number): void {
    let selected = null;
    this.elementMap.forEach((el, id) => {
      if (el.getBounds().contains(x, y)) {
        selected = id;
      }
    });
    this.selectElement(selected);
  }

  public selectElement(id: string | null): void {
    this.elementMap.forEach((el) => {
      if (el instanceof PIXI.Graphics) {
        const graphic = el as ExtendedGraphics;
        graphic.lineStyle(graphic._originalBorderWidth || 0, graphic._originalBorderColor || 0x000000);
      } else if (el instanceof PIXI.Sprite) {
        el.tint = 0xffffff;
      } else if (el instanceof PIXI.Text) {
        el.style.stroke = '';
      }
    });

    if (id) {
      const pixiElement = this.elementMap.get(id);
      const canvasElement = this.canvasElementMap.get(id);
      if (pixiElement && canvasElement) {
        if (pixiElement instanceof PIXI.Graphics) {
          const graphic = pixiElement as ExtendedGraphics;
          graphic._originalBorderWidth = canvasElement.borderWidth || 0;
          graphic._originalBorderColor = canvasElement.borderColor 
            ? parseInt(canvasElement.borderColor.slice(1), 16) 
            : 0;
          graphic.lineStyle(3, 0x1890ff);
        }
        if (pixiElement instanceof PIXI.Sprite) {
          pixiElement.tint = 0xe6f7ff;
        }
        if (pixiElement instanceof PIXI.Text) {
          pixiElement.style.stroke = '#1890ff';
        }
        this.selectedElementId = id;
      }
    } else {
      this.selectedElementId = null;
    }
  }

  // 撤销操作
  private undo(): void {
    if (this.undoStack.length > 0) {
      const lastElement = this.undoStack.pop();
      if (lastElement) {
        this.redoStack.push(lastElement);
        this.removeElement(lastElement.id);
      }
    }
  }

  // 重做操作
  private redo(): void {
    if (this.redoStack.length > 0) {
      const lastElement = this.redoStack.pop();
      if (lastElement) {
        this.undoStack.push(lastElement);
        this.addElement(lastElement);
      }
    }
  }

  // 删除元素
  private deleteElement(id: string): void {
    const element = this.canvasElementMap.get(id);
    if (element) {
      this.removeElement(id);
      this.undoStack.push(element);
    }
  }

  private removeElement(id: string): void {
    const pixiElement = this.elementMap.get(id);
    if (pixiElement) {
      this.canvasContainer.removeChild(pixiElement);
      this.elementMap.delete(id);
      this.canvasElementMap.delete(id);
    }
  }

  public addElement(element: CanvasElement): void {
    const pixiEl = this.createPixiElement(element);
    if (pixiEl) {
      // 新增：给所有元素开启交互（必须，否则无法检测点击拖拽）
      pixiEl.interactive = true;
      //pixiEl.buttonMode = true; // 鼠标悬浮显示手型（体验优化）
      
      this.canvasContainer.addChild(pixiEl);
      this.elementMap.set(element.id, pixiEl);
      this.canvasElementMap.set(element.id, element);
      this.undoStack.push(element);
    }
  }

  private createPixiElement(element: CanvasElement): PIXI.DisplayObject | null {
    switch (element.type) {
      case 'rect':
      case 'roundedRect':
      case 'circle':
        return this.createGraphicElement(element);
      case 'image':
        return this.createImageElement(element);
      case 'text':
        return this.createTextElement(element);
      default:
        console.warn(`不支持的元素类型：${element.type}`);
        return null;
    }
  }

  private createGraphicElement(element: CanvasElement): ExtendedGraphics {
    const graphic = new PIXI.Graphics() as ExtendedGraphics;
    this.updateGraphicElement(graphic, element);
    return graphic;
  }

  private updateGraphicElement(graphic: ExtendedGraphics, element: CanvasElement): void {
    graphic.clear();

    if (element.background) {
      graphic.beginFill(parseInt(element.background.slice(1), 16));
    }

    if (element.type === 'rect') {
      graphic.drawRect(0, 0, element.width || 100, element.height || 80);
    } else if (element.type === 'roundedRect') {
      graphic.drawRoundedRect(0, 0, element.width || 100, element.height || 80, element.radius || 10);
    } else if (element.type === 'circle') {
      const radius = element.radius || 50;
      graphic.drawCircle(radius, radius, radius);
    }

    if (element.borderWidth && element.borderColor) {
      graphic.lineStyle(element.borderWidth, parseInt(element.borderColor.slice(1), 16));
      graphic._originalBorderWidth = element.borderWidth;
      graphic._originalBorderColor = parseInt(element.borderColor.slice(1), 16);
    }

    graphic.endFill();
    graphic.x = element.x;
    graphic.y = element.y;
  }

  private createImageElement(element: CanvasElement): PIXI.Sprite {
    const sprite = PIXI.Sprite.from(element.url || 'assets/default.png');
    sprite.x = element.x;
    sprite.y = element.y;
    sprite.width = element.width || 150;
    sprite.height = element.height || 150;

    // 完全注释：滤镜应用逻辑（彻底移除，无任何滤镜相关代码）
    // if (element.filters) {
    //   sprite.filters = element.filters.map(filter => {
    //     switch (filter) {
    //       case 'grayscale': return new PIXI.filters.GrayscaleFilter();
    //       case 'blur': return new PIXI.filters.BlurFilter(2);
    //       case 'sepia': return new PIXI.filters.SepiaFilter();
    //       default: return null;
    //     }
    //   }).filter(Boolean) as PIXI.Filter[];
    // }

    return sprite;
  }

  private createTextElement(element: CanvasElement): PIXI.Text {
    // 完全注释：文本装饰逻辑（避免textDecoration类型错误）
    // const textDecoration: ('underline' | 'line-through' | 'none')[] = [];
    // if (element.underline) textDecoration.push('underline');
    // if (element.strike) textDecoration.push('line-through');

    const styleOptions: Partial<PIXI.TextStyle> = {
      fontFamily: element.fontFamily || 'Arial',
      fontSize: element.fontSize || 16,
      fill: element.color || '#000000',
      fontWeight: element.bold ? 'bold' : 'normal',
      fontStyle: element.italic ? 'italic' : 'normal',
      strokeThickness: 0,
    };

    const text = new PIXI.Text(element.text || '', new PIXI.TextStyle(styleOptions as PIXI.TextStyle));
    text.x = element.x;
    text.y = element.y;
    return text;
  }

  private initDemoElements(): void {
    const elements: CanvasElement[] = [
      {
        id: 'rect1',
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
        id: 'roundedRect1',
        type: 'roundedRect',
        x: 400,
        y: 100,
        width: 200,
        height: 150,
        radius: 20,
        background: '#00ccff',
        borderWidth: 3,
        borderColor: '#006699',
      },
      {
        id: 'circle1',
        type: 'circle',
        x: 250,
        y: 300,
        radius: 80,
        background: '#ff6699',
        borderWidth: 1,
        borderColor: '#cc0033',
      },
      {
        id: 'image1',
        type: 'image',
        x: 500,
        y: 300,
        width: 200,
        height: 150,
        url: 'https://picsum.photos/400/300',
        // 完全注释：图片滤镜属性（彻底移除）
        // filters: ['grayscale'],
      },
      {
        id: 'text1',
        type: 'text',
        x: 300,
        y: 450,
        text: '富文本测试',
        fontFamily: 'Microsoft YaHei',
        fontSize: 24,
        color: '#ff0000',
        bold: true,
        underline: true,
      },
    ];

    elements.forEach(el => this.addElement(el));
  }
}

// 开发环境自动初始化
if (import.meta.env.DEV) {
  window.onload = () => {
    new CanvasApp('canvas-container');
  };
}