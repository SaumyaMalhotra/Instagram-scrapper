import React, { useState, useEffect } from 'react';
import {
  AtSign,
  Link as LinkIcon,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lock
} from 'lucide-react';

export default function ScrapeForm({
  onSubmit,
  onGuestSubmit,
  onUnverifiedSubmit,
  onOpenUpgrade,
  isSearchLocked = false,
  userTier = 'guest', // 'guest' | 'trial' | 'locked' | 'paid'
  isEmailVerified = false,
  onLoadSample,
  isBusy,
  maxResultsPerProfile = 100,
  initialValues = null
}) {
  const [tags, setTags] = useState(() => {
    if (initialValues?.targets && Array.isArray(initialValues.targets)) return initialValues.targets;
    if (initialValues?.usernameOrUrl) return [initialValues.usernameOrUrl];
    if (initialValues?.username) return [initialValues.username];
    return [];
  });
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [directPostUrl, setDirectPostUrl] = useState('');
  const [resultsLimit, setResultsLimit] = useState(() => initialValues?.resultsLimit || 20);
  const [skipPinnedPosts, setSkipPinnedPosts] = useState(true);
  const [onlyPostsNewerThan, setOnlyPostsNewerThan] = useState(() => initialValues?.onlyPostsNewerThan || '');
  const [onlyPostsOlderThan, setOnlyPostsOlderThan] = useState(() => initialValues?.onlyPostsOlderThan || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Sync state if initialValues changes (e.g. from history or presets)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.targets && Array.isArray(initialValues.targets)) {
        setTags(initialValues.targets);
      } else if (initialValues.usernameOrUrl) {
        setTags([initialValues.usernameOrUrl]);
      } else if (initialValues.username) {
        setTags([initialValues.username]);
      }
      if (initialValues.resultsLimit) {
        setResultsLimit(initialValues.resultsLimit);
      }
    }
  }, [initialValues]);

  // Add account tag
  const addTag = (text) => {
    const raw = text.trim();
    if (!raw) return;

    const parts = raw.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
    const newTags = [...tags];

    for (const part of parts) {
      if (newTags.length >= 10) {
        setValidationError('You can search up to 10 accounts at once.');
        break;
      }
      const clean = part.startsWith('@') ? part.slice(1) : part;
      if (!newTags.includes(clean)) {
        newTags.push(clean);
      }
    }

    setTags(newTags);
    setCurrentTagInput('');
    setValidationError('');
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
    setValidationError('');
  };

  const addDirectUrl = () => {
    if (!directPostUrl.trim()) return;
    if (tags.length >= 10) {
      setValidationError('You can add up to 10 accounts or links.');
      return;
    }
    const clean = directPostUrl.trim();
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setDirectPostUrl('');
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    let finalTags = [...tags];
    if (currentTagInput.trim()) {
      const parts = currentTagInput.trim().split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
      for (const p of parts) {
        const clean = p.startsWith('@') ? p.slice(1) : p;
        if (!finalTags.includes(clean)) finalTags.push(clean);
      }
      setCurrentTagInput('');
      setTags(finalTags);
    }

    if (finalTags.length === 0) {
      setValidationError('Please enter an Instagram username (e.g. natgeo).');
      return;
    }

    const searchParams = {
      targets: finalTags,
      usernames: finalTags.filter(t => !t.startsWith('http')),
      postUrls: finalTags.filter(t => t.startsWith('http')),
      resultsLimit: Math.min(resultsLimit, maxResultsPerProfile),
      skipPinnedPosts,
      onlyPostsNewerThan: onlyPostsNewerThan || null,
      onlyPostsOlderThan: onlyPostsOlderThan || null
    };

    if (userTier === 'guest') {
      if (onGuestSubmit) onGuestSubmit(searchParams);
      return;
    }

    if (isSearchLocked) {
      setValidationError('Your free trial is used. Choose a plan to keep searching and analyzing.');
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }

    if ((userTier === 'free' || userTier === 'trial') && !isEmailVerified) {
      if (onUnverifiedSubmit) onUnverifiedSubmit(searchParams);
      return;
    }

    onSubmit(searchParams);
  };

  const loadPreset = (presetUsername) => {
    if (!tags.includes(presetUsername)) {
      setTags([...tags, presetUsername]);
    }
  };

  return (
    <div
      className="glass-panel card-responsive-padding"
      style={{
        marginBottom: '28px',
        maxWidth: '880px',
        margin: '0 auto 28px auto'
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* Simple Label & Preset chips */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            Instagram Username
          </label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try:</span>
            {['natgeo', 'nasa', 'zuck'].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => loadPreset(preset)}
                className="chip"
                style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '3px 8px' }}
              >
                @{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Big, Clean Search Bar Container */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '10px 14px',
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            minHeight: '56px',
            alignItems: 'center',
            marginBottom: '14px',
            transition: 'border-color 200ms ease'
          }}
        >
          {tags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="chip chip-active"
              style={{
                padding: '6px 12px',
                fontSize: '0.825rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {tag.startsWith('http') ? <LinkIcon size={12} /> : <AtSign size={12} />}
              {tag}
              <button
                type="button"
                onClick={() => removeTag(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={`Remove ${tag}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={currentTagInput}
            onChange={(e) => setCurrentTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(currentTagInput);
              }
            }}
            onBlur={() => addTag(currentTagInput)}
            placeholder={tags.length === 0 ? "Type an account name and press Enter (e.g. natgeo)" : "Add another account..."}
            style={{
              flex: 1,
              minWidth: '180px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Action Row: Advanced filter toggle + Find Posts button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Subtle Collapsible Filters Button */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '6px 10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <SlidersHorizontal size={14} />
            <span>Search options ({resultsLimit} posts)</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Primary Action Button */}
          <button
            type={isSearchLocked ? "button" : "submit"}
            onClick={isSearchLocked ? () => {
              setValidationError('Your free trial is used. Choose a plan to keep searching and analyzing.');
              if (onOpenUpgrade) onOpenUpgrade();
            } : undefined}
            disabled={isBusy || (!isSearchLocked && tags.length === 0)}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-full)',
              opacity: isSearchLocked ? 0.8 : 1,
              cursor: 'pointer'
            }}
          >
            {isSearchLocked ? (
              <>
                <Lock size={16} /> Choose Plan (Trial Used)
              </>
            ) : (
              <>
                <Search size={16} /> {isBusy ? 'Searching...' : (userTier === 'guest' ? 'Find Posts (Subscribe)' : 'Find Posts')}
              </>
            )}
          </button>
        </div>

        {/* Locked Trial Notification Banner */}
        {isSearchLocked && (
          <div
            onClick={onOpenUpgrade}
            style={{
              marginTop: '14px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(225, 48, 108, 0.1)',
              border: '1px solid rgba(225, 48, 108, 0.35)',
              color: 'var(--accent-pink)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={15} style={{ flexShrink: 0 }} />
              <span>Your free trial is used. Choose a plan to keep searching and analyzing.</span>
            </div>
            <span style={{ fontSize: '0.78rem', textDecoration: 'underline', fontWeight: 700, flexShrink: 0 }}>
              View Plans
            </span>
          </div>
        )}

        {/* Collapsible Advanced Filters Section (neatly tucked away) */}
        {showAdvanced && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px'
            }}
          >
            {/* Limit selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Posts to load</label>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-pink)', fontWeight: 600 }}>{resultsLimit} posts</span>
              </div>
              <input
                type="range"
                min="5"
                max={maxResultsPerProfile}
                step="5"
                value={resultsLimit}
                onChange={(e) => setResultsLimit(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--accent-pink)', cursor: 'pointer' }}
              />
            </div>

            {/* Date filter: Newer than */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                Posted after
              </label>
              <input
                type="date"
                value={onlyPostsNewerThan}
                onChange={(e) => setOnlyPostsNewerThan(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              />
            </div>

            {/* Date filter: Older than */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                Posted before
              </label>
              <input
                type="date"
                value={onlyPostsOlderThan}
                onChange={(e) => setOnlyPostsOlderThan(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              />
            </div>

            {/* Direct post URL option */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                Or paste a specific Instagram Post / Reel link
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  value={directPostUrl}
                  onChange={(e) => setDirectPostUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  className="input-field"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={addDirectUrl}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation error message */}
        {validationError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '14px'
            }}
          >
            <AlertCircle size={15} />
            <span>{validationError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
