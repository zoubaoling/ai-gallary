// app.ts
import { IAppOption, GlobalData, UserInfo } from './types/index';

App<IAppOption>({
  globalData: {
    userInfo: null,
    isLoggedIn: false
  } as GlobalData,

  onLaunch() {
    // 初始化应用
    this.initApp();
  },

  onShow() {
    // 应用显示时检查登录状态
    this.checkLoginStatus();
  },

  onHide() {
    // 应用隐藏时的处理
  },

  // 初始化应用
  initApp() {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 初始化其他配置
    this.initConfig();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo') as UserInfo | null;
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = !!userInfo;
  },

  // 初始化配置
  initConfig() {
    // 设置全局配置
    wx.setStorageSync('appVersion', '1.0.0');
    wx.setStorageSync('lastLaunchTime', Date.now());
  },

  // 设置用户信息
  setUserInfo(userInfo: UserInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    wx.setStorageSync('userInfo', userInfo);
  },

  // 清除用户信息
  clearUserInfo() {
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    wx.removeStorageSync('userInfo');
  }
})