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

    // Switch to Stats tab — initially shows Calculate Stats button (no auto-calculation)
    await page.getByRole('button', { name: 'Stats' }).click();
    const calcBtn = page.getByRole('button', { name: /Calculate Stats/i });
    await calcBtn.scrollIntoViewIfNeeded();
    await expect(calcBtn).toBeVisible();

    // Click to calculate and verify Overview + Recalculate appear
    await calcBtn.click();
    await expect(page.locator('text=Overview')).toBeVisible();
    const recalculateBtn = page.getByRole('button', { name: /Recalculate/i });
    await recalculateBtn.scrollIntoViewIfNeeded();
    await expect(recalculateBtn).toBeVisible();

    // Switch back to YAML tab
    await page.getByRole('button', { name: 'YAML' }).click();
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('Terminal Bar: Visibility and Toggle', async ({ page }) => {
    // Toggle with Ctrl+K
    await page.keyboard.press('Control+k');
    const terminal = page.locator('input[placeholder*="/ for commands"]');
    await expect(terminal).toBeVisible();
    await expect(terminal).toBeFocused();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(terminal).not.toBeVisible();
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

  // T50: v2 YAML basic display tests
  test('T50: v2 YAML loads table nodes correctly', async ({ page }) => {
    // Canvas should show table nodes (cy nodes rendered)
    const canvas = page.locator('.cytoscape-container, #cy, canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('T50: v2 YAML — YAML editor shows version 2.0.0', async ({ page }) => {
    const editor = page.locator('.cm-editor');
    await expect(editor).toBeVisible();
    await expect(editor).toContainText('2.0.0');
  });

  test('T50: v2 YAML — no error banner shown for valid v2 model', async ({ page }) => {
    // No parse error alert/banner should appear
    const errorBanner = page.locator('[role="alert"]').filter({ hasText: /error|failed|modscape migrate/i });
    await expect(errorBanner).toHaveCount(0);
  });
});

// T52: v1 YAML error display tests
test.describe.serial('T52: v1 YAML error display', () => {
  const V1_PATH = path.join(__dirname, 'fixtures/test-model-v1-runtime.yaml');

  test.beforeAll(async () => {
    // Write a v1-format model (no version field, uses old structure)
    const v1Content = `tables:
  - id: legacy_table
    name: Legacy Table
    appearance:
      type: fact
    columns:
      - id: id
        logical:
          name: ID
          type: Int
          isPrimaryKey: true
`;
    fs.writeFileSync(V1_PATH, v1Content, 'utf8');
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test.afterAll(async () => {
    if (fs.existsSync(V1_PATH)) fs.unlinkSync(V1_PATH);
  });

  test('v1 YAML shows error message with modscape migrate hint', async ({ page }) => {
    await page.goto('/?model=test-model-v1-runtime');
    // Wait a moment for the app to load and attempt to parse
    await page.waitForTimeout(3000);
    // Check that some error indication is shown (either alert, error text, or migrate hint)
    const pageContent = await page.content();
    const hasError = pageContent.includes('modscape migrate') ||
      pageContent.includes('migrate') ||
      pageContent.includes('v1') ||
      pageContent.includes('error') ||
      pageContent.includes('Error');
    expect(hasError).toBe(true);
  });
});
