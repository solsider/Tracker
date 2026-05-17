import { test, expect } from '../fixtures';

async function createProject(page: import('@playwright/test').Page, name: string) {
  await page.goto('/projects');
  await page.getByRole('button', { name: /new project|create project/i }).click();
  await page.getByLabel(/project name|name/i).fill(name);
  await page.getByRole('button', { name: /create|save/i }).last().click();
  await page.getByText(name).click();
  await expect(page).toHaveURL(/projects\/.+\/(board|backlog|issues)/);
}

test.describe('Issues', () => {
  test('create issue — appears on board', async ({ authedPage }) => {
    const page = authedPage;
    const title = `Issue ${Date.now()}`;

    await createProject(page, `P ${Date.now()}`);

    await page.getByRole('button', { name: /new issue|create issue|add issue/i }).click();
    await page.getByLabel(/title|issue title/i).fill(title);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    await expect(page.getByText(title)).toBeVisible();
  });

  test('open issue drawer shows detail panel', async ({ authedPage }) => {
    const page = authedPage;
    const title = `Drawer Test ${Date.now()}`;

    await createProject(page, `P ${Date.now()}`);
    await page.getByRole('button', { name: /new issue|create issue|add issue/i }).click();
    await page.getByLabel(/title|issue title/i).fill(title);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    await page.getByText(title).click();
    await expect(page.getByRole('dialog').or(page.locator('[data-testid="issue-drawer"]'))).toBeVisible();
  });

  test('update issue title in drawer', async ({ authedPage }) => {
    const page = authedPage;
    const original = `Original ${Date.now()}`;
    const updated = `Updated ${Date.now()}`;

    await createProject(page, `P ${Date.now()}`);
    await page.getByRole('button', { name: /new issue|create issue|add issue/i }).click();
    await page.getByLabel(/title|issue title/i).fill(original);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    await page.getByText(original).click();
    const titleField = page.getByRole('dialog').getByRole('textbox').first();
    await titleField.clear();
    await titleField.fill(updated);
    await titleField.press('Enter');

    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByText(updated)).toBeVisible();
  });

  test('add comment on issue', async ({ authedPage }) => {
    const page = authedPage;
    const title = `Comment Target ${Date.now()}`;
    const comment = `Hello from E2E ${Date.now()}`;

    await createProject(page, `P ${Date.now()}`);
    await page.getByRole('button', { name: /new issue|create issue|add issue/i }).click();
    await page.getByLabel(/title|issue title/i).fill(title);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    await page.getByText(title).click();

    const commentBox = page.getByPlaceholder(/add a comment|write a comment/i);
    await commentBox.fill(comment);
    await page.getByRole('button', { name: /submit|post|send/i }).click();

    await expect(page.getByText(comment)).toBeVisible();
  });

  test('delete issue removes it from board', async ({ authedPage }) => {
    const page = authedPage;
    const title = `Delete Issue ${Date.now()}`;

    await createProject(page, `P ${Date.now()}`);
    await page.getByRole('button', { name: /new issue|create issue|add issue/i }).click();
    await page.getByLabel(/title|issue title/i).fill(title);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    await page.getByText(title).click();
    await page.getByRole('button', { name: /delete issue/i }).click();
    await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

    await expect(page.getByText(title)).not.toBeVisible();
  });
});
