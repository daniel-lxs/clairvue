import collectionService from '@/server/services/collection.service';
import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import feedService from '@/server/services/feed.service';

export const load = (async ({ cookies, params, depends }) => {
  // Add dependency on feeds data
  depends('feeds');

  const authSession = await validateAuthSession(cookies);
  if (!authSession) {
    throw redirect(302, '/auth/login');
  }

  const collections = await collectionService.findByUserIdWithFeeds(authSession.user.id);

  if (!collections) {
    throw error(404, 'Collections not found');
  }

  // Find the requested collection by slug
  const selectedCollection = collections.find((collection) => collection.slug === params.slug);

  const defaultCollection = collections.find((collection) => collection.id.startsWith('default-'));

  if (!selectedCollection || !defaultCollection) {
    throw error(404, 'Collection not found');
  }

  // Count articles for the selected collection's feeds
  if (selectedCollection.feeds) {
    await Promise.all(
      selectedCollection.feeds.map(async (feed) => {
        feed.articleCount = await feedService.countArticles(feed.id);
      })
    );
  }

  return {
    collection: selectedCollection,
    collections,
    defaultCollection,
    userId: authSession.user.id
  };
}) satisfies PageServerLoad;
