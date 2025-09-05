// HTTP请求云函数
const cloud = require('wx-server-sdk');
const https = require('https');
const http = require('http');
const { URL } = require('url');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { url, method = 'GET', headers = {}, data } = event;
  
  console.log('HTTP请求云函数调用:', {
    url,
    method,
    headers: Object.keys(headers),
    hasData: !!data
  });

  try {
    if (!url) {
      throw new Error('URL不能为空');
    }

    // 解析URL
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    // 构建请求选项
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // 添加请求体（如果是POST/PUT等）
    let requestBody = '';
    if (data && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      requestBody = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(requestBody);
    }

    console.log('发起HTTP请求:', {
      hostname: options.hostname,
      port: options.port,
      path: options.path,
      method: options.method,
      headers: Object.keys(options.headers)
    });

    // 发起HTTP请求
    const result = await new Promise((resolve, reject) => {
      const req = httpModule.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log('HTTP请求成功:', {
            statusCode: res.statusCode,
            headers: res.headers
          });
          
          try {
            const parsedData = JSON.parse(responseData);
            resolve({
              success: true,
              statusCode: res.statusCode,
              data: parsedData,
              headers: res.headers
            });
          } catch (parseError) {
            console.error('解析响应数据失败:', parseError);
            resolve({
              success: true,
              statusCode: res.statusCode,
              data: responseData,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('HTTP请求失败:', error);
        reject(error);
      });

      // 发送请求体
      if (requestBody) {
        req.write(requestBody);
      }
      
      req.end();
    });

    return result;
  } catch (error) {
    console.error('HTTP请求云函数错误:', error);
    return {
      success: false,
      error: error.message || 'HTTP请求失败'
    };
  }
};
