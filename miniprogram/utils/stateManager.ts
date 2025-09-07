// 小程序端状态管理服务
import { cloudService } from './cloudService';

export interface StateManagerConfig {
  enableCache: boolean;
  cacheTimeout: number;
  maxRetries: number;
}

export class StateManager {
  private static instance: StateManager;
  private cache: Map<string, { data: any; timestamp: number; timeout: number }> = new Map();
  private config: StateManagerConfig = {
    enableCache: true,
    cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
    maxRetries: 3
  };

  private constructor() {}

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  // 设置配置
  public setConfig(config: Partial<StateManagerConfig>) {
    this.config = { ...this.config, ...config };
  }

  // 缓存管理
  private getCacheKey(operation: string, params: any): string {
    return `${operation}_${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    if (!this.config.enableCache) return null;
    
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.timeout) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any) {
    if (!this.config.enableCache) return;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout: this.config.cacheTimeout
    });
  }

  // 重试机制
  private async withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < this.config.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`${context} 第${i + 1}次尝试失败:`, error);
        
        if (i < this.config.maxRetries - 1) {
          // 指数退避
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  }

  // 统一的数据获取方法
  public async getData<T>(
    operation: string,
    params: any,
    fetcher: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = this.getCacheKey(operation, params);
    
    // 尝试从缓存获取
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 从数据源获取
    const data = await this.withRetry(fetcher, operation);
    
    // 缓存结果
    if (useCache) {
      this.setCache(cacheKey, data);
    }
    
    return data;
  }

  // 清除缓存
  public clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // 获取所有作品（带缓存）
  public async getAllArtworks(page: number = 1, pageSize: number = 10) {
    return this.getData(
      'getAllArtworks',
      { page, pageSize },
      () => cloudService.getAllArtworks(page, pageSize)
    );
  }

  // 获取用户作品（带缓存）
  public async getUserArtworks(openid: string, page: number = 1, pageSize: number = 10) {
    return this.getData(
      'getUserArtworks',
      { openid, page, pageSize },
      () => cloudService.getUserArtworks(openid, page, pageSize)
    );
  }

  // 获取用户信息（带缓存）
  public async getUserInfo(openid: string) {
    return this.getData(
      'getUserInfo',
      { openid },
      () => cloudService.getUserInfo(openid)
    );
  }

  // 预加载数据
  public async preloadData(operations: Array<{ operation: string; params: any; fetcher: () => Promise<any> }>) {
    const promises = operations.map(op => 
      this.getData(op.operation, op.params, op.fetcher, true)
    );
    
    try {
      await Promise.all(promises);
      console.log('数据预加载完成');
    } catch (error) {
      console.error('数据预加载失败:', error);
    }
  }
}

// 导出单例实例
export const stateManager = StateManager.getInstance();
