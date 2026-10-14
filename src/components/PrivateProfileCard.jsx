import React, { useState } from 'react';
import {
  Lock,
  User,
  Users,
  Grid,
  ShieldAlert,
  ExternalLink,
  ArrowRight,
  EyeOff
} from 'lucide-react';

export default function PrivateProfileCard({ profile, isPaid = false, onUpgrade }) {
  const [imgSrc, setImgSrc] = useState(profile.profilePicUrl || '');
  const [hasTriedProxy, setHasTriedProxy] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return (num || 0).toLocaleString();
  };

  const handleImageError = () => {
    if (!hasTriedProxy && profile.profilePicUrl && profile.profilePicUrl.startsWith('http')) {
      setHasTriedProxy(true);
      setImgSrc(`/api/proxy-image?url=${encodeURIComponent(profile.profilePicUrl)}`);
    } else {
      setImgError(true);
    }
  };

  const username = profile.username || 'unknown';

  return (
    <div
      className="surface-card"
      style={{
        padding: '24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Top Private Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.22)',
          color: '#fbbf24',
          fontSize: '0.825rem',
          fontWeight: 600
        }}
      >
        <Lock size={16} style={{ flexShrink: 0 }} />
        <span>Private account. Profile headers and counts are available; timeline posts are locked.</span>
      </div>

      {/* Main Profile Info Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flexWrap: 'wrap' }}>
        {/* Profile Picture */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--bg-surface-elevated)',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isPaid && imgSrc && !imgError ? (
              <img
                src={imgSrc}
                alt={username}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleImageError}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : isPaid && imgError ? (
              <User size={36} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  textAlign: 'center'
                }}
              >
                <Lock size={22} style={{ color: '#f59e0b', marginBottom: '2px' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>PRO</span>
              </div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#f59e0b',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Private Account"
          >
            <Lock size={12} strokeWidth={2.5} />
          </div>
        </div>

        {/* User Details */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              @{username}
            </h3>

            <a
              href={`https://www.instagram.com/${encodeURIComponent(username)}/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                textDecoration: 'none'
              }}
              title="Open profile on Instagram"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {profile.fullName && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
              {profile.fullName}
            </p>
          )}

          {profile.biography ? (
            <p
              style={{
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginTop: '6px',
                whiteSpace: 'pre-line'
              }}
            >
              {profile.biography}
            </p>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
              No biography provided
            </p>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {formatCount(profile.postsCount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
            <Grid size={12} /> Posts (Locked)
          </div>
        </div>

        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {formatCount(profile.followersCount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
            <Users size={12} /> Followers
          </div>
        </div>

        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {formatCount(profile.followingCount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
            <Users size={12} /> Following
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '8px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
          Zero posts extracted. Post-scrape quota was not consumed.
        </span>

        {!isPaid && onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-pink)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowRight size={13} /> Unlock HD Avatar on Pro
          </button>
        )}
      </div>
    </div>
  );
}
