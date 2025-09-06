// 首页
import { HomePageData, Artwork } from '../../types/index';
import { cloudService } from '../../utils/cloudService';

Page<HomePageData, any>({
  data: {
    artworks: [],
    loading: false,
    hasMore: true,
    currentPage: 1,
    refreshing: false
  },

  onLoad() {
    this.loadArtworks();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreArtworks();
    }
  },

  // 滚动到底部加载更多
  onLoadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreArtworks();
    }
  },

  // 加载作品列表
  async loadArtworks(refresh = false) {
    if (this.data.loading) return;

    this.setData({
      loading: true,
      refreshing: refresh
    });

    try {
      const page = refresh ? 1 : this.data.currentPage;
      
      // 调用云函数获取所有用户的作品
      const result = await wx.cloud.callFunction({
        name: 'getAllImages',
        data: {
          page: page,
          pageSize: 10
        }
      });
      
      if (result.result && (result.result as any).success && (result.result as any).data) {
        const { images, hasMore } = (result.result as any).data;
        
        // 转换数据格式以匹配现有的 Artwork 类型，并动态获取临时URL
        const artworks = await Promise.all(images.map(async (image: any) => {
          let imageUrl = image.imageUrl;
          
          // 优先使用fileID获取临时URL
          if (image.fileID) {
            try {
              const tempFileResult = await wx.cloud.getTempFileURL({
                fileList: [image.fileID]
              });
              if (tempFileResult.fileList && tempFileResult.fileList[0] && tempFileResult.fileList[0].tempFileURL) {
                imageUrl = tempFileResult.fileList[0].tempFileURL;
              }
            } catch (error) {
              console.error('使用fileID获取临时URL失败:', error);
            }
          }
          
          // 如果没有fileID或获取失败，保持原始URL
          if (!imageUrl || imageUrl === image.imageUrl) {
            console.warn('没有有效的fileID，使用原始图片URL:', image.imageUrl);
          }
          
          // 处理用户头像的临时URL
          let authorAvatar = image.author.avatar;
          if (image.author.avatarFileID) {
            try {
              const avatarTempResult = await wx.cloud.getTempFileURL({
                fileList: [image.author.avatarFileID]
              });
              if (avatarTempResult.fileList && avatarTempResult.fileList[0] && avatarTempResult.fileList[0].tempFileURL) {
                authorAvatar = avatarTempResult.fileList[0].tempFileURL;
              }
            } catch (error) {
              console.error('使用avatarFileID获取临时URL失败:', error);
            }
          }
          
          return {
            id: image._id,
            title: image.prompt.substring(0, 20) + (image.prompt.length > 20 ? '...' : ''),
            description: image.prompt,
            imageUrl: imageUrl,
            prompt: image.prompt,
            negativePrompt: image.negativePrompt,
            style: image.style,
            author: {
              ...image.author,
              avatar: authorAvatar
            },
            createTime: this.formatTime(image.createTime),
            likeCount: image.likeCount,
            isLiked: image.isLiked
          };
        }));
        
        this.setData({
          artworks: refresh ? artworks : [...this.data.artworks, ...artworks],
          currentPage: page,
          hasMore: hasMore,
          loading: false,
          refreshing: false
        });
      } else {
        // 云函数获取作品失败
        console.error('云函数获取作品失败:', (result.result as any)?.error);
        this.setData({
          loading: false,
          refreshing: false
        });
        this.showToast('加载作品失败，请重试');
      }

      if (refresh) {
        wx.stopPullDownRefresh();
      }
    } catch (error) {
      console.error('加载作品失败:', error);
      this.setData({
        loading: false,
        refreshing: false
      });
      this.showToast('加载失败，请重试');

      if (refresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  // 刷新数据
  refreshData() {
    this.loadArtworks(true);
  },

  // 加载更多
  loadMoreArtworks() {
    this.setData({
      currentPage: this.data.currentPage + 1
    });
    this.loadArtworks();
  },


  // 点击作品
  onArtworkTap(e: any) {
    const artwork = e.currentTarget.dataset.artwork as Artwork;
    
    // 跳转到作品详情页（如果有的话）
    // wx.navigateTo({
    //   url: `/pages/detail/detail?id=${artwork.id}`
    // });
  },

  // 点击创建按钮
  onCreateTap() {
    try {
      wx.navigateTo({
        url: '/pages/create/create',
        success: () => {
        },
        fail: (error) => {
          console.error('页面跳转失败:', error);
          this.showToast('页面跳转失败，请重试');
        }
      });
    } catch (error) {
      console.error('跳转异常:', error);
      this.showToast('跳转异常，请重试');
    }
  },

  // 图片加载错误
  onImageError(e: any) {
    console.error('图片加载失败:', e);
  },

  // 头像加载错误
  onAvatarError(e: any) {
    const index = e.currentTarget.dataset.index;
    if (index !== undefined) {
      this.setData({
        [`artworks[${index}].avatarLoadFailed`]: true
      });
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
        theme: 'error'
      });
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'AI画廊 - 用文字创造艺术',
      path: '/pages/home/home'
    };
  }
});