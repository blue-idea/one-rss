import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("onerss.auth.session", "1");
  });
});

test("filters and paginates the explore directory", async ({ page }) => {
  await page.goto("/explore");

  await expect(page.getByTestId("explore-screen")).toBeVisible();
  await expect(page.getByText("状态回显")).toBeVisible();
  await expect(
    page.getByTestId("explore-summary-primary"),
  ).toBeVisible();
  await expect(
    page.getByTestId("explore-summary-primary"),
  ).toContainText(/目录模式：公开目录，\s*当前分类：全部，\s*关键词：未输入。/);
  await expect(
    page.getByTestId("explore-summary-pagination"),
  ).toBeVisible();
  await expect(page.getByTestId("explore-summary-pagination")).toContainText(
    "已展示 6 / 19 个订阅源，当前第 1 / 4 页，每页 6 条。",
  );

  await page.getByTestId("explore-category-business").click();
  await expect(page.getByTestId("explore-summary-primary")).toContainText(
    /目录模式：公开目录，\s*当前分类：商业，\s*关键词：未输入。/,
  );
  await expect(page.getByTestId("explore-summary-pagination")).toContainText(
    "已展示 4 / 4 个订阅源，当前第 1 / 1 页，每页 6 条。",
  );
  await expect(page.getByText("Stratechery")).toBeVisible();

  await page.getByTestId("explore-category-all").click();
  await page.getByTestId("explore-search-input").fill("design");
  await expect(page.getByTestId("explore-summary-primary")).toContainText(
    /目录模式：公开目录，\s*当前分类：全部，\s*关键词：design。/,
  );
  await expect(page.getByText("It's Nice That Design")).toBeVisible();
  await expect(page.getByText("Product Hunt Daily")).toHaveCount(0);

  await page.getByTestId("explore-search-input").fill("");
  await page.getByTestId("explore-load-more").click();
  await expect(page.getByTestId("explore-summary-pagination")).toContainText(
    "已展示 12 / 19 个订阅源，当前第 2 / 4 页，每页 6 条。",
  );
});
