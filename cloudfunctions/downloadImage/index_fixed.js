// 下载图片到云存储云函数
const cloud = require('wx-server-sdk');
const https = require('https');
const http = require('http');
const { URL } = require('url');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { imageUrl, fileName } = event;
  
  console.log('下载图片云函数调用:', {
    imageUrl: imageUrl ? imageUrl.substring(0, 100) + '...' : null,
    fileName
  });

  try {
    if (!imageUrl) {
      throw new Error('图片URL不能为空');
    }

    // 如果没有提供文件名，生成一个默认的文件名
    let finalFileName = fileName;
    if (!finalFileName) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      finalFileName = `images/ai_generated_${timestamp}_${randomId}.png`;
    } else {
      // 确保文件名包含 images/ 前缀
      if (!finalFileName.startsWith('images/')) {
        finalFileName = `images/${finalFileName}`;
      }
    }

    console.log('最终文件名:', finalFileName);

    // 下载图片
    console.log('开始下载图片...');
    const imageBuffer = await downloadImageFromUrl(imageUrl);
    console.log('图片下载完成，大小:', imageBuffer.length, 'bytes');

    // 上传到云存储
    console.log('开始上传到云存储...');
    const uploadResult = await cloud.uploadFile({
      cloudPath: finalFileName,
      fileContent: imageBuffer
    });

    console.log('云存储上传结果:', uploadResult);

    if (uploadResult.fileID) {
      // 获取临时访问链接
      const tempFileURL = await cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      });

      console.log('获取临时访问链接结果:', tempFileURL);

      if (tempFileURL.fileList && tempFileURL.fileList.length > 0) {
        const cloudUrl = tempFileURL.fileList[0].tempFileURL;
        console.log('云存储访问链接:', cloudUrl);

        return {
          success: true,
          data: {
            cloudUrl: cloudUrl,
            fileID: uploadResult.fileID,
            cloudPath: finalFileName
          }
        };
      } else {
        throw new Error('获取临时访问链接失败');
      }
    } else {
      throw new Error('上传到云存储失败');
    }
  } catch (error) {
    console.error('下载图片云函数错误:', error);
    return {
      success: false,
      error: error.message || '下载图片失败'
    };
  }
};

// 从URL下载图片
async function downloadImageFromUrl(imageUrl) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(imageUrl);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };

      console.log('发起图片下载请求:', {
        hostname: options.hostname,
        port: options.port,
        path: options.path
      });

      const req = httpModule.request(options, (res) => {
        console.log('图片下载响应状态:', res.statusCode);
        console.log('图片下载响应头:', res.headers);

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log('图片下载完成，大小:', buffer.length, 'bytes');
          resolve(buffer);
        });

        res.on('error', (error) => {
          console.error('图片下载响应错误:', error);
          reject(error);
        });
      });

      req.on('error', (error) => {
        console.error('图片下载请求错误:', error);
        reject(error);
      });

      req.setTimeout(30000, () => {
        console.error('图片下载超时');
        req.destroy();
        reject(new Error('下载超时'));
      });

      req.end();
    } catch (error) {
      console.error('图片下载初始化错误:', error);
      reject(error);
    }
  });
}
