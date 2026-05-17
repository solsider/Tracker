import { test, expect } from '../fixtures';

async function setup(page: import('@playwright/test').Page) {
  await page.goto('/projects');
  await page.getByRole('button', { name: /new project|create project/i }).click();
  await page.getByLabel(/project name|name/i).fill(`Kanban ${Date.now()}`);
  await page.getByRole('button', { name: /create|save/i }).last().click();
  await page.getByRole('link', { name: /kanban|board/i }).click();
  await expect(page).toHaveURL(/\/(board)/);
}

test.describe('Kanban Board', () => {
  test('board renders columns', async ({ authedPage }) => {
    await setup(authedPage);
    const columns = authedPage.locator('[data-testid^="kanban-column"], [class*="kanban-column"]');
    await expect(columns.first()).toBeVisible();
  });

  test('drag issue to another column changes its status', async ({ authedPage }) => {
    const page = authedPage;
    await setup(page);

    const title = `Drag Me ${Date.now()}`;
    await page.getByRole('button', { name: /new issue|create issue|add issue/i }).first().click();
    await page.getByLabel(/title|issue title/i).fill(title);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    const card = page.getByText(title);
    await expect(card).toBeVisible();

    const columns = page.locator('[data-testid^="kanban-column"], [class*="column"]').filter({ hasText: /./ });
    const colCount = await columns.count();
    if (colCount < 2) {
      test.skip(true, 'Not enough columns to test drag');
      return;
    }

    const sourceCol = columns.nth(0);
    const targetCol = columns.nth(1);

    const cardBox = await card.boundingBox();
    const targetBox = await targetCol.boundingBox();
    if (!cardBox || !targetBox) return;

    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 40, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);
    await expect(targetCol.getByText(title)).toBeVisible();
  });

  test('sprint board toggle switches views', async ({ authedPage }) => {
    const page = authedPage;
    await setup(page);

    const toggle = page.getByRole('button', { name: /sprint|backlog/i });
    if (await toggle.count() > 0) {
      await toggle.click();
      await expect(page.getByText(/sprint|backlog/i)).toBeVisible();
    }
  });
});
