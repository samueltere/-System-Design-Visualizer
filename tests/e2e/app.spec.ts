import { test, expect } from '@playwright/test';

test.describe('System Design Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/System Design Visualizer/);
    await expect(page.getByRole('heading', { name: 'SystemViz' })).toBeVisible();
  });

  test('should show simulation panel', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Simulation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Launch Simulation' })).toBeVisible();
  });

  test('should show sidebar with components', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Components' })).toBeVisible();
    await expect(page.getByText('API Server', { exact: true })).toBeVisible();
    await expect(page.getByText('Database', { exact: true })).toBeVisible();
  });
});
