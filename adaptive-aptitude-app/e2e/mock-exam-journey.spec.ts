// e2e/mock-exam-journey.spec.ts
import { test, expect } from './fixtures';

test.describe('Mock Examination Journey (ACC-10, ACC-11, ACC-12)', () => {
  test('launches mock exam, verifies sealed questions (ACC-10), submits, and tests abandoned exam isolation (ACC-12)', async ({
    page,
    seedAuthenticatedSession,
  }) => {
    // 1. Authenticate and visit mock exams catalog
    await seedAuthenticatedSession();
    await page.goto('/app/mock-exams');

    await expect(page.getByRole('heading', { name: /Mock Examination Catalog/i })).toBeVisible();
    await expect(page.getByText(/Full-Length Quant Mock Exam/i)).toBeVisible();

    // 2. Launch Mock Exam
    await page.getByRole('button', { name: /Launch Mock Exam/i }).click();

    // Modal confirmation opens
    await expect(page.getByRole('dialog', { name: /Launch Full-Length Quant Mock Exam/i })).toBeVisible();
    await page.getByRole('button', { name: /Begin Examination/i }).click();

    // 3. Active Mock Session (Distraction-Free Environment)
    await expect(page).toHaveURL(/\/app\/mock-exams\/mock-session-e2e-777/);
    await expect(page.getByTestId('active-mock-session-page')).toBeVisible();

    // Distraction-free: standard sidebar navigation is sealed/hidden
    await expect(page.getByRole('navigation', { name: /Main navigation/i })).toHaveCount(0);

    // ACC-10: Anti-Leakage Assertion
    // Sealed active mock question MUST NOT contain answers, solutions, or explanations in DOM
    const htmlContent = await page.content();
    expect(htmlContent).not.toContain('X = 5');
    expect(htmlContent).not.toContain('Subtract 5');
    expect(htmlContent).not.toContain('correctAnswer');
    expect(htmlContent).not.toContain('isCorrect');

    // ExamTimer mirrors backend duration
    await expect(page.getByRole('timer')).toBeVisible();

    // Answer Question 1
    const opt5 = page.getByRole('radio', { name: '5' });
    await opt5.click();
    await expect(opt5).toHaveAttribute('aria-checked', 'true');

    // 4. Submit Examination
    await page.getByRole('button', { name: /Submit Exam/i }).click();
    await expect(page.getByRole('dialog', { name: /Confirm Exam Submission/i })).toBeVisible();
    await page.getByRole('button', { name: /Yes, Submit Exam/i }).click();

    // Navigates to authoritative Score Report
    await expect(page).toHaveURL(/\/app\/mock-exams\/mock-session-e2e-777\/result/);
    await expect(page.getByRole('heading', { name: /Examination Score Report/i })).toBeVisible();
    await expect(page.getByText(/95th/i)).toBeVisible(); // Percentile

    // 5. Post-Exam Diagnostic Review
    await page.getByRole('button', { name: /Review Questions & Solutions/i }).first().click();
    await expect(page).toHaveURL(/\/app\/mock-exams\/mock-session-e2e-777\/review/);
    await expect(page.getByRole('heading', { name: /Post-Exam Diagnostic Review/i })).toBeVisible();
    await expect(page.getByText(/Subtract 5: 2X = 10, X = 5/i)).toBeVisible();

    // 6. ACC-12: Abandoned Exam Isolation
    // Navigate to an abandoned mock session result route
    await page.goto('/app/mock-exams/mock-abandoned-999/result');
    await expect(page.getByTestId('abandoned-exam-notice')).toBeVisible();
    await expect(page.getByText(/No score report available/i)).toBeVisible();
    // Must NOT reveal score metrics
    await expect(page.getByText(/Percentile/i)).toHaveCount(0);

    // Navigate to an abandoned mock session review route
    await page.goto('/app/mock-exams/mock-abandoned-999/review');
    await expect(page.getByTestId('abandoned-review-notice')).toBeVisible();
    await expect(page.getByText(/Review and solutions sealed/i)).toBeVisible();
    // Must NOT reveal solutions
    await expect(page.getByText(/Subtract 5/i)).toHaveCount(0);
  });
});
