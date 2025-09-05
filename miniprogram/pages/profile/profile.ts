// 我的页面
import { ProfilePageData, UserInfo, Artwork } from '../../types/index';
import { cloudService } from '../../utils/cloudService';

Page<ProfilePageData, any>({
  data: {
    userInfo: null,
    myArtworks: [],
    loading: false,
    hasMore: true,
    currentPage: 1,
    showNicknameDialog: false,
    tempNickname: ''
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    // 页面显示时检查登录状态和刷新数据
    this.checkLoginStatus();
    if (this.data.userInfo) {
      this.loadMyArtworks();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo') as UserInfo | null;
    this.setData({
      userInfo
    });
  },

  // 微信登录
  async onLoginTap() {
    try {
      this.showToast('正在登录...');
      
      // 使用云开发进行登录
      const result = await cloudService.getUserProfile();
      
      if (result.success && result.userInfo) {
        // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', result.userInfo);
        
        // 更新全局用户信息
        const app = getApp();
        app.setUserInfo(result.userInfo);
        
        this.setData({
          userInfo: result.userInfo
        });

        const message = result.isNewUser ? '注册成功！' : '登录成功！';
        this.showToast(message);
        
        // 加载用户作品
        this.loadMyArtworks();
      } else {
        this.showToast(result.error || '登录失败，请重试');
      }
    } catch (error) {
      console.error('登录异常:', error);
      this.showToast('登录异常，请重试');
    }
  },

  // 加载我的作品
  async loadMyArtworks() {
    if (this.data.loading || !this.data.userInfo) return;

    this.setData({
      loading: true,
      currentPage: 1,
      hasMore: true
    });

    try {
      // 调用云函数获取用户发布的图片
      const result = await wx.cloud.callFunction({
        name: 'getUserImages',
        data: {
          page: 1,
          pageSize: 6
        }
      });

      if (result.result && (result.result as any).success && (result.result as any).data) {
        const { images, hasMore } = (result.result as any).data;
        
        // 转换数据格式以匹配现有的 Artwork 类型
        const artworks = images.map((image: any) => ({
          id: image._id,
          title: image.prompt.substring(0, 20) + (image.prompt.length > 20 ? '...' : ''),
          description: image.prompt,
          imageUrl: image.imageUrl,
          prompt: image.prompt,
          negativePrompt: image.negativePrompt,
          style: image.style,
          author: image.author,
          createTime: this.formatTime(image.createTime),
          likeCount: image.likeCount,
          isLiked: image.isLiked
        }));

        this.setData({
          myArtworks: artworks,
          loading: false,
          hasMore: hasMore
        });
      } else {
        // 如果云函数失败，使用模拟数据作为备选
        console.warn('云函数获取作品失败，使用模拟数据:', (result.result as any)?.error);
        const artworks = await this.fetchMyArtworks();
        this.setData({
          myArtworks: artworks,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载作品失败:', error);
      // 使用模拟数据作为备选
      try {
        const artworks = await this.fetchMyArtworks();
        this.setData({
          myArtworks: artworks,
          loading: false
        });
      } catch (fallbackError) {
        console.error('备选方案也失败:', fallbackError);
        this.setData({
          loading: false
        });
        this.showToast('加载失败，请重试');
      }
    }
  },

  // 模拟获取我的作品
  async fetchMyArtworks(): Promise<Artwork[]> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟数据
    const mockArtworks: Artwork[] = [
      {
        id: 'my_artwork_1',
        title: '梦幻森林',
        description: '一只可爱的小猫在梦幻森林中玩耍',
        imageUrl: 'https://picsum.photos/400/400?random=21',
        prompt: '一只可爱的小猫在梦幻森林中玩耍，日系动漫风格',
        author: this.data.userInfo!,
        createTime: '2小时前',
        likeCount: 128,
        isLiked: false
      },
      {
        id: 'my_artwork_2',
        title: '科幻机甲',
        description: '未来科幻风格的巨型机甲',
        imageUrl: 'https://picsum.photos/400/400?random=22',
        prompt: '未来科幻风格的巨型机甲，金属质感，战斗场景',
        author: this.data.userInfo!,
        createTime: '1天前',
        likeCount: 89,
        isLiked: false
      },
      {
        id: 'my_artwork_3',
        title: '动漫少女',
        description: '日系动漫风格的可爱少女',
        imageUrl: 'https://picsum.photos/400/400?random=23',
        prompt: '日系动漫风格的可爱少女，校园背景，清新画风',
        author: this.data.userInfo!,
        createTime: '3天前',
        likeCount: 256,
        isLiked: false
      },
      {
        id: 'my_artwork_4',
        title: '未来城市',
        description: '赛博朋克风格的未来都市夜景',
        imageUrl: 'https://picsum.photos/400/400?random=24',
        prompt: '未来城市的夜景，霓虹灯闪烁，赛博朋克风格，电影质感',
        author: this.data.userInfo!,
        createTime: '1周前',
        likeCount: 312,
        isLiked: false
      },
      {
        id: 'my_artwork_5',
        title: '抽象艺术',
        description: '现代抽象艺术风格作品',
        imageUrl: 'https://picsum.photos/400/400?random=25',
        prompt: '现代抽象艺术风格，色彩丰富，几何图形',
        author: this.data.userInfo!,
        createTime: '2周前',
        likeCount: 156,
        isLiked: false
      },
      {
        id: 'my_artwork_6',
        title: '风景画',
        description: '美丽的自然风景',
        imageUrl: 'https://picsum.photos/400/400?random=26',
        prompt: '美丽的自然风景，山水画风格，宁静致远',
        author: this.data.userInfo!,
        createTime: '3周前',
        likeCount: 98,
        isLiked: false
      }
    ];

    return mockArtworks;
  },

  // 点击画廊作品
  onGalleryItemTap(e: any) {
    const artwork = e.currentTarget.dataset.artwork as Artwork;
    console.log('点击作品:', artwork);
    
    // 跳转到作品详情页（如果有的话）
    // wx.navigateTo({
    //   url: `/pages/detail/detail?id=${artwork.id}`
    // });
  },

  // 点击创建按钮
  onCreateTap() {
    wx.navigateTo({
      url: '/pages/create/create'
    });
  },

  // 滚动加载更多
  onLoadMore() {
    if (this.data.loading || !this.data.hasMore) {
      return;
    }
    this.loadMoreArtworks();
  },

  // 加载更多作品
  async loadMoreArtworks() {
    if (this.data.loading || !this.data.hasMore) {
      return;
    }

    this.setData({ loading: true });

    try {
      const nextPage = this.data.currentPage + 1;
      
      // 调用云函数获取更多用户发布的图片
      const result = await wx.cloud.callFunction({
        name: 'getUserImages',
        data: {
          page: nextPage,
          pageSize: 6
        }
      });

      if (result.result && (result.result as any).success && (result.result as any).data) {
        const { images, hasMore } = (result.result as any).data;
        
        // 转换数据格式以匹配现有的 Artwork 类型
        const newArtworks = images.map((image: any) => ({
          id: image._id,
          title: image.prompt.substring(0, 20) + (image.prompt.length > 20 ? '...' : ''),
          description: image.prompt,
          imageUrl: image.imageUrl,
          prompt: image.prompt,
          negativePrompt: image.negativePrompt,
          style: image.style,
          author: image.author,
          createTime: this.formatTime(image.createTime),
          likeCount: image.likeCount,
          isLiked: image.isLiked
        }));

        this.setData({
          myArtworks: [...this.data.myArtworks, ...newArtworks],
          currentPage: nextPage,
          hasMore: hasMore,
          loading: false
        });
      } else {
        // 如果云函数失败，使用模拟数据
        const mockArtworks = this.getMockArtworks();
        const startIndex = (nextPage - 1) * 6;
        const endIndex = startIndex + 6;
        const newArtworks = mockArtworks.slice(startIndex, endIndex);

        if (newArtworks.length === 0) {
          this.setData({ 
            hasMore: false,
            loading: false 
          });
          return;
        }

        this.setData({
          myArtworks: [...this.data.myArtworks, ...newArtworks],
          currentPage: nextPage,
          loading: false
        });
      }

    } catch (error) {
      console.error('加载更多作品失败:', error);
      this.setData({ loading: false });
      this.showToast('加载失败，请重试');
    }
  },

  // 图片加载错误
  onImageError(e: any) {
    console.error('图片加载失败:', e);
  },

  // 头像加载错误
  onAvatarError(e: any) {
    console.error('头像加载失败:', e);
    // 头像加载失败时，t-avatar组件会自动使用默认图片
    // 默认图片路径已在WXML中设置：/assets/icons/user-avatar.png
  },

  // 选择头像
  async onChooseAvatar(e: any) {
    try {
      const { avatarUrl } = e.detail;
      console.log('选择头像:', avatarUrl);
      
      this.showToast('正在上传头像...');
      
      // 上传头像到云存储
      const uploadResult = await this.uploadAvatarToCloud(avatarUrl);
      
      if (uploadResult.success && uploadResult.cloudUrl) {
        // 更新用户头像信息
        const result = await cloudService.updateUserProfile(
          this.data.userInfo?.nickname || '微信用户',
          uploadResult.cloudUrl
        );
        
        if (result.success && result.userInfo) {
          this.setData({
            userInfo: result.userInfo
          });
          this.showToast('头像更新成功');
        } else {
          this.showToast(result.error || '头像更新失败');
        }
      } else {
        this.showToast(uploadResult.error || '头像上传失败');
      }
    } catch (error) {
      console.error('选择头像失败:', error);
      this.showToast('头像更新失败，请重试');
    }
  },

  // 上传头像到云存储
  async uploadAvatarToCloud(localPath: string): Promise<{success: boolean, cloudUrl?: string, error?: string}> {
    try {
      if (!this.data.userInfo?.id) {
        return {
          success: false,
          error: '用户信息不完整'
        };
      }

      // 使用cloudService上传头像
      const result = await cloudService.uploadAvatar(localPath, this.data.userInfo.id);
      
      if (result.success && result.data) {
        return {
          success: true,
          cloudUrl: result.data.tempUrl
        };
      } else {
        return {
          success: false,
          error: result.error || '头像上传失败'
        };
      }
    } catch (error) {
      console.error('上传头像到云存储失败:', error);
      return {
        success: false,
        error: '头像上传异常，请重试'
      };
    }
  },

  // 打开昵称编辑弹框
  onEditNicknameTap() {
    this.setData({
      showNicknameDialog: true,
      tempNickname: this.data.userInfo?.nickname || ''
    });
  },

  // 昵称输入变化
  onNicknameChange(e: any) {
    const nickname = e.detail.value;
    this.setData({
      tempNickname: nickname
    });
  },

  // 昵称输入框聚焦
  onNicknameFocus() {
    // 可以在这里添加一些聚焦时的逻辑
    console.log('昵称输入框获得焦点');
  },

  // 昵称输入框失焦
  onNicknameBlur() {
    console.log('昵称输入框失去焦点');
  },

  // 确认修改昵称
  async onConfirmNicknameTap() {
    const nickname = this.data.tempNickname.trim();
    
    if (!nickname) {
      this.showToast('昵称不能为空');
      return;
    }

    if (nickname === this.data.userInfo?.nickname) {
      // 昵称没有变化，直接关闭弹框
      this.setData({
        showNicknameDialog: false,
        tempNickname: ''
      });
      return;
    }

    try {
      this.showToast('正在保存...');
      
      // 更新用户昵称
      const result = await cloudService.updateUserProfile(
        nickname,
        this.data.userInfo?.avatar || ''
      );
      
      if (result.success && result.userInfo) {
        this.setData({
          userInfo: result.userInfo,
          showNicknameDialog: false,
          tempNickname: ''
        });
        this.showToast('昵称更新成功');
      } else {
        this.showToast(result.error || '昵称更新失败');
      }
    } catch (error) {
      console.error('更新昵称失败:', error);
      this.showToast('昵称更新失败，请重试');
    }
  },

  // 取消修改昵称
  onCancelNicknameTap() {
    this.setData({
      showNicknameDialog: false,
      tempNickname: ''
    });
  },

  // 弹框关闭事件
  onNicknameDialogClose() {
    this.setData({
      showNicknameDialog: false,
      tempNickname: ''
    });
  },

  // 点击菜单项
  onMenuTap(e: any) {
    const type = e.currentTarget.dataset.type;
    
    switch (type) {
      case 'favorites':
        this.showToast('我的收藏功能开发中...');
        break;
      case 'history':
        this.showToast('创作历史功能开发中...');
        break;
      case 'settings':
        this.showToast('设置功能开发中...');
        break;
      default:
        break;
    }
  },

  // 格式化时间
  formatTime(timeString: string): string {
    const now = new Date();
    const time = new Date(timeString);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return time.toLocaleDateString();
    }
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
      path: '/pages/profile/profile'
    };
  }
});
