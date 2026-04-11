import { describe, it, expect } from "vitest";
import {
  getMembershipPlans,
  getPlanById,
  calculateYearlySavings,
} from "./getMembershipPlans";

// 需求7 - 会员与计费
describe("Membership Plans", () => {
  // 需求7.1: 当用户进入会员购买页时，OneRss 应展示月付与年付两种付费方案。
  describe("getMembershipPlans", () => {
    it("returns monthly and yearly plans", () => {
      const { plans } = getMembershipPlans();

      expect(plans).toHaveLength(2);
      expect(plans[0].interval).toBe("month");
      expect(plans[1].interval).toBe("year");
    });

    it("includes premium features", () => {
      const { plans } = getMembershipPlans();

      const monthlyFeatures = plans[0].features;
      expect(monthlyFeatures).toContain("无限订阅源");
      expect(monthlyFeatures).toContain("文章翻译");
      expect(monthlyFeatures).toContain("文章朗读");
    });

    it("yearly plan includes savings", () => {
      const { plans } = getMembershipPlans();
      const yearlyPlan = plans.find((p) => p.interval === "year");

      expect(yearlyPlan?.annualDiscount).toBe(33);
      expect(yearlyPlan?.features).toContain("节省 33%");
    });

    it("has correct currency", () => {
      const { currency } = getMembershipPlans();
      expect(currency).toBe("USD");
    });
  });

  // 需求7.1: 验证年付价格比月付优惠
  describe("calculateYearlySavings", () => {
    it("calculates correct savings percentage", () => {
      const savings = calculateYearlySavings();
      // Monthly: 9.99 * 12 = 119.88, Yearly: 79.99, Savings: (119.88 - 79.99) / 119.88 = 33.27%
      expect(savings).toBe(33);
    });
  });

  describe("getPlanById", () => {
    it("returns monthly plan for 'monthly' id", () => {
      const plan = getPlanById("monthly");
      expect(plan?.interval).toBe("month");
      expect(plan?.price).toBe(9.99);
    });

    it("returns yearly plan for 'yearly' id", () => {
      const plan = getPlanById("yearly");
      expect(plan?.interval).toBe("year");
      expect(plan?.price).toBe(79.99);
    });

    it("returns null for unknown plan id", () => {
      const plan = getPlanById("unknown");
      expect(plan).toBeNull();
    });
  });
});
