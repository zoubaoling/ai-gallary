// 更新用户信息云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { userInfo, openid } = event;
  
  try {
    // 获取当前用户的openid
    const { OPENID } = cloud.getWXContext();
    const targetOpenid = openid || OPENID;
    
    if (!targetOpenid) {
      return {
        success: false,
        error: '获取用户openid失败'
      };
    }

    // 查询用户是否存在
    const userResult = await db.collection('users').where({
      openid: targetOpenid
    }).get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }

    const existingUser = userResult.data[0];

    // 更新用户信息
    const updateData = {
      nickname: userInfo.nickName || existingUser.nickname,
      avatar: userInfo.avatarUrl || existingUser.avatar,
      updateTime: new Date().toISOString(),
      lastLoginTime: new Date().toISOString(),
      isActive: true
    };

    const updateResult = await db.collection('users').doc(existingUser._id).update({
      data: updateData
    });

    // 返回更新后的用户信息
    const updatedUserInfo = {
      ...existingUser,
      ...updateData
    };

    return {
      success: true,
      userInfo: updatedUserInfo
    };

  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      error: '更新用户信息失败，请重试'
    };
  }
};
