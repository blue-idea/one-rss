/**
 * 会员套餐 API
 * 展示月付与年付两种方案
 */

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  annualDiscount?: number;
};

export type MembershipPlans = {
  plans: SubscriptionPlan[];
  currency: string;
};

const MONTHLY_PLAN: SubscriptionPlan = {
  id: "monthly",
  name: "月付",
  price: 9.99,
  interval: "month",
  features: ["无限订阅源", "文章翻译", "文章朗读", "高级数据分析"],
};

const YEARLY_PLAN: SubscriptionPlan = {
  id: "yearly",
  name: "年付",
  price: 79.99,
  interval: "year",
  features: ["无限订阅源", "文章翻译", "文章朗读", "高级数据分析", "节省 33%"],
  annualDiscount: 33,
};

/**
 * 获取会员套餐列表
 */
export function getMembershipPlans(): MembershipPlans {
  return {
    plans: [MONTHLY_PLAN, YEARLY_PLAN],
    currency: "USD",
  };
}

/**
 * 获取指定套餐详情
 */
export function getPlanById(planId: string): SubscriptionPlan | null {
  const plans = getMembershipPlans();
  return plans.plans.find((p) => p.id === planId) || null;
}

/**
 * 计算年付节省金额
 */
export function calculateYearlySavings(): number {
  const monthly = MONTHLY_PLAN.price * 12;
  const yearly = YEARLY_PLAN.price;
  return Math.round(((monthly - yearly) / monthly) * 100);
}
