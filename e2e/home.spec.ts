import { expect, test } from "../playwright-fixture";

test("loads the dashboard shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Chat Político" })).toBeVisible();
  await expect(page.getByPlaceholder("Pergunte alguma coisa")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mais Gráficos" })).toBeVisible();
});
