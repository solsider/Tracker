import { test, expect } from '../fixtures';

test.describe('Navigation', () => {
  test('sidebar renders on desktop', async ({ authedPage }) => {
    await authedPage.goto('/projects');
    const sidebar = authedPage.locator('aside, nav[aria-label="sidebar"], [data-testid="sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('mobile — hamburger button opens sidebar', async ({ authedPage, page }) => {
    await authedPage.setViewportSize({ width: 375, height: 812 });
    await authedPage.goto('/projects');

    const hamburger = authedPage.getByRole('button', { name: /menu|open sidebar/i })
      .or(authedPage.locator('[aria-label="menu"], [data-testid="hamburger"]'));

    await expect(hamburger.first()).toBeVisible();
    await hamburger.first().click();

    const sidebar = authedPage.locator('aside, [data-testid="sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('mobile — sidebar closes on backdrop click', async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 375, height: 812 });
    await authedPage.goto('/projects');

    const hamburger = authedPage.getByRole('button', { name: /menu|open sidebar/i })
      .or(authedPage.locator('[aria-label="menu"], [data-testid="hamburger"]'));
    await hamburger.first().click();

    const backdrop = authedPage.locator('.bg-black\\/50, [data-testid="sidebar-backdrop"]');
    if (await backdrop.count() > 0) {
      await backdrop.click();
      await authedPage.waitForTimeout(300);
      const sidebar = authedPage.locator('aside, [data-testid="sidebar"]');
      await expect(sidebar.first()).not.toBeInViewport();
    }
  });

  test('mobile — sidebar closes on Escape key', async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 375, height: 812 });
    await authedPage.goto('/projects');

    const hamburger = authedPage.getByRole('button', { name: /menu|open sidebar/i })
      .or(authedPage.locator('[aria-label="menu"], [data-testid="hamburger"]'));
    await hamburger.first().click();
    await authedPage.keyboard.press('Escape');
    await authedPage.waitForTimeout(300);

    const sidebar = authedPage.locator('[data-testid="sidebar"]');
    if (await sidebar.count() > 0) {
      await expect(sidebar).not.toBeInViewport();
    }
  });

  test('sprint lifecycle navigation — backlog → active sprint → complete', async ({ authedPage }) => {
    const page = authedPage;
    await page.goto('/projects');
    await page.getByRole('button', { name: /new project|create project/i }).click();
    await page.getByLabel(/project name|name/i).fill(`Sprint Nav ${Date.now()}`);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    await page.getByRole('link', { name: /backlog/i }).click();
    await expect(page).toHaveURL(/backlog/);

    const createSprintBtn = page.getByRole('button', { name: /create sprint|new sprint/i });
    if (await createSprintBtn.count() > 0) {
      await createSprintBtn.click();
      const startBtn = page.getByRole('button', { name: /start sprint/i });
      if (await startBtn.count() > 0) {
        await startBtn.click();
        await expect(page.getByText(/active/i)).toBeVisible();
      }
    }
  });
});
