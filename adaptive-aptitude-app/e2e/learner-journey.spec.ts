// e2e/learner-journey.spec.ts
import { test, expect } from './fixtures';

test.describe('Learner Journey (Dashboard, Prescriptions, Adaptive, Revision, Analytics)', () => {
  test('exercises full learner journey with attribution lifecycle and zero optimistic state', async ({
    page,
    seedAuthenticatedSession,
    apiState,
  }) => {
    // 1. Start session in authenticated mode via HttpOnly refresh cookie
    await seedAuthenticatedSession();
    await page.goto('/app/dashboard');

    // 2. Dashboard loaded with authoritative server state
    await expect(page.getByRole('heading', { name: /Learner Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Target 99th Percentile Quant/i)).toBeVisible();

    // 3. Next Action Card & Attribution Lifecycle (Ops 64, 56, 57)
    const nextActionCard = page.getByTestId('next-action-card');
    await expect(nextActionCard).toBeVisible();
    await expect(nextActionCard.getByText(/Percentages/i).first()).toBeVisible();

    // Click "Start Next Action" -> triggers Op 64 Issuance then Op 56 Activation
    await page.getByRole('button', { name: /Start Next Action/i }).click();

    // Verify prescription issuance & activation occurred
    await expect.poll(() => Array.from(apiState.issuedPrescriptions.values())[0]?.status).toBe('active');
    const [prescription] = Array.from(apiState.issuedPrescriptions.values());
    expect(prescription.originSurface).toBe('next_action');

    // Navigation into the prescribed practice route occurs
    await expect(page).toHaveURL(/\/app\/practice\/Arithmetic\/Percentages/);
    await expect(page.getByRole('heading', { name: /Percentages/i })).toBeVisible();

    // 4. Adaptive Practice Flow & ACC-09 (Zero Optimistic State)
    await page.goto('/app/adaptive');
    await expect(page.getByRole('heading', { name: /Adaptive Practice Session/i })).toBeVisible();

    // Question options are available
    const optionButton = page.getByRole('radio', { name: /4% decrease/i });
    await expect(optionButton).toBeVisible();

    // Select option
    await optionButton.click();
    await expect(optionButton).toHaveAttribute('aria-checked', 'true');

    // Zero Optimistic State: Before clicking submit, correctness is NEVER rendered
    expect(await page.locator('text=Correct').count()).toBe(0);
    expect(await page.locator('text=Incorrect').count()).toBe(0);

    // Submit answer to backend
    await page.getByRole('button', { name: /Submit Answer/i }).click();

    // After authoritative response returns, feedback is displayed
    await expect(page.getByText(/Correct/i).first()).toBeVisible();
    await expect(page.getByText(/Net change = 1.2 \* 0.8/i)).toBeVisible();

    // 5. Spaced Revision Queue
    await page.goto('/app/revision');
    await expect(page.getByRole('heading', { name: /Spaced Retention Practice/i })).toBeVisible();
    await expect(page.getByText(/Percentages/i).first()).toBeVisible();
    await expect(page.getByText(/Due Today/i).first()).toBeVisible();

    // 6. Analytics Dashboard & Accessible SVGs (ACC-15)
    await page.goto('/app/analytics');
    await expect(page.getByRole('heading', { name: /Cognitive Analytics & Readiness/i })).toBeVisible();

    // Verify accessible SVG diagnostic components
    const svgElements = page.locator('svg[role="img"]');
    await expect(svgElements.first()).toBeVisible();
    const svgCount = await svgElements.count();
    expect(svgCount).toBeGreaterThan(0);

    // Verify Readiness meter
    await expect(page.getByText(/Exam Readiness/i).first()).toBeVisible();
    await expect(page.getByText('88%', { exact: true })).toBeVisible();
  });
});
