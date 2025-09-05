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

    // 3. 处理图片数据，优先返回fileID
    const processedImages = imagesResult.data.map(image => {
      // 优先使用fileID，如果没有则提取云存储路径
      let cloudPath = image.cloudPath;
      if (!image.fileID && image.imageUrl && image.imageUrl.includes('tcb.qcloud.la')) {
        // 从临时URL中提取云存储路径
        const urlParts = image.imageUrl.split('?')[0]; // 移除查询参数
        const pathParts = urlParts.split('/');
        const imagesIndex = pathParts.indexOf('images');
        if (imagesIndex !== -1) {
          cloudPath = pathParts.slice(imagesIndex).join('/');
        }
      }
      
      return {
        ...image,
        cloudPath: cloudPath // 返回云存储路径作为备用
      };
    });

    return {
      success: true,
      data: {
        images: processedImages,
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
