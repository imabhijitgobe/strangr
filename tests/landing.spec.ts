import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the hero section with title", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("TALK");
    await expect(page.locator("h1")).toContainText("STRANGERS");
  });

  test("renders the header with logo", async ({ page }) => {
    await expect(page.getByText("Strangr").first()).toBeVisible();
  });

  test("has TEXT CHAT button linking to /chat", async ({ page }) => {
    const chatLink = page.getByRole("link", { name: /TEXT CHAT/i }).first();
    await expect(chatLink).toBeVisible();
    await expect(chatLink).toHaveAttribute("href", "/chat");
  });

  test("has START CHATTING button in header", async ({ page }) => {
    const btn = page.getByRole("link", { name: /START CHATTING/i }).first();
    await expect(btn).toBeVisible();
  });

  test("renders How It Works section", async ({ page }) => {
    // Scroll to trigger the inView animation
    await page.evaluate(() => {
      document.getElementById("how-it-works")?.scrollIntoView();
    });
    // Wait for framer-motion animation (opacity 0 -> 1)
    await page.waitForTimeout(1500);
    await expect(page.locator("#how-it-works h2")).toHaveText("How It Works");
    await expect(page.getByText("Instant Matching")).toBeAttached();
    await expect(page.getByText("Anonymous & Safe")).toBeAttached();
    await expect(page.getByText("Interest-Based")).toBeAttached();
  });

  test("renders Safety section", async ({ page }) => {
    await page.evaluate(() => {
      document.getElementById("safety")?.scrollIntoView();
    });
    await page.waitForTimeout(500);
    await expect(page.getByText("Your Safety Matters")).toBeAttached();
  });

  test("renders CTA section", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.getByText("Ready to Meet Someone New?")).toBeAttached();
  });

  test("renders footer", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.getByText("TERMS")).toBeAttached();
    await expect(page.getByText("PRIVACY")).toBeAttached();
  });

  test("navigates to /chat when TEXT CHAT is clicked", async ({ page }) => {
    await page.getByRole("link", { name: /TEXT CHAT/i }).first().click();
    await expect(page).toHaveURL("/chat");
  });
});
