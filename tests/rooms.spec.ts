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

test.describe("Multi-User Room", () => {
  test("multiple users can join a room and exchange messages", async ({ browser }) => {
    test.setTimeout(90000);

    // Create 3 separate browser contexts (3 different users)
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const ctx3 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();
    const page3 = await ctx3.newPage();

    const roomCode = "TEST42";
    const roomId = "test-multi-user-room";

    // User 1 adds the room
    await page1.goto("/rooms");
    await page1.waitForTimeout(1000);
    await page1.getByPlaceholder("e.g., WOLF42").fill(roomCode);
    await page1.getByPlaceholder("Your name in this room").fill("Alice");
    await page1.getByRole("button", { name: /Add/i }).click();
    await expect(page1.getByText(roomCode)).toBeVisible({ timeout: 5000 });

    // User 2 adds the same room
    await page2.goto("/rooms");
    await page2.waitForTimeout(1000);
    await page2.getByPlaceholder("e.g., WOLF42").fill(roomCode);
    await page2.getByPlaceholder("Your name in this room").fill("Bob");
    await page2.getByRole("button", { name: /Add/i }).click();
    await expect(page2.getByText(roomCode)).toBeVisible({ timeout: 5000 });

    // User 3 adds the same room
    await page3.goto("/rooms");
    await page3.waitForTimeout(1000);
    await page3.getByPlaceholder("e.g., WOLF42").fill(roomCode);
    await page3.getByPlaceholder("Your name in this room").fill("Charlie");
    await page3.getByRole("button", { name: /Add/i }).click();
    await expect(page3.getByText(roomCode)).toBeVisible({ timeout: 5000 });

    // All 3 click into the room
    await page1.getByText(roomCode).first().click();
    await page1.waitForTimeout(2000);
    await page2.getByText(roomCode).first().click();
    await page2.waitForTimeout(2000);
    await page3.getByText(roomCode).first().click();
    await page3.waitForTimeout(2000);

    // User 1 sends a message
    await page1.getByPlaceholder("Type a message").fill("Hello from Alice!");
    await page1.getByLabel("Send message").click();

    // User 2 and 3 should receive it
    await expect(page2.getByText("Hello from Alice!")).toBeVisible({ timeout: 10000 });
    await expect(page3.getByText("Hello from Alice!")).toBeVisible({ timeout: 10000 });

    // User 3 sends a message
    await page3.getByPlaceholder("Type a message").fill("Hey everyone!");
    await page3.getByLabel("Send message").click();

    // User 1 and 2 should receive it
    await expect(page1.getByText("Hey everyone!")).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText("Hey everyone!")).toBeVisible({ timeout: 10000 });

    await ctx1.close();
    await ctx2.close();
    await ctx3.close();
  });
});
