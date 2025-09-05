// 发布图片到画廊云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { imageUrl, prompt, negativePrompt, style } = event;
  
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

    // 4. 构建图片数据
    const imageData = {
      imageUrl: imageUrl,
      prompt: prompt,
      negativePrompt: negativePrompt || '',
      style: style || '',
      author: {
        id: userInfo.id,
        openid: userInfo.openid,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
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
