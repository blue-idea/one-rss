import { describe, it, expect } from "vitest";
import {
  getNotificationSettings,
  getNotificationStatus,
  updateNotificationSettings,
} from "./getNotificationSettings";

// 需求6.3 - 通知设置入口占位
describe("Notification Settings", () => {
  // 需求6.3: 当用户进入通知设置页时，OneRss 应展示通知开关与说明。
  describe("getNotificationSettings", () => {
    it("returns placeholder notification settings info", async () => {
      const info = await getNotificationSettings();

      expect(info.title).toBe("通知设置");
      expect(info.description).toBe("管理您的推送和邮件通知偏好");
      expect(info.placeholder).toBe(true);
    });

    it("includes expected notification features", async () => {
      const info = await getNotificationSettings();

      expect(info.features).toContain("新文章推送通知");
      expect(info.features).toContain("每日阅读摘要邮件");
      expect(info.features).toContain("订阅源更新提醒");
      expect(info.features).toContain("会员到期提醒");
    });
  });

  describe("getNotificationStatus", () => {
    it("returns default notification status as placeholder", async () => {
      const status = await getNotificationStatus();

      expect(status.pushEnabled).toBe(true);
      expect(status.emailEnabled).toBe(false);
      expect(status.placeholderMode).toBe(true);
    });
  });

  describe("updateNotificationSettings", () => {
    it("returns placeholder error indicating feature in development", async () => {
      const result = await updateNotificationSettings();

      expect(result.ok).toBe(false);
      expect(result.code).toBe("PLACEHOLDER");
      expect(result.message).toBe("通知设置功能正在开发中，敬请期待。");
    });
  });
});
