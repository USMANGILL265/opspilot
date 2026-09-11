import { expect, test } from '@playwright/test';

test('logs in successfully with admin credentials', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('admin@opspilot.com');
  await page.locator('input[type="password"]').fill('AdminPass123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/dashboard/);
});

test('shows an error for wrong credentials', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('admin@opspilot.com');
  await page.locator('input[type="password"]').fill('WrongPass123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Invalid email or password')).toBeVisible();
});
