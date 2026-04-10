export const NOTIFICATION_SETTINGS_PREVIEW = "每日摘要，重点提醒";

export const NOTIFICATION_SETTINGS_SECTIONS = [
  {
    title: "首版说明",
    body: "通知能力将在后续版本开放。本版本先提供入口与说明，方便你了解后续将支持的提醒类型。",
  },
  {
    title: "后续将支持",
    body: "你将可以按文章摘要、重点更新和订阅源动态管理提醒频率，避免被无效推送打扰。",
  },
  {
    title: "当前状态",
    body: "通知开关暂未接入，也不会向你发送系统推送。待能力上线后，这里会补充可配置项与到达方式。",
  },
] as const;
