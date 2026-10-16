// src/pages/OnboardingPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGoal } from '../services/api/goalApi';
import { previewPlan, generatePlan } from '../services/api/planningApi';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ApiClientError } from '../services/api/apiClient';
import type { PlanPreviewDto } from '../types/api';
import styles from '../styles/pages.module.css';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [goalType, setGoalType] = useState('engineering_campus_recruitment');
  const [title, setTitle] = useState('Campus Aptitude Target');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split('T')[0];
  });
  const [dailyBudget, setDailyBudget] = useState(20);

  const [createdGoalId, setCreatedGoalId] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<PlanPreviewDto | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleCreateAndPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setCorrelationId(null);

    try {
      // Step 1: Create Goal
      const goalRes = await createGoal({
        title,
        type: goalType,
        targetDate: new Date(targetDate).toISOString(),
      });

      const goalId = goalRes.data._id;
      setCreatedGoalId(goalId);

      // Step 2: Preview Plan
      const previewRes = await previewPlan({
        goalId,
        scope: { allCanonicalPatterns: true },
        dailyQuestionBudget: dailyBudget,
        targetDate: new Date(targetDate).toISOString(),
      });

      setPlanPreview(previewRes.data);
      setIsPreviewModalOpen(true);
      setStep(2);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setCorrelationId(err.correlationId);
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Plan generation failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitPlan = async () => {
    if (!createdGoalId || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await generatePlan({
        goalId: createdGoalId,
        scope: { allCanonicalPatterns: true },
        dailyQuestionBudget: dailyBudget,
        targetDate: new Date(targetDate).toISOString(),
      });

      setIsPreviewModalOpen(false);
      navigate('/app/dashboard');
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setCorrelationId(err.correlationId);
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to commit plan.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.onboardingWizard} data-testid="onboarding-page">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className={styles.pageTitle}
        style={{ textAlign: 'center', marginBottom: 'var(--space-2)', outline: 'none' }}
      >
        Set Up Your Target Exam Goal
      </h1>
      <p className={styles.pageSubtitle} style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        Configure your target date and daily question budget to generate an individualized adaptive curriculum
      </p>

      {errorMessage && (
        <ErrorAlert
          message={errorMessage}
          correlationId={correlationId}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      <form onSubmit={handleCreateAndPreview} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label htmlFor="goal-title" style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Goal Description / Title
          </label>
          <input
            id="goal-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label htmlFor="goal-type" style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Examination Target Track
          </label>
          <select
            id="goal-type"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="engineering_campus_recruitment">Engineering Campus Recruitment</option>
            <option value="national_aptitude_benchmark">National Aptitude Benchmark</option>
            <option value="graduate_technical_assessment">Graduate Technical Assessment</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label htmlFor="target-date" style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Target Examination Date
          </label>
          <input
            id="target-date"
            type="date"
            required
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label htmlFor="daily-budget" style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Daily Question Budget ({dailyBudget} questions / day)
          </label>
          <input
            id="daily-budget"
            type="range"
            min="5"
            max="60"
            step="5"
            value={dailyBudget}
            onChange={(e) => setDailyBudget(Number(e.target.value))}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={{ width: '100%', marginTop: 'var(--space-4)' }}
        >
          Generate Feasibility & Preview Plan
        </Button>
      </form>

      {/* Plan Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Study Plan Feasibility Preview"
      >
        {planPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              A curriculum has been synthesized based on your target date and learning pace.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Total Days:</span>{' '}
                <strong>{planPreview.days || 45}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Total Questions:</span>{' '}
                <strong>{planPreview.scheduledWorkload || dailyBudget * 45}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Patterns Scheduled:</span>{' '}
                <strong>{planPreview.patternsScheduled || 24}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Daily Target:</span>{' '}
                <strong>{dailyBudget} questions</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button
                variant="outline"
                onClick={() => setIsPreviewModalOpen(false)}
                disabled={isLoading}
              >
                Modify Settings
              </Button>
              <Button
                variant="primary"
                onClick={handleCommitPlan}
                isLoading={isLoading}
              >
                Commit Plan & Enter Dashboard
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OnboardingPage;
