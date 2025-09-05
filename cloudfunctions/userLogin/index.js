// 用户登录云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { code } = event;
  
  try {
    // 1. 通过code获取openid
    const { OPENID } = cloud.getWXContext();
    
    if (!OPENID) {
      return {
        success: false,
        error: '获取用户openid失败'
      };
    }

    // 2. 查询用户是否已存在
    const userResult = await db.collection('users').where({
      openid: OPENID
    }).get();

    let userInfo;
    let isNewUser = false;

    if (userResult.data.length > 0) {
      // 用户已存在，更新最后登录时间
      userInfo = userResult.data[0];
      await db.collection('users').doc(userInfo._id).update({
        data: {
          lastLoginTime: new Date().toISOString(),
          isActive: true
        }
      });
      userInfo.lastLoginTime = new Date().toISOString();
      userInfo.isActive = true;
    } else {
      // 新用户，创建用户记录
      isNewUser = true;
      const newUser = {
        openid: OPENID,
        id: 'user_' + Date.now(),
        nickname: '微信用户',
        avatar: '',
        createTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString(),
        isActive: true
      };

      const createResult = await db.collection('users').add({
        data: newUser
      });

      userInfo = {
        _id: createResult._id,
        ...newUser
      };
    }

    return {
      success: true,
      userInfo,
      isNewUser
    };

  } catch (error) {
    console.error('用户登录失败:', error);
    return {
      success: false,
      error: '登录失败，请重试'
    };
  }
};
