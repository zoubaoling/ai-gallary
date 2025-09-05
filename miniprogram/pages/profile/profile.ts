// 我的页面
import { ProfilePageData, UserInfo, Artwork } from '../../types/index';

Page<ProfilePageData, any>({
  data: {
    userInfo: null,
    myArtworks: [],
    loading: false,
    hasMore: true,
    currentPage: 1
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
  onLoginTap() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        // 模拟登录成功
        const userInfo: UserInfo = {
          id: 'user_' + Date.now(),
          nickname: res.userInfo.nickName,
          avatar: res.userInfo.avatarUrl,
          createTime: new Date().toISOString()
        };

        // 保存用户信息
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({
          userInfo
        });

        this.showToast('登录成功');
        this.loadMyArtworks();
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        this.showToast('登录失败，请重试');
      }
    });
  },

  // 加载我的作品
  async loadMyArtworks() {
    if (this.data.loading || !this.data.userInfo) return;

    this.setData({
      loading: true
    });

    try {
      const artworks = await this.fetchMyArtworks();
      this.setData({
        myArtworks: artworks,
        loading: false
      });
    } catch (error) {
      console.error('加载作品失败:', error);
      this.setData({
        loading: false
      });
      this.showToast('加载失败，请重试');
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
