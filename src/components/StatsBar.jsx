import React, { useState } from 'react';
import {
  Heart,
  FileText,
  TrendingUp,
  BarChart2,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function StatsBar({ stats }) {
  const [showChart, setShowChart] = useState(false);

  if (!stats || stats.totalPosts === 0) return null;

  // Format large numbers (e.g. 1.2M, 45.3K)
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return (num || 0).toLocaleString();
  };

  const statCards = [
    {
      label: 'Posts Found',
      formatted: stats.totalPosts.toLocaleString(),
      icon: <FileText size={18} style={{ color: 'var(--accent-blue)' }} />,
      bg: 'rgba(59, 130, 246, 0.1)'
    },
    {
      label: 'Total Likes',
      formatted: formatNumber(stats.totalLikes),
      icon: <Heart size={18} style={{ color: 'var(--accent-pink)' }} />,
      bg: 'rgba(225, 48, 108, 0.1)'
    },
    {
      label: 'Average Likes per Post',
      formatted: formatNumber(stats.avgLikes),
      icon: <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} />,
      bg: 'rgba(16, 185, 129, 0.1)'
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} style={{ color: 'var(--accent-pink)' }} /> Quick Overview
        </h3>
        {stats.timelineData?.length > 1 && (
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="btn btn-ghost"
            style={{ fontSize: '0.78rem', padding: '4px 10px', color: 'var(--text-secondary)' }}
          >
            {showChart ? 'Hide timeline chart' : 'Show timeline chart'}
          </button>
        )}
      </div>

      {/* Metric Counters Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        {statCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: card.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {card.label}
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {card.formatted}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Posts & Likes Timeline Chart (optional expand) */}
      {showChart && stats.timelineData?.length > 1 && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px 12px 6px 12px',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
            <Calendar size={14} style={{ color: 'var(--accent-pink)' }} />
            <span>Activity over time</span>
          </div>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timelineData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e1306c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#e1306c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="postsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-active)',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Area type="monotone" dataKey="likes" stroke="#e1306c" strokeWidth={2} fillOpacity={1} fill="url(#likesGrad)" name="Likes" />
                <Area type="monotone" dataKey="posts" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#postsGrad)" name="Posts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
