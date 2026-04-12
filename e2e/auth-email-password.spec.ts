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

test("邮箱密码登录成功后进入今日页", async ({ page }) => {
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

  // 切换到登录模式
  await page.getByTestId("auth-switch-to-login").click();

  await page.getByTestId("auth-email").fill("user@example.com");
  await page.getByTestId("auth-password").fill("password123");
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

test("登录凭据错误时显示密码错误提示", async ({ page }) => {
  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid login credentials",
      }),
    });
  });

  // 切换到登录模式
  await page.getByTestId("auth-switch-to-login").click();

  await page.getByTestId("auth-email").fill("user@example.com");
  await page.getByTestId("auth-password").fill("wrongpassword");
  await page.getByTestId("auth-submit").click();

  await expect(page.getByText("邮箱或密码错误。")).toBeVisible();
});

test("登录时服务端返回通用错误应显示错误提示而非无响应", async ({ page }) => {
  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Internal Server Error" }),
    });
  });

  // 切换到登录模式
  await page.getByTestId("auth-switch-to-login").click();

  await page.getByTestId("auth-email").fill("user@example.com");
  await page.getByTestId("auth-password").fill("password123");
  await page.getByTestId("auth-submit").click();

  // 修复前：错误提示不可见，表现为"按钮无反应"
  // 修复后：应显示通用错误提示
  await expect(page.getByTestId("auth-login-error")).toBeVisible();
});
