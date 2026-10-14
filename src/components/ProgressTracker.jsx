import React from 'react';
import {
  Loader2,
  Clock,
  StopCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function ProgressTracker({
  stage, // 'idle' | 'starting' | 'scraping' | 'fetching' | 'done' | 'failed' | 'aborted'
  runId,
  elapsedSeconds,
  error,
  runMetadata,
  onCancel,
  onReset
}) {
  if (stage === 'idle') return null;

  // Format elapsed time mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const steps = [
    { key: 'starting', label: 'Connecting', desc: 'Preparing search' },
    { key: 'scraping', label: 'Finding Posts', desc: 'Scanning Instagram' },
    { key: 'fetching', label: 'Loading Media', desc: 'Preparing photos & text' },
    { key: 'done', label: 'Done', desc: 'Results ready' }
  ];

  const getStepStatus = (stepKey) => {
    if (stage === 'failed') return 'failed';
    if (stage === 'aborted') return 'aborted';
    if (stage === 'done') return 'completed';

    const order = ['starting', 'scraping', 'fetching', 'done'];
    const currentIdx = order.indexOf(stage);
    const stepIdx = order.indexOf(stepKey);

    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return 'pending';
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px 24px',
        marginBottom: '28px',
        maxWidth: '880px',
        margin: '0 auto 28px auto',
        border: stage === 'failed' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-active)'
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {['starting', 'scraping', 'fetching'].includes(stage) ? (
            <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1.2s linear infinite', color: 'var(--accent-pink)' }} />
          ) : stage === 'done' ? (
            <CheckCircle2 size={20} style={{ color: 'var(--accent-green)' }} />
          ) : stage === 'failed' ? (
            <AlertTriangle size={20} style={{ color: 'var(--accent-red)' }} />
          ) : (
            <StopCircle size={20} style={{ color: 'var(--text-muted)' }} />
          )}

          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
            {stage === 'starting' && 'Connecting to Instagram...'}
            {stage === 'scraping' && 'Finding recent posts...'}
            {stage === 'fetching' && 'Loading photos and captions...'}
            {stage === 'done' && 'All posts loaded!'}
            {stage === 'failed' && 'Could not complete search'}
            {stage === 'aborted' && 'Search stopped'}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Elapsed time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface-elevated)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            <Clock size={13} />
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          {/* Cancel button if running */}
          {['starting', 'scraping', 'fetching'].includes(stage) && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.78rem', color: '#f87171' }}
            >
              Stop
            </button>
          )}

          {/* Reset / New search button if completed or failed */}
          {['done', 'failed', 'aborted'].includes(stage) && (
            <button
              type="button"
              onClick={onReset}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
            >
              <RotateCcw size={13} /> New Search
            </button>
          )}
        </div>
      </div>

      {/* Clean Step Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px'
        }}
      >
        {steps.map((st, i) => {
          const status = getStepStatus(st.key);
          const isDone = status === 'completed';
          const isActive = status === 'active';

          return (
            <div
              key={st.key}
              style={{
                background: isActive
                  ? 'rgba(225, 48, 108, 0.1)'
                  : isDone
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'var(--bg-surface-elevated)',
                border: isActive
                  ? '1px solid var(--border-active)'
                  : isDone
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                transition: 'all 200ms ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Step {i + 1}
                </span>
                {isActive && <Loader2 size={12} className="animate-spin" style={{ animation: 'spin 1.2s linear infinite', color: 'var(--accent-pink)' }} />}
                {isDone && <CheckCircle2 size={12} style={{ color: 'var(--accent-green)' }} />}
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isActive ? 'var(--text-primary)' : isDone ? 'var(--accent-green)' : 'var(--text-secondary)'
                }}
              >
                {st.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Error Message Box */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginTop: '14px',
            fontSize: '0.825rem',
            color: '#f87171'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <AlertTriangle size={16} />
            <span>{error.message}</span>
          </div>
          {error.retryHint && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px', marginLeft: '24px' }}>
              {error.retryHint}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
