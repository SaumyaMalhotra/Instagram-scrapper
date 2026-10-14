import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, ChevronDown } from 'lucide-react';

export default function ExportMenu({ filteredPosts, allPosts }) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetScope, setTargetScope] = useState('filtered'); // 'filtered' | 'all'

  const getExportData = () => {
    const raw = targetScope === 'filtered' ? filteredPosts : allPosts;
    return raw.map(p => {
      if (p.type === 'private_profile') {
        return {
          id: `private_${p.username || 'unknown'}`,
          type: 'private_profile',
          ownerUsername: p.username || p.ownerUsername || 'unknown',
          caption: '[Private Account - Only profile visible]',
          timestamp: p.timestamp || '',
          likesCount: 0,
          isPrivate: true,
          fullName: p.fullName || '',
          followersCount: p.followersCount || 0,
          followingCount: p.followingCount || 0,
          postsCount: p.postsCount || 0,
          ...(p.profilePicUrl ? { displayUrl: p.profilePicUrl } : {})
        };
      }
      return {
        id: p.id,
        ownerUsername: p.ownerUsername,
        caption: p.caption,
        timestamp: p.timestamp,
        likesCount: p.likesCount,
        ...(p.thumbnail ? { displayUrl: p.thumbnail } : {}),
        ...(p.videoUrl ? { videoUrl: p.videoUrl } : {})
      };
    });
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    const data = getExportData();
    const jsonStr = JSON.stringify(data, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(jsonStr, `instagram_posts_${targetScope}_${dateStr}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    const data = getExportData();
    if (data.length === 0) return;

    const headers = [
      'id',
      'ownerUsername',
      'caption',
      'timestamp',
      'likesCount',
      'displayUrl',
      'videoUrl'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const csvRows = [
      headers.join(','),
      ...data.map(p => [
        escapeCsv(p.id),
        escapeCsv(p.ownerUsername),
        escapeCsv(p.caption),
        escapeCsv(p.timestamp),
        p.likesCount || 0,
        escapeCsv(p.displayUrl || ''),
        escapeCsv(p.videoUrl || '')
      ].join(','))
    ];

    const csvContent = csvRows.join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csvContent, `instagram_posts_${targetScope}_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary"
        style={{ fontSize: '0.825rem', padding: '8px 14px' }}
      >
        <Download size={15} /> Export Metadata <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 100,
            minWidth: '220px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-active)',
            padding: '12px',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Scope selection */}
          <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              EXPORT METADATA SCOPE
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setTargetScope('filtered')}
                className={`chip ${targetScope === 'filtered' ? 'chip-active' : ''}`}
                style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}
              >
                Filtered ({filteredPosts.length})
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`chip ${targetScope === 'all' ? 'chip-active' : ''}`}
                style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}
              >
                All ({allPosts.length})
              </button>
            </div>
          </div>

          {/* Formats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.825rem' }}
            >
              <FileSpreadsheet size={16} style={{ color: 'var(--accent-green)' }} /> Export as CSV (.csv)
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.825rem' }}
            >
              <FileJson size={16} style={{ color: 'var(--accent-pink)' }} /> Export as JSON (.json)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
