import { test, expect, Page } from "@playwright/test";

test.describe("Chat Page - UI States", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
  });

  test("renders idle state with interest input and start button", async ({ page }) => {
    await expect(page.getByText("Text Chat")).toBeVisible();
    await expect(page.getByPlaceholder("Type an interest")).toBeVisible();
    await expect(page.getByRole("button", { name: /START CHATTING/i })).toBeVisible();
  });

  test("can add and remove interest tags", async ({ page }) => {
    const input = page.getByPlaceholder("Type an interest");
    await input.fill("music");
    await input.press("Enter");
    await expect(page.getByText("music")).toBeVisible();

    await input.fill("gaming");
    await input.press("Enter");
    await expect(page.getByText("gaming")).toBeVisible();

    // Remove first tag
    await page.getByLabel("Remove music").click();
    await expect(page.getByText("music")).not.toBeVisible();
    await expect(page.getByText("gaming")).toBeVisible();
  });

  test("clicking START CHATTING shows searching state", async ({ page }) => {
    await page.getByRole("button", { name: /START CHATTING/i }).click();
    await expect(page.getByText("Looking for someone to chat with")).toBeVisible();
  });

  test("can cancel search and return to idle", async ({ page }) => {
    await page.getByRole("button", { name: /START CHATTING/i }).click();
    await expect(page.getByText("Looking for someone")).toBeVisible();

    await page.getByText("Cancel").click();
    await expect(page.getByRole("heading", { name: "Text Chat" })).toBeVisible({ timeout: 5000 });
  });

  test("header shows Strangr logo linking to home", async ({ page }) => {
    const logo = page.getByRole("link", { name: /Strangr/i });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/");
  });

  test("header shows Offline status initially", async ({ page }) => {
    await expect(page.getByText("Offline")).toBeVisible();
  });
});

test.describe("Chat Page - Two Users Matching", () => {
  test("two users can match and exchange messages", async ({ browser }) => {
    // Create two separate browser contexts (simulates two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    // Wait for socket to connect
    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);

    // User 1 starts searching
    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await expect(page1.getByText("Looking for someone")).toBeVisible();

    // User 2 starts searching — they should match
    await page2.getByRole("button", { name: /START CHATTING/i }).click();

    // Both should see "connected" message
    await expect(page1.getByText("You're now chatting with a random stranger")).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText("You're now chatting with a random stranger")).toBeVisible({ timeout: 10000 });

    // User 1 sends a message
    const input1 = page1.getByPlaceholder("Type a message");
    await input1.fill("Hello from user 1!");
    await page1.getByLabel("Send message").click();

    // User 2 should receive it
    await expect(page2.getByText("Hello from user 1!")).toBeVisible({ timeout: 5000 });

    // User 2 replies
    const input2 = page2.getByPlaceholder("Type a message");
    await input2.fill("Hey user 1, nice to meet you!");
    await page2.getByLabel("Send message").click();

    // User 1 should receive it
    await expect(page1.getByText("Hey user 1, nice to meet you!")).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });

  test("user can disconnect and partner sees notification", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    // Match both users
    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await page2.getByRole("button", { name: /START CHATTING/i }).click();

    await expect(page1.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });

    // User 1 clicks NEXT (disconnect)
    await page1.getByLabel("Disconnect from chat").click();

    // User 1 sees disconnect message
    await expect(page1.getByText("You have disconnected")).toBeVisible();

    // User 2 sees partner disconnected
    await expect(page2.getByText("Stranger has disconnected")).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });

  test("ESC key disconnects connected user", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await page2.getByRole("button", { name: /START CHATTING/i }).click();

    await expect(page1.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });

    // Press ESC on page1
    await page1.keyboard.press("Escape");

    await expect(page1.getByText("You have disconnected")).toBeVisible();
    await expect(page2.getByText("Stranger has disconnected")).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });

  test("interest-based matching works", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    // Both add "music" as interest
    const input1 = page1.getByPlaceholder("Type an interest");
    await input1.fill("music");
    await input1.press("Enter");

    const input2 = page2.getByPlaceholder("Type an interest");
    await input2.fill("music");
    await input2.press("Enter");

    // Start chatting
    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await page2.getByRole("button", { name: /START CHATTING/i }).click();

    // Should match and show shared interest
    await expect(page1.getByText("You both like: music")).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText("You both like: music")).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
  });

  test("typing indicator shows when partner types", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await page2.getByRole("button", { name: /START CHATTING/i }).click();

    await expect(page1.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });

    // User 2 starts typing
    const input2 = page2.getByPlaceholder("Type a message");
    await input2.fill("h");

    // User 1 should see typing indicator (bouncing dots)
    // The typing indicator is rendered as animated spans
    await expect(page1.locator(".animate-bounce").first()).toBeVisible({ timeout: 3000 });

    await context1.close();
    await context2.close();
  });

  test("NEW CHAT button works after disconnect", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    // Match user 1 and 2
    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await page2.getByRole("button", { name: /START CHATTING/i }).click();
    await expect(page1.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });

    // User 1 disconnects
    await page1.getByLabel("Disconnect from chat").click();
    await expect(page1.getByText("You have disconnected")).toBeVisible();

    // User 3 joins
    await page3.goto("/chat");
    await page3.getByRole("button", { name: /START CHATTING/i }).click();

    // User 1 clicks NEW CHAT
    await page1.getByRole("button", { name: /NEW CHAT/i }).click();

    // User 1 and 3 should match
    await expect(page1.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });
    await expect(page3.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
    await context3.close();
  });
});

test.describe("Chat Page - Media Features", () => {
  test("media button is visible when connected", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("/chat");
    await page2.goto("/chat");

    await page1.getByRole("button", { name: /START CHATTING/i }).click();
    await page2.getByRole("button", { name: /START CHATTING/i }).click();

    await expect(page1.getByText("You're now chatting")).toBeVisible({ timeout: 10000 });

    // Media button should be visible
    await expect(page1.getByLabel("Send view-once media")).toBeVisible();

    await context1.close();
    await context2.close();
  });
});
