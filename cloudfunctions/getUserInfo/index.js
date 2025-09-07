// 获取用户信息云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { openid } = event;
  
  try {
    // 参数验证
    if (!openid) {
      return {
        success: false,
        error: '缺少必需参数: openid'
      };
    }

    // 查询用户信息
    const result = await db.collection('users').where({
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
};
