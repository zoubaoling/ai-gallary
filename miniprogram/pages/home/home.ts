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
    if (this.data.artworks.length > 0) {
      this.refreshData();
    }
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
    console.log('点击作品:', artwork);
    
    // 跳转到作品详情页（如果有的话）
    // wx.navigateTo({
    //   url: `/pages/detail/detail?id=${artwork.id}`
    // });
  },

  // 点击创建按钮
  onCreateTap() {
    console.log('悬浮按钮被点击了');
    try {
      wx.navigateTo({
        url: '/pages/create/create',
        success: () => {
          console.log('页面跳转成功');
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
    console.error('头像加载失败:', e);
    // 头像加载失败时，t-avatar组件会自动使用默认图片
    // 默认图片路径已在WXML中设置：/assets/icons/user-avatar.png
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