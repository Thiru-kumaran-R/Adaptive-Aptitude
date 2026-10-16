// src/components/ai/TutorChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react';
import { requestTutorGuidance } from '../../services/api/learningApi';
import { renderSanitizedMarkdown } from '../../utils/markdownSanitizer';
import { ApiClientError } from '../../services/api/apiClient';
import styles from '../../styles/tutor.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorChatWindowProps {
  questionId?: string;
  topic?: string;
  pattern?: string;
  contextType?: string;
}

export const TutorChatWindow: React.FC<TutorChatWindowProps> = ({
  questionId,
  topic = 'General Quantitative Aptitude',
  pattern,
  contextType = 'concept_exploration',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your Socratic AI Tutor. I can help guide your problem-solving process without spoiling solutions. What concept or problem would you like to explore?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Cooldown countdown timer on HTTP 429
  useEffect(() => {
    if (cooldownSeconds === null || cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || cooldownSeconds !== null) return;

    const userText = input.trim();
    const userMsgId = `user-${Date.now()}`;
    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, role: 'user', content: userText },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await requestTutorGuidance({
        message: userText,
        topic,
        pattern,
        questionId,
      });

      const assistantReply =
        response.data?.conceptExplanation ||
        response.data?.keyTakeaway ||
        'I am here to guide you. Could you share what step you tried next?';

      setMessages([
        ...newMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantReply,
        },
      ]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.statusCode === 429) {
        if (typeof err.retryAfter === 'number' && !isNaN(err.retryAfter) && err.retryAfter > 0) {
          const bounded = Math.min(Math.max(1, Math.round(err.retryAfter)), 300);
          setCooldownSeconds(bounded);
          setErrorMessage(null);
        } else {
          setCooldownSeconds(null);
          setErrorMessage('AI Tutor is currently busy. Please review concepts or continue practice.');
        }
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'AI Tutor service is temporarily unavailable. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.tutorWorkspace} data-testid="tutor-chat-window">
      <div className={styles.tutorHeader}>
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Socratic AI Tutor</h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Topic: {topic} {pattern ? `• Pattern: ${pattern}` : ''}
          </span>
        </div>
      </div>

      <div className={styles.messagesList} role="log" aria-live="polite">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`${styles.messageBubble} ${
                isUser ? styles.messageUser : styles.messageAssistant
              }`}
            >
              {isUser ? (
                <div>{msg.content}</div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderSanitizedMarkdown(msg.content),
                  }}
                />
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className={`${styles.messageBubble} ${styles.messageAssistant}`}>
            <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
              Thinking and formulating guidance...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {cooldownSeconds !== null && (
        <div className={styles.cooldownBanner} role="alert">
          Rate limited. Please wait {cooldownSeconds}s before retrying.
        </div>
      )}

      {errorMessage && cooldownSeconds === null && (
        <div
          className={styles.cooldownBanner}
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            color: 'var(--status-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
          role="alert"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid currentColor',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 'var(--text-xs)',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className={styles.tutorInputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            cooldownSeconds !== null
              ? `Cooldown active (${cooldownSeconds}s)...`
              : 'Ask a question or describe your thought process...'
          }
          disabled={isLoading || cooldownSeconds !== null}
          className={styles.textInput}
          aria-label="Ask a question or explain your reasoning"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || cooldownSeconds !== null}
          className={styles.textInput}
          style={{
            width: 'auto',
            padding: '8px 16px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            fontWeight: 600,
            cursor: !input.trim() || isLoading || cooldownSeconds !== null ? 'not-allowed' : 'pointer',
            opacity: !input.trim() || isLoading || cooldownSeconds !== null ? 0.6 : 1,
          }}
        >
          {cooldownSeconds !== null ? `Wait (${cooldownSeconds}s)` : 'Send Message'}
        </button>
      </form>

    </div>
  );
};
