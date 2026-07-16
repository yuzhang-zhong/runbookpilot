import { expect, test } from "@playwright/test";

test("operator can diagnose, approve, and verify a sandbox rollback", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Diagnose fast/i })).toBeVisible();
  await page.getByRole("button", { name: /run autopilot/i }).click();
  await expect(page.getByRole("heading", { name: /authorize rollback release/i })).toBeVisible();
  await page.getByRole("button", { name: /approve once/i }).click();
  await expect(page.getByText(/recovery verified/i)).toBeVisible();
  await expect(page.getByTestId("run-outcome")).toContainText("Three consecutive probes passed");
});

test("primary workflow is keyboard reachable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});
