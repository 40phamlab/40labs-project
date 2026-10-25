import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const viewports = [
  { name: 'Mobile-390', width: 390, height: 844 },
  { name: 'Tablet-768', width: 768, height: 1024 },
  { name: 'Desktop-1920', width: 1920, height: 1080 },
];

const routes = ['/', '/history', '/notifications', '/settings'];

test.describe('Orbit Worker Comprehensive Layout E2E & Measurements', () => {
  for (const vp of viewports) {
    for (const route of routes) {
      test(`measure and assert ${route} at ${vp.width}x${vp.height}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`http://localhost:8081${route}`);

        // Wait for app header to be present
        await page.waitForSelector('[data-testid="app-header"]', { timeout: 10000 });

        const screenshotDir = path.join(process.cwd(), 'e2e/__screenshots__');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }
        const safeRouteName = route === '/' ? 'home' : route.replace('/', '');
        const screenshotPath = path.join(screenshotDir, `${safeRouteName}-${vp.width}x${vp.height}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const nodeMetrics = await page.evaluate(() => {
          const results: any[] = [];
          const headerEl = document.querySelector('[data-testid="app-header"]');
          let current: Element | null = headerEl;

          while (current) {
            const rect = current.getBoundingClientRect();
            const comp = window.getComputedStyle(current);
            results.push({
              tag: current.tagName,
              id: current.id || '',
              className: typeof current.className === 'string' ? current.className : '',
              top: Math.round(rect.top),
              bottom: Math.round(rect.bottom),
              height: Math.round(rect.height),
              paddingTop: comp.paddingTop,
              paddingBottom: comp.paddingBottom,
              marginTop: comp.marginTop,
              marginBottom: comp.marginBottom,
              minHeight: comp.minHeight,
              justifyContent: comp.justifyContent,
              alignItems: comp.alignItems,
              position: comp.position,
            });
            if (current.id === 'root' || current.tagName === 'BODY') break;
            current = current.parentElement;
          }
          return results;
        });

        console.log(`\n=== VIEWPORT: ${vp.width}x${vp.height} | ROUTE: ${route} ===`);
        console.table(nodeMetrics);

        const headerMetrics = await page.evaluate(() => {
          const h = document.querySelector('[data-testid="app-header"]');
          const s = document.querySelector('div[tabindex]') || document.querySelector('div');
          const t = document.querySelector('[data-testid="bottom-tab-bar"]');
          const root = document.querySelector('#root');

          const getInfo = (el: Element | null) => el ? {
            top: Math.round(el.getBoundingClientRect().top),
            bottom: Math.round(el.getBoundingClientRect().bottom),
            height: Math.round(el.getBoundingClientRect().height),
            left: Math.round(el.getBoundingClientRect().left),
            right: Math.round(el.getBoundingClientRect().right),
          } : null;

          return {
            header: getInfo(h),
            scroll: getInfo(s),
            tabBar: getInfo(t),
            root: getInfo(root),
          };
        });

        console.log('Layout Summary:', headerMetrics);

        expect(headerMetrics.header).not.toBeNull();
        expect(Math.abs(headerMetrics.header!.top)).toBeLessThanOrEqual(1);
        expect(Math.abs(headerMetrics.header!.height - 56)).toBeLessThanOrEqual(2);
      });
    }
  }
});
