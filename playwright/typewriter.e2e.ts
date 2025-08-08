import { test, expect } from '@playwright/test';

test.describe('Typewriter E2E', () => {
  let warnings: string[] = [];

  test.beforeEach(({ page }) => {
    warnings = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && /duplicate key/i.test(msg.text())) {
        warnings.push(msg.text());
      }
    });
  });

  test.afterEach(() => {
    expect(warnings).toEqual([]);
  });

  test('NoScroll-Stress: 1000 lines with no scrollbars and active input visible', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.focus('#hidden-input');
    for (let i = 0; i < 1000; i++) {
      await page.keyboard.type('a');
      await page.keyboard.press('Enter');
    }
    await page.waitForSelector('[data-testid="active-line"]');
    await page.waitForTimeout(100);

    const activeBox = await page.locator('[data-testid="active-line"]').boundingBox();
    const height = await page.evaluate(() => window.innerHeight);
    expect((activeBox?.bottom ?? 0)).toBeLessThanOrEqual(height);

    const noScrollbars = await page.evaluate(() => {
      const stack = document.querySelector('.line-stack') as HTMLElement;
      const stackStyle = getComputedStyle(stack);
      const docStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      return (
        stackStyle.overflowY === 'hidden' &&
        docStyle.overflowY !== 'scroll' &&
        bodyStyle.overflowY !== 'scroll' &&
        window.scrollY === 0
      );
    });
    expect(noScrollbars).toBe(true);

    expect(errors.some(e => /key/i.test(e))).toBeFalsy();
  });

  test('Responsive: viewport and font changes keep visible length in sync', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 600 });
    await page.goto('/');
    await page.focus('#hidden-input');
    await page.waitForTimeout(500);
    for (let i = 0; i < 200; i++) {
      await page.keyboard.type(`line${i}`);
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(200);

    const checkCounts = async () => {
      return page.evaluate(() => {
        const stack = document.querySelector('.line-stack') as HTMLElement;
        const line = stack.querySelector('div') as HTMLElement;
        const lh = parseFloat(getComputedStyle(line).lineHeight);
        const maxVisible = Math.floor(stack.clientHeight / lh);
        return { visible: stack.children.length, maxVisible };
      });
    };

    let counts = await checkCounts();
    expect(counts.visible).toBe(counts.maxVisible);

    await page.setViewportSize({ width: 1000, height: 900 });
    await page.waitForTimeout(200);
    counts = await checkCounts();
    expect(counts.visible).toBe(counts.maxVisible);

    await page.evaluate(() => {
      const container = document.querySelector('.writing-container') as HTMLElement;
      container.style.fontSize = '12px';
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(200);
    counts = await checkCounts();
    expect(counts.visible).toBe(counts.maxVisible);
  });

  test('Navigation: arrow keys move slice without native scroll and Escape resumes typing', async ({ page }) => {
    await page.goto('/');
    await page.focus('#hidden-input');
    for (let i = 0; i < 50; i++) {
      await page.keyboard.type(`line${i}`);
      await page.keyboard.press('Enter');
    }

    const noScroll = async () => {
      return page.evaluate(() => {
        const stack = document.querySelector('.line-stack') as HTMLElement;
        const stackStyle = getComputedStyle(stack);
        const docStyle = getComputedStyle(document.documentElement);
        const bodyStyle = getComputedStyle(document.body);
        return (
          stackStyle.overflowY === 'hidden' &&
          docStyle.overflowY !== 'scroll' &&
          bodyStyle.overflowY !== 'scroll' &&
          window.scrollY === 0
        );
      });
    };

    await page.waitForTimeout(100);
    expect(await noScroll()).toBe(true);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    expect(await noScroll()).toBe(true);

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    expect(await noScroll()).toBe(true);

    await page.keyboard.press('Escape');
    await page.keyboard.type('b');
    const activeLineContent = await page.evaluate(
      () => (document.getElementById('hidden-input') as HTMLTextAreaElement).value,
    );
    expect(activeLineContent).toBe('b');
    expect(await noScroll()).toBe(true);
  });
});
