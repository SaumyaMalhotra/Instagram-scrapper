import { useState, useMemo } from 'react';

export function useFilteredPosts(rawPosts = [], userTier = 'free') {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // Paid only
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'likes_desc' | 'owner_asc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const isPaid = userTier === 'paid';

  // Normalize posts ensuring tier fields
  const normalizedPosts = useMemo(() => {
    if (!Array.isArray(rawPosts)) return [];

    return rawPosts.map((post, idx) => {
      if (post.type === 'private_profile') {
        const username = post.username || post.ownerUsername || 'unknown';
        return {
          ...post,
          type: 'private_profile',
          id: `private-profile-${username}-${idx}`,
          ownerUsername: username,
          likesCount: 0,
          timestamp: post.fetchedAt || new Date().toISOString(),
          isPrivate: true
        };
      }

      let type = post.type || 'Image';
      if (type.toLowerCase().includes('sidecar') || post.images?.length > 1) {
        type = 'Sidecar';
      } else if (type.toLowerCase().includes('video') || post.videoUrl) {
        type = 'Video';
      } else {
        type = 'Image';
      }

      const thumbnail = isPaid
        ? (post.displayUrl || post.thumbnailUrl || post.images?.[0] || '')
        : '';

      const images = isPaid && Array.isArray(post.images) && post.images.length > 0
        ? post.images
        : (thumbnail ? [thumbnail] : []);

      const videoUrl = isPaid ? (post.videoUrl || null) : null;
      const likesCount = parseInt(post.likesCount || 0, 10);
      const timestamp = post.timestamp || new Date().toISOString();
      const ownerUsername = post.ownerUsername || 'unknown';

      return {
        id: post.id || post.shortCode || `post-${idx}`,
        shortCode: post.shortCode || '',
        url: post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : '#'),
        caption: post.caption || '',
        type,
        likesCount,
        timestamp,
        ownerUsername,
        thumbnail,
        images,
        videoUrl
      };
    });
  }, [rawPosts, isPaid]);

  // List of unique owner usernames for filter dropdown
  const uniqueOwners = useMemo(() => {
    const set = new Set();
    for (const p of normalizedPosts) {
      if (p.ownerUsername) set.add(p.ownerUsername);
    }
    return Array.from(set);
  }, [normalizedPosts]);

  // Filter and Sort
  const filteredPosts = useMemo(() => {
    let result = [...normalizedPosts];

    // 1. Owner Filter
    if (selectedOwner !== 'ALL') {
      result = result.filter(post => post.ownerUsername.toLowerCase() === selectedOwner.toLowerCase());
    }

    // 2. Post Type Filter (Paid tier only)
    if (isPaid && selectedType !== 'ALL') {
      result = result.filter(post => post.type.toLowerCase() === selectedType.toLowerCase());
    }

    // 3. Search Term (Captions)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(post => post.caption.toLowerCase().includes(query));
    }

    // 4. Sorting: private profiles first, then date, likes, owner
    result.sort((a, b) => {
      if (a.type === 'private_profile' && b.type !== 'private_profile') return -1;
      if (b.type === 'private_profile' && a.type !== 'private_profile') return 1;
      if (sortBy === 'likes_desc') {
        return b.likesCount - a.likesCount;
      }
      if (sortBy === 'date_asc') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === 'owner_asc') {
        return a.ownerUsername.localeCompare(b.ownerUsername);
      }
      // Default: date_desc
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return result;
  }, [normalizedPosts, selectedOwner, selectedType, isPaid, searchTerm, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // Statistics calculation (strictly excludes private profiles)
  const stats = useMemo(() => {
    const postItems = normalizedPosts.filter(p => p.type !== 'private_profile');
    const totalPosts = postItems.length;
    if (totalPosts === 0) {
      return {
        totalPosts: 0,
        totalLikes: 0,
        avgLikes: 0,
        timelineData: []
      };
    }

    let totalLikes = 0;
    const dateMap = new Map();

    for (const post of postItems) {
      totalLikes += post.likesCount;

      const dateKey = new Date(post.timestamp).toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || { date: dateKey, posts: 0, likes: 0 };
      existing.posts += 1;
      existing.likes += post.likesCount;
      dateMap.set(dateKey, existing);
    }

    const avgLikes = Math.round(totalLikes / totalPosts);
    const timelineData = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14);

    return {
      totalPosts,
      totalLikes,
      avgLikes,
      timelineData
    };
  }, [normalizedPosts]);

  return {
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
    allNormalizedPosts: normalizedPosts,
    stats,
    isPaid
  };
}
