// 通义万相文生图云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 阿里云通义万相API配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

exports.main = async (event, context) => {
  const { action, taskId, prompt, negativePrompt, size, n, seed } = event;
  

  try {
    if (!DASHSCOPE_API_KEY) {
      throw new Error('DASHSCOPE_API_KEY 环境变量未配置');
    }

    switch (action) {
      case 'create':
        return await createImageTask(prompt, negativePrompt, size, n, seed);
      case 'query':
        return await queryTaskResult(taskId);
      default:
        throw new Error('不支持的操作类型');
    }
  } catch (error) {
    console.error('通义万相文生图云函数错误:', error);
    return {
      success: false,
      error: error.message || '云函数执行失败'
    };
  }
};

// 创建图像生成任务
async function createImageTask(prompt, negativePrompt, size = '1024*1024', n = 1, seed) {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('提示词不能为空');
    }

    // 构建请求参数
    const requestBody = {
      model: 'wan2.2-t2i-plus',
      input: {
        prompt: prompt.trim()
      },
      parameters: {
        size: size,
        n: Math.min(Math.max(n, 1), 4), // 限制在1-4之间
        prompt_extend: true, // 开启智能改写
        watermark: false // 不添加水印
      }
    };

    // 添加反向提示词（如果提供）
    if (negativePrompt && negativePrompt.trim().length > 0) {
      requestBody.input.negative_prompt = negativePrompt.trim();
    }

    // 添加随机种子（如果提供）
    if (seed && seed > 0) {
      requestBody.parameters.seed = seed;
    }


    // 调用阿里云通义万相API
    const response = await cloud.callFunction({
      name: 'httpRequest',
      data: {
        url: `${DASHSCOPE_BASE_URL}/services/aigc/text2image/image-synthesis`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'X-DashScope-Async': 'enable'
        },
        data: requestBody
      }
    });


    if (response.result && response.result.success && response.result.data) {
      const apiResponse = response.result.data;
      
      if (apiResponse.output) {
        return {
          success: true,
          data: {
            taskId: apiResponse.output.task_id,
            taskStatus: apiResponse.output.task_status,
            requestId: apiResponse.request_id
          }
        };
      } else {
        throw new Error('创建任务失败: API响应格式错误 - ' + JSON.stringify(apiResponse));
      }
    } else {
      console.error('httpRequest云函数调用失败:', response);
      throw new Error('创建任务失败: ' + (response.result?.error || 'httpRequest云函数调用失败'));
    }
  } catch (error) {
    console.error('创建图像生成任务失败:', error);
    throw error;
  }
}

// 查询任务结果
async function queryTaskResult(taskId) {
  try {
    if (!taskId) {
      throw new Error('任务ID不能为空');
    }


    // 调用阿里云通义万相API查询任务结果
    const response = await cloud.callFunction({
      name: 'httpRequest',
      data: {
        url: `${DASHSCOPE_BASE_URL}/tasks/${taskId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
        }
      }
    });


    if (response.result && response.result.success && response.result.data) {
      const apiResponse = response.result.data;
      
      if (apiResponse.output) {
        const output = apiResponse.output;
        
        return {
          success: true,
          data: {
            taskId: output.task_id,
            taskStatus: output.task_status,
            submitTime: output.submit_time,
            scheduledTime: output.scheduled_time,
            endTime: output.end_time,
            results: output.results || [],
            taskMetrics: output.task_metrics || {},
            usage: apiResponse.usage || {},
            requestId: apiResponse.request_id
          }
        };
      } else {
        throw new Error('查询任务失败: API响应格式错误 - ' + JSON.stringify(apiResponse));
      }
    } else {
      console.error('httpRequest云函数查询失败:', response);
      throw new Error('查询任务失败: ' + (response.result?.error || 'httpRequest云函数调用失败'));
    }
  } catch (error) {
    console.error('查询任务结果失败:', error);
    throw error;
  }
}
