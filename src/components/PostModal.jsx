import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Image as ImageIcon,
  Play,
  Copy,
  Check,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function PostModal({ post, onClose, isPaid = false, onUpgrade }) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState({});
  const [triedProxyIndices, setTriedProxyIndices] = useState({});
  const [mediaUrls, setMediaUrls] = useState([]);
  const [copied, setCopied] = useState(false);

  // Initialize media URLs list from post images (for paid users)
  useEffect(() => {
    if (!post) return;
    const candidates = [];
    if (Array.isArray(post.images) && post.images.length > 0) {
      for (const img of post.images) {
        const url = typeof img === 'string' ? img : img?.url || img?.displayUrl;
        if (url && !candidates.includes(url)) candidates.push(url);
      }
    }
    if (post.displayUrl && !candidates.includes(post.displayUrl)) {
      candidates.push(post.displayUrl);
    }
    if (post.thumbnail && !candidates.includes(post.thumbnail)) {
      candidates.push(post.thumbnail);
    }

    const initialList = isPaid ? candidates : [];
    setMediaUrls(initialList);
    setActiveMediaIndex(0);
    setFailedIndices({});
    setTriedProxyIndices({});
    setCopied(false);
  }, [post, isPaid]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && mediaUrls.length > 1) {
        setActiveMediaIndex(prev => (prev + 1) % mediaUrls.length);
      }
      if (e.key === 'ArrowLeft' && mediaUrls.length > 1) {
        setActiveMediaIndex(prev => (prev - 1 + mediaUrls.length) % mediaUrls.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mediaUrls, onClose]);

  if (!post) return null;

  const currentMediaUrl = mediaUrls[activeMediaIndex] || '';
  const isCurrentFailed = Boolean(failedIndices[activeMediaIndex]);
  const isVideoPost = isPaid && (post.type === 'Video' || Boolean(post.videoUrl)) && activeMediaIndex === 0;

  // Handle image error: first retry with backend image proxy, then show placeholder icon
  const handleMediaError = (index) => {
    const originalUrl = mediaUrls[index];
    if (!triedProxyIndices[index] && originalUrl && originalUrl.startsWith('http')) {
      setTriedProxyIndices(prev => ({ ...prev, [index]: true }));
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
      setMediaUrls(prev => {
        const updated = [...prev];
        updated[index] = proxyUrl;
        return updated;
      });
    } else {
      setFailedIndices(prev => ({ ...prev, [index]: true }));
    }
  };

  const handleCopyLink = async () => {
    const link = currentMediaUrl || post.url || `https://www.instagram.com/p/${post.shortCode}/`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-active)',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 1fr)',
          position: 'relative'
        }}
      >
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            padding: '8px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            color: '#fff'
          }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Media Preview Column */}
        <div
          style={{
            position: 'relative',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            minHeight: '400px'
          }}
        >
          {isPaid ? (
            isVideoPost && post.videoUrl ? (
              <video
                src={post.videoUrl}
                poster={post.thumbnail}
                controls
                playsInline
                style={{ width: '100%', height: '100%', maxHeight: '85vh', objectFit: 'contain' }}
              />
            ) : !isCurrentFailed && currentMediaUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  key={currentMediaUrl}
                  src={currentMediaUrl}
                  alt={`Instagram media slide ${activeMediaIndex + 1}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => handleMediaError(activeMediaIndex)}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '85vh',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '30px'
                }}
              >
                <ImageIcon size={48} opacity={0.4} />
                <span style={{ fontSize: '0.85rem' }}>Media preview not available</span>
              </div>
            )
          ) : (
            /* Free tier locked preview screen */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '36px',
                textAlign: 'center',
                gap: '14px',
                background: 'var(--bg-surface-elevated)'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(225, 48, 108, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-pink)'
                }}
              >
                <Lock size={26} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pro Media Preview</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                Image URLs and video streaming links are available for Paid subscribers.
              </p>
              {onUpgrade && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUpgrade();
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '8px 18px', marginTop: '6px' }}
                >
                  <ArrowRight size={15} /> Upgrade to Paid (₹199+)
                </button>
              )}
            </div>
          )}

          {/* Carousel Controls if multiple images (Paid tier) */}
          {isPaid && mediaUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveMediaIndex(prev => (prev - 1 + mediaUrls.length) % mediaUrls.length)}
                className="btn btn-ghost"
                style={{
                  position: 'absolute',
                  left: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '8px'
                }}
                aria-label="Previous media slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaIndex(prev => (prev + 1) % mediaUrls.length)}
                className="btn btn-ghost"
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '8px'
                }}
                aria-label="Next media slide"
              >
                <ChevronRight size={20} />
              </button>
              {/* Media indicator dots */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  display: 'flex',
                  gap: '6px',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {mediaUrls.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setActiveMediaIndex(i)}
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: i === activeMediaIndex ? 'var(--accent-pink)' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content & Details Column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            background: 'var(--bg-surface)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--border-subtle)',
                  padding: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <User size={18} style={{ color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>@{post.ownerUsername}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isPaid && mediaUrls.length > 1 ? `Slide ${activeMediaIndex + 1} of ${mediaUrls.length}` : 'Post Metadata'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {isPaid && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  title="Copy media URL"
                >
                  {copied ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              )}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                Open on IG <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Caption body (scrollable) */}
          <div
            style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginBottom: '16px'
              }}
            >
              {post.caption || <em style={{ color: 'var(--text-muted)' }}>No caption provided.</em>}
            </p>
          </div>

          {/* Footer Metrics: strictly allowed fields (likesCount, timestamp) */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.95rem' }}>
                <Heart size={18} style={{ color: 'var(--accent-pink)' }} />
                {post.likesCount?.toLocaleString()} likes
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Calendar size={13} />
              <span>{new Date(post.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              {post.shortCode && <span>• Shortcode: {post.shortCode}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
