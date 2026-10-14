import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, toggleTheme }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-ghost"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {isDark ? (
        <>
          <Sun size={17} className="text-yellow-400" style={{ color: '#fcb045' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Light</span>
        </>
      ) : (
        <>
          <Moon size={17} style={{ color: '#833ab4' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Dark</span>
        </>
      )}
    </button>
  );
}
