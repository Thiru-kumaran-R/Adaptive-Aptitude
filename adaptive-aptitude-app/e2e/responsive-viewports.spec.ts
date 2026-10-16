// e2e/responsive-viewports.spec.ts
import { test, expect } from './fixtures';

test.describe('Responsive Viewports & Overflow Regression (ACC-15 & Section 47)', () => {
  const boundaryWidths = [320, 639, 640, 767, 768, 1023, 1024, 1920, 2560];

  for (const width of boundaryWidths) {
    test(`verifies zero horizontal overflow and responsive chrome at ${width}px`, async ({
      page,
      seedAuthenticatedSession,
    }) => {
      await seedAuthenticatedSession();
      await page.setViewportSize({ width, height: 1080 });

      // 1. Visit main dashboard
      await page.goto('/app/dashboard');
      await expect(page.getByRole('heading', { name: /Learner Dashboard/i })).toBeVisible();

      // Zero Horizontal Page Overflow Assertion:
      // document.documentElement.scrollWidth must never exceed window.innerWidth
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalOverflow).toBe(false);

      // 2. Responsive Navigation Assertions
      if (width < 640) {
        // Mobile viewport: Bottom navigation must be visible
        await expect(page.getByRole('navigation', { name: /Mobile bottom navigation/i })).toBeVisible();
        // Desktop sidebar must be hidden
        await expect(page.getByRole('navigation', { name: /Sidebar navigation/i })).toHaveCount(0);
      } else if (width >= 1024) {
        // Desktop viewport: Desktop sidebar must be visible
        await expect(page.getByRole('navigation', { name: /Sidebar navigation/i })).toBeVisible();
        // Mobile bottom navigation must be hidden
        await expect(page.getByRole('navigation', { name: /Mobile bottom navigation/i })).toHaveCount(0);
      }

      // 3. Exam Chrome Isolation at every width (Record 15)
      await page.goto('/app/mock-exams/mock-session-e2e-777');
      await expect(page.getByTestId('active-mock-session-page')).toBeVisible();

      // Exam chrome maintains distraction-free canvas without standard sidebar or bottom navigation
      await expect(page.getByRole('navigation', { name: /Sidebar navigation/i })).toHaveCount(0);
      await expect(page.getByRole('navigation', { name: /Mobile bottom navigation/i })).toHaveCount(0);

      // Exam canvas also has zero horizontal overflow
      const examHasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(examHasOverflow).toBe(false);
    });
  }
});
