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

  async onShow() {
    // 页面显示时检查登录状态和刷新数据
    await this.checkLoginStatus();
    // 如果用户已登录，刷新数据
    if (this.data.userInfo) {
      this.loadMyArtworks();
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo') as UserInfo | null;
    
    if (userInfo && userInfo.avatarFileID) {
      // 使用公共函数获取头像临时URL
      userInfo.avatar = await cloudService.getTempFileURL(userInfo.avatarFileID, userInfo.avatar);
    }
    
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

    await this.fetchArtworks(1, true);
  },


  // 点击画廊作品
  onGalleryItemTap(e: any) {
    const artwork = e.currentTarget.dataset.artwork as Artwork;
    
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
    const nextPage = this.data.currentPage + 1;
    await this.fetchArtworks(nextPage, false);
  },

  // 获取作品数据的公共方法
  async fetchArtworks(page: number, isRefresh: boolean = false) {
    try {
      // 调用云函数获取用户发布的图片
      const result = await wx.cloud.callFunction({
        name: 'getUserImages',
        data: {
          page: page,
          pageSize: 6
        }
      });

      if (result.result && (result.result as any).success && (result.result as any).data) {
        const { images, hasMore } = (result.result as any).data;
        
        // 转换数据格式
        const artworks = await this.transformImagesToArtworks(images);

        this.setData({
          myArtworks: isRefresh ? artworks : [...this.data.myArtworks, ...artworks],
          currentPage: page,
          hasMore: hasMore,
          loading: false
        });
      } else {
        // 云函数获取作品失败
        console.error('云函数获取作品失败:', (result.result as any)?.error);
        this.handleFetchError(isRefresh);
      }
    } catch (error) {
      console.error('加载作品失败:', error);
      this.handleFetchError(isRefresh);
    }
  },

  // 转换图片数据为作品格式
  async transformImagesToArtworks(images: any[]): Promise<Artwork[]> {
    return await Promise.all(images.map(async (image: any) => {
      // 使用公共函数获取图片临时URL
      const imageUrl = await cloudService.getTempFileURL(image.fileID, image.imageUrl);
      
      return {
        id: image._id,
        title: image.prompt.substring(0, 20) + (image.prompt.length > 20 ? '...' : ''),
        description: image.prompt,
        imageUrl: imageUrl,
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
        style: image.style,
        author: image.author,
        createTime: this.formatTime(image.createTime),
        likeCount: image.likeCount,
        isLiked: image.isLiked
      };
    }));
  },

  // 处理获取数据失败的情况
  handleFetchError(isRefresh: boolean) {
    this.setData({
      loading: false,
      hasMore: isRefresh ? true : false
    });
    this.showToast(isRefresh ? '加载作品失败，请重试' : '加载更多作品失败');
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
      
      this.showToast('正在上传头像...');
      
      // 上传头像到云存储
      const uploadResult = await this.uploadAvatarToCloud(avatarUrl);
      
      if (uploadResult.success && uploadResult.cloudUrl) {
        // 更新用户头像信息
        const result = await cloudService.updateUserProfile(
          this.data.userInfo?.nickname || '微信用户',
          uploadResult.cloudUrl,
          uploadResult.fileID // 传递fileID
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
  async uploadAvatarToCloud(localPath: string): Promise<{success: boolean, cloudUrl?: string, fileID?: string, error?: string}> {
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
          cloudUrl: result.data.tempUrl,
          fileID: result.data.fileID
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

  // 昵称输入变化（双向绑定自动处理，此方法保留用于其他逻辑）
  onNicknameChange() {
    // 双向绑定自动处理数据更新，这里可以添加其他逻辑
  },

  // 昵称输入框聚焦
  onNicknameFocus() {
    // 可以在这里添加一些聚焦时的逻辑
  },

  // 昵称输入框失焦
  onNicknameBlur() {
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
          userInfo: result.userInfo
        });
        this.closeNicknameDialog();
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
    this.closeNicknameDialog();
  },

  // 弹框关闭事件
  onNicknameDialogClose() {
    this.closeNicknameDialog();
  },

  // 关闭昵称弹框的公共方法
  closeNicknameDialog() {
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
