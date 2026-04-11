import { test, expect, type Page } from "@playwright/test";

async function clearWebStorage(page: Page) {
  await page.goto("about:blank");
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

test.beforeEach(async ({ page }) => {
  await clearWebStorage(page);
});

test("未登录访问首页时进入登录页（首启）", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/, { timeout: 30_000 });
  await expect(page.getByTestId("auth-email")).toBeVisible();
});

test("未登录访问业务页时拦截并进入登录入口", async ({ page }) => {
  await page.goto("/explore");
  await expect(page).toHaveURL(/login/, { timeout: 30_000 });
});

test("登录后按 returnTo 回到阅读页", async ({ page }) => {
  await page.goto("/read");
  await expect(page).toHaveURL(/login/, { timeout: 30_000 });

  await page.getByTestId("auth-switch-to-login").click();
  await expect(page.getByTestId("auth-submit")).toContainText("登录");
  await page.getByTestId("auth-email").fill("reader@example.com");
  await page.getByTestId("auth-password").fill("secret");
  await page.getByTestId("auth-submit").click();

  await expect(page).toHaveURL(/read/, { timeout: 30_000 });
  await expect(
    page.getByText("宁静的建筑：为何现代城市正缺失静谧空间"),
  ).toBeVisible({ timeout: 15_000 });
});

test("从登录页直接登录后默认进入今日", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("auth-switch-to-login").click();
  await expect(page.getByTestId("auth-submit")).toContainText("登录");

  await page.getByTestId("auth-email").fill("reader@example.com");
  await page.getByTestId("auth-password").fill("secret");
  await page.getByTestId("auth-submit").click();

  await expect(page).toHaveURL(
    (url) => {
      try {
        const p = new URL(url).pathname;
        return p === "/" || p === "";
      } catch {
        return false;
      }
    },
    { timeout: 30_000 },
  );
  const todayRoot = page.getByTestId("screen-today").last();
  await expect(todayRoot).toBeVisible({ timeout: 15_000 });
});
