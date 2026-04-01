/**
 * @fileoverview 集中管理所有跨模块共享的常数
 * @module @halfway-lab/question-expansion/constants
 */

/**
 * 概览中最多显示的张力数量
 * @constant {number}
 */
export const MAX_TENSIONS = 3

/**
 * 概览中最多显示的下一步问题数量
 * @constant {number}
 */
export const MAX_NEXT_QUESTIONS = 3

/**
 * 构建概览时最多显示的路径标题数量
 * @constant {number}
 */
export const MAX_OVERVIEW_PATH_TITLES = 3

/**
 * 层级名称映射表，用于生成暂停摘要标题
 * @constant {string[]}
 */
export const LEVEL_NAMES = [
  '',
  '问题层面',
  '分析层面',
  '行动层面',
  '执行层面',
  '细化层面',
  '验证层面',
  '优化层面',
  '固化层面',
  '迭代层面'
]

/**
 * 层级名称的最大索引（用于边界检查）
 * @constant {number}
 */
export const MAX_LEVEL_NAME_INDEX = 9

/**
 * Markdown 标题的最大层级（用于限制 # 数量）
 * @constant {number}
 */
export const MAX_MARKDOWN_HEADING_LEVEL = 6

/**
 * 路径字段的默认回退值
 * @constant {Object}
 */
export const PATH_DEFAULTS = {
  /** 未命名路径标题模板 */
  PATH_TITLE: (index) => `未命名路径 ${index + 1}`,
  
  /** 默认路径摘要 */
  PATH_SUMMARY: '当前返回缺少摘要，建议检查 provider 输出结构。',
  
  /** 默认下一步问题 */
  NEXT_QUESTION: '继续追问这个方向里最值得澄清的部分。',
  
  /** 默认分支类型 */
  BRANCH_TYPE: 'unknown',
  
  /** 默认未完成度分数 */
  UNFINISHED_SCORE: 0.5,
  
  /** 默认盲点提示 */
  BLIND_SPOT_HINT: '当前返回缺少 blind spot 字段。',
  
  /** 默认层级 */
  LEVEL: 1,
  
  /** ID 生成种子 */
  ID_SEED: 'path'
}

/**
 * 暂停摘要的默认回退值
 * @constant {Object}
 */
export const PAUSE_SUMMARY_DEFAULTS = {
  /** 默认核心洞察 */
  KEY_INSIGHT: '这条路径仍有继续展开的空间',
  
  /** 默认下一步行动 */
  NEXT_ACTION: '继续澄清这条路径的关键问题'
}

/**
 * 概览构建的默认回退文本
 * @constant {Object}
 */
export const OVERVIEW_DEFAULTS = {
  /** 空问题时的默认文本 */
  EMPTY_QUESTION: '这个问题还需要先被说清。',
  
  /** 无路径时的默认核心问题 */
  NO_PATHS_CORE_QUESTION: (question) => `当前先围绕「${question}」把问题打开，而不是急着给结论。`,
  
  /** 有路径时的默认核心问题 */
  WITH_PATHS_CORE_QUESTION: (question, pathTitles) => `围绕「${question}」，这次先拆清 ${pathTitles.join('、')} 这几块，再决定问题真正卡在哪里。`,
  
  /** 聚焦模式下的默认核心问题 */
  FOCUSED_CORE_QUESTION: (focusedTitle, pathTitles) => `围绕「${focusedTitle}」，这次继续拆清 ${pathTitles.join('、')} 这几块，看看这条分支接下来该往哪里追。`,
  
  /** 无张力时的默认文本 */
  NO_TENSIONS: '这个问题里最关键的拉扯还没有完全显形。',
  
  /** 无下一步问题时的默认文本 */
  NO_NEXT_QUESTIONS: '如果先不急着判断，这个问题下一步最值得继续追问什么？'
}

/**
 * 聚焦范围标签
 * @constant {Object}
 */
export const FOCUS_SCOPE_LABELS = {
  /** 全局概览标签 */
  GLOBAL_BADGE: '当前问题全局',
  
  /** 全局概览副标题 */
  GLOBAL_SUBTITLE: '先抓住问题、张力和下一步，再进入具体路径。',
  
  /** 聚焦分支标签 */
  FOCUSED_BADGE: '当前聚焦分支',
  
  /** 聚焦分支副标题模板 */
  FOCUSED_SUBTITLE: (focusedTitle) => `总览会优先跟随「${focusedTitle}」这条分支。`
}

/**
 * 历史卡片标签
 * @constant {Object}
 */
export const HISTORY_CARD_LABELS = {
  /** 当前会话标记 */
  ACTIVE_BADGE: '当前',
  
  /** 路径数量模板 */
  PATH_COUNT: (count) => `${count} 条路径`,
  
  /** 层级数量模板 */
  LEVEL_COUNT: (count) => `${count} 层已展开`,
  
  /** 可继续展开状态 */
  EXPANDABLE_STATUS: '可继续展开',
  
  /** 已保存状态 */
  SAVED_STATUS: '已保存',
  
  /** 暂停次数模板 */
  PAUSE_COUNT: (count) => `${count} 次停一下`,
  
  /** 点击继续提示 */
  CONTINUE_PROMPT: '点开继续',
  
  /** 当前聚焦模板 */
  FOCUS_PREFIX: (title) => `当前聚焦：${title}`
}

/**
 * 会话摘要默认值
 * @constant {Object}
 */
export const SESSION_SUMMARY_DEFAULTS = {
  /** 默认标题 */
  DEFAULT_TITLE: '未命名问题链'
}

/**
 * 状态消息默认值
 * @constant {Object}
 */
export const STATUS_DEFAULTS = {
  /** 默认状态消息 */
  DEFAULT_MESSAGE: '后端已连接',
  
  /** 模式前缀 */
  MODE_PREFIX: '模式：',
  
  /** 模型前缀 */
  MODEL_PREFIX: '模型：',
  
  /** Provider 前缀 */
  PROVIDER_PREFIX: 'provider：',
  
  /** Replay 模式提示 */
  REPLAY_NOTICE: '当前为 replay 结果，不随输入实时变化'
}

/**
 * 时间戳格式化配置
 * @constant {Object}
 */
export const TIMESTAMP_FORMAT = {
  /** 地区设置 */
  LOCALE: 'zh-CN',
  
  /** 格式化选项 */
  OPTIONS: {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
}

/**
 * 原始 HWP 默认值
 * @constant {Object}
 */
export const RAW_HWP_DEFAULTS = {
  /** 默认来源标识 */
  SOURCE: 'raw_hwp',
  
  /** 默认分支类型（推断失败时） */
  FALLBACK_BRANCH_TYPE: 'branch_followup',
  
  /** 默认规则 ID（推断失败时） */
  FALLBACK_RULE_ID: 'fallback_branch_followup'
}
