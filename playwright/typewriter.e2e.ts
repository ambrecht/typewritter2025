import { test, expect } from '@playwright/test';

test.describe('Typewriter E2E', () => {
  test('stress test: 500 lines keep input visible without scrollbars', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.focus('#hidden-input');
    for (let i = 0; i < 500; i++) {
      await page.keyboard.type('a');
      await page.keyboard.press('Enter');
    }

    const activeBox = await page.locator('[data-testid="active-line"]').boundingBox();
    const height = await page.evaluate(() => window.innerHeight);
    expect(activeBox?.bottom).toBeLessThanOrEqual(height);

    const hasNoScrollbar = await page.evaluate(() => {
      const el = document.querySelector('.line-stack') as HTMLElement;
      return el.scrollHeight === el.clientHeight;
    });
    expect(hasNoScrollbar).toBe(true);

    expect(errors.some(e => /key/i.test(e))).toBeFalsy();
  });

  test('resize recalculates maxVisible and keeps layout stable', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 500 });
    await page.goto('/');
    await page.focus('#hidden-input');
    for (let i = 0; i < 100; i++) {
      await page.keyboard.type(`line${i}`);
      await page.keyboard.press('Enter');
    }

    await expect(page.locator('.line-stack > div')).toHaveCount(20);

    await page.setViewportSize({ width: 1000, height: 1000 });
    await page.waitForTimeout(100);
    const countAfter = await page.locator('.line-stack > div').count();
    expect(countAfter).toBeGreaterThan(20);
  });

  test('arrow navigation shifts slice without introducing scrollbars', async ({ page }) => {
    await page.goto('/');
    await page.focus('#hidden-input');
    for (let i = 0; i < 100; i++) {
      await page.keyboard.type(`line${i}`);
      await page.keyboard.press('Enter');
    }

    const visibleCount = await page.locator('.line-stack > div').count();
    const firstLineBefore = await page.locator('.line-stack > div').first().innerText();
    const noScrollBefore = await page.evaluate(() => {
      const el = document.querySelector('.line-stack') as HTMLElement;
      return el.scrollHeight === el.clientHeight;
    });
    expect(noScrollBefore).toBe(true);

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');

    await expect(page.locator('.line-stack > div')).toHaveCount(visibleCount);
    const firstLineAfter = await page.locator('.line-stack > div').first().innerText();
    expect(firstLineAfter).not.toBe(firstLineBefore);
    const noScrollDuring = await page.evaluate(() => {
      const el = document.querySelector('.line-stack') as HTMLElement;
      return el.scrollHeight === el.clientHeight;
    });
    expect(noScrollDuring).toBe(true);

    await page.keyboard.press('ArrowDown');
    const firstLineDown = await page.locator('.line-stack > div').first().innerText();
    expect(firstLineDown).toBe(firstLineBefore);
    const noScrollAfter = await page.evaluate(() => {
      const el = document.querySelector('.line-stack') as HTMLElement;
      return el.scrollHeight === el.clientHeight;
    });
    expect(noScrollAfter).toBe(true);
  });
});
