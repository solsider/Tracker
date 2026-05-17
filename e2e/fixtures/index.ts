import { test as base, expect, Page, APIRequestContext } from '@playwright/test';

const API = process.env.API_URL ?? 'http://localhost:3001';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export async function registerUser(
  request: APIRequestContext,
  suffix?: string,
): Promise<TestUser> {
  const tag = suffix ?? String(Date.now());
  const user: TestUser = {
    email: `e2e_${tag}@test.com`,
    password: 'testpass123',
    name: `E2E User ${tag}`,
  };

  const res = await request.post(`${API}/auth/register`, { data: user });
  if (!res.ok()) {
    throw new Error(`Registration failed: ${await res.text()}`);
  }
  return user;
}

export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/(projects|dashboard)?$/);
}

export async function loginViaAPI(
  request: APIRequestContext,
  user: TestUser,
): Promise<string[]> {
  const res = await request.post(`${API}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) throw new Error('Login via API failed');
  const headers = res.headers();
  const setCookie = headers['set-cookie'] ?? '';
  return setCookie.split(',').map((c) => c.trim());
}

type AuthFixtures = { authedPage: Page; user: TestUser };

export const test = base.extend<AuthFixtures>({
  user: async ({ request }, use) => {
    const u = await registerUser(request, String(Date.now()));
    await use(u);
  },

  authedPage: async ({ page, user }, use) => {
    await loginViaUI(page, user.email, user.password);
    await use(page);
  },
});

export { expect };
