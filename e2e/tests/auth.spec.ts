import { test, expect } from '../fixtures';
import { registerUser } from '../fixtures';

const uid = () => String(Date.now());

test.describe('Auth', () => {
  test('register — new user lands on projects page', async ({ page, request }) => {
    const tag = uid();
    await page.goto('/register');
    await page.getByLabel(/name/i).fill(`E2E ${tag}`);
    await page.getByLabel(/email/i).fill(`reg_${tag}@test.com`);
    await page.getByLabel(/password/i).fill('testpass123');
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    await page.waitForURL(/\/(projects|dashboard)?$/);
    await expect(page).not.toHaveURL(/login/);
  });

  test('login — correct credentials authenticate user', async ({ page, request }) => {
    const u = await registerUser(request, uid());
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(u.email);
    await page.getByLabel(/password/i).fill(u.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(projects|dashboard)?$/);
    await expect(page).not.toHaveURL(/login/);
  });

  test('login — wrong password shows error', async ({ page, request }) => {
    const u = await registerUser(request, uid());
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(u.email);
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByRole('alert').or(page.getByText(/invalid|incorrect|wrong/i))).toBeVisible();
  });

  test('cookie auth persists across page reload', async ({ authedPage }) => {
    await authedPage.reload();
    await expect(authedPage).not.toHaveURL(/login/);
  });

  test('logout clears session and redirects to login', async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /logout|sign out/i }).click();
    await authedPage.waitForURL(/login/);
    await authedPage.reload();
    await expect(authedPage).toHaveURL(/login/);
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/login/);
  });
});
