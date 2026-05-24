import { test, expect } from "@playwright/test";

test.describe("Rooms / Connections Feature", () => {
  test("rooms page renders with My Connections header", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page.getByText("My Connections")).toBeVisible({ timeout: 10000 });
  });

  test("rooms page has add room input", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page.getByPlaceholder("e.g., WOLF42")).toBeVisible({ timeout: 10000 });
  });

  test("two users can connect and create a room", async ({ browser }) => {
    test.setTimeout(90000); // Give this test more time

    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    // Wait for socket connections
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(1000);

    // Match
    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await page1.waitForTimeout(500);
    await page2.getByRole("button", { name: /START CHATTING/i }).click();

    await expect(page1.getByText("You're now chatting")).toBeVisible({ timeout: 15000 });
    await expect(page2.getByText("You're now chatting")).toBeVisible({ timeout: 15000 });

    // User 1 sends connect request
    await page1.getByLabel("Send connection request").click();
    await expect(page1.getByText("Request Sent")).toBeVisible({ timeout: 5000 });

    // User 2 receives and accepts
    await expect(page2.getByText("Connection Request")).toBeVisible({ timeout: 10000 });
    await page2.getByRole("button", { name: /Accept/i }).click();

    // Both see success
    await expect(page1.getByText("Connected!")).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText("Connected!")).toBeVisible({ timeout: 10000 });

    await ctx1.close();
    await ctx2.close();
  });
});

test.describe("Video Chat", () => {
  test("video page shows idle state with heading", async ({ page }) => {
    await page.goto("/video");
    await expect(page.getByRole("heading", { name: "Video Chat" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /START VIDEO CHAT/i })).toBeVisible();
  });

  test("video page has interest input", async ({ page }) => {
    await page.goto("/video");
    await expect(page.getByPlaceholder("Type an interest")).toBeVisible({ timeout: 10000 });
  });
});
