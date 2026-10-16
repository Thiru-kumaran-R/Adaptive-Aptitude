// src/components/quiz/ExamTimer.tsx
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import styles from '../../styles/quiz.module.css';

export interface ExamTimerProps {
  expiresAt: string | number;
  onZeroTime?: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  expiresAt,
  onZeroTime,
}) => {
  const targetTime =
    typeof expiresAt === 'number'
      ? expiresAt
      : new Date(expiresAt).getTime();

  const calculateRemaining = () =>
    Math.max(0, Math.floor((targetTime - Date.now()) / 1000));

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemaining);
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const rem = calculateRemaining();
      setRemainingSeconds(rem);

      if (rem === 600) {
        setAnnouncement('10 minutes remaining in examination.');
      } else if (rem === 300) {
        setAnnouncement('5 minutes remaining in examination.');
      } else if (rem === 60) {
        setAnnouncement('1 minute remaining in examination.');
      } else if (rem === 30) {
        setAnnouncement('30 seconds remaining in examination.');
      } else if (rem === 0) {
        setAnnouncement('Time has elapsed. Checking exam status with the server.');
        if (onZeroTime) {
          onZeroTime();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, onZeroTime]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 300;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={`${styles.timerCard} ${isUrgent ? styles.timerUrgent : ''}`}
      role="timer"
      aria-label={`Time remaining: ${minutes} minutes and ${seconds} seconds`}
    >
      <Clock size={18} aria-hidden="true" />
      <span className="tabular-nums">{formattedTime}</span>

      {/* Screen reader aria-live milestone announcements */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
};
