import { test, expect } from '@playwright/test';
import { waitForLiveSync } from './utils/helpers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.join(__dirname, 'fixtures/test-model.yaml');
const RUNTIME_PATH = path.join(__dirname, 'fixtures/test-model-runtime.yaml');

test.describe.serial('Modscape Main E2E Suite', () => {
  let originalContent: string;

  test.beforeAll(async () => {
    originalContent = fs.readFileSync(FIXTURE_PATH, 'utf8');
    fs.writeFileSync(RUNTIME_PATH, originalContent, 'utf8');
    // Basic wait for server
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?model=test-model-runtime');
    // Simplified wait: just wait for the UI to be ready, don't strictly require nodes
    const liveBadge = page.locator('span:has-text("Live")').first();
    await expect(liveBadge).toBeVisible({ timeout: 25000 });
  });

  test.afterAll(async () => {
    if (fs.existsSync(RUNTIME_PATH)) {
      fs.unlinkSync(RUNTIME_PATH);
    }
  });

  test('Sidebar: Elements and Tab Switching', async ({ page }) => {
    const sidebar = page.locator('.sidebar-content').first();
    await expect(sidebar.locator('h1:has-text("Modscape")')).toBeVisible();

    // Default tab should be YAML viewer
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Switch to Stats tab
    await page.getByRole('button', { name: 'Stats' }).click();
    await expect(page.locator('text=Overview')).toBeVisible();

    // Switch back to YAML tab
    await page.getByRole('button', { name: 'YAML' }).click();
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('Command Palette: Visibility and Toggle', async ({ page }) => {
    // Toggle with Ctrl+K
    await page.keyboard.press('Control+k');
    const palette = page.locator('input[placeholder*="select * | mv Core"]');
    await expect(palette).toBeVisible();
    await expect(palette).toBeFocused();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(palette).not.toBeVisible();
  });

  test('Visual: Sidebar snapshot', async ({ page }) => {
    await page.addStyleTag({ content: '::-webkit-scrollbar { display: none !important; }' });
    const sidebar = page.locator('.sidebar-content').first();
    await expect(sidebar).toHaveScreenshot('sidebar-main.png', {
      mask: [page.locator('text=/Modscape v/i'), page.locator('text=/Live/i')],
      maxDiffPixelRatio: 0.2,
      threshold: 0.5
    });
  });
});
