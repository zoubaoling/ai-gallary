// 云函数测试脚本
// 在微信开发者工具的控制台中运行此脚本来测试云函数

// 测试用户登录云函数
async function testUserLogin() {
  try {
    console.log('开始测试用户登录云函数...');
    
    const result = await wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        code: 'test_code' // 这里使用测试代码
      }
    });
    
    console.log('用户登录云函数测试结果:', result);
    return result;
  } catch (error) {
    console.error('用户登录云函数测试失败:', error);
    return null;
  }
}

// 测试更新用户信息云函数
async function testUpdateUserInfo() {
  try {
    console.log('开始测试更新用户信息云函数...');
    
    const result = await wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userInfo: {
          nickName: '测试用户',
          avatarUrl: 'https://example.com/avatar.jpg'
        },
        openid: 'test_openid'
      }
    });
    
    console.log('更新用户信息云函数测试结果:', result);
    return result;
  } catch (error) {
    console.error('更新用户信息云函数测试失败:', error);
    return null;
  }
}

// 测试云数据库连接
async function testDatabase() {
  try {
    console.log('开始测试云数据库连接...');
    
    const db = wx.cloud.database();
    const result = await db.collection('users').limit(1).get();
    
    console.log('云数据库测试结果:', result);
    return result;
  } catch (error) {
    console.error('云数据库测试失败:', error);
    return null;
  }
}

// 测试云开发环境初始化
async function testCloudInit() {
  try {
    console.log('开始测试云开发环境初始化...');
    
    if (!wx.cloud) {
      console.error('❌ 云开发SDK未加载');
      return false;
    }
    
    console.log('✅ 云开发SDK已加载');
    
    // 检查云开发环境ID
    const envId = 'zou-cloud1-4gee2jb2b028dcdc';
    console.log(`✅ 云开发环境ID: ${envId}`);
    
    return true;
  } catch (error) {
    console.error('❌ 云开发环境初始化测试失败:', error);
    return false;
  }
}

// 测试数据库集合是否存在
async function testCollections() {
  try {
    console.log('开始测试数据库集合...');
    
    const db = wx.cloud.database();
    
    // 测试users集合
    try {
      await db.collection('users').limit(1).get();
      console.log('✅ users集合存在且可访问');
    } catch (error) {
      console.error('❌ users集合测试失败:', error);
    }
    
    // 测试artworks集合
    try {
      await db.collection('artworks').limit(1).get();
      console.log('✅ artworks集合存在且可访问');
    } catch (error) {
      console.error('❌ artworks集合测试失败:', error);
    }
    
  } catch (error) {
    console.error('❌ 数据库集合测试失败:', error);
  }
}

// 测试云函数部署状态
async function testCloudFunctions() {
  try {
    console.log('开始测试云函数部署状态...');
    
    const functions = ['userLogin', 'updateUserInfo'];
    
    for (const funcName of functions) {
      try {
        const result = await wx.cloud.callFunction({
          name: funcName,
          data: { test: true }
        });
        console.log(`✅ ${funcName} 云函数部署正常`);
      } catch (error) {
        console.error(`❌ ${funcName} 云函数测试失败:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ 云函数部署状态测试失败:', error);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('=== 开始云开发功能测试 ===');
  
  // 测试云开发环境
  const cloudInitOk = await testCloudInit();
  if (!cloudInitOk) {
    console.log('❌ 云开发环境测试失败，停止后续测试');
    return;
  }
  
  // 测试数据库集合
  await testCollections();
  
  // 测试云函数部署
  await testCloudFunctions();
  
  // 测试云数据库连接
  await testDatabase();
  
  // 测试云函数功能
  await testUserLogin();
  await testUpdateUserInfo();
  
  console.log('=== 云开发功能测试完成 ===');
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testUserLogin,
    testUpdateUserInfo,
    testDatabase,
    runAllTests
  };
}

// 在控制台中可以直接调用
console.log('🚀 云函数测试脚本已加载，可以调用以下函数：');
console.log('');
console.log('📋 基础测试函数：');
console.log('- testCloudInit()        // 测试云开发环境初始化');
console.log('- testCollections()      // 测试数据库集合');
console.log('- testCloudFunctions()   // 测试云函数部署状态');
console.log('- testDatabase()         // 测试云数据库连接');
console.log('');
console.log('🔧 功能测试函数：');
console.log('- testUserLogin()        // 测试用户登录云函数');
console.log('- testUpdateUserInfo()   // 测试更新用户信息云函数');
console.log('');
console.log('🎯 完整测试：');
console.log('- runAllTests()          // 运行所有测试');
console.log('');
console.log('💡 使用建议：');
console.log('1. 首次使用建议运行 runAllTests() 进行完整测试');
console.log('2. 如果某个功能有问题，可以单独测试对应函数');
console.log('3. 查看控制台输出，✅ 表示成功，❌ 表示失败');
