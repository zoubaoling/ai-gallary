// 发布图片到画廊云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { imageUrl, prompt, negativePrompt, style, fileID } = event;
  
  try {
    // 1. 获取用户信息
    const { OPENID } = cloud.getWXContext();
    
    if (!OPENID) {
      return {
        success: false,
        error: '获取用户信息失败'
      };
    }

    // 2. 验证必要参数
    if (!imageUrl || !prompt) {
      return {
        success: false,
        error: '缺少必要参数'
      };
    }

    // 3. 验证fileID
    let finalFileID = fileID;
    if (!finalFileID) {
      console.warn('未提供fileID，无法构造正确的fileID，请确保传递正确的fileID');
      // 不再尝试构造fileID，因为格式复杂且容易出错
    } else {
      console.log('使用提供的fileID:', finalFileID);
    }

    // 3. 查询用户信息
    const userResult = await db.collection('users').where({
      openid: OPENID
    }).get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }

    const userInfo = userResult.data[0];
    
    console.log('用户信息:', {
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
      avatarFileID: userInfo.avatarFileID
    });

    // 4. 从临时URL中提取云存储路径（作为备用）
    let cloudPath = imageUrl;
    if (imageUrl && imageUrl.includes('tcb.qcloud.la')) {
      // 从临时URL中提取云存储路径
      const urlParts = imageUrl.split('?')[0]; // 移除查询参数
      const pathParts = urlParts.split('/');
      const imagesIndex = pathParts.indexOf('images');
      if (imagesIndex !== -1) {
        cloudPath = pathParts.slice(imagesIndex).join('/');
      }
    }

    // 5. 构建图片数据
    const imageData = {
      imageUrl: imageUrl, // 保留原始URL作为备份
      fileID: finalFileID, // 优先存储fileID
      cloudPath: cloudPath, // 存储云存储路径作为备用
      prompt: prompt,
      negativePrompt: negativePrompt || '',
      style: style || '',
      author: {
        id: userInfo.id,
        openid: userInfo.openid,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
        avatarFileID: userInfo.avatarFileID, // 保存用户头像的fileID
        createTime: userInfo.createTime
      },
      likeCount: 0,
      isLiked: false,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      status: 'published' // 发布状态
    };

    // 5. 保存到数据库
    const result = await db.collection('artworks').add({
      data: imageData
    });

    return {
      success: true,
      data: {
        _id: result._id,
        ...imageData
      }
    };

  } catch (error) {
    console.error('发布图片失败:', error);
    return {
      success: false,
      error: '发布失败，请重试'
    };
  }
};
