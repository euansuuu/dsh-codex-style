import type { FeatureManifest } from '../../core/feature'

export default {
  id: 'pluginRemoval',
  // 在品牌特性之后：它装饰的已安装插件卡片由宿主自己的页面渲染，晚于页面骨架的特性落笔。
  order: 165,
  // 该页在主题启用时即存在，卡片随宿主的 React 出现与重渲染，不随某个偏好开关装卸。
  ungated: '宿主插件页的已安装卡片在主题启用时即存在，卸载控制随之装饰',
  contracts: [],
  stylesheets: [{ file: 'plugin-removal.css', rank: 168 }],
  cases: [],
} satisfies FeatureManifest
