/**
 * Field policy (Single Source of Truth)
 * Shared across server and client.
 * Strictly filters Instagram post fields according to access tier.
 * Never stores or returns comments, hashtags, coauthors, child posts,
 * alt text, dimensions, or pinned/sponsored flags.
 */

export const FREE_FIELDS = [
  'ownerUsername',
  'caption',
  'timestamp',
  'likesCount'
];

export const PAID_FIELDS = [
  ...FREE_FIELDS,
  'displayUrl',
  'images',
  'videoUrl'
];

/**
 * Filters a raw post item to only include fields permitted for the given tier
 * @param {Object} rawPost - The post object
 * @param {'free'|'paid'} tier - The user's active tier
 * @returns {Object} Clean filtered post adhering to policy
 */
export function filterPostByTier(rawPost, tier = 'free') {
  if (!rawPost || typeof rawPost !== 'object') return {};

  const allowedFields = tier === 'paid' ? PAID_FIELDS : FREE_FIELDS;
  const filtered = {};

  for (const field of allowedFields) {
    if (rawPost[field] !== undefined) {
      filtered[field] = rawPost[field];
    } else {
      // Safe defaults
      if (field === 'images') filtered[field] = [];
      else if (field === 'likesCount') filtered[field] = 0;
      else filtered[field] = null;
    }
  }

  // Preserve post type if present
  if (rawPost.type) filtered.type = rawPost.type;

  // Harmonize media properties for paid users
  if (tier === 'paid') {
    const resolvedDisplayUrl =
      rawPost.displayUrl ||
      rawPost.display_url ||
      rawPost.thumbnailUrl ||
      rawPost.thumbnail_src ||
      rawPost.thumbnail ||
      (Array.isArray(rawPost.images) && rawPost.images.length > 0
        ? (typeof rawPost.images[0] === 'string' ? rawPost.images[0] : rawPost.images[0]?.url)
        : null) ||
      null;

    filtered.displayUrl = resolvedDisplayUrl;

    let resolvedImages = [];
    if (Array.isArray(rawPost.images) && rawPost.images.length > 0) {
      resolvedImages = rawPost.images
        .map(img => (typeof img === 'string' ? img : img?.url || img?.displayUrl || null))
        .filter(Boolean);
    }
    if (resolvedImages.length === 0 && resolvedDisplayUrl) {
      resolvedImages = [resolvedDisplayUrl];
    }
    filtered.images = resolvedImages;

    filtered.videoUrl = rawPost.videoUrl || rawPost.video_url || null;
  }

  // Preserve identifier and post URL for navigation
  if (rawPost.id) filtered.id = String(rawPost.id);
  if (rawPost.shortCode) filtered.shortCode = String(rawPost.shortCode);
  if (rawPost.url) filtered.url = String(rawPost.url);
  else if (rawPost.shortCode) filtered.url = `https://www.instagram.com/p/${rawPost.shortCode}/`;

  return filtered;
}

/**
 * Batch filters an array of posts by tier
 */
export function filterPostsListByTier(posts = [], tier = 'free') {
  if (!Array.isArray(posts)) return [];
  return posts.map(post => filterPostByTier(post, tier));
}

/**
 * Profile field policy (Private account handling)
 * Free users see username and basic info.
 * Paid users see the profile picture URL.
 * NEVER returns posts, captions, likes, images, or video URLs for private accounts.
 */
export const FREE_PROFILE_FIELDS = [
  'type',
  'username',
  'fullName',
  'biography',
  'followersCount',
  'followingCount',
  'postsCount',
  'isPrivate'
];

export const PAID_PROFILE_FIELDS = [
  ...FREE_PROFILE_FIELDS,
  'profilePicUrl'
];

/**
 * Filters a raw profile object according to user tier
 * @param {Object} rawProfile
 * @param {'free'|'paid'} tier
 * @returns {Object} Filtered profile object
 */
export function filterProfileByTier(rawProfile, tier = 'free') {
  if (!rawProfile || typeof rawProfile !== 'object') return {};

  const allowedFields = tier === 'paid' ? PAID_PROFILE_FIELDS : FREE_PROFILE_FIELDS;
  const filtered = {
    type: 'private_profile',
    isPrivate: true
  };

  for (const field of allowedFields) {
    if (rawProfile[field] !== undefined && rawProfile[field] !== null) {
      filtered[field] = rawProfile[field];
    } else {
      if (['followersCount', 'followingCount', 'postsCount'].includes(field)) {
        filtered[field] = 0;
      } else if (field === 'type') {
        filtered[field] = 'private_profile';
      } else if (field === 'isPrivate') {
        filtered[field] = true;
      } else {
        filtered[field] = null;
      }
    }
  }

  // Ensure username is clean
  if (filtered.username) {
    filtered.username = String(filtered.username).replace(/^@/, '');
  }

  return filtered;
}

/**
 * Batch filters an array of profile items by tier
 */
export function filterProfilesListByTier(profiles = [], tier = 'free') {
  if (!Array.isArray(profiles)) return [];
  return profiles.map(profile => filterProfileByTier(profile, tier));
}
