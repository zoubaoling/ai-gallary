// 创建图片页面
import { CreatePageData, CreateImageRequest, CreateImageResponse, ArtStyle, InspirationTip } from '../../types/index';
import { cloudService } from '../../utils/cloudService';

Page<CreatePageData, any>({
  data: {
    prompt: '',
    negativePrompt: '',
    selectedStyle: '',
    generatedImage: null,
    generating: false,
    publishing: false,
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
    this.setData({
      prompt: e.detail.value
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
      this.setData({
        prompt: currentPrompt + '，' + style + '风格'
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
      generating: true,
      generatedImage: null
    });

    try {
      const request: CreateImageRequest = {
        prompt: this.data.prompt,
        negativePrompt: this.data.negativePrompt,
        style: this.data.selectedStyle
      };

      const response = await this.generateImage(request);
      
      if (response.success && response.imageUrl) {
        this.setData({
          generatedImage: response.imageUrl,
          generating: false
        });
        this.showToast('图片生成成功！');
      } else {
        throw new Error(response.error || '生成失败');
      }
    } catch (error) {
      console.error('生成图片失败:', error);
      this.setData({
        generating: false
      });
      this.showToast('生成失败，请重试');
    }
  },

  // 模拟AI图片生成
  async generateImage(request: CreateImageRequest): Promise<CreateImageResponse> {
    console.log('开始生成图片，请求参数:', request);
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 模拟生成成功
    const randomId = Math.floor(Math.random() * 1000);
    return {
      success: true,
      imageUrl: `https://picsum.photos/512/512?random=${randomId}`
    };
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
      // 获取当前用户信息
      const app = getApp();
      const userInfo = app.globalData.userInfo;
      
      if (!userInfo) {
        throw new Error('用户未登录');
      }

      // 构建作品数据
      const artwork = {
        title: this.data.prompt.substring(0, 20) + (this.data.prompt.length > 20 ? '...' : ''),
        description: this.data.prompt,
        imageUrl: this.data.generatedImage,
        prompt: this.data.prompt,
        negativePrompt: this.data.negativePrompt,
        style: this.data.selectedStyle,
        author: {
          id: userInfo.id,
          openid: userInfo.openid,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
          createTime: userInfo.createTime
        },
        likeCount: 0,
        isLiked: false
      };

      // 保存到云数据库
      const result = await cloudService.saveArtwork(artwork);
      
      if (!result.success) {
        throw new Error(result.error || '保存作品失败');
      }

      console.log('作品发布成功:', result.data);
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
