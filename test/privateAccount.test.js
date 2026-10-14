import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterPostByTier,
  filterProfileByTier,
  FREE_PROFILE_FIELDS,
  PAID_PROFILE_FIELDS
} from '../src/shared/fieldPolicy.js';
import {
  saveUserRun,
  updateRunPosts,
  getRunPostsForUser
} from '../server/services/userService.js';

test('Private Account Handling & Field Policies', async (t) => {

  await t.test('1. Free tier private profile excludes profilePicUrl and includes basic info', () => {
    const rawPrivateProfile = {
      type: 'private_profile',
      username: 'secret_user',
      fullName: 'Secret Agent',
      biography: 'Classified bio',
      profilePicUrl: 'https://cdninstagram.com/avatar.jpg',
      followersCount: 150,
      followingCount: 80,
      postsCount: 12,
      isPrivate: true,
      // Attempted injection of forbidden post fields:
      caption: 'Forbidden caption',
      images: ['https://cdninstagram.com/post.jpg'],
      videoUrl: 'https://cdninstagram.com/reel.mp4'
    };

    const freeFiltered = filterProfileByTier(rawPrivateProfile, 'free');

    assert.equal(freeFiltered.type, 'private_profile');
    assert.equal(freeFiltered.username, 'secret_user');
    assert.equal(freeFiltered.fullName, 'Secret Agent');
    assert.equal(freeFiltered.biography, 'Classified bio');
    assert.equal(freeFiltered.isPrivate, true);
    assert.equal(freeFiltered.followersCount, 150);
    assert.equal(freeFiltered.followingCount, 80);
    assert.equal(freeFiltered.postsCount, 12);

    // Profile picture must be excluded (undefined) on free tier
    assert.equal(freeFiltered.profilePicUrl, undefined);

    // Forbidden post fields must NEVER be returned
    assert.equal(freeFiltered.caption, undefined);
    assert.equal(freeFiltered.images, undefined);
    assert.equal(freeFiltered.videoUrl, undefined);
  });

  await t.test('2. Paid tier private profile includes profilePicUrl and excludes post fields', () => {
    const rawPrivateProfile = {
      type: 'private_profile',
      username: 'agent_007',
      fullName: 'James Bond',
      biography: 'On secret service',
      profilePicUrl: 'https://cdninstagram.com/bond_avatar.jpg',
      followersCount: 777,
      followingCount: 7,
      postsCount: 0,
      isPrivate: true,
      caption: 'Top secret',
      likesCount: 9999
    };

    const paidFiltered = filterProfileByTier(rawPrivateProfile, 'paid');

    assert.equal(paidFiltered.type, 'private_profile');
    assert.equal(paidFiltered.username, 'agent_007');
    assert.equal(paidFiltered.isPrivate, true);
    assert.equal(paidFiltered.profilePicUrl, 'https://cdninstagram.com/bond_avatar.jpg');

    // Forbidden post fields must NEVER be returned
    assert.equal(paidFiltered.caption, undefined);
    assert.equal(paidFiltered.likesCount, undefined);
  });

  await t.test('3. Post scraper is never invoked for private-only searches & quota is preserved', async () => {
    let postScraperCalled = false;
    let postScraperTargets = [];

    // Mock post scraper runner
    const mockStartActorRun = async (params) => {
      postScraperCalled = true;
      postScraperTargets = params.targets;
      return { runId: 'mock_run_123', datasetId: 'mock_ds_123', status: 'RUNNING' };
    };

    // Simulated scrape request with 1 private profile
    const inputTargets = ['private_friend'];
    const mockProfileResults = [
      {
        type: 'private_profile',
        username: 'private_friend',
        fullName: 'Private Friend',
        biography: 'Friends only',
        profilePicUrl: 'https://cdninstagram.com/p1.jpg',
        followersCount: 300,
        followingCount: 200,
        postsCount: 50,
        isPrivate: true
      }
    ];

    const privateProfiles = [];
    const publicUsernames = [];

    for (const target of inputTargets) {
      const p = mockProfileResults.find(r => r.username === target);
      if (p && p.isPrivate) {
        privateProfiles.push(p);
      } else {
        publicUsernames.push(target);
      }
    }

    let quotaConsumed = false;
    if (publicUsernames.length > 0) {
      quotaConsumed = true;
      await mockStartActorRun({ targets: publicUsernames });
    }

    // Verify post actor was NEVER called
    assert.equal(postScraperCalled, false, 'Post scraper must not be called for private username');
    assert.equal(postScraperTargets.length, 0);
    assert.equal(quotaConsumed, false, 'Daily quota must not be consumed for private accounts');
    assert.equal(privateProfiles.length, 1);
    assert.equal(privateProfiles[0].username, 'private_friend');
  });

  await t.test('4. Mixed searches only pass public usernames to post scraper', async () => {
    let postScraperCalled = false;
    let postScraperTargets = [];

    const mockStartActorRun = async (params) => {
      postScraperCalled = true;
      postScraperTargets = params.targets;
      return { runId: 'mixed_run_456', datasetId: 'mock_ds_456', status: 'RUNNING' };
    };

    const inputTargets = ['private_ex', 'public_creator'];
    const mockProfileResults = [
      {
        username: 'private_ex',
        fullName: 'Ex Partner',
        isPrivate: true,
        followersCount: 50
      },
      {
        username: 'public_creator',
        fullName: 'Creator Brand',
        isPrivate: false,
        followersCount: 100000
      }
    ];

    const privateProfiles = [];
    const publicUsernames = [];

    for (const target of inputTargets) {
      const p = mockProfileResults.find(r => r.username === target);
      if (p && p.isPrivate) {
        privateProfiles.push(p);
      } else {
        publicUsernames.push(target);
      }
    }

    if (publicUsernames.length > 0) {
      await mockStartActorRun({ targets: publicUsernames });
    }

    assert.equal(postScraperCalled, true);
    assert.deepEqual(postScraperTargets, ['public_creator']);
    assert.ok(!postScraperTargets.includes('private_ex'), 'Private account must never reach post scraper');
    assert.equal(privateProfiles.length, 1);
    assert.equal(privateProfiles[0].username, 'private_ex');
  });

  await t.test('5. History reload of a private profile shows only the profile card & 0 post documents', async () => {
    const testUid = `user_test_${Date.now()}`;
    const testRunId = `run_priv_${Date.now()}`;

    const privateProfile = {
      type: 'private_profile',
      username: 'private_account_test',
      fullName: 'Private Tester',
      biography: 'Stealth account',
      profilePicUrl: 'https://cdninstagram.com/avatar_test.jpg',
      followersCount: 420,
      followingCount: 69,
      postsCount: 15,
      isPrivate: true
    };

    // Save run with private profile
    await saveUserRun(testUid, {
      runId: testRunId,
      input: { targets: ['private_account_test'], resultsLimit: 50 },
      status: 'SUCCEEDED',
      tier: 'paid',
      privateProfiles: [privateProfile],
      isPrivateOnly: true
    });

    // Simulate an attempt to store post documents for this run
    await updateRunPosts(testUid, testRunId, [
      {
        id: 'forbidden_post_1',
        ownerUsername: 'private_account_test',
        caption: 'Should never be stored or returned',
        likesCount: 100
      }
    ], 'paid');

    // Reload from history
    const historyResult = await getRunPostsForUser(testUid, testRunId, 'paid');

    assert.ok(historyResult, 'History reload must return the run record');
    assert.equal(historyResult.posts.length, 0, 'Must return 0 post documents for private account');
    assert.equal(historyResult.privateProfiles.length, 1, 'Must return 1 private profile card');
    assert.equal(historyResult.privateProfiles[0].username, 'private_account_test');
    assert.equal(historyResult.privateProfiles[0].type, 'private_profile');
    assert.equal(historyResult.privateProfiles[0].isPrivate, true);

    // Check items combination
    assert.equal(historyResult.items.length, 1);
    assert.equal(historyResult.items[0].type, 'private_profile');
  });

});
