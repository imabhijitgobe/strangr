import { test, expect } from "@playwright/test";

test.describe("Rooms / Connections Feature", () => {
  test("rooms page shows empty state when no rooms", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page.getByText("No connections yet")).toBeAttached();
  });

  test("rooms page has add room input", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page.getByPlaceholder("e.g., WOLF42")).toBeAttached();
  });

  test("can add a room manually via code", async ({ page }) => {
    await page.goto("/rooms");
    const input = page.getByPlaceholder("e.g., WOLF42");
    await input.fill("BEAR42");
    await page.getByRole("button", { name: /Add/i }).click();
    await expect(page.getByText("BEAR42")).toBeVisible();
  });

  test("two users can connect and create a room", async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    // Match
    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await page2.getByRole("button", { name: /START CHATTING/i }).click();
    await expect(page1.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });

    // User 1 sends connect request
    await page1.getByLabel("Send connection request").click();
    await expect(page1.getByText("Request Sent")).toBeVisible();

    // User 2 receives and accepts
    await expect(page2.getByText("Connection Request")).toBeVisible({ timeout: 5000 });
    await page2.getByRole("button", { name: /Accept/i }).click();

    // Both see success
    await expect(page1.getByText("Connected!")).toBeVisible({ timeout: 5000 });
    await expect(page2.getByText("Connected!")).toBeVisible({ timeout: 5000 });

    await ctx1.close();
    await ctx2.close();
  });
});

test.describe("Video Chat", () => {
  test("video page shows idle state", async ({ page }) => {
    await page.goto("/video");
    await expect(page.getByText("Video Chat")).toBeVisible();
    await expect(page.getByRole("button", { name: /START VIDEO CHAT/i })).toBeVisible();
  });

  test("video page has interest input", async ({ page }) => {
    await page.goto("/video");
    await expect(page.getByPlaceholder("Type an interest")).toBeVisible();
  });
});
