// 创建图片页面
import { CreatePageData, ArtStyle, InspirationTip } from '../../types/index';
import { cloudService } from '../../utils/cloudService';

Page<CreatePageData, any>({
  data: {
    prompt: '',
    negativePrompt: '',
    selectedStyle: '',
    generatedImage: null,
    generating: false,
    publishing: false,
    canGenerate: false,
    taskId: null,
    taskStatus: null,
    isGenerating: false,
    generationProgress: 0,
    currentSeed: null,
    artStyles: [
      '写实',
      '动漫',
      '电影感',
      '梦幻',
      '科幻',
      '油画',
      '水彩',
      '素描',
      '卡通',
      '抽象'
    ] as ArtStyle[],
    inspirationTips: [
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
    ] as InspirationTip[]
  } as CreatePageData,

  onLoad() {
    console.log('create页面加载成功');
    // 页面加载时的初始化
  },

  // 提示词输入变化
  onPromptChange(e: any) {
    const promptValue = e.detail.value;
    const canGenerate = promptValue && promptValue.trim().length > 0 && !this.data.isGenerating;
    
    this.setData({
      prompt: promptValue,
      canGenerate: canGenerate
    });
  },

  // 提示词输入失焦
  onPromptBlur(e: any) {
    const value = e.detail.value.trim();
    if (value && !this.data.selectedStyle) {
      // 自动检测并推荐风格
      this.autoDetectStyle(value);
    }
  },

  // 不想要的内容输入变化
  onNegativePromptChange(e: any) {
    this.setData({
      negativePrompt: e.detail.value
    });
  },

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
    const styleKeywords: Record<string, ArtStyle> = {
      '写实': '写实',
      '真实': '写实',
      '动漫': '动漫',
      '动画': '动漫',
      '电影': '电影感',
      '电影感': '电影感',
      '梦幻': '梦幻',
      '梦境': '梦幻',
      '科幻': '科幻',
      '未来': '科幻',
      '油画': '油画',
      '水彩': '水彩',
      '素描': '素描',
      '卡通': '卡通',
      '抽象': '抽象'
    };

    for (const [keyword, style] of Object.entries(styleKeywords)) {
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
        prompt: newPrompt,
        canGenerate: newPrompt && newPrompt.trim().length > 0 && !this.data.generating
      });
    }
  },

  // 点击生成按钮
  async onGenerateTap() {
    if (!this.data.prompt.trim()) {
      this.showToast('请输入描述内容');
      return;
    }

    this.setData({
      isGenerating: true,
      generating: true,
      generatedImage: null,
      canGenerate: false,
      generationProgress: 0,
      taskStatus: '创建任务中...'
    });

    try {
      // 构建完整的提示词
      let fullPrompt = this.data.prompt;
      if (this.data.selectedStyle) {
        fullPrompt += `，${this.data.selectedStyle}风格`;
      }

      // 创建AI图片生成任务
      const taskResult = await cloudService.createImageTask(
        fullPrompt,
        this.data.negativePrompt,
        '1024*1024',
        1,
        this.data.currentSeed
      );

      if (!taskResult.success) {
        throw new Error(taskResult.error || '创建任务失败');
      }

      const taskId = taskResult.data.taskId;
      this.setData({
        taskId: taskId,
        taskStatus: '任务创建成功，开始生成...'
      });

      // 开始轮询任务结果
      await this.pollTaskResult(taskId);

    } catch (error) {
      console.error('生成图片失败:', error);
      this.setData({
        isGenerating: false,
        generating: false,
        canGenerate: this.data.prompt && this.data.prompt.trim().length > 0,
        taskStatus: null
      });
      this.showToast('生成失败，请重试');
    }
  },

  // 轮询任务结果
  async pollTaskResult(taskId: string) {
    const maxAttempts = 60; // 最多轮询60次，每次间隔2秒，总共2分钟
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      try {
        const result = await cloudService.queryImageTaskResult(taskId);
        
        if (!result.success) {
          throw new Error(result.error || '查询任务结果失败');
        }

        const taskData = result.data;
        const status = taskData.taskStatus; // 修复：使用 taskStatus 而不是 status

        // 更新进度和状态
        this.setData({
          generationProgress: Math.min(attempts * 2, 90), // 最多显示90%进度
          taskStatus: `生成中... (${status})`
        });

        if (status === 'SUCCEEDED') {
          // 任务成功完成
          const imageUrl = taskData.results?.[0]?.url; // 修复：使用 results 而不是 output.results
          if (imageUrl) {
            // 生成文件名
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 8);
            const fileName = `ai_generated_${timestamp}_${randomId}.png`;
            
            // 下载图片到云存储
            const downloadResult = await cloudService.downloadImageToCloud(imageUrl, fileName);
            if (downloadResult.success) {
              const cloudUrl = downloadResult.data.cloudUrl;
              this.setData({
                generatedImage: cloudUrl,
                isGenerating: false,
                generating: false,
                canGenerate: this.data.prompt && this.data.prompt.trim().length > 0,
                generationProgress: 100,
                taskStatus: '生成完成！'
              });
              this.showToast('图片生成成功！');
            } else {
              throw new Error('下载图片到云存储失败: ' + downloadResult.error);
            }
          } else {
            throw new Error('未获取到生成的图片URL');
          }
        } else if (status === 'FAILED') {
          throw new Error(taskData.message || '图片生成失败');
        } else if (status === 'PENDING' || status === 'RUNNING') {
          // 继续轮询
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000); // 2秒后再次轮询
          } else {
            throw new Error('生成超时，请重试');
          }
        } else {
          throw new Error(`未知的任务状态: ${status}`);
        }
      } catch (error) {
        console.error('轮询任务结果失败:', error);
        this.setData({
          isGenerating: false,
          generating: false,
          canGenerate: this.data.prompt && this.data.prompt.trim().length > 0,
          taskStatus: null
        });
        this.showToast('生成失败，请重试');
      }
    };

    // 开始轮询
    poll();
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
      
      // 延迟跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/home'
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
          prompt: this.data.prompt,
          negativePrompt: this.data.negativePrompt,
          style: this.data.selectedStyle
        }
      });

      if (!result.result || !(result.result as any).success) {
        throw new Error((result.result as any)?.error || '发布失败');
      }

      console.log('作品发布成功:', (result.result as any).data);
    } catch (error) {
      console.error('发布作品失败:', error);
      throw error;
    }
  },

  // 点击灵感提示
  onInspirationTap(e: any) {
    const tip = e.currentTarget.dataset.tip as InspirationTip;
    this.setData({
      prompt: tip.prompt,
      canGenerate: tip.prompt && tip.prompt.trim().length > 0 && !this.data.generating
    });
    this.showToast('已应用灵感提示');
  },

  // 图片加载错误
  onImageError(e: any) {
    console.error('图片加载失败:', e);
    this.showToast('图片加载失败');
  },

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