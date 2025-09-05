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
      
      // 尝试从云数据库加载作品
      const result = await cloudService.getAllArtworks(page, 10);
      
      if (result.success && result.data) {
        const artworks = result.data;
        this.setData({
          artworks: refresh ? artworks : [...this.data.artworks, ...artworks],
          currentPage: page,
          hasMore: result.count === 10, // 如果返回10条，可能还有更多
          loading: false,
          refreshing: false
        });
      } else {
        // 如果云开发失败，使用模拟数据作为备选
        console.warn('云开发获取作品失败，使用模拟数据:', result.error);
        const artworks = await this.fetchArtworks(page);
        this.setData({
          artworks: refresh ? artworks : [...this.data.artworks, ...artworks],
          currentPage: page,
          hasMore: artworks.length >= 10,
          loading: false,
          refreshing: false
        });
      }

      if (refresh) {
        wx.stopPullDownRefresh();
      }
    } catch (error) {
      console.error('加载作品失败:', error);
      // 使用模拟数据作为备选
      try {
        const page = refresh ? 1 : this.data.currentPage;
        const artworks = await this.fetchArtworks(page);
        this.setData({
          artworks: refresh ? artworks : [...this.data.artworks, ...artworks],
          currentPage: page,
          hasMore: artworks.length >= 10,
          loading: false,
          refreshing: false
        });
        
        if (refresh) {
          wx.stopPullDownRefresh();
        }
      } catch (fallbackError) {
        console.error('备选方案也失败:', fallbackError);
        this.setData({
          loading: false,
          refreshing: false
        });
        this.showToast('加载失败，请重试');
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

  // 模拟API请求
  async fetchArtworks(page: number): Promise<Artwork[]> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟数据
    const mockArtworks: Artwork[] = [
      {
        id: `artwork_${page}_1`,
        title: '梦幻森林',
        description: '一只可爱的小猫在梦幻森林中玩耍',
        imageUrl: 'https://picsum.photos/400/400?random=1',
        prompt: '一只可爱的小猫在梦幻森林中玩耍，日系动漫风格',
        author: {
          id: 'user_1',
          nickname: '用户A',
          avatar: 'https://picsum.photos/100/100?random=11',
          createTime: '2024-01-01'
        },
        createTime: '2小时前',
        likeCount: 128,
        isLiked: false
      },
      {
        id: `artwork_${page}_2`,
        title: '未来城市',
        description: '赛博朋克风格的未来都市夜景',
        imageUrl: 'https://picsum.photos/400/400?random=2',
        prompt: '未来城市的夜景，霓虹灯闪烁，赛博朋克风格，电影质感',
        author: {
          id: 'user_2',
          nickname: '用户B',
          avatar: 'https://picsum.photos/100/100?random=12',
          createTime: '2024-01-01'
        },
        createTime: '5小时前',
        likeCount: 256,
        isLiked: true
      },
      {
        id: `artwork_${page}_3`,
        title: '动漫少女',
        description: '日系动漫风格的可爱少女',
        imageUrl: 'https://picsum.photos/400/400?random=3',
        prompt: '日系动漫风格的可爱少女，校园背景，清新画风',
        author: {
          id: 'user_3',
          nickname: '用户C',
          avatar: 'https://picsum.photos/100/100?random=13',
          createTime: '2024-01-01'
        },
        createTime: '1天前',
        likeCount: 89,
        isLiked: false
      },
      {
        id: `artwork_${page}_4`,
        title: '科幻机甲',
        description: '未来科幻风格的巨型机甲',
        imageUrl: 'https://picsum.photos/400/400?random=4',
        prompt: '未来科幻风格的巨型机甲，金属质感，战斗场景',
        author: {
          id: 'user_4',
          nickname: '用户D',
          avatar: 'https://picsum.photos/100/100?random=14',
          createTime: '2024-01-01'
        },
        createTime: '2天前',
        likeCount: 312,
        isLiked: false
      }
    ];

    // 模拟分页，只返回前几页的数据
    if (page > 3) {
      return [];
    }

    return mockArtworks;
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