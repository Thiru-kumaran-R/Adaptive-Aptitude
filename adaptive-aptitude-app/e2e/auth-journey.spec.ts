// e2e/auth-journey.spec.ts
import { test, expect } from './fixtures';

test.describe('Authentication Journey (SEC-01–17 & Same-Origin Auth)', () => {
  test('executes public registration, login, token rotation, and HttpOnly probe', async ({
    page,
    context,
    getFetchObservations,
  }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Master Quantitative Reasoning/i })).toBeVisible();

    // 2. Navigate to Registration
    await page.getByRole('link', { name: /Create Account/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible();

    // Fill registration form
    await page.getByLabel(/Full Name/i).fill('Test Learner');
    await page.getByLabel(/Email Address/i).fill('learner@example.com');
    await page.getByLabel(/Password/i).fill('StrongPassword123!');
    await page.getByRole('button', { name: /Register/i }).click();

    // Registration navigates to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible();

    // 3. Perform login
    await page.getByLabel(/Email Address/i).fill('learner@example.com');
    await page.getByLabel(/Password/i).fill('StrongPassword123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Authenticated state transitions into /app/dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByRole('heading', { name: /Learner Dashboard/i })).toBeVisible();

    // 4. Verify Same-Origin and Browser Credentials via Fetch Observer
    const observations = await getFetchObservations();
    expect(observations.length).toBeGreaterThan(0);

    for (const obs of observations) {
      // Must be same-origin resolution
      expect(obs.url.startsWith('http://127.0.0.1:5173/api/v1/')).toBe(true);
      // Native credentials mode must be include
      expect(obs.credentials).toBe('include');
      // No client script injected or synthesized Origin header
      expect(obs.hasOriginHeader).toBe(false);
    }

    // 5. Privileged Cookie Jar Inspection
    const refreshCookies = await context.cookies('http://127.0.0.1:5173/api/v1/auth/refresh');
    const refreshCookie = refreshCookies.find((c) => c.name === 'refreshToken');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);
    expect(refreshCookie?.sameSite).toBe('Strict');
    expect(refreshCookie?.path).toBe('/api/v1/auth/refresh');

    // Verify path isolation (cookie is not attached to non-matching paths)
    const meCookies = await context.cookies('http://127.0.0.1:5173/api/v1/auth/me');
    expect(meCookies.find((c) => c.name === 'refreshToken')).toBeUndefined();

    // 6. HttpOnly Probe Page: JavaScript unreadability at matching path
    const probePage = await context.newPage();
    await probePage.route('http://127.0.0.1:5173/api/v1/auth/refresh', async (route) => {
      // Return inert HTML to test client document.cookie in isolation
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><div id="probe">probe</div></body></html>',
      });
    });

    await probePage.goto('http://127.0.0.1:5173/api/v1/auth/refresh');
    // Set a non-HttpOnly control cookie
    await probePage.evaluate(() => {
      document.cookie = 'controlCookie=visible; path=/api/v1/auth/refresh';
    });

    const cookieString = await probePage.evaluate(() => document.cookie);
    expect(cookieString).toContain('controlCookie=visible');
    // Refresh token is completely shielded from document.cookie
    expect(cookieString).not.toContain('refreshToken');
    await probePage.close();

    // 7. Token Rotation on Page Reload
    // Reload clears in-memory closure token, triggering silent bootstrap refresh
    await page.reload();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByRole('heading', { name: /Learner Dashboard/i })).toBeVisible();

    // 8. Logout Journey
    await page.getByRole('button', { name: /Account Settings/i }).click();
    await expect(page).toHaveURL(/\/app\/profile/);
    await page.getByRole('button', { name: /Sign Out/i }).first().click();

    // Session cleared -> redirected to login
    await expect(page).toHaveURL(/\/login/);
    const postLogoutCookies = await context.cookies('http://127.0.0.1:5173/api/v1/auth/refresh');
    expect(postLogoutCookies.find((c) => c.name === 'refreshToken')).toBeUndefined();
  });
});
