// 云开发服务工具类
import { UserInfo, CloudLoginResponse, CloudDBResult } from '../types/index';

export class CloudService {
  private static instance: CloudService;
  private db: any;

  private constructor() {
    this.db = wx.cloud.database();
  }

  public static getInstance(): CloudService {
    if (!CloudService.instance) {
      CloudService.instance = new CloudService();
    }
    return CloudService.instance;
  }

  // 微信登录
  async wxLogin(): Promise<CloudLoginResponse> {
    try {
      // 1. 获取微信登录凭证
      const loginRes = await wx.login();
      if (!loginRes.code) {
        return {
          success: false,
          error: '获取微信登录凭证失败'
        };
      }

      // 2. 调用云函数进行登录
      const result = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          code: loginRes.code
        }
      });

      const { success, userInfo, isNewUser, error } = result.result as any;
      
      if (success && userInfo) {
        return {
          success: true,
          userInfo,
          isNewUser
        };
      } else {
        return {
          success: false,
          error: error || '登录失败'
        };
      }
    } catch (error) {
      console.error('微信登录失败:', error);
      return {
        success: false,
        error: '登录异常，请重试'
      };
    }
  }

  // 获取用户信息并注册/更新
  async getUserProfile(): Promise<CloudLoginResponse> {
    try {
      // 1. 先进行微信登录
      const loginResult = await this.wxLogin();
      if (!loginResult.success) {
        return loginResult;
      }

      // 2. 由于wx.getUserProfile已废弃，直接使用登录结果
      // 新用户会使用默认昵称，后续可以通过头像昵称填写组件更新
      const result = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userInfo: {
            nickName: loginResult.userInfo?.nickname || '微信用户',
            avatarUrl: loginResult.userInfo?.avatar || ''
          },
          openid: loginResult.userInfo?.openid
        }
      });

      const { success, userInfo, error } = result.result as any;
      
      if (success && userInfo) {
        return {
          success: true,
          userInfo,
          isNewUser: loginResult.isNewUser
        };
      } else {
        return {
          success: false,
          error: error || '更新用户信息失败'
        };
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: '获取用户信息失败，请重试'
      };
    }
  }

  // 更新用户头像昵称（使用新的头像昵称填写组件）
  async updateUserProfile(nickname: string, avatarUrl: string): Promise<CloudLoginResponse> {
    try {
      // 获取当前用户信息
      const currentUser = wx.getStorageSync('userInfo');
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录'
        };
      }

      // 调用云函数更新用户信息
      const result = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userInfo: {
            nickName: nickname,
            avatarUrl: avatarUrl
          },
          openid: currentUser.openid
        }
      });

      const { success, userInfo, error } = result.result as any;
      
      if (success && userInfo) {
        // 更新本地存储
        wx.setStorageSync('userInfo', userInfo);
        
        // 更新全局用户信息
        const app = getApp();
        app.setUserInfo(userInfo);
        
        return {
          success: true,
          userInfo
        };
      } else {
        return {
          success: false,
          error: error || '更新用户信息失败'
        };
      }
    } catch (error) {
      console.error('更新用户头像昵称失败:', error);
      return {
        success: false,
        error: '更新用户头像昵称失败，请重试'
      };
    }
  }

  // 从云数据库获取用户信息
  async getUserInfo(openid: string): Promise<CloudDBResult<UserInfo>> {
    try {
      const result = await this.db.collection('users').where({
        openid: openid
      }).get();

      if (result.data && result.data.length > 0) {
        return {
          success: true,
          data: result.data[0]
        };
      } else {
        return {
          success: false,
          error: '用户不存在'
        };
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: '获取用户信息失败'
      };
    }
  }

  // 更新用户信息
  async updateUserInfo(userInfo: Partial<UserInfo>): Promise<CloudDBResult> {
    try {
      const result = await this.db.collection('users').doc(userInfo._id).update({
        data: {
          ...userInfo,
          updateTime: new Date().toISOString()
        }
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return {
        success: false,
        error: '更新用户信息失败'
      };
    }
  }

  // 获取用户作品列表
  async getUserArtworks(openid: string, page: number = 1, limit: number = 10): Promise<CloudDBResult> {
    try {
      const result = await this.db.collection('artworks')
        .where({
          'author.openid': openid
        })
        .orderBy('createTime', 'desc')
        .skip((page - 1) * limit)
        .limit(limit)
        .get();

      return {
        success: true,
        data: result.data,
        count: result.data.length
      };
    } catch (error) {
      console.error('获取用户作品失败:', error);
      return {
        success: false,
        error: '获取用户作品失败'
      };
    }
  }

  // 保存作品到云数据库
  async saveArtwork(artwork: any): Promise<CloudDBResult> {
    try {
      const result = await this.db.collection('artworks').add({
        data: {
          ...artwork,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        }
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('保存作品失败:', error);
      return {
        success: false,
        error: '保存作品失败'
      };
    }
  }

  // 上传头像到云存储
  async uploadAvatar(localPath: string, userId: string): Promise<CloudDBResult> {
    try {
      // 生成云存储路径：/avatars/用户ID.jpg
      const fileExtension = localPath.split('.').pop() || 'jpg';
      const cloudPath = `avatars/${userId}.${fileExtension}`;
      
      console.log('上传头像到云存储:', {
        localPath,
        cloudPath,
        userId
      });

      // 上传文件到云存储
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: localPath
      });

      console.log('头像上传结果:', uploadResult);

      if (uploadResult.fileID) {
        // 获取文件的临时访问链接
        const tempFileResult = await wx.cloud.getTempFileURL({
          fileList: [uploadResult.fileID]
        });

        if (tempFileResult.fileList && tempFileResult.fileList.length > 0) {
          const tempUrl = tempFileResult.fileList[0].tempFileURL;
          return {
            success: true,
            data: {
              fileID: uploadResult.fileID,
              cloudPath: cloudPath,
              tempUrl: tempUrl
            }
          };
        } else {
          return {
            success: false,
            error: '获取头像访问链接失败'
          };
        }
      } else {
        return {
          success: false,
          error: '头像上传失败'
        };
      }
    } catch (error) {
      console.error('上传头像到云存储失败:', error);
      return {
        success: false,
        error: '头像上传异常，请重试'
      };
    }
  }

  // 删除云存储中的头像
  async deleteAvatar(userId: string): Promise<CloudDBResult> {
    try {
      // 尝试删除不同格式的头像文件
      const extensions = ['jpg', 'jpeg', 'png', 'gif'];
      const deletePromises = extensions.map(ext => {
        const cloudPath = `avatars/${userId}.${ext}`;
        return wx.cloud.deleteFile({
          fileList: [cloudPath]
        }).catch(() => {
          // 文件不存在时忽略错误
          console.log(`头像文件不存在: ${cloudPath}`);
          return { fileList: [] };
        });
      });

      const results = await Promise.all(deletePromises);
      console.log('删除头像结果:', results);

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('删除头像失败:', error);
      return {
        success: false,
        error: '删除头像失败'
      };
    }
  }

  // 获取所有作品列表
  async getAllArtworks(page: number = 1, limit: number = 10): Promise<CloudDBResult> {
    try {
      const result = await this.db.collection('artworks')
        .orderBy('createTime', 'desc')
        .skip((page - 1) * limit)
        .limit(limit)
        .get();

      return {
        success: true,
        data: result.data,
        count: result.data.length
      };
    } catch (error) {
      console.error('获取作品列表失败:', error);
      return {
        success: false,
        error: '获取作品列表失败'
      };
    }
  }

  // 创建AI图片生成任务
  async createImageTask(prompt: string, negativePrompt?: string, size?: string, n?: number, seed?: number): Promise<CloudDBResult> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'qwenImageGeneration',
        data: {
          action: 'create',
          prompt: prompt,
          negativePrompt: negativePrompt || '',
          size: size || '1024*1024',
          n: n || 1,
          seed: seed
        }
      });

      if (typeof result.result === 'object' && (result.result as any).success) {
        return {
          success: true,
          data: (result.result as any).data
        };
      } else {
        return {
          success: false,
          error: (result.result as any)?.error || '创建图片生成任务失败'
        };
      }
    } catch (error) {
      console.error('创建图片生成任务失败:', error);
      return {
        success: false,
        error: '创建图片生成任务失败'
      };
    }
  }

  // 查询AI图片生成任务结果
  async queryImageTaskResult(taskId: string): Promise<CloudDBResult> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'qwenImageGeneration',
        data: {
          action: 'query',
          taskId: taskId
        }
      });

      if (typeof result.result === 'object' && (result.result as any).success) {
        return {
          success: true,
          data: (result.result as any).data
        };
      } else {
        return {
          success: false,
          error: (result.result as any)?.error || '查询图片生成任务失败'
        };
      }
    } catch (error) {
      console.error('查询图片生成任务失败:', error);
      return {
        success: false,
        error: '查询图片生成任务失败'
      };
    }
  }

  // 重新生成图片
  async regenerateImage(taskId: string, seed?: number): Promise<CloudDBResult> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'qwenImageGeneration',
        data: {
          action: 'regenerate',
          taskId: taskId,
          seed: seed
        }
      });

      if (typeof result.result === 'object' && (result.result as any).success) {
        return {
          success: true,
          data: (result.result as any).data
        };
      } else {
        return {
          success: false,
          error: (result.result as any)?.error || '重新生成图片失败'
        };
      }
    } catch (error) {
      console.error('重新生成图片失败:', error);
      return {
        success: false,
        error: '重新生成图片失败'
      };
    }
  }

  // 下载外部图片到云存储
  async downloadImageToCloud(imageUrl: string, fileName?: string): Promise<CloudDBResult> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'downloadImage',
        data: {
          imageUrl: imageUrl,
          fileName: fileName
        }
      });

      if (typeof result.result === 'object' && (result.result as any).success) {
        return {
          success: true,
          data: (result.result as any).data
        };
      } else {
        return {
          success: false,
          error: (result.result as any)?.error || '下载图片到云存储失败'
        };
      }
    } catch (error) {
      console.error('下载图片到云存储失败:', error);
      return {
        success: false,
        error: '下载图片到云存储失败'
      };
    }
  }
}

// 导出单例实例
export const cloudService = CloudService.getInstance();
