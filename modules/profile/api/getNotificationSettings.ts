/**
 * 通知设置 API（占位实现）
 * 首版提供入口与说明文案，不接入实际通知开关后端能力
 */

export type NotificationSettings = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  placeholderMode: true;
};

export type NotificationSettingsInfo = {
  title: string;
  description: string;
  features: string[];
  placeholder: true;
};

/**
 * 获取通知设置信息（占位）
 * 首版仅提供 UI 入口，实际通知能力后续接入
 */
export async function getNotificationSettings(): Promise<NotificationSettingsInfo> {
  return {
    title: "通知设置",
    description: "管理您的推送和邮件通知偏好",
    features: [
      "新文章推送通知",
      "每日阅读摘要邮件",
      "订阅源更新提醒",
      "会员到期提醒",
    ],
    placeholder: true,
  };
}

/**
 * 获取当前通知状态（占位）
 * 首版返回默认值，实际状态后续从后端获取
 */
export async function getNotificationStatus(): Promise<NotificationSettings> {
  // Placeholder: return default values
  return {
    pushEnabled: true,
    emailEnabled: false,
    placeholderMode: true,
  };
}

/**
 * 更新通知设置（占位 - 不实际保存）
 * 首版提示用户该功能正在开发中
 */
export async function updateNotificationSettings(): Promise<{
  ok: false;
  code: string;
  message: string;
}> {
  return {
    ok: false,
    code: "PLACEHOLDER",
    message: "通知设置功能正在开发中，敬请期待。",
  };
}
