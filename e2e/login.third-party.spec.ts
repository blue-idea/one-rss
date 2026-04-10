import path from "node:path";
import { pathToFileURL } from "node:url";

import { expect, test } from "@playwright/test";

const LOGIN_PAGE_URL = pathToFileURL(
  path.resolve(process.cwd(), "dist/login/index.html"),
).href;
const SHOULD_RUN_PLAYWRIGHT_E2E = process.env.RUN_PLAYWRIGHT_E2E === "1";

test.describe("third-party auth smoke", () => {
  test.skip(
    !SHOULD_RUN_PLAYWRIGHT_E2E,
    "Browser launch is blocked in the current sandbox. Set RUN_PLAYWRIGHT_E2E=1 to run locally.",
  );

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let appleAttempts = 0;

      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        });

      const originalFetch = window.fetch.bind(window);

      window.localStorage.clear();

      window.fetch = async (input, init) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input);

        if (url.endsWith("/api/send-email-code")) {
          return json({
            success: true,
            data: { cooldownSeconds: 60 },
          });
        }

        if (url.endsWith("/api/verify-email-code")) {
          return json({
            success: true,
            data: {
              registrationCredential: "credential-123",
              expiresAt: "2099-01-01T00:00:00.000Z",
            },
          });
        }

        if (url.endsWith("/api/oauth/sign-in")) {
          const payload = init?.body ? JSON.parse(String(init.body)) : {};

          if (payload.provider === "apple") {
            appleAttempts += 1;

            if (appleAttempts === 1) {
              return json({
                success: true,
                data: {
                  status: "cancelled",
                  message: "Apple 授权已取消，请重试。",
                },
              });
            }

            return json({
              success: true,
              data: {
                status: "signed_in",
                message: "Apple 登录成功。",
                merged: false,
              },
            });
          }

          if (payload.provider === "google") {
            return json({
              success: true,
              data: {
                status: "needs_email",
                message: "Google 未返回可用邮箱，请补充后继续。",
                flowId: "flow-google",
                suggestedEmail: "merge@example.com",
              },
            });
          }
        }

        if (url.endsWith("/api/oauth/complete")) {
          return json({
            success: true,
            data: {
              status: "signed_in",
              message: "Google 登录成功。",
              merged: true,
            },
          });
        }

        return originalFetch(input, init);
      };
    });
  });

  test("keeps the user signed out after cancellation and allows retry", async ({
    page,
  }) => {
    await page.goto(LOGIN_PAGE_URL);

    await page.getByTestId("auth-social-apple").click();
    await expect(page.getByTestId("auth-third-party-error")).toContainText(
      "Authorization was cancelled. Please try again.",
    );

    await page.getByTestId("auth-third-party-retry").click();
    await expect(page.getByText("沉默的建筑师")).toBeVisible();
  });

  test("completes third-party login after supplemental email verification", async ({
    page,
  }) => {
    await page.goto(LOGIN_PAGE_URL);

    await page.getByTestId("auth-social-google").click();
    await expect(page.getByTestId("auth-third-party-message")).toContainText(
      "Google 未返回可用邮箱",
    );

    await page.getByTestId("auth-third-party-email").fill("merge@example.com");
    await page.getByTestId("auth-third-party-send-otp").click();
    await page.getByTestId("auth-third-party-otp").fill("123456");
    await page.getByTestId("auth-third-party-complete").click();

    await expect(page.getByText("沉默的建筑师")).toBeVisible();
  });
});
