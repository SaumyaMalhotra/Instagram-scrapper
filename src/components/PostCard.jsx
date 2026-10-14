import React, { useState, useEffect } from 'react';
import {
  Heart,
  Play,
  Layers,
  Image as ImageIcon,
  Clock,
  User,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function PostCard({ post, onSelect, isPaid = false, onUpgrade }) {
  const getRawImageUrl = () => {
    if (!isPaid || !post) return '';
    return post.thumbnail || post.displayUrl || (Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : '') || '';
  };

  const [imageSrc, setImageSrc] = useState(getRawImageUrl());
  const [hasTriedProxy, setHasTriedProxy] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const nextUrl = getRawImageUrl();
    setImageSrc(nextUrl);
    setHasTriedProxy(false);
    setImageError(false);
  }, [post?.id, post?.thumbnail, post?.displayUrl, post?.images, isPaid]);

  // Relative time helper (e.g. 2d ago, 3h ago)
  const formatRelativeTime = (timestamp) => {
    try {
      const now = new Date();
      const past = new Date(timestamp);
      const diffMs = now - past;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return (num || 0).toLocaleString();
  };

  const isVideo = isPaid && (post.type === 'Video' || Boolean(post.videoUrl));
  const isSidecar = isPaid && (post.type === 'Sidecar' || (Array.isArray(post.images) && post.images.length > 1));

  // Handle image load error: first fallback to backend image proxy, then show placeholder
  const handleImageError = () => {
    const targetUrl = getRawImageUrl() || imageSrc;
    if (!hasTriedProxy && targetUrl && targetUrl.startsWith('http') && !targetUrl.includes('/api/proxy-image')) {
      setHasTriedProxy(true);
      setImageSrc(`/api/proxy-image?url=${encodeURIComponent(targetUrl)}`);
    } else {
      setImageError(true);
    }
  };

  return (
    <div
      onClick={() => onSelect(post)}
      className="surface-card"
      style={{
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-active)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Thumbnail Container (Paid users see media; Free users see locked preview placeholder) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'var(--bg-surface-elevated)',
          overflow: 'hidden'
        }}
      >
        {isPaid ? (
          !imageError && imageSrc ? (
            <img
              src={imageSrc}
              alt={post.caption ? post.caption.slice(0, 50) : `Post by ${post.ownerUsername}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 300ms ease'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '8px',
                padding: '20px'
              }}
            >
              <ImageIcon size={36} opacity={0.5} />
              <span style={{ fontSize: '0.75rem' }}>Media Preview Unavailable</span>
            </div>
          )
        ) : (
          /* Free tier preview lock placeholder */
          <div
            onClick={(e) => {
              if (onUpgrade) {
                e.stopPropagation();
                onUpgrade();
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-surface-elevated)',
              padding: '20px',
              textAlign: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(225, 48, 108, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-pink)'
              }}
            >
              <Lock size={20} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Pro Media Preview
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Upgrade to unlock high-res photos & video playback
            </span>
          </div>
        )}

        {/* Video posts: thumbnail with play overlay that links to the video URL in a new tab */}
        {isPaid && isVideo && (
          <a
            href={post.videoUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (post.videoUrl) e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.28)',
              transition: 'background 200ms ease',
              textDecoration: 'none'
            }}
            title="Watch video on new tab"
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: '3px'
              }}
            >
              <Play size={24} fill="#ffffff" color="#ffffff" />
            </div>
          </a>
        )}

        {/* Media Type Badge (Top Right) for Paid users */}
        {isPaid && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#ffffff',
              borderRadius: 'var(--radius-full)',
              padding: '4px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isVideo && (
              <>
                <Play size={12} fill="white" /> Video
              </>
            )}
            {isSidecar && (
              <>
                <Layers size={12} /> Carousel
              </>
            )}
            {!isVideo && !isSidecar && (
              <>
                <ImageIcon size={12} /> Photo
              </>
            )}
          </div>
        )}

        {/* Owner Chip overlay (Bottom Left) */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#ffffff',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <User size={12} /> @{post.ownerUsername}
        </div>
      </div>

      {/* Post Content & Metrics */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Caption preview truncated with "read more" */}
        <div style={{ marginBottom: '14px', flex: 1 }}>
          <p
            style={{
              fontSize: '0.825rem',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              wordBreak: 'break-word',
              ...(isExpanded ? {} : {
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              })
            }}
          >
            {post.caption || <em style={{ color: 'var(--text-muted)' }}>No caption provided.</em>}
          </p>
          {post.caption && post.caption.length > 120 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-pink)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '2px 0',
                marginTop: '4px',
                fontWeight: 600
              }}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Footer Metrics: Only allowed fields (likesCount, timestamp, ownerUsername) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.8rem'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
            <Heart size={14} style={{ color: 'var(--accent-pink)' }} />
            {formatCount(post.likesCount)} likes
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Clock size={12} />
            {formatRelativeTime(post.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
