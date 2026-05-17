import { test, expect } from '../fixtures';

test.describe('Projects', () => {
  test('create project — appears in project list', async ({ authedPage }) => {
    const page = authedPage;
    const name = `E2E Project ${Date.now()}`;

    await page.goto('/projects');
    await page.getByRole('button', { name: /new project|create project/i }).click();

    await page.getByLabel(/project name|name/i).fill(name);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    await expect(page.getByText(name)).toBeVisible();
  });

  test('open project navigates to board or backlog', async ({ authedPage }) => {
    const page = authedPage;
    const name = `Nav Project ${Date.now()}`;

    await page.goto('/projects');
    await page.getByRole('button', { name: /new project|create project/i }).click();
    await page.getByLabel(/project name|name/i).fill(name);
    await page.getByRole('button', { name: /create|save/i }).last().click();

    await page.getByText(name).click();
    await expect(page).toHaveURL(/projects\/.+\/(board|backlog|issues)/);
  });

  test('update project name', async ({ authedPage }) => {
    const page = authedPage;
    const original = `Update Me ${Date.now()}`;
    const updated = `Updated ${Date.now()}`;

    await page.goto('/projects');
    await page.getByRole('button', { name: /new project|create project/i }).click();
    await page.getByLabel(/project name|name/i).fill(original);
    await page.getByRole('button', { name: /create|save/i }).last().click();
    await page.getByText(original).click();

    await page.getByRole('link', { name: /settings/i }).click();
    await page.getByLabel(/project name|name/i).fill(updated);
    await page.getByRole('button', { name: /save|update/i }).click();

    await expect(page.getByText(updated)).toBeVisible();
  });

  test('delete project removes it from list', async ({ authedPage }) => {
    const page = authedPage;
    const name = `Delete Me ${Date.now()}`;

    await page.goto('/projects');
    await page.getByRole('button', { name: /new project|create project/i }).click();
    await page.getByLabel(/project name|name/i).fill(name);
    await page.getByRole('button', { name: /create|save/i }).last().click();
    await page.getByText(name).click();

    await page.getByRole('link', { name: /settings/i }).click();
    await page.getByRole('button', { name: /delete project/i }).click();
    await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

    await page.waitForURL(/\/projects$/);
    await expect(page.getByText(name)).not.toBeVisible();
  });
});
