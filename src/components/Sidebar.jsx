import React from 'react';
import {
  X,
  History,
  Shield,
  HelpCircle,
  Sparkles,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import HistoryList from './HistoryList.jsx';

export default function Sidebar({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onLoadRun,
  onRerunParams,
  onDeleteRun
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 900
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}
        style={{
          width: '320px',
          maxWidth: '85vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 950,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform var(--transition-normal)',
          boxShadow: isOpen ? 'var(--shadow-lg)' : 'none'
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <History size={15} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Search History</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {/* History Section */}
          <HistoryList
            history={history}
            onClearHistory={onClearHistory}
            onLoadRun={(run) => {
              onLoadRun(run);
              onClose();
            }}
            onRerunParams={(params) => {
              onRerunParams(params);
              onClose();
            }}
            onDeleteRun={onDeleteRun}
          />

          {/* Quick Tips */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HelpCircle size={16} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Quick Tips</span>
            </div>
            <ul style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', paddingLeft: '16px', lineHeight: 1.6 }}>
              <li>Usernames can be typed with or without the <code>@</code> symbol.</li>
              <li>You can search any public Instagram profile or post URL.</li>
              <li>Re-open any previous search with one tap.</li>
            </ul>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.725rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Cloud Scraper Engine</span>
          <span>v2.4 Active</span>
        </div>
      </aside>

      <style>{`
        .sidebar-container {
          transform: translateX(-100%);
        }
        .sidebar-open {
          transform: translateX(0) !important;
        }
      `}</style>
    </>
  );
}
