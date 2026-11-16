import { BRAND_DEEPSEEK } from '../../constants'
import type { FeatureManifest } from '../../core/feature'

export default {
  id: 'workspaceWords',
  // 紧跟在「进行中 / 已归档」那一节之后：同一张目录，视图特性先给那一节换上分段控件，本特性只换它上面的字。
  order: 151,
  pref: 'brand',
  prefValues: [BRAND_DEEPSEEK],
  contracts: [],
  stylesheets: [],
  cases: [],
} satisfies FeatureManifest
