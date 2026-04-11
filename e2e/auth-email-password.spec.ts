import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ context, page }) => {
  await context.clearCookies();
  await context.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.removeItem("onerss.auth.session");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/login");
});

test("邮箱注册成功后自动登录并进入今日页", async ({ page }) => {
  await page.route("**/functions/v1/verify-email-code", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          registrationCredential: "mock-ticket",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
        meta: {},
      }),
    });
  });

  await page.route("**/functions/v1/register-email-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { email: "newuser@example.com" },
        meta: {},
      }),
    });
  });

  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "mock-access-token",
        token_type: "bearer",
      }),
    });
  });

  await page.getByTestId("auth-email").fill("newuser@example.com");
  await page.getByPlaceholder("请输入6位验证码").fill("123456");
  await page.getByTestId("auth-submit").click();

  await expect(page.getByPlaceholder("请再次输入密码")).toBeVisible();
  await page.getByPlaceholder("至少8个字符").fill("secret123");
  await page.getByPlaceholder("请再次输入密码").fill("secret123");
  await page.getByText("我同意").click();
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
  await expect(page.getByTestId("screen-today").last()).toBeVisible();
});
