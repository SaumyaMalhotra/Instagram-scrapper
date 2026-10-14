import React, { useState } from 'react';
import {
  Search,
  LayoutGrid,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import PostCard from './PostCard.jsx';
import PrivateProfileCard from './PrivateProfileCard.jsx';
import ExportMenu from './ExportMenu.jsx';

export default function ResultsGrid({
  postsHook,
  onSelectPost,
  userTier = 'free',
  isPaid = false,
  onOpenSubscriptionModal
}) {
  const {
    searchTerm,
    setSearchTerm,
    selectedOwner,
    setSelectedOwner,
    uniqueOwners,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredPosts,
    paginatedPosts,
    allNormalizedPosts
  } = postsHook;

  const [columnDensity, setColumnDensity] = useState('normal'); // 'normal' | 'dense'
  const types = ['ALL', 'Image', 'Video', 'Sidecar'];

  return (
    <div style={{ marginBottom: '40px' }}>
      {/* Free User Upgrade Banner */}
      {!isPaid && (
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-pink)',
                flexShrink: 0
              }}
            >
              <Lock size={15} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Upgrade to view photos and videos in full quality
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Free accounts see post captions, likes, and dates. Get high-res images and video links with Paid plans.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            Upgrade Plan <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Clean Filter & Action Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* Caption Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search captions..."
            className="input-field"
            style={{ paddingLeft: '34px', fontSize: '0.825rem', height: '36px' }}
          />
        </div>

        {/* Filter by Author (only if multiple authors exist) */}
        {uniqueOwners?.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account:</span>
            <select
              value={selectedOwner}
              onChange={(e) => {
                setSelectedOwner(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem', height: '36px', cursor: 'pointer' }}
            >
              <option value="ALL">All ({uniqueOwners.length})</option>
              {uniqueOwners.map(owner => (
                <option key={owner} value={owner}>@{owner}</option>
              ))}
            </select>
          </div>
        )}

        {/* Post Type Chips */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {types.map(t => {
            const isTypeActive = selectedType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (!isPaid && t !== 'ALL') {
                    onOpenSubscriptionModal();
                    return;
                  }
                  setSelectedType(t);
                  setCurrentPage(1);
                }}
                className={`chip ${isTypeActive ? 'chip-active' : ''}`}
                style={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  opacity: (!isPaid && t !== 'ALL') ? 0.7 : 1
                }}
                title={!isPaid && t !== 'ALL' ? 'Pro feature' : ''}
              >
                {!isPaid && t !== 'ALL' && <Lock size={10} style={{ marginRight: '3px' }} />}
                {t === 'ALL' ? 'All' : t === 'Sidecar' ? 'Carousel' : t}
              </button>
            );
          })}
        </div>

        {/* Sort & Grid Layout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem', height: '36px', cursor: 'pointer' }}
          >
            <option value="date_desc">Newest</option>
            <option value="date_asc">Oldest</option>
            <option value="likes_desc">Most Likes</option>
            <option value="owner_asc">Author (A-Z)</option>
          </select>

          {/* Density toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setColumnDensity('normal')}
              className={`btn btn-ghost ${columnDensity === 'normal' ? 'chip-active' : ''}`}
              style={{ padding: '5px', borderRadius: 'var(--radius-sm)' }}
              title="Standard view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setColumnDensity('dense')}
              className={`btn btn-ghost ${columnDensity === 'dense' ? 'chip-active' : ''}`}
              style={{ padding: '5px', borderRadius: 'var(--radius-sm)' }}
              title="Compact view"
            >
              <Grid3X3 size={14} />
            </button>
          </div>

          {/* Export Menu */}
          <ExportMenu filteredPosts={filteredPosts} allPosts={allNormalizedPosts} />
        </div>
      </div>

      {/* Post count status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>
          Showing <strong>{filteredPosts.length}</strong> posts
          {searchTerm && <span> matching "<em>{searchTerm}</em>"</span>}
        </span>
        {totalPages > 1 && (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      {/* Posts Cards Grid */}
      {paginatedPosts.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              columnDensity === 'dense'
                ? 'repeat(auto-fill, minmax(220px, 1fr))'
                : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '18px'
          }}
        >
          {paginatedPosts.map((post, idx) => {
            if (post.type === 'private_profile') {
              return (
                <div key={post.id || `private-${idx}`} style={{ gridColumn: '1 / -1' }}>
                  <PrivateProfileCard
                    profile={post}
                    isPaid={isPaid}
                    onUpgrade={onOpenSubscriptionModal}
                  />
                </div>
              );
            }
            return (
              <PostCard
                key={post.id}
                post={post}
                onSelect={onSelectPost}
                isPaid={isPaid}
                onUpgrade={onOpenSubscriptionModal}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          className="glass-panel"
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <Inbox size={24} />
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>No posts found</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '360px' }}>
            {searchTerm || selectedType !== 'ALL' || selectedOwner !== 'ALL'
              ? 'Try clearing your search query or filters to see more posts.'
              : 'Enter an Instagram account above to view posts.'}
          </p>
          {(searchTerm || selectedType !== 'ALL' || selectedOwner !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('ALL');
                setSelectedOwner('ALL');
              }}
              className="btn btn-secondary"
              style={{ marginTop: '6px', fontSize: '0.78rem', padding: '6px 14px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '28px'
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
