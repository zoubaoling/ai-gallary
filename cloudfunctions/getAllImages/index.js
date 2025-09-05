// 获取所有用户发布图片云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10 } = event;
  
  try {
    // 1. 查询所有已发布的图片
    const skip = (page - 1) * pageSize;
    const imagesResult = await db.collection('artworks')
      .where({
        status: 'published'
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 2. 获取总数
    const countResult = await db.collection('artworks')
      .where({
        status: 'published'
      })
      .count();

    return {
      success: true,
      data: {
        images: imagesResult.data,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + pageSize < countResult.total
      }
    };

  } catch (error) {
    console.error('获取所有图片失败:', error);
    return {
      success: false,
      error: '获取图片失败，请重试'
    };
  }
};
