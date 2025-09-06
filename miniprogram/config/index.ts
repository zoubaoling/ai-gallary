// 配置文件
import { CloudConfig } from './types'
import { devConfig } from './env.dev'
import { prodConfig } from './env.prod'
const isDev = (): boolean => {
  return true
}
export const getAppConfig = () => {
  return isDev() ? devConfig : prodConfig
}
export function getCloudCOnfig(): CloudConfig {
  const config = getAppConfig()
  return {
    env: config.env,
    traceUser: config.traceUser
  }
}