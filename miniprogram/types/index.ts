// 用户信息类型
export interface UserInfo {
  _id?: string; // 云数据库文档ID
  openid?: string; // 微信openid
  unionid?: string; // 微信unionid
  id: string; // 用户自定义ID
  nickname: string;
  avatar: string;
  createTime: string;
  updateTime?: string;
  lastLoginTime?: string;
  isActive?: boolean;
}

// AI画作类型
export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  author: UserInfo;
  createTime: string;
  likeCount: number;
  isLiked: boolean;
}

// 创建图片请求类型
export interface CreateImageRequest {
  prompt: string;
  negativePrompt?: string;
  style?: string;
}

// 创建图片响应类型
export interface CreateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// 页面数据接口
export interface PageData {
  artworks: Artwork[];
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
}

// 首页数据
export interface HomePageData extends PageData {
  refreshing: boolean;
}

// 我的页面数据
export interface ProfilePageData {
  userInfo: UserInfo | null;
  myArtworks: Artwork[];
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
}

// 创建页面数据
export interface CreatePageData {
  prompt: string;
  negativePrompt: string;
  selectedStyle: string;
  generatedImage: string | null;
  generating: boolean;
  publishing: boolean;
  artStyles: ArtStyle[];
  inspirationTips: InspirationTip[];
}

// 全局数据类型
export interface GlobalData {
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
}

// 应用选项类型
export interface IAppOption {
  globalData: GlobalData;
  onLaunch(): void;
  onShow(): void;
  onHide(): void;
  initApp(): void;
  initCloud(): void;
  checkLoginStatus(): void;
  initConfig(): void;
  setUserInfo(userInfo: UserInfo): void;
  clearUserInfo(): void;
}

// 页面选项类型
export interface IPageOption {
  data: any;
  onLoad(options?: any): void;
  onShow(): void;
  onHide(): void;
  onUnload(): void;
  onPullDownRefresh(): void;
  onReachBottom(): void;
  onShareAppMessage(): any;
}

// 常用风格类型
export const ART_STYLES = [
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
] as const;

export type ArtStyle = typeof ART_STYLES[number];

// 灵感提示类型
export interface InspirationTip {
  id: string;
  title: string;
  prompt: string;
  example: string;
}

// 云开发登录响应类型
export interface CloudLoginResponse {
  success: boolean;
  userInfo?: UserInfo;
  error?: string;
  isNewUser?: boolean;
}

// 云数据库操作结果类型
export interface CloudDBResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}
