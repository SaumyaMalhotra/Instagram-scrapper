import React from 'react';
import {
  History,
  RotateCcw,
  Trash2,
  Calendar,
  Database
} from 'lucide-react';
import { fetchRunPosts } from '../services/api.js';

export default function HistoryList({
  history,
  onClearHistory,
  onLoadRun,
  onRerunParams,
  onDeleteRun
}) {
  if (!history || history.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <History size={28} opacity={0.4} style={{ margin: '0 auto 8px auto' }} />
        <p style={{ fontSize: '0.8rem' }}>No saved searches yet.</p>
      </div>
    );
  }

  const handleLoadItem = async (entry) => {
    const runId = entry.id || entry.runId;
    const datasetId = entry.apifyDatasetId || entry.datasetId;

    // If items are cached directly in entry, load them
    if (entry.items && entry.items.length > 0) {
      onLoadRun({
        runId,
        datasetId,
        items: entry.items,
        input: entry.input || entry.params
      });
      return;
    }

    // Otherwise fetch using /api/runs/:runId/posts
    if (runId) {
      try {
        const { posts } = await fetchRunPosts(runId, { limit: 100, datasetId });
        onLoadRun({
          runId,
          datasetId,
          items: posts || [],
          input: entry.input || entry.params
        });
      } catch (err) {
        alert(`Failed to load posts for run: ${err.message}`);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Saved Searches ({history.length}/10)
        </span>
        {onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            className="btn btn-ghost"
            style={{ fontSize: '0.7rem', padding: '2px 6px', color: 'var(--text-muted)' }}
            title="Clear list"
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map((entry) => {
          const runId = entry.id || entry.runId;
          const params = entry.input || entry.params || {};
          const targets = params.targets || params.usernames || [];
          const count = entry.postCount ?? entry.itemCount ?? entry.items?.length ?? 0;
          const timestamp = entry.createdAt || entry.timestamp || new Date().toISOString();

          return (
            <div
              key={runId}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {targets.slice(0, 3).map((target, idx) => (
                    <span
                      key={idx}
                      className="chip"
                      style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                    >
                      @{target}
                    </span>
                  ))}
                  {targets.length > 3 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                      +{targets.length - 3}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--accent-pink)',
                    background: 'rgba(225, 48, 108, 0.1)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {count} posts
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} /> {new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleLoadItem(entry)}
                    className="btn btn-ghost"
                    style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                    title="View posts"
                  >
                    <Database size={12} /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => onRerunParams(params)}
                    className="btn btn-ghost"
                    style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                    title="Re-run search"
                  >
                    <RotateCcw size={12} /> Re-run
                  </button>
                  {onDeleteRun && (
                    <button
                      type="button"
                      onClick={() => onDeleteRun(runId)}
                      className="btn btn-ghost"
                      style={{ padding: '3px 6px', fontSize: '0.7rem', color: '#f87171' }}
                      title="Delete run"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
