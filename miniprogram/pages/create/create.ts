// 创建图片页面
import { CreatePageData, ArtStyle, InspirationTip } from '../../types/index';
import { cloudService } from '../../utils/cloudService';

// 常量定义
const CONSTANTS = {
  POLL_INTERVAL: 2000, // 轮询间隔 2秒
  MAX_POLL_ATTEMPTS: 60, // 最大轮询次数
  IMAGE_SIZE: '1024*1024', // 图片尺寸
  IMAGE_COUNT: 1, // 图片数量
  MAX_PROMPT_LENGTH: 500, // 最大提示词长度
  MAX_NEGATIVE_LENGTH: 200, // 最大负面提示词长度
  DEBOUNCE_DELAY: 300 // 防抖延迟
};

// 艺术风格配置
const ART_STYLES: ArtStyle[] = [
  '写实', '动漫', '电影感', '梦幻', '科幻',
  '油画', '水彩', '素描', '卡通', '抽象'
];

// 灵感提示配置
const INSPIRATION_TIPS: InspirationTip[] = [
  {
    id: 'tip_1',
    title: '温馨场景',
    prompt: '一只橘猫坐在咖啡厅窗边，阳光洒在它身上，温馨的日系插画风格',
    example: '温馨的咖啡厅场景'
  },
  {
    id: 'tip_2',
    title: '科幻未来',
    prompt: '未来城市的夜景，霓虹灯闪烁，赛博朋克风格，电影质感',
    example: '赛博朋克城市夜景'
  },
  {
    id: 'tip_3',
    title: '梦幻童话',
    prompt: '森林中的小精灵，梦幻的光影效果，童话风格',
    example: '梦幻森林精灵'
  },
  {
    id: 'tip_4',
    title: '动漫人物',
    prompt: '日系动漫风格的可爱少女，校园背景，清新画风',
    example: '校园动漫少女'
  },
  {
    id: 'tip_5',
    title: '科幻机甲',
    prompt: '未来科幻风格的巨型机甲，金属质感，战斗场景',
    example: '科幻机甲战士'
  }
];

// 风格关键词映射
const STYLE_KEYWORDS: Record<string, ArtStyle> = {
  '写实': '写实', '真实': '写实',
  '动漫': '动漫', '动画': '动漫',
  '电影': '电影感', '电影感': '电影感',
  '梦幻': '梦幻', '梦境': '梦幻',
  '科幻': '科幻', '未来': '科幻',
  '油画': '油画', '水彩': '水彩',
  '素描': '素描', '卡通': '卡通',
  '抽象': '抽象'
};

Page<CreatePageData, any>({
  data: {
    prompt: '',
    negativePrompt: '',
    selectedStyle: '',
    generatedImage: null,
    generatedFileID: null, // 存储生成的图片fileID
    publishing: false,
    canGenerate: false,
    taskId: null,
    isGenerating: false, // 统一使用一个生成状态
    currentSeed: null,
    artStyles: ART_STYLES,
    inspirationTips: INSPIRATION_TIPS
  } as CreatePageData,


  onLoad() {
    // 页面加载时的初始化
    // 初始化防抖函数
    this.debouncedAutoDetect = this.debounce((prompt: string) => {
      if (prompt && !this.data.selectedStyle) {
        this.autoDetectStyle(prompt);
      }
    }, CONSTANTS.DEBOUNCE_DELAY);
  },

  // ==================== 工具方法 ====================
  
  // 验证输入内容
  validateInputs(): { isValid: boolean; message?: string } {
    if (!this.data.prompt.trim()) {
      return { isValid: false, message: '请输入描述内容' };
    }
    
    if (this.data.prompt.length > CONSTANTS.MAX_PROMPT_LENGTH) {
      return { isValid: false, message: `提示词长度不能超过${CONSTANTS.MAX_PROMPT_LENGTH}个字符` };
    }
    
    if (this.data.negativePrompt.length > CONSTANTS.MAX_NEGATIVE_LENGTH) {
      return { isValid: false, message: `负面提示词长度不能超过${CONSTANTS.MAX_NEGATIVE_LENGTH}个字符` };
    }
    
    return { isValid: true };
  },

  // 防抖处理
  debounce(func: Function, delay: number) {
    let timeoutId: number;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  // 检查网络状态
  async checkNetworkStatus(): Promise<boolean> {
    try {
      const networkType = await wx.getNetworkType();
      return networkType.networkType !== 'none';
    } catch (error) {
      console.error('检查网络状态失败:', error);
      return false;
    }
  },

  // 公共方法：更新生成状态
  updateGeneratingState(isGenerating: boolean, clearImage: boolean = false) {
    const updateData: any = {
      isGenerating: isGenerating,
      canGenerate: !isGenerating && this.data.prompt && this.data.prompt.trim().length > 0
    };
    
    if (clearImage) {
      updateData.generatedImage = null;
      updateData.generatedFileID = null;
    }
    
    this.setData(updateData);
  },

  // 公共方法：构建完整提示词
  buildFullPrompt(): string {
    let fullPrompt = this.data.prompt;
    if (this.data.selectedStyle) {
      fullPrompt += `，${this.data.selectedStyle}风格`;
    }
    return fullPrompt;
  },

  // 公共方法：处理生成错误
  handleGenerationError(error: any, context: string) {
    console.error(`${context}失败:`, error);
    this.updateGeneratingState(false);
    this.showToast(`${context}失败，请重试`);
  },

  // 提示词输入事件（处理双向绑定的副作用）
  onPromptInput() {
    // 双向绑定自动处理数据更新，这里处理副作用
    const promptValue = this.data.prompt;
    const canGenerate = promptValue && promptValue.trim().length > 0 && !this.data.isGenerating;
    
    this.setData({
      canGenerate: canGenerate
    });

    // 防抖处理自动风格检测
    if (this.debouncedAutoDetect) {
      this.debouncedAutoDetect(promptValue);
    }
  },

  // 防抖的自动风格检测
  debouncedAutoDetect: null as Function | null,

  // 提示词输入失焦
  onPromptBlur(e: any) {
    const value = e.detail.value.trim();
    if (value && !this.data.selectedStyle) {
      // 自动检测并推荐风格
      this.autoDetectStyle(value);
    }
  },

  // 不想要的内容输入变化（双向绑定自动处理，此方法保留用于其他逻辑）
  onNegativePromptChange() {
    // 双向绑定自动处理数据更新，这里可以添加其他逻辑
  },

  // ==================== 用户交互方法 ====================
  
  // 风格标签点击
  onStyleTagTap(e: any) {
    const style = e.currentTarget.dataset.style as ArtStyle;
    const currentStyle = this.data.selectedStyle;
    
    this.setData({
      selectedStyle: currentStyle === style ? '' : style
    });

    // 如果选择了风格，自动添加到提示词中
    if (currentStyle !== style && style) {
      this.addStyleToPrompt(style);
    }
  },

  // 自动检测风格
  autoDetectStyle(prompt: string) {
    for (const [keyword, style] of Object.entries(STYLE_KEYWORDS)) {
      if (prompt.includes(keyword)) {
        this.setData({
          selectedStyle: style
        });
        break;
      }
    }
  },

  // 添加风格到提示词
  addStyleToPrompt(style: ArtStyle) {
    const currentPrompt = this.data.prompt;
    if (!currentPrompt.includes(style)) {
      const newPrompt = currentPrompt + '，' + style + '风格';
      this.setData({
        prompt: newPrompt
      });
      // 使用公共方法更新生成状态
      this.updateGeneratingState(this.data.isGenerating);
    }
  },

  // ==================== 核心功能方法 ====================
  
  // 点击生成按钮
  async onGenerateTap() {
    // 输入验证
    const validation = this.validateInputs();
    if (!validation.isValid) {
      this.showToast(validation.message!);
      return;
    }

    // 网络状态检查
    const isOnline = await this.checkNetworkStatus();
    if (!isOnline) {
      this.showToast('网络连接异常，请检查网络后重试');
      return;
    }

    this.updateGeneratingState(true, true);

    try {
      const fullPrompt = this.buildFullPrompt();
      const taskResult = await cloudService.createImageTask(
        fullPrompt,
        this.data.negativePrompt,
        CONSTANTS.IMAGE_SIZE,
        CONSTANTS.IMAGE_COUNT,
        this.data.currentSeed
      );

      if (!taskResult.success) {
        throw new Error(taskResult.error || '创建任务失败');
      }

      this.setData({
        taskId: taskResult.data.taskId
      });

      await this.pollTaskResult(taskResult.data.taskId);

    } catch (error) {
      this.handleGenerationError(error, '生成图片');
    }
  },

  // 轮询任务结果
  async pollTaskResult(taskId: string) {
    let attempts = 0;

    const poll = async (): Promise<void> => {
      attempts++;
      
      try {
        const result = await cloudService.queryImageTaskResult(taskId);
        
        if (!result.success) {
          throw new Error(result.error || '查询任务结果失败');
        }

        const taskData = result.data;
        const status = taskData.taskStatus;

        switch (status) {
          case 'SUCCEEDED':
            await this.handleTaskSuccess(taskData);
            break;
          case 'FAILED':
            throw new Error(taskData.message || '图片生成失败');
          case 'PENDING':
          case 'RUNNING':
            if (attempts < CONSTANTS.MAX_POLL_ATTEMPTS) {
              setTimeout(poll, CONSTANTS.POLL_INTERVAL);
            } else {
              throw new Error('生成超时，请重试');
            }
            break;
          default:
            throw new Error(`未知的任务状态: ${status}`);
        }
      } catch (error) {
        this.handleGenerationError(error, '轮询任务结果');
      }
    };

    poll();
  },

  // 处理任务成功
  async handleTaskSuccess(taskData: any) {
    const imageUrl = taskData.results?.[0]?.url;
    if (!imageUrl) {
      throw new Error('未获取到生成的图片URL');
    }

    const fileName = this.generateFileName();
    const downloadResult = await cloudService.downloadImageToCloud(imageUrl, fileName);
    
    if (!downloadResult.success) {
      throw new Error('下载图片到云存储失败: ' + downloadResult.error);
    }

    this.setData({
      generatedImage: downloadResult.data.cloudUrl,
      generatedFileID: downloadResult.data.fileID
    });
    
    this.updateGeneratingState(false);
    this.showToast('图片生成成功！');
  },

  // 生成文件名
  generateFileName(): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    return `ai_generated_${timestamp}_${randomId}.png`;
  },

  // 点击重新生成按钮
  async onRegenerateTap() {
    // 输入验证
    const validation = this.validateInputs();
    if (!validation.isValid) {
      this.showToast(validation.message!);
      return;
    }

    // 网络状态检查
    const isOnline = await this.checkNetworkStatus();
    if (!isOnline) {
      this.showToast('网络连接异常，请检查网络后重试');
      return;
    }

    this.updateGeneratingState(true, true);

    try {
      const fullPrompt = this.buildFullPrompt();
      const taskResult = await cloudService.createImageTask(
        fullPrompt,
        this.data.negativePrompt,
        CONSTANTS.IMAGE_SIZE,
        CONSTANTS.IMAGE_COUNT,
        this.data.currentSeed // 使用相同的seed确保一致性
      );

      if (!taskResult.success) {
        throw new Error(taskResult.error || '创建任务失败');
      }

      this.setData({
        taskId: taskResult.data.taskId
      });

      await this.pollTaskResult(taskResult.data.taskId);

    } catch (error) {
      this.handleGenerationError(error, '重新生成图片');
    }
  },

  // 点击发布按钮
  async onPublishTap() {
    if (!this.data.generatedImage) {
      this.showToast('请先生成图片');
      return;
    }

    this.setData({
      publishing: true
    });

    try {
      // 模拟发布到画廊
      await this.publishToGallery();
      
      this.setData({
        publishing: false
      });
      
      this.showToast('发布成功！');
      
      // 延迟跳转到我的页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/profile/profile'
        });
      }, 1500);
      
    } catch (error) {
      console.error('发布失败:', error);
      this.setData({
        publishing: false
      });
      this.showToast('发布失败，请重试');
    }
  },

  // 发布到画廊
  async publishToGallery(): Promise<void> {
    try {
      // 调用云函数发布图片
      const result = await wx.cloud.callFunction({
        name: 'publishImage',
        data: {
          imageUrl: this.data.generatedImage,
          fileID: this.data.generatedFileID, // 传递fileID
          prompt: this.data.prompt,
          negativePrompt: this.data.negativePrompt,
          style: this.data.selectedStyle
        }
      });

      if (!result.result || !(result.result as any).success) {
        throw new Error((result.result as any)?.error || '发布失败');
      }

    } catch (error) {
      console.error('发布作品失败:', error);
      throw error;
    }
  },

  // 点击灵感提示
  onInspirationTap(e: any) {
    const tip = e.currentTarget.dataset.tip as InspirationTip;
    this.setData({
      prompt: tip.prompt
    });
    // 使用公共方法更新生成状态
    this.updateGeneratingState(this.data.isGenerating);
    this.showToast('已应用灵感提示');
  },

  // 图片加载错误
  onImageError(e: any) {
    console.error('图片加载失败:', e);
    this.showToast('图片加载失败');
  },

  // ==================== 工具和辅助方法 ====================
  
  // 显示Toast
  showToast(message: string) {
    const toast = this.selectComponent('#t-toast');
    if (toast) {
      toast.show({
        message,
        theme: 'success'
      });
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'AI画廊 - 用文字创造艺术',
      path: '/pages/create/create'
    };
  }
});